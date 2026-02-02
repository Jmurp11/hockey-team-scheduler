import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  DeveloperPortalService,
  UserAccessService,
  SupabaseService,
  AuthService,
} from '@hockey-team-scheduler/shared-data-access';

/**
 * Developer Auth Guard
 *
 * Protects developer portal routes by validating:
 * 1. User has a valid Supabase Auth session
 * 2. User has DEVELOPER_ACCESS capability (active api_users record)
 *
 * Redirects to login if not authenticated, or to app if user only has app access.
 */
export const developerAuthGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const userAccessService = inject(UserAccessService);
  const developerPortalService = inject(DeveloperPortalService);
  const router = inject(Router);

  try {
    const client = supabaseService.getSupabaseClient();
    if (!client) {
      return router.createUrlTree(['/login']);
    }

    // Validate Supabase session
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      authService.session.set(null);
      authService.currentUser.set(null);
      userAccessService.clearAccess();
      developerPortalService.logout();
      return router.createUrlTree(['/login']);
    }

    // Ensure session is set
    const {
      data: { session },
    } = await client.auth.getSession();
    if (session) {
      authService.setSession(session);
    }

    // Load user access
    const access = await userAccessService.loadUserAccess();

    if (!access) {
      return router.createUrlTree(['/login']);
    }

    // Check for developer access
    if (access.isApiUser) {
      return true;
    }

    // User doesn't have developer access
    if (access.isAppUser) {
      // Has app access, redirect there
      return router.createUrlTree(['/app']);
    }

    // No access at all, redirect to developer signup
    return router.createUrlTree(['/developer/signup']);
  } catch (error) {
    console.error('[DeveloperAuthGuard] Error:', error);
    return router.createUrlTree(['/login']);
  }
};
