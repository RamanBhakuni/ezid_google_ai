import { db } from "../firebaseConfig";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  increment,
  runTransaction,
  orderBy,
  limit,
  deleteDoc,
  arrayUnion,
  Timestamp,
  writeBatch
} from "firebase/firestore";
import { User, UserRole, BulkLookupResult } from "../types";
import { PLAN_LIMITS } from "../constants";

/**
 * DATABASE SERVICE
 * Handles all interactions with Firestore.
 */

// --- USER & PROFILE OPERATIONS ---

export const createUserProfile = async (user: User) => {
  console.log("DB: createUserProfile called", user);
  const userRef = doc(db, "users", user.id);
  
  try {
    await setDoc(userRef, {
      ...user,
      shortIds: [], 
      createdAt: serverTimestamp(),
      quotaUsed: 0,
      lookupBalance: 10, // Initial Free Credits
      quotaRefreshedAt: serverTimestamp(),
      aliasCredits: 0,
      totalLookups: 0
    });
    console.log("DB: Profile created successfully");
  } catch (e) {
    console.error("DB: Failed to create user document:", e);
    throw e;
  }
};

export const getUserProfile = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    const data = snap.data();
    
    // BACKWARD COMPATIBILITY
    let ids = data.shortIds || [];
    if (ids.length === 0 && data.shortId) {
        ids = [data.shortId];
    }

    let roles = data.roles || [];
    if (roles.length === 0 && data.role) {
        roles = [data.role];
    }

    return { 
        id: userId, 
        email: data.email,
        name: data.name,
        role: data.role,
        roles: roles,          
        shortId: data.shortId, 
        shortIds: ids,         
        organizationName: data.organizationName,
        plan: data.plan,
        planExpiry: data.planExpiry ? data.planExpiry.toDate() : null, // Convert Firestore Timestamp
        quotaUsed: data.quotaUsed || 0,
        lookupBalance: data.lookupBalance ?? 10, // Default to 10 if missing
        quotaRefreshedAt: data.quotaRefreshedAt,
        createdAt: data.createdAt,
        aliasCredits: data.aliasCredits || 0,
        totalLookups: data.totalLookups || 0,
        isVerified: data.isVerified,
        apiKey: data.apiKey
    } as User;
  }
  return null;
};

export const addRoleToUser = async (userId: string, newRole: UserRole) => {
    const userRef = doc(db, "users", userId);
    try {
        await updateDoc(userRef, {
            roles: arrayUnion(newRole),
            role: newRole 
        });
        console.log(`Added role ${newRole} to user ${userId}`);
    } catch (e) {
        console.error("Failed to add role:", e);
        throw e;
    }
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
    const userRef = doc(db, "users", userId);
    try {
        await updateDoc(userRef, {
            aliasCredits: increment(1)
        });
        console.log("Added alias credit for", userId);
    } catch (e) {
        console.error("Failed to add credit", e);
        throw e;
    }
};

export const claimCustomShortId = async (userId: string, userEmail: string, desiredId: string) => {
    const cleanId = desiredId.toLowerCase().trim();

    if (cleanId.length < 5) throw new Error("ID must be at least 5 characters long.");
    if (!/^[a-z0-9._]+$/.test(cleanId)) throw new Error("Only letters, numbers, dots, and underscores allowed.");

    const userRef = doc(db, "users", userId);
    const shortIdRef = doc(db, "short_ids", cleanId);

    try {
        await runTransaction(db, async (transaction) => {
            const idSnap = await transaction.get(shortIdRef);
            if (idSnap.exists()) {
                throw new Error(`The ID '${cleanId}' is already taken.`);
            }

            const userSnap = await transaction.get(userRef);
            let userData: any;
            let needsProfileCreation = false;

            if (!userSnap.exists()) {
                needsProfileCreation = true;
                userData = { shortIds: [], aliasCredits: 0, shortId: null };
            } else {
                userData = userSnap.data();
            }

            const currentIds = userData.shortIds || [];
            const credits = userData.aliasCredits || 0;
            const isFirstFree = currentIds.length === 0 && !userData.shortId;

            if (!isFirstFree && credits <= 0) {
                throw new Error("Payment required for additional aliases.");
            }

            transaction.set(shortIdRef, {
                email: userEmail,
                ownerId: userId,
                createdAt: serverTimestamp()
            });

            const updates: any = {
                shortIds: arrayUnion(cleanId)
            };

            if (isFirstFree) {
                updates.shortId = cleanId;
            } else {
                updates.aliasCredits = increment(-1);
            }

            if (needsProfileCreation) {
                transaction.set(userRef, {
                    id: userId,
                    email: userEmail,
                    name: 'User',
                    role: UserRole.INDIVIDUAL,
                    roles: [UserRole.INDIVIDUAL],
                    shortIds: [cleanId],
                    shortId: isFirstFree ? cleanId : null,
                    createdAt: serverTimestamp(),
                    quotaUsed: 0,
                    lookupBalance: 10,
                    aliasCredits: isFirstFree ? 0 : -1,
                    totalLookups: 0
                });
            } else {
                transaction.update(userRef, updates);
            }
        });
        return cleanId;
    } catch (e) {
        console.error("Claim failed:", e);
        throw e;
    }
};

export const claimMissingShortId = async (user: User) => {
  const generated = generateAiSuggestions(user.name, user.email)[0];
  return await claimCustomShortId(user.id, user.email, generated);
};

// --- SUBSCRIPTION & TOP-UP ---

export const updateUserPlan = async (userId: string, planName: string) => {
  const userRef = doc(db, "users", userId);
  
  let dbPlanCode = 'FREE';
  let creditsToAdd = 0;

  if (planName.includes('Edu')) {
      dbPlanCode = 'EDU_BASIC';
      creditsToAdd = 500;
  }
  if (planName.includes('Business') || planName.includes('Pro')) {
      dbPlanCode = 'BUSINESS_PRO';
      creditsToAdd = 10000;
  }

  // Set expiry to 30 days from NOW
  const newExpiryDate = new Date();
  newExpiryDate.setDate(newExpiryDate.getDate() + 30);

  try {
    await updateDoc(userRef, {
      plan: dbPlanCode,
      lookupBalance: increment(creditsToAdd), // Add credits (stacking)
      planExpiry: Timestamp.fromDate(newExpiryDate), // Set/Extend validity
      updatedAt: serverTimestamp()
    });
    console.log(`Added ${creditsToAdd} credits to user ${userId}. Valid until ${newExpiryDate}`);
    return dbPlanCode;
  } catch (error) {
    console.error("Error updating plan:", error);
    throw error;
  }
};

export const syncEmailVerification = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  try {
      await updateDoc(userRef, { isVerified: true });
  } catch (error) {
      console.error("Error syncing verification status:", error);
  }
};

// --- API KEYS ---

export const generateAndSaveApiKey = async (userId: string) => {
    const userRef = doc(db, "users", userId);
    // Generate a robust key: prefix + random segments
    const newKey = `ez_live_${Math.random().toString(36).substr(2, 9)}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
        await updateDoc(userRef, { apiKey: newKey });
        return newKey;
    } catch (e) {
        console.error("Failed to generate API Key", e);
        throw e;
    }
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async () => {
  const usersRef = collection(db, "users");
  const q = query(usersRef, orderBy("createdAt", "desc"), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
};

export const deleteUser = async (userId: string) => {
  await deleteDoc(doc(db, "users", userId));
};

export const adminUpdateUser = async (userId: string, data: Partial<User>) => {
  await updateDoc(doc(db, "users", userId), data);
};

export const resetDatabase = async () => {
    const collections = ["users", "short_ids", "lookups"];
    for (const col of collections) {
        const querySnapshot = await getDocs(collection(db, col));
        const deletePromises = querySnapshot.docs.map((d) => deleteDoc(d.ref));
        await Promise.all(deletePromises);
    }
    console.log("DB Reset Complete");
};

// --- CORE BUSINESS API: LOOKUP ---

export const lookupShortId = async (requesterId: string, shortIdInput: string): Promise<BulkLookupResult> => {
  const cleanId = shortIdInput.replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim();
  
  if (!cleanId) return { shortId: shortIdInput, email: null, status: 'INVALID' };

  // 1. Get User Profile & Check Balance
  const userRef = doc(db, "users", requesterId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("User not found");
  
  const user = userSnap.data();
  const currentPlan = user.plan || 'FREE';
  let balance = user.lookupBalance ?? 0;
  
  // --- FREE PLAN LAZY RESET ---
  // If Free plan and >30 days since last refresh, reset balance to 10
  if (currentPlan === 'FREE') {
      const lastRefresh = user.quotaRefreshedAt ? user.quotaRefreshedAt.toDate() : null;
      const now = new Date();
      if (!lastRefresh || (now.getTime() - lastRefresh.getTime() > 30 * 24 * 60 * 60 * 1000)) {
          console.log("Monthly reset for Free user triggered.");
          balance = 10;
          // We update this in the DB later during the decrement phase
          await updateDoc(userRef, {
              lookupBalance: 10,
              quotaRefreshedAt: serverTimestamp()
          });
      }
  } else {
      // --- PAID PLAN EXPIRY CHECK ---
      const expiry = user.planExpiry ? user.planExpiry.toDate() : null;
      if (expiry && new Date() > expiry) {
          throw new Error("EXPIRED: Your plan validity has expired. Please buy a new pack.");
      }
  }

  // --- BALANCE CHECK ---
  if (balance <= 0) {
      throw new Error("QUOTA_EXCEEDED: Insufficient credits. Please upgrade or top-up.");
  }

  // 2. Perform Lookup
  const shortIdRef = doc(db, "short_ids", cleanId);
  const shortIdSnap = await getDoc(shortIdRef);

  let result: BulkLookupResult;

  if (shortIdSnap.exists()) {
    const data = shortIdSnap.data();
    result = {
      shortId: cleanId,
      email: data.email,
      status: 'FOUND'
    };

    // Increment owner stats
    try {
        if (data.ownerId) {
            updateDoc(doc(db, "users", data.ownerId), { totalLookups: increment(1) });
        }
    } catch (e) { console.error(e); }

  } else {
    result = { shortId: cleanId, email: null, status: 'NOT_FOUND' };
  }

  // 3. Log & Deduct Credit
  await addDoc(collection(db, "lookups"), {
    businessId: requesterId,
    shortId: cleanId,
    foundEmail: result.email || null,
    status: result.status,
    timestamp: serverTimestamp()
  });

  // Decrement balance and increment lifetime usage
  await updateDoc(userRef, {
    lookupBalance: increment(-1),
    quotaUsed: increment(1)
  });

  return result;
};

// --- BATCH PROCESSING (OPTIMIZED) ---

export const processBulkLookupBatch = async (requesterId: string, shortIds: string[]): Promise<BulkLookupResult[]> => {
  if (shortIds.length === 0) return [];

  // Normalize IDs
  const uniqueIds = [...new Set(shortIds.map(id => id.replace(/^(https?:\/\/)?ezid\.in\//, '').replace(/\/$/, '').trim()))];
  const refs = uniqueIds.map(id => doc(db, "short_ids", id));
  
  // 1. Parallel Reads
  const snapshots = await Promise.all(refs.map(ref => getDoc(ref)));
  
  const results: BulkLookupResult[] = [];
  const logs: any[] = [];
  
  // 2. Prepare Results & Logs
  snapshots.forEach((snap, index) => {
      const id = uniqueIds[index];
      if (snap.exists()) {
          const data = snap.data();
          results.push({ shortId: id, email: data.email, status: 'FOUND' });
          logs.push({ shortId: id, foundEmail: data.email, status: 'FOUND' });
      } else {
          results.push({ shortId: id, email: null, status: 'NOT_FOUND' });
          logs.push({ shortId: id, foundEmail: null, status: 'NOT_FOUND' });
      }
  });

  // 3. Batch Write: Logs & Quota
  const batch = writeBatch(db);
  const lookupsCol = collection(db, "lookups");
  
  logs.forEach(log => {
      const newLogRef = doc(lookupsCol);
      batch.set(newLogRef, {
          businessId: requesterId,
          shortId: log.shortId,
          foundEmail: log.foundEmail,
          status: log.status,
          timestamp: serverTimestamp()
      });
  });

  const userRef = doc(db, "users", requesterId);
  batch.update(userRef, {
      lookupBalance: increment(-uniqueIds.length),
      quotaUsed: increment(uniqueIds.length)
  });

  await batch.commit();

  return results;
};

// --- ANALYTICS ---

export const getBusinessStats = async (businessId: string) => {
  const lookupsRef = collection(db, "lookups");
  const q = query(
    lookupsRef,
    where("businessId", "==", businessId),
    orderBy("timestamp", "desc"),
    limit(2000) // Increased to support bulk CSV stats
  );

  try {
    const querySnapshot = await getDocs(q);
    const lookups = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        shortId: data.shortId,
        status: data.status,
        foundEmail: data.foundEmail,
        timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        requesterId: data.businessId
      };
    });

    const userProfile = await getUserProfile(businessId);
    
    return { 
        lookups, 
        quota: userProfile?.quotaUsed || 0,
        balance: userProfile?.lookupBalance || 0,
        plan: userProfile?.plan,
        expiry: userProfile?.planExpiry
    };
  } catch (error) {
    console.error("Error fetching business stats:", error);
    return { lookups: [], quota: 0, balance: 0 };
  }
};