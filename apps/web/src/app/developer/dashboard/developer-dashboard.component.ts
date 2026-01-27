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
import { Router } from '@angular/router';
import {
  DeveloperPortalService,
  UserService,
  UserAccessService,
} from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import {
  ApiKeyDisplay,
  ApiUsageStats,
  ApiUserPublic,
  DeveloperDashboard,
} from '@hockey-team-scheduler/shared-utilities';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../environments/environment';
import { CardComponent } from '../../shared/components/card/card.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Developer Dashboard Component
 *
 * Provides authenticated developers with:
 * - API key display (masked)
 * - API key rotation
 * - Usage statistics
 * - Subscription management (cancel)
 *
 * Protected by developerGuard - uses unified Supabase Auth.
 * Users can be:
 * - API-only users (redirected here after login)
 * - Both app and API users (access via sidenav "Developer" link)
 */
@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardComponent,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-container">
      <header class="dashboard-header">
        <div class="header-content">
          <h1>Developer Dashboard</h1>
          @if (user()) {
            <p class="email">{{ user()?.email }}</p>
          }
        </div>
        <div class="header-actions">
          @if (showBackToApp()) {
            <p-button
              label="Back to App"
              icon="pi pi-arrow-left"
              variant="outlined"
              (onClick)="navigateToApp()"
            />
          }
          <p-button
            label="View Docs"
            icon="pi pi-book"
            variant="outlined"
            (onClick)="navigateToDocs()"
          />
          <p-button
            label="Logout"
            icon="pi pi-sign-out"
            severity="secondary"
            variant="text"
            (onClick)="logout()"
          />
        </div>
      </header>

      @if (loading()) {
        <div class="loading">
          <p-progressSpinner strokeWidth="4" />
          <p>Loading dashboard...</p>
        </div>
      } @else {
        <div class="dashboard-grid">
          <!-- API Key Card -->
          <app-card class="api-key-card">
            <ng-template #title>
              <div class="card-header">
                <i class="pi pi-key"></i>
                <h3>Your API Key</h3>
              </div>
            </ng-template>
            <ng-template #content>
              <div class="api-key-display">
                @if (newApiKey()) {
                  <!-- Show new key after rotation -->
                  <div class="new-key-alert">
                    <i class="pi pi-exclamation-triangle"></i>
                    <p>
                      <strong>Save this key now!</strong> It won't be shown again.
                    </p>
                  </div>
                  <div class="key-value full-key">
                    <code>{{ newApiKey() }}</code>
                    <p-button
                      icon="pi pi-copy"
                      variant="text"
                      (onClick)="copyKey(newApiKey()!)"
                      pTooltip="Copy to clipboard"
                    />
                  </div>
                  <p-button
                    label="I've saved my key"
                    size="small"
                    (onClick)="clearNewKey()"
                  />
                } @else {
                  <!-- Show masked key -->
                  <div class="key-value">
                    <code>{{ apiKey()?.key || '****' }}</code>
                  </div>
                  @if (apiKey()?.lastUsed) {
                    <p class="last-used">
                      Last used: {{ formatDate(apiKey()?.lastUsed) }}
                    </p>
                  }
                }
              </div>
            </ng-template>
            <ng-template #footer>
              <p-button
                label="Rotate Key"
                icon="pi pi-refresh"
                severity="warn"
                variant="outlined"
                [loading]="rotatingKey()"
                (onClick)="confirmRotateKey()"
              />
            </ng-template>
          </app-card>

          <!-- Usage Stats Card -->
          <app-card class="usage-card">
            <ng-template #title>
              <div class="card-header">
                <i class="pi pi-chart-bar"></i>
                <h3>Usage Statistics</h3>
              </div>
            </ng-template>
            <ng-template #content>
              <div class="stats-grid">
                <div class="stat">
                  <span class="stat-value">{{ usage()?.totalRequests || 0 }}</span>
                  <span class="stat-label">Total Requests</span>
                </div>
                <div class="stat">
                  <span class="stat-value">
                    {{ formatCurrency(usage()?.estimatedCost || 0) }}
                  </span>
                  <span class="stat-label">Current Bill</span>
                </div>
              </div>
              @if (usage()?.lastRequestAt) {
                <p class="last-request">
                  Last request: {{ formatDate(usage()?.lastRequestAt) }}
                </p>
              }
            </ng-template>
          </app-card>

          <!-- Subscription Card -->
          <app-card class="subscription-card">
            <ng-template #title>
              <div class="card-header">
                <i class="pi pi-credit-card"></i>
                <h3>Subscription</h3>
              </div>
            </ng-template>
            <ng-template #content>
              <div class="subscription-info">
                <div class="status-badge" [class]="user()?.subscription_status">
                  {{ formatStatus(user()?.subscription_status) }}
                </div>
                <div class="pricing">
                  <span class="price">$0.05</span>
                  <span class="unit">per request</span>
                </div>
                <p class="billing-note">
                  Usage-based billing. Charged monthly based on API requests.
                </p>
              </div>
            </ng-template>
            <ng-template #footer>
              @if (user()?.subscription_status === 'active') {
                <p-button
                  label="Cancel Subscription"
                  icon="pi pi-times"
                  severity="danger"
                  variant="outlined"
                  [loading]="canceling()"
                  (onClick)="confirmCancelSubscription()"
                />
              }
            </ng-template>
          </app-card>

          <!-- Quick Start Card -->
          <app-card class="quickstart-card">
            <ng-template #title>
              <div class="card-header">
                <i class="pi pi-bolt"></i>
                <h3>Quick Start</h3>
              </div>
            </ng-template>
            <ng-template #content>
              <div class="code-example">
                <p>Include your API key in the x-api-key header:</p>
                <pre><code>curl -H "x-api-key: YOUR_API_KEY" \\
  {{ apiBaseUrl }}/tournaments</code></pre>
              </div>
            </ng-template>
            <ng-template #footer>
              <p-button
                label="View Full Documentation"
                icon="pi pi-external-link"
                variant="text"
                (onClick)="navigateToDocs()"
              />
            </ng-template>
          </app-card>
        </div>
      }
    </div>
    <p-toast />
    <p-confirmDialog />
  `,
  styles: [
    `
      @use 'mixins/mixins' as *;

      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }

      .dashboard-header {
        @include flex(space-between, center, row);
        margin-bottom: 2rem;
        flex-wrap: wrap;
        gap: 1rem;

        .header-content {
          h1 {
            font-size: 2rem;
            color: var(--primary-700);
            margin: 0 0 0.25rem;
          }

          .email {
            color: var(--text-color-secondary);
            margin: 0;
          }
        }

        .header-actions {
          @include flex(flex-end, center, row);
          gap: 0.5rem;
        }
      }

      .loading {
        @include flex(center, center, column);
        gap: 1.5rem;
        padding: 4rem 0;

        p {
          color: var(--text-color-secondary);
        }
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 1.5rem;

        @media (max-width: 768px) {
          grid-template-columns: 1fr;
        }
      }

      .card-header {
        @include flex(flex-start, center, row);
        gap: 0.75rem;

        i {
          font-size: 1.25rem;
          color: var(--primary-500);
        }

        h3 {
          margin: 0;
          font-size: 1.125rem;
        }
      }

      // API Key Card
      .api-key-card {
        .api-key-display {
          .new-key-alert {
            background: var(--yellow-100);
            border-left: 4px solid var(--yellow-500);
            padding: 0.75rem 1rem;
            margin-bottom: 1rem;
            border-radius: 4px;
            @include flex(flex-start, center, row);
            gap: 0.5rem;

            i {
              color: var(--yellow-700);
            }

            p {
              margin: 0;
              font-size: 0.875rem;
            }
          }

          .key-value {
            background: var(--surface-ground);
            border-radius: 8px;
            padding: 1rem;
            @include flex(space-between, center, row);
            margin-bottom: 0.75rem;

            code {
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 0.875rem;
              word-break: break-all;
            }

            &.full-key {
              background: var(--green-50);
              border: 1px solid var(--green-200);
            }
          }

          .last-used {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0;
          }
        }
      }

      // Usage Card
      .usage-card {
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 1rem;

          .stat {
            text-align: center;

            .stat-value {
              display: block;
              font-size: 2rem;
              font-weight: bold;
              color: var(--primary-500);
            }

            .stat-label {
              font-size: 0.875rem;
              color: var(--text-color-secondary);
            }
          }
        }

        .last-request {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          margin: 0;
          text-align: center;
        }
      }

      // Subscription Card
      .subscription-card {
        .subscription-info {
          text-align: center;

          .status-badge {
            display: inline-block;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.875rem;
            margin-bottom: 1.5rem;

            &.active {
              background: var(--green-100);
              color: var(--green-700);
            }

            &.past_due {
              background: var(--yellow-100);
              color: var(--yellow-700);
            }

            &.canceled,
            &.unpaid {
              background: var(--red-100);
              color: var(--red-700);
            }

            &.incomplete {
              background: var(--gray-100);
              color: var(--gray-700);
            }
          }

          .pricing {
            @include flex(center, baseline, row);
            gap: 0.5rem;
            margin-bottom: 1rem;

            .price {
              font-size: 2rem;
              font-weight: bold;
              color: var(--primary-500);
            }

            .unit {
              color: var(--text-color-secondary);
            }
          }

          .billing-note {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin: 0;
          }
        }
      }

      // Quick Start Card
      .quickstart-card {
        .code-example {
          p {
            font-size: 0.875rem;
            color: var(--text-color-secondary);
            margin-bottom: 1rem;
          }

          pre {
            background: #1e1e1e;
            border-radius: 8px;
            padding: 1rem;
            margin: 0;
            overflow-x: auto;

            code {
              color: #d4d4d4;
              font-family: 'Monaco', 'Menlo', monospace;
              font-size: 0.75rem;
            }
          }
        }
      }
    `,
  ],
})
export class DeveloperDashboardComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private developerPortalService = inject(DeveloperPortalService);
  private userService = inject(UserService);
  private userAccessService = inject(UserAccessService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private seoService = inject(SeoService);

  apiBaseUrl = environment.apiUrl;

  // Computed: Show "Back to App" for users with both access
  showBackToApp = this.userAccessService.hasBothAccess;

  loading = signal(true);
  rotatingKey = signal(false);
  canceling = signal(false);

  user = signal<ApiUserPublic | null>(null);
  apiKey = signal<ApiKeyDisplay | null>(null);
  usage = signal<ApiUsageStats | null>(null);
  newApiKey = signal<string | null>(null);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'API Dashboard - RinkLink.ai Developer Portal',
      description:
        'Manage your RinkLink.ai API keys, view usage statistics, and control your subscription. Access youth hockey data programmatically.',
      url: 'https://rinklink.ai/developer/dashboard',
      robots: 'noindex, nofollow', // Authenticated pages should not be indexed
    });

    this.loadDashboard();
  }

  private loadDashboard(): void {
    this.loading.set(true);

    this.developerPortalService
      .getDashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard: DeveloperDashboard) => {
          this.user.set(dashboard.user);
          this.apiKey.set(dashboard.apiKey);
          this.usage.set(dashboard.usage);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Dashboard error:', err);
          this.loading.set(false);
          if (err.status === 401) {
            // Session expired - use unified logout
            this.logout();
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to load dashboard. Please try again.',
            });
          }
        },
      });
  }

  confirmRotateKey(): void {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to rotate your API key? Your current key will stop working immediately.',
      header: 'Rotate API Key',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-warning',
      accept: () => this.rotateKey(),
    });
  }

  private rotateKey(): void {
    this.rotatingKey.set(true);

    this.developerPortalService
      .rotateApiKey()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.rotatingKey.set(false);
          this.newApiKey.set(response.apiKey);
          this.messageService.add({
            severity: 'success',
            summary: 'Key Rotated',
            detail: 'Your new API key is ready. Save it now!',
          });
        },
        error: (err) => {
          this.rotatingKey.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'Failed to rotate key.',
          });
        },
      });
  }

  clearNewKey(): void {
    this.newApiKey.set(null);
    this.loadDashboard();
  }

  copyKey(key: string): void {
    navigator.clipboard.writeText(key).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copied',
        detail: 'API key copied to clipboard.',
      });
    });
  }

  confirmCancelSubscription(): void {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to cancel your subscription? Your API access will continue until the end of your billing period.',
      header: 'Cancel Subscription',
      icon: 'pi pi-exclamation-triangle',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.cancelSubscription(),
    });
  }

  private cancelSubscription(): void {
    this.canceling.set(true);

    this.developerPortalService
      .cancelSubscription()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.canceling.set(false);
          this.loadDashboard();
          this.messageService.add({
            severity: 'info',
            summary: 'Subscription Canceled',
            detail: response.cancelsAt
              ? `Your access will end on ${this.formatDate(response.cancelsAt)}.`
              : 'Your subscription has been canceled.',
          });
        },
        error: (err) => {
          this.canceling.set(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'Failed to cancel subscription.',
          });
        },
      });
  }

  async logout(): Promise<void> {
    // Clear developer portal state
    this.developerPortalService.logout();

    // Full logout using unified auth
    await this.userService.logout();

    // Redirect to login
    this.router.navigate(['/login']);
  }

  navigateToApp(): void {
    this.router.navigate(['/app']);
  }

  navigateToDocs(): void {
    const stripVersion = environment.apiUrl.replace('/v1', '');
    window.location.href = `${stripVersion}/api/docs`;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatStatus(status: string | undefined): string {
    if (!status) return 'Unknown';
    const statusLabels: Record<string, string> = {
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
      unpaid: 'Unpaid',
      incomplete: 'Incomplete',
    };
    return statusLabels[status] || status;
  }
}
