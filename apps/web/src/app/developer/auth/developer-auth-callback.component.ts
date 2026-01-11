import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { DeveloperPortalService } from '@hockey-team-scheduler/shared-data-access';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

/**
 * Developer Auth Callback Component
 *
 * Handles the magic link verification when user clicks the link from email.
 * Extracts the token from query params, verifies it, and redirects to dashboard.
 */
@Component({
  selector: 'app-developer-auth-callback',
  standalone: true,
  imports: [CommonModule, ProgressSpinnerModule, ButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="callback-container">
      @if (loading()) {
        <div class="loading">
          <p-progressSpinner strokeWidth="4" />
          <p>Verifying your login link...</p>
        </div>
      } @else if (error()) {
        <div class="error">
          <div class="error-icon">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <h2>Login Link Invalid</h2>
          <p>{{ errorMessage() }}</p>
          <div class="actions">
            <p-button
              label="Request New Link"
              icon="pi pi-refresh"
              (onClick)="navigateToLogin()"
            />
            <p-button
              label="Back to Developer Portal"
              variant="outlined"
              (onClick)="navigateToPortal()"
            />
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .callback-container {
        max-width: 500px;
        margin: 4rem auto;
        padding: 0 1rem;
        text-align: center;
      }

      .loading {
        @include flex(center, center, column);
        gap: 1.5rem;

        p {
          color: var(--text-color-secondary);
          font-size: 1.125rem;
        }
      }

      .error {
        background: white;
        border-radius: 16px;
        padding: 3rem 2rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);

        .error-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--red-100);
          @include flex(center, center, row);
          margin: 0 auto 1.5rem;

          i {
            font-size: 2rem;
            color: var(--red-500);
          }
        }

        h2 {
          color: var(--primary-700);
          margin-bottom: 1rem;
        }

        p {
          color: var(--text-color-secondary);
          margin-bottom: 2rem;
          line-height: 1.6;
        }

        .actions {
          @include flex(center, center, row);
          gap: 1rem;

          @media (max-width: 480px) {
            flex-direction: column;
          }
        }
      }
    `,
  ],
})
export class DeveloperAuthCallbackComponent implements OnInit {
  private developerPortalService = inject(DeveloperPortalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  error = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const token = params['token'];
        if (token) {
          this.verifyToken(token);
        } else {
          this.showError('No login token found. Please request a new login link.');
        }
      });
  }

  private verifyToken(token: string): void {
    this.developerPortalService
      .verifyMagicLink(token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          // Redirect to dashboard
          this.router.navigate(['/developer/dashboard']);
        },
        error: (err) => {
          this.showError(
            err.error?.error ||
              'This login link has expired or is invalid. Please request a new one.'
          );
        },
      });
  }

  private showError(message: string): void {
    this.loading.set(false);
    this.error.set(true);
    this.errorMessage.set(message);
  }

  navigateToLogin(): void {
    this.router.navigate(['/developer/login']);
  }

  navigateToPortal(): void {
    this.router.navigate(['/developer']);
  }
}
