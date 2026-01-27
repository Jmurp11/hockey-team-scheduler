import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  AuthService,
  SupabaseService,
  UserAccessService,
} from '@hockey-team-scheduler/shared-data-access';

/**
 * App User Guard
 *
 * Protects app routes (/app/*) by ensuring:
 * 1. User is authenticated via Supabase
 * 2. User has app access (exists in app_users)
 *
 * If user is authenticated but only has API access, redirects to /developer/dashboard.
 * If user is not authenticated, redirects to /auth/login.
 */
export const appUserGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const userAccessService = inject(UserAccessService);
  const router = inject(Router);

  try {
    const client = supabaseService.getSupabaseClient();

    if (!client) {
      console.error('[AppUserGuard] Supabase client not available');
      return router.createUrlTree(['/auth/login']);
    }

    // Validate session with Supabase
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      // Clear any stale session data
      authService.session.set(null);
      authService.currentUser.set(null);
      userAccessService.clearAccess();
      return router.createUrlTree(['/auth/login']);
    }

    // Ensure session is set
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      authService.setSession(session);
    }

    // Load user access info
    const access = await userAccessService.loadUserAccess();

    if (!access) {
      console.error('[AppUserGuard] Failed to load user access');
      return router.createUrlTree(['/auth/login']);
    }

    // Check if user has app access
    if (access.isAppUser) {
      return true;
    }

    // User is authenticated but doesn't have app access
    // Check if they have API access and redirect accordingly
    if (access.isApiUser) {
      console.log('[AppUserGuard] User has API access only, redirecting to developer');
      return router.createUrlTree(['/developer/dashboard']);
    }

    // User exists in auth but has no access to either app or developer
    console.log('[AppUserGuard] User has no access, redirecting to login');
    return router.createUrlTree(['/auth/login']);
  } catch (error) {
    console.error('[AppUserGuard] Unexpected error:', error);
    authService.session.set(null);
    authService.currentUser.set(null);
    userAccessService.clearAccess();
    return router.createUrlTree(['/auth/login']);
  }
};
