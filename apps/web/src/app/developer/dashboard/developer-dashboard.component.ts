import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DeveloperPortalService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import {
  ApiKeyDisplay,
  ApiUsageStats,
  ApiUserPublic,
  DeveloperDashboard,
} from '@hockey-team-scheduler/shared-utilities';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../environments/environment';
import { SeoService } from '../../shared/services/seo.service';
import {
  ApiKeyCardComponent,
  DeveloperDashboardHeaderComponent,
  QuickStartCardComponent,
  SubscriptionCardComponent,
  UsageStatsCardComponent,
} from './components';

/**
 * Developer Dashboard Component
 *
 * Provides authenticated developers with:
 * - API key display (masked)
 * - API key rotation
 * - Usage statistics
 * - Subscription management (cancel)
 *
 * Protected by DeveloperAuthGuard - requires magic link authentication.
 */
@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
    DeveloperDashboardHeaderComponent,
    ApiKeyCardComponent,
    UsageStatsCardComponent,
    SubscriptionCardComponent,
    QuickStartCardComponent,
  ],
  providers: [MessageService, ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './developer-dashboard.component.html',
  styleUrl: './developer-dashboard.component.scss',
})
export class DeveloperDashboardComponent implements OnInit {
  @ViewChild('apiKeyCard') apiKeyCard?: ApiKeyCardComponent;

  protected loadingService = inject(LoadingService);
  private developerPortalService = inject(DeveloperPortalService);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private seoService = inject(SeoService);

  apiBaseUrl = environment.apiUrl;

  loading = signal(true);
  rotatingKey = signal(false);
  canceling = signal(false);

  user = signal<ApiUserPublic | null>(null);
  apiKey = signal<ApiKeyDisplay | null>(null);
  usage = signal<ApiUsageStats | null>(null);

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

  loadDashboard(): void {
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
            // Session expired
            this.developerPortalService.logout();
            this.router.navigate(['/developer/login']);
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
          if (this.apiKeyCard) {
            this.apiKeyCard.setNewApiKey(response.apiKey);
          }
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

  copyKeyToClipboard(key: string): void {
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

  logout(): void {
    this.developerPortalService.logout();
    this.router.navigate(['/developer']);
  }

  navigateToDocs(): void {
    const stripVersion = environment.apiUrl.replace('/v1', '');
    window.location.href = `${stripVersion}/api/docs`;
  }

  private formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
