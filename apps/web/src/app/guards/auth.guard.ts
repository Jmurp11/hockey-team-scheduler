import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@hockey-team-scheduler/shared-data-access';
import { SupabaseService } from '@hockey-team-scheduler/shared-data-access';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Get the current session
    const {
      data: { session },
      error,
    } = await supabaseService.getSupabaseClient()!.auth.getSession();

    if (error) {
      console.error('Auth guard error:', error);
      router.navigate(['/login']);
      return false;
    }

    // Check if user is authenticated
    if (session && session.user) {
      authService.setSession(session);
      return true;
    }

    // No session found, redirect to login
    console.log('No session found, redirecting to login');
    router.navigate(['/login']);
    return false;
  } catch (error) {
    console.error('Auth guard unexpected error:', error);
    router.navigate(['/login']);
    return false;
  }
};
