import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  AuthService,
  SupabaseService,
  UserAccessService,
} from '@hockey-team-scheduler/shared-data-access';

/**
 * Developer Guard
 *
 * Protects developer portal routes (/developer/dashboard, etc.) by ensuring:
 * 1. User is authenticated via Supabase
 * 2. User has API access (exists in api_users with active subscription)
 *
 * This guard uses Supabase Auth instead of the legacy developer JWT system.
 *
 * If user is authenticated but only has app access, redirects to /app.
 * If user is not authenticated, redirects to /developer/login (unified login).
 */
export const developerGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const userAccessService = inject(UserAccessService);
  const router = inject(Router);

  try {
    const client = supabaseService.getSupabaseClient();

    if (!client) {
      console.error('[DeveloperGuard] Supabase client not available');
      return router.createUrlTree(['/login']);
    }

    // Validate session with Supabase
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      // Not authenticated - redirect to login
      // They can use the same login page, will be routed based on access
      return router.createUrlTree(['/login']);
    }

    // Ensure session is set
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      authService.setSession(session);
    }

    // Load user access info
    const access = await userAccessService.loadUserAccess();

    if (!access) {
      console.error('[DeveloperGuard] Failed to load user access');
      return router.createUrlTree(['/login']);
    }

    // Check if user has API/developer access
    if (access.isApiUser) {
      return true;
    }

    // User is authenticated but doesn't have developer access
    // Check if they have app access and redirect accordingly
    if (access.isAppUser) {
      console.log('[DeveloperGuard] User has app access only, redirecting to app');
      return router.createUrlTree(['/app']);
    }

    // User exists in auth but has no access
    // Redirect to developer signup to get API access
    console.log('[DeveloperGuard] User has no API access, redirecting to signup');
    return router.createUrlTree(['/developer/signup']);
  } catch (error) {
    console.error('[DeveloperGuard] Unexpected error:', error);
    return router.createUrlTree(['/login']);
  }
};
