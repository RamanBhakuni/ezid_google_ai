import { User, UserRole, BulkLookupResult } from "../types";

/**
 * DATABASE SERVICE
 * Talks to the local Postgres-backed API (server/) over HTTP.
 * Firebase Auth is still the source of user identity; `user.id` is the Auth UID.
 *
 * The public API of this module is unchanged from the old Firestore version,
 * so the pages / authContext that import it need no edits.
 */

const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:4000/api";

// --- JWT token storage (Postgres-native auth) ---
const TOKEN_KEY = "ezid_token";
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Small fetch wrapper: attaches the Bearer token, throws Error(message) on
// non-2xx, returns parsed JSON.
async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  let body: any = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const message = (body && body.error) || res.statusText || "Request failed";
    const err: any = new Error(message);
    err.status = res.status;
    if (body && typeof body === "object" && body.retryAfter != null) {
      err.retryAfter = body.retryAfter;
    }
    throw err;
  }
  return body as T;
}

const toDate = (v: any): Date | null => (v ? new Date(v) : null);

const hydrateUser = (data: any): User => ({
  ...data,
  planExpiry: toDate(data.planExpiry),
  quotaRefreshedAt: toDate(data.quotaRefreshedAt),
  createdAt: toDate(data.createdAt),
});

// --- AUTHENTICATION (Postgres-native) ---

export const authRegister = async (name: string, email: string, password: string, role: UserRole) => {
  await api("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password, role }) });
};

export const authLogin = async (email: string, password: string): Promise<User> => {
  const data = await api<{ token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.token);
  return hydrateUser(data.user);
};

export const authMe = async (): Promise<User | null> => {
  if (!getToken()) return null;
  try {
    const data = await api<any>("/auth/me");
    return data ? hydrateUser(data) : null;
  } catch {
    clearToken();
    return null;
  }
};

export const authVerifyEmail = async (token: string) => {
  await api("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) });
};

export const authResendVerification = async (email: string) => {
  await api("/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
};

export const authForgotPassword = async (email: string) => {
  await api("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
};

export const authResetPassword = async (token: string, password: string) => {
  await api("/auth/reset-password", { method: "POST", body: JSON.stringify({ token, password }) });
};

// --- USER & PROFILE OPERATIONS ---

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const data = await api<any>(`/users/${encodeURIComponent(userId)}`);
  return data ? hydrateUser(data) : null;
};

export const addRoleToUser = async (userId: string, newRole: UserRole) => {
  await api(`/users/${encodeURIComponent(userId)}/roles`, {
    method: "POST",
    body: JSON.stringify({ role: newRole }),
  });
  console.log(`Added role ${newRole} to user ${userId}`);
};

// --- CUSTOM ID CLAIMING ---

export const generateAiSuggestions = (name: string, email: string): string[] => {
  const [rawHandle, rawDomain] = email.toLowerCase().split('@');
  const handle = rawHandle.replace(/[^a-z0-9._]/g, '');
  const domainParts = rawDomain.split('.');
  const domainName = domainParts[0].replace(/[^a-z0-9]/g, '');

  const GENERIC_DOMAINS = [
    'gmail', 'googlemail', 'yahoo', 'ymail', 'hotmail', 'outlook', 'live', 'msn',
    'icloud', 'me', 'mac', 'aol', 'zoho', 'zohomail', 'protonmail', 'proton',
    'yandex', 'rediffmail', 'gmx', 'mail'
  ];

  const suggestions: Set<string> = new Set();
  const currentYear = new Date().getFullYear();
  const shortYear = currentYear % 100;

  if (!GENERIC_DOMAINS.includes(domainName) && domainName.length >= 3) {
    suggestions.add(domainName);
    suggestions.add(`${domainName}.official`);
    suggestions.add(`${domainName}.in`);

    const genericHandles = ['info', 'contact', 'admin', 'support', 'sales', 'hello', 'team', 'hr'];
    if (!genericHandles.includes(handle)) {
      suggestions.add(`${handle}.${domainName}`);
    } else {
      suggestions.add(`${domainName}.${handle}`);
    }
  }

  if (handle.length >= 4) {
    suggestions.add(handle);
  }

  suggestions.add(`${handle}.id`);
  suggestions.add(`${handle}${shortYear}`);

  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (cleanName.length >= 4) {
    suggestions.add(cleanName);
  }

  return Array.from(suggestions)
    .filter(s => s.length >= 4 && /^[a-z0-9._]+$/.test(s))
    .slice(0, 6);
};

export const addAliasCredit = async (userId: string) => {
  await api(`/users/${encodeURIComponent(userId)}/alias-credit`, { method: "POST" });
  console.log("Added alias credit for", userId);
};

export const claimCustomShortId = async (userId: string, userEmail: string, desiredId: string) => {
  const data = await api<{ shortId: string }>("/short-ids/claim", {
    method: "POST",
    body: JSON.stringify({ userId, userEmail, desiredId }),
  });
  return data.shortId;
};

export const claimMissingShortId = async (user: User) => {
  const generated = generateAiSuggestions(user.name, user.email)[0];
  return await claimCustomShortId(user.id, user.email, generated);
};

// --- SUBSCRIPTION & TOP-UP ---

export const updateUserPlan = async (userId: string, planName: string) => {
  const data = await api<{ plan: string }>(`/users/${encodeURIComponent(userId)}/plan`, {
    method: "POST",
    body: JSON.stringify({ planName }),
  });
  console.log(`Updated plan for user ${userId} -> ${data.plan}`);
  return data.plan;
};

// --- API KEYS ---

export const generateAndSaveApiKey = async (userId: string) => {
  const data = await api<{ apiKey: string }>(`/users/${encodeURIComponent(userId)}/api-key`, {
    method: "POST",
  });
  return data.apiKey;
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async () => {
  return await api<User[]>("/users");
};

export const deleteUser = async (userId: string) => {
  await api(`/users/${encodeURIComponent(userId)}`, { method: "DELETE" });
};

export const adminUpdateUser = async (userId: string, data: Partial<User>) => {
  await api(`/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const resetDatabase = async () => {
  await api("/admin/reset", { method: "POST" });
  console.log("DB Reset Complete");
};

// --- CORE BUSINESS API: LOOKUP ---

export const lookupShortId = async (requesterId: string, shortIdInput: string): Promise<BulkLookupResult> => {
  return await api<BulkLookupResult>("/lookup", {
    method: "POST",
    body: JSON.stringify({ requesterId, shortId: shortIdInput }),
  });
};

// --- BATCH PROCESSING ---

export const processBulkLookupBatch = async (requesterId: string, shortIds: string[]): Promise<BulkLookupResult[]> => {
  if (shortIds.length === 0) return [];
  return await api<BulkLookupResult[]>("/lookup/bulk", {
    method: "POST",
    body: JSON.stringify({ requesterId, shortIds }),
  });
};

// --- ANALYTICS ---

export const getBusinessStats = async (businessId: string) => {
  try {
    const data = await api<any>(`/stats/${encodeURIComponent(businessId)}`);
    return {
      lookups: (data.lookups || []).map((l: any) => ({
        ...l,
        timestamp: l.timestamp ? new Date(l.timestamp) : new Date(),
      })),
      quota: data.quota || 0,
      balance: data.balance || 0,
      plan: data.plan,
      expiry: data.expiry ? new Date(data.expiry) : null,
    };
  } catch (error) {
    console.error("Error fetching business stats:", error);
    return { lookups: [], quota: 0, balance: 0 };
  }
};
