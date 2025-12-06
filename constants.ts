import { UserRole, ShortIdRecord } from './types';

export const APP_NAME = "EZID";
export const DOMAIN_PREFIX = "ezid.in/";

export const MOCK_SHORT_IDS: ShortIdRecord[] = [
  { shortId: 'rahul23', email: 'rahul.kumar.official@zohomail.in', ownerName: 'Rahul Kumar', createdAt: '2023-01-15' },
  { shortId: 'priya_art', email: 'priya.sharma.design@gmail.com', ownerName: 'Priya Sharma', createdAt: '2023-02-20' },
  { shortId: 'acme_sales', email: 'sales@acmecorp.in', ownerName: 'Acme Sales Team', createdAt: '2023-03-10' },
];

// Define Pack Sizes (Credits added per purchase)
export const PLAN_LIMITS: Record<string, number> = {
  'FREE': 10,          // Monthly reset amount
  'EDU_BASIC': 500,    // Credits per pack
  'BUSINESS_PRO': 10000, // Credits per pack
  'PRO': 10000, 
  'ENTERPRISE': 100000
};

export const PLANS = [
  {
    name: "Free",
    price: "₹0",
    features: ["1 Personal ID", "Basic Dashboard", "10 Free Lookups / Month"],
    cta: "Start Free",
    role: UserRole.INDIVIDUAL,
    limit: PLAN_LIMITS.FREE
  },
  {
    name: "Edu Basic Pack",
    price: "₹99",
    features: ["500 Credits added", "Valid for 30 Days", "Bulk CSV Upload", "Export to Excel"],
    cta: "Buy Edu Pack",
    role: UserRole.BUSINESS,
    limit: PLAN_LIMITS.EDU_BASIC
  },
  {
    name: "Business Pro Pack",
    price: "₹499",
    features: ["10,000 Credits added", "Valid for 30 Days", "API Access", "Priority Support"],
    cta: "Buy Pro Pack",
    role: UserRole.BUSINESS,
    limit: PLAN_LIMITS.BUSINESS_PRO
  }
];