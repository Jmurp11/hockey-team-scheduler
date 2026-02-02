import { Injectable, UnauthorizedException } from '@nestjs/common';
import { supabase } from '../supabase';

/**
 * User type classification based on database state
 */
export type UserType = 'app_only' | 'api_only' | 'both' | 'none';

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
 * User access information for routing decisions
 */
export interface UserAccess {
  authUserId: string;
  email: string;
  isAppUser: boolean;
  isApiUser: boolean;
  userType: UserType;
  capabilities: UserCapability[];
  defaultRedirect: string;
  appUserId?: number;
  apiUserId?: number;
  isAppProfileComplete?: boolean;
}

/**
 * User Access Service
 *
 * Provides unified user access checking for the authentication system.
 * Determines if a user has access to the app, developer portal, or both
 * based on their Supabase Auth session and database records.
 *
 * This service is the single source of truth for:
 * - User type resolution (app_only, api_only, both, none)
 * - Post-login routing decisions
 * - Access authorization for protected routes
 */
@Injectable()
export class UserAccessService {
  /**
   * Gets comprehensive access information for a user by their Supabase Auth ID.
   *
   * This is the primary method for determining user access after login.
   * It queries the user_access view which joins app_users and api_users.
   *
   * @param authUserId - The Supabase Auth user ID (UUID)
   * @returns UserAccess object with access details and routing info
   */
  async getUserAccess(authUserId: string): Promise<UserAccess> {
    // First try the database function (uses the view)
    const { data, error } = await supabase.rpc('get_user_access', {
      p_auth_user_id: authUserId,
    });

    if (error) {
      console.error('[UserAccess] Error calling get_user_access:', error);
      // Fallback to direct query
      return this.getUserAccessFallback(authUserId);
    }

    if (!data || data.length === 0) {
      // User exists in auth but not in app_users or api_users
      return this.getUserAccessFallback(authUserId);
    }

    const row = data[0];

    // Check if app profile is complete
    const isAppProfileComplete = await this.checkAppProfileComplete(authUserId);

    // Build capabilities array
    const capabilities: UserCapability[] = [];
    if (row.is_app_user) capabilities.push(UserCapability.APP_ACCESS);
    if (row.is_api_user) capabilities.push(UserCapability.DEVELOPER_ACCESS);

    return {
      authUserId: row.auth_user_id,
      email: row.email,
      isAppUser: row.is_app_user,
      isApiUser: row.is_api_user,
      userType: row.user_type as UserType,
      capabilities,
      defaultRedirect: row.default_redirect,
      appUserId: row.app_user_id,
      apiUserId: row.api_user_id,
      isAppProfileComplete,
    };
  }

  /**
   * Fallback method for getting user access when the view/function is not available.
   * This queries tables directly.
   */
  private async getUserAccessFallback(authUserId: string): Promise<UserAccess> {
    // Get auth user email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(authUserId);

    if (authError || !authUser?.user) {
      throw new UnauthorizedException('User not found');
    }

    const email = authUser.user.email || '';

    // Check app_users
    const { data: appUser } = await supabase
      .from('app_users')
      .select('id, name, association, team')
      .eq('user_id', authUserId)
      .single();

    // Check api_users (by auth_user_id or email)
    const { data: apiUser } = await supabase
      .from('api_users')
      .select('id, is_active, auth_user_id')
      .or(`auth_user_id.eq.${authUserId},and(email.eq.${email},auth_user_id.is.null)`)
      .eq('is_active', true)
      .single();

    // If api_user exists without auth_user_id, link it
    if (apiUser && !apiUser.auth_user_id) {
      await this.linkApiUserToAuth(authUserId, email);
    }

    const isAppUser = !!appUser;
    const isApiUser = !!apiUser && apiUser.is_active;

    let userType: UserType;
    let defaultRedirect: string;

    if (isAppUser && isApiUser) {
      userType = 'both';
      defaultRedirect = '/app';
    } else if (isAppUser) {
      userType = 'app_only';
      defaultRedirect = '/app';
    } else if (isApiUser) {
      userType = 'api_only';
      defaultRedirect = '/developer';
    } else {
      userType = 'none';
      defaultRedirect = '/login';
    }

    // Check if app profile is complete
    const isAppProfileComplete = appUser
      ? !!(appUser.name && appUser.association && appUser.team)
      : undefined;

    // Build capabilities array
    const capabilities: UserCapability[] = [];
    if (isAppUser) capabilities.push(UserCapability.APP_ACCESS);
    if (isApiUser) capabilities.push(UserCapability.DEVELOPER_ACCESS);

    return {
      authUserId,
      email,
      isAppUser,
      isApiUser,
      userType,
      capabilities,
      defaultRedirect,
      appUserId: appUser?.id,
      apiUserId: apiUser?.id,
      isAppProfileComplete,
    };
  }

