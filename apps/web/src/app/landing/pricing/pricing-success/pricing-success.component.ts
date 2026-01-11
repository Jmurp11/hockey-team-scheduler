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
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SubscriptionService, UserService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { getFormControl, initMagicLinkForm } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../../shared/components/card/card.component';
import { InputComponent } from '../../../shared/components/input/input.component';

type PageStatus = 'loading' | 'success' | 'error';

/**
 * Handles the return from Stripe Checkout for subscription payments.
 * Verifies payment status and displays appropriate success/error state.
 */
@Component({
  selector: 'app-pricing-success',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    InputComponent,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
    ReactiveFormsModule,
  ],
  providers: [MessageService, UserService],
  template: `
    <div class="success-container">
      @switch (status()) {
        @case ('loading') {
          <app-card class="status-card">
            <ng-template #content>
              <div class="loading-content">
                <p-progressSpinner
                  strokeWidth="4"
                  [style]="{ width: '50px', height: '50px' }"
                />
                <p>Verifying your payment...</p>
                <p class="loading-detail">Please wait while we confirm your subscription.</p>
              </div>
            </ng-template>
          </app-card>
        }
        @case ('success') {
          @if (emailSent()) {
            <app-card class="status-card success">
              <ng-template #title>Check your email!</ng-template>
              <ng-template #content>
                <div class="success-content">
                  <div class="success-icon-container">
                    <i class="pi pi-envelope success-icon"></i>
                  </div>
                  <p>We've sent you a magic link to log in. Please check your inbox.</p>
                </div>
              </ng-template>
            </app-card>
          } @else {
            <app-card class="status-card success">
              <ng-template #title>Welcome to RinkLink!</ng-template>
              <ng-template #content>
                <div class="success-content">
                  <div class="success-icon-container">
                    <i class="pi pi-check-circle success-icon"></i>
                  </div>
                  <h2>Your Subscription is Active!</h2>
                  <p>
                    Thank you for subscribing to {{ planName() }}.
                    Click the button below to receive a login link via email.
                  </p>
                  <form [formGroup]="magicLinkForm" class="magic-link-form">
                    <app-input
                      [control]="getFormControl(magicLinkForm, 'email')"
                      label="Email"
                    />
                    <p-button
                      [disabled]="magicLinkForm.invalid || sendingEmail()"
                      [loading]="sendingEmail()"
                      label="Get Login Link"
                      styleClass="w-full"
                      (click)="sendMagicLink()"
                    />
                  </form>
                </div>
              </ng-template>
            </app-card>
          }
        }
        @case ('error') {
          <app-card class="status-card error">
            <ng-template #title>Something Went Wrong</ng-template>
            <ng-template #content>
              <div class="error-content">
                <div class="error-icon-container">
                  <i class="pi pi-times-circle error-icon"></i>
                </div>
                <p>{{ errorMessage() }}</p>
                <p class="error-detail">
                  If you were charged, please contact support with your session details.
                </p>
                <div class="action-buttons">
                  <p-button
                    label="Try Again"
                    icon="pi pi-refresh"
                    (click)="goBack()"
                  />
                  <p-button
                    label="Contact Support"
                    icon="pi pi-envelope"
                    severity="secondary"
                    [outlined]="true"
                    (click)="contactSupport()"
                  />
                </div>
              </div>
            </ng-template>
          </app-card>
        }
      }
    </div>
    <p-toast />
  `,
  styleUrls: ['./pricing-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private userService = inject(UserService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);
  private destroyRef = inject(DestroyRef);

  status = signal<PageStatus>('loading');
  errorMessage = signal('There was an issue processing your payment.');
  planName = signal('your plan');
  emailSent = signal(false);
  sendingEmail = signal(false);

  magicLinkForm: FormGroup = initMagicLinkForm();
  getFormControl = getFormControl;

  ngOnInit() {
    this.handleStripeReturn();
  }

  /**
   * Handles the return from Stripe Checkout.
   * Extracts session_id from URL and verifies payment status.
   */
  private handleStripeReturn() {
    const params = this.route.snapshot.queryParams;
    const sessionId = params['session_id'];

    if (sessionId) {
      this.verifyPayment(sessionId);
    } else if (params['canceled'] === 'true') {
      this.status.set('error');
      this.errorMessage.set(
        'Payment was canceled. Your subscription was not activated.',
      );
    } else {
      this.status.set('error');
      this.errorMessage.set(
        'Invalid session. Please start the checkout process again.',
      );
    }
  }

  /**
   * Verifies the Stripe payment status.
   */
  private verifyPayment(sessionId: string) {
    this.loadingService.setLoading(true);

    this.subscriptionService
      .getCheckoutStatus(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          this.loadingService.setLoading(false);

          if (session.status === 'paid') {
            this.status.set('success');
            this.planName.set(this.formatPlanName(session.seats));

            // Pre-fill email from checkout session
            if (session.customerEmail) {
              this.magicLinkForm.get('email')?.setValue(session.customerEmail);
            }

            this.messageService.add({
              severity: 'success',
              summary: 'Welcome!',
              detail: 'Your subscription has been activated successfully.',
            });
          } else {
            this.status.set('error');
            this.errorMessage.set(
              'Payment could not be verified. Please contact support if you were charged.',
            );
          }
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          this.status.set('error');

          if (err.status === 404) {
            this.errorMessage.set(
              'Session not found. Please try again or contact support.',
            );
          } else {
            this.errorMessage.set(
              'Failed to verify your payment. Please contact support.',
            );
          }

          console.error('Error verifying payment:', err);
        },
      });
  }

  /**
   * Formats the plan name for display based on seat count.
   */
  private formatPlanName(seats: number | null): string {
    if (!seats) return 'your plan';
    return `${seats}-Seat Plan`;
  }

  /**
   * Sends a magic link email to the user.
   */
  async sendMagicLink() {
    this.sendingEmail.set(true);

    const email = this.magicLinkForm.get('email')?.value;
    const { error } = await this.userService.loginWithMagicLink(email);

    this.sendingEmail.set(false);

    if (!error) {
      this.emailSent.set(true);
    } else {
      console.error('Magic link error:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to send login link. Please try again.',
      });
    }
  }

  goBack() {
    this.router.navigate(['/pricing']);
  }

  contactSupport() {
    this.router.navigate(['/contact']);
  }
}
