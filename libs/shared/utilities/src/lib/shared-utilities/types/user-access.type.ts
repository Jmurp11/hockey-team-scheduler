/**
 * User Access Types
 *
 * These types support the unified authentication system where a single
 * Supabase Auth login can grant access to both the app and developer portal.
 */

/**
 * User capabilities derived from database state.
 * This is the primary way to determine what features a user can access.
 */
export enum UserCapability {
  /** User has access to the main app (exists in app_users table) */
  APP_ACCESS = 'APP_ACCESS',
  /** User has access to the developer portal (exists in api_users with active subscription) */
  DEVELOPER_ACCESS = 'DEVELOPER_ACCESS',
}

/**
 * User type classification based on database state
 */
export type UserType = 'app_only' | 'api_only' | 'both' | 'none';

/**
 * User access information returned after authentication
 * Used to determine routing and UI state
 */
export interface UserAccess {
  /** Supabase Auth user ID */
  authUserId: string;

  /** User's email address */
  email: string;

  /** Whether user has app access (exists in app_users) */
  isAppUser: boolean;

  /** Whether user has API access (exists in api_users with active subscription) */
  isApiUser: boolean;

  /** Computed user type for routing logic */
  userType: UserType;

  /** User capabilities derived from isAppUser and isApiUser */
  capabilities: UserCapability[];

  /** Default redirect path after login */
  defaultRedirect: string;

  /** App user ID (if app user) */
  appUserId?: number;

  /** API user ID (if API user) */
  apiUserId?: number;

  /** Whether the user's app profile is complete */
  isAppProfileComplete?: boolean;
}

/**
 * API response for user access check
 */
export interface UserAccessResponse {
  success: boolean;
  access: UserAccess;
}

/**
 * Route access requirements
 */
export interface RouteAccessConfig {
  /** Route requires app user access */
  requiresAppUser?: boolean;

  /** Route requires API user access */
  requiresApiUser?: boolean;

  /** Route requires completed app profile */
  requiresCompleteProfile?: boolean;

  /** Redirect path if access denied */
  redirectTo?: string;
}

/**
 * Developer portal access info
 * Extended information for API users
 */
export interface DeveloperAccess extends UserAccess {
  /** API subscription status */
  subscriptionStatus?: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';

  /** Whether API key exists */
  hasApiKey?: boolean;

  /** Masked API key prefix for display */
  apiKeyPrefix?: string;
}