  /**
   * Checks if a user has app access (exists in app_users).
   */
  async hasAppAccess(authUserId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    return !error && !!data;
  }

  /**
   * Checks if a user has API/developer access (exists in api_users with active subscription).
   */
  async hasApiAccess(authUserId: string): Promise<boolean> {
    // First check by auth_user_id
    const { data: byAuthId } = await supabase
      .from('api_users')
      .select('id, is_active')
      .eq('auth_user_id', authUserId)
      .eq('is_active', true)
      .single();

    if (byAuthId) {
      return true;
    }

    // Also check by email for unlinked api_users
    const { data: authUser } = await supabase.auth.admin.getUserById(authUserId);
    if (!authUser?.user?.email) {
      return false;
    }

    const { data: byEmail } = await supabase
      .from('api_users')
      .select('id, is_active')
      .eq('email', authUser.user.email)
      .is('auth_user_id', null)
      .eq('is_active', true)
      .single();

    if (byEmail) {
      // Link the api_user to auth
      await this.linkApiUserToAuth(authUserId, authUser.user.email);
      return true;
    }

    return false;
  }

  /**
   * Checks if a user's app profile is complete.
   * A complete profile has name, association, and team.
   */
  async checkAppProfileComplete(authUserId: string): Promise<boolean | undefined> {
    const { data, error } = await supabase
      .from('app_users')
      .select('name, association, team')
      .eq('user_id', authUserId)
      .single();

    if (error || !data) {
      return undefined; // Not an app user
    }

    return !!(data.name && data.association && data.team);
  }

  /**
   * Links an api_user (by email) to a Supabase Auth user.
   * Called when a user logs in and has an unlinked api_user record.
   */
  async linkApiUserToAuth(authUserId: string, email: string): Promise<boolean> {
    // Try using the database function first
    const { data, error } = await supabase.rpc('link_api_user_to_auth', {
      p_auth_user_id: authUserId,
      p_email: email,
    });

    if (error) {
      console.error('[UserAccess] Error linking api_user:', error);

      // Fallback to direct update
      const { error: updateError } = await supabase
        .from('api_users')
        .update({ auth_user_id: authUserId })
        .eq('email', email)
        .is('auth_user_id', null);

      return !updateError;
    }

    return !!data;
  }

  /**
   * Gets the API user ID for a given auth user.
   * Useful for developer portal operations.
   */
  async getApiUserId(authUserId: string): Promise<number | null> {
    const { data } = await supabase
      .from('api_users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .single();

    return data?.id || null;
  }

  /**
   * Gets the app user ID for a given auth user.
   */
  async getAppUserId(authUserId: string): Promise<number | null> {
    const { data } = await supabase
      .from('app_users')
      .select('id')
      .eq('user_id', authUserId)
      .single();

    return data?.id || null;
  }

  /**
   * Validates a Supabase JWT and returns the user ID.
   * Used by guards to authenticate requests.
   */
  async validateSupabaseToken(token: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user) {
        return null;
      }

      return data.user.id;
    } catch {
      return null;
    }
  }
}
