import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService, SupabaseService } from '@hockey-team-scheduler/shared-data-access';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const client = supabaseService.getSupabaseClient();

    if (!client) {
      console.error('Supabase client not available');
      return router.createUrlTree(['/login']);
    }

    // Use getUser() instead of getSession() - getUser() validates the session
    // by making a request to Supabase, ensuring the session hasn't been revoked
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      // Clear any stale session data
      authService.session.set(null);
      authService.currentUser.set(null);
      console.log('No valid user, redirecting to login');
      return router.createUrlTree(['/login']);
    }

    // User is authenticated, ensure session is set
    const { data: { session } } = await client.auth.getSession();
    if (session) {
      authService.setSession(session);
    }
    
    return true;
  } catch (error) {
    console.error('Auth guard unexpected error:', error);
    authService.session.set(null);
    authService.currentUser.set(null);
    return router.createUrlTree(['/login']);
  }
};
