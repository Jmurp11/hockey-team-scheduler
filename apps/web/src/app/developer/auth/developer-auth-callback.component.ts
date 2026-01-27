import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Developer Auth Callback Component
 *
 * Legacy component for magic link verification.
 * Magic link authentication has been deprecated in favor of unified Supabase Auth.
 * This component now redirects to the main auth callback or login page.
 */
@Component({
  selector: 'app-developer-auth-callback',
  standalone: true,
  template: `
    <div class="callback-container">
      <p>Redirecting...</p>
    </div>
  `,
  styles: [
    `
      .callback-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
        color: var(--text-color-secondary);
      }
    `,
  ],
})
export class DeveloperAuthCallbackComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // Legacy magic link URLs should redirect to unified login
    // The user will need to log in again using the unified auth flow
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/developer/dashboard' },
    });
  }
}
