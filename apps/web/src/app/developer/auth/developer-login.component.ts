import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Developer Login Component
 *
 * Redirects to the unified login page.
 * Developer authentication now uses the same Supabase Auth flow as regular users.
 * After login, users are routed based on their capabilities (APP_ACCESS / DEVELOPER_ACCESS).
 */
@Component({
  selector: 'app-developer-login',
  standalone: true,
  template: `
    <div class="redirect-container">
      <p>Redirecting to login...</p>
    </div>
  `,
  styles: [
    `
      .redirect-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 50vh;
        color: var(--text-color-secondary);
      }
    `,
  ],
})
export class DeveloperLoginComponent implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    // Redirect to unified login with return URL
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: '/developer/dashboard' },
    });
  }
}
