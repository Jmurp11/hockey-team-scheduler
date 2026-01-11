import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DeveloperPortalService } from '@hockey-team-scheduler/shared-data-access';

/**
 * Developer Auth Guard
 *
 * Protects routes that require developer authentication.
 * Redirects to login page if not authenticated.
 */
export const developerAuthGuard: CanActivateFn = () => {
  const developerPortalService = inject(DeveloperPortalService);
  const router = inject(Router);

  if (developerPortalService.isAuthenticated()) {
    return true;
  }

  // Redirect to developer login
  router.navigate(['/developer/login']);
  return false;
};
