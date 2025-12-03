import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import {
  AuthService,
  SupabaseService,
} from '@hockey-team-scheduler/shared-data-access';

export const authGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Get the current session
    const client = supabaseService.getSupabaseClient();

    if (!client) {
      console.error('Supabase client not available');
      return router.createUrlTree(['/auth/login']);
    }

    const {
      data: { session },
      error,
    } = await client.auth.getSession();

    if (error) {
      console.error('Auth guard error:', error);
      return router.createUrlTree(['/auth/login']);
    }

    if (session && session.user) {
      authService.setSession(session);
      return true;
    }

    // No session found, redirect to login
    console.log('No session found, redirecting to login');
    return router.createUrlTree(['/auth/login']);
  } catch (error) {
    console.error('Auth guard unexpected error:', error);
    return router.createUrlTree(['/auth/login']);
  }
};
