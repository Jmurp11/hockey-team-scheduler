/**
 * Developer Portal Types
 *
 * Local type definitions for the Developer Portal API module.
 * These mirror the shared-utilities types but are used within the API.
 */

/**
 * API User stored in the api_users table
 */
export interface ApiUser {
  id: number;
  created_at: string;
  api_key: string | null;
  email: string;
  /** Supabase Auth user ID - links api_user to unified auth system */
  auth_user_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
  last_used: string | null;
  request_count: number;
  api_key_prefix?: string;
}

/**
 * Public-facing API user data (excludes sensitive fields)
 */
export interface ApiUserPublic {
  id: number;
  email: string;
  is_active: boolean;
  last_used: string | null;
  request_count: number;
  created_at: string;
  subscription_status: ApiSubscriptionStatus;
}

/**
 * API subscription status
 */
export type ApiSubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete';

/**
 * API key display (masked for security)
 */
export interface ApiKeyDisplay {
  key: string;
  fullKey?: string;
  createdAt: string;
  lastUsed: string | null;
}

/**
 * API usage statistics
 */
export interface ApiUsageStats {
  totalRequests: number;
  requestsThisMonth: number;
  lastRequestAt: string | null;
  estimatedCost: number;
}

/**
 * Developer dashboard data
 */
export interface DeveloperDashboard {
  user: ApiUserPublic;
  apiKey: ApiKeyDisplay;
  usage: ApiUsageStats;
}
