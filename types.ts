

export enum UserRole {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole; // Primary/Current Role (Legacy support)
  roles: UserRole[]; // All assigned roles
  shortId?: string | null; // Primary ID (for backward compatibility)
  shortIds?: string[]; // Array of all owned aliases
  organizationName?: string | null; // For businesses
  plan?: 'FREE' | 'PRO' | 'ENTERPRISE' | 'EDU_BASIC' | 'BUSINESS_PRO';
  planExpiry?: any; // Timestamp
  quotaUsed: number; // Lifetime usage stats
  lookupBalance: number; // Current remaining credits
  quotaRefreshedAt?: any; // For Free tier monthly reset
  createdAt?: any;
  aliasCredits?: number; // Tracks paid-but-unclaimed aliases
  isVerified?: boolean;
  totalLookups?: number; // Count of how many times this user was looked up
  apiKey?: string | null; // For API Access
}

export interface ShortIdRecord {
  shortId: string;
  email: string;
  ownerName: string;
  createdAt: string;
}

export interface LookupLog {
  id: string;
  shortId: string;
  timestamp: string;
  status: 'SUCCESS' | 'NOT_FOUND';
  requesterId: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface BulkLookupResult {
  shortId: string;
  email: string | null;
  status: 'FOUND' | 'NOT_FOUND' | 'INVALID' | 'QUOTA_EXCEEDED' | 'EXPIRED';
}

// Razorpay Types
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}