/**
 * Types for Developer Portal API Users
 *
 * These types support the external developer authentication system
 * which is separate from the main application's Supabase Auth.
 */

/**
 * API User stored in the api_users table
 */
export interface ApiUser {
  id: number;
  created_at: string;
  api_key: string | null;
  email: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  is_active: boolean;
  last_used: string | null;
  request_count: number;
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
 * Developer portal session token payload
 */
export interface ApiUserSessionPayload {
  userId: number;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Developer auth token response
 */
export interface DeveloperAuthToken {
  token: string;
  expiresAt: string;
}

/**
 * API key display (masked for security)
 */
export interface ApiKeyDisplay {
  key: string;  // Masked key like "sk_live_****1234"
  fullKey?: string;  // Only shown once after generation
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
  estimatedCost: number;  // Based on $0.05 per request
}

/**
 * Developer dashboard data
 */
export interface DeveloperDashboard {
  user: ApiUserPublic;
  apiKey: ApiKeyDisplay;
  usage: ApiUsageStats;
}

// ============ DTOs for API Requests ============

/**
 * Create developer checkout session
 */
export interface CreateDeveloperCheckoutDto {
  email: string;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Checkout session response
 */
export interface DeveloperCheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Checkout status response
 */
export interface DeveloperCheckoutStatus {
  status: 'paid' | 'unpaid' | 'no_payment_required';
  customerEmail: string | null;
  customerId: string | null;
}

/**
 * Magic link request
 */
export interface DeveloperMagicLinkDto {
  email: string;
}

/**
 * Magic link verification
 */
export interface DeveloperVerifyMagicLinkDto {
  token: string;
}

/**
 * API key rotation response
 */
export interface ApiKeyRotationResponse {
  apiKey: string;  // The new full API key (shown only once)
  message: string;
}

/**
 * Subscription cancellation response
 */
export interface SubscriptionCancelResponse {
  success: boolean;
  message: string;
  cancelsAt?: string;  // Date when subscription actually ends
}
