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
import {
  SubscriptionService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  getFormControl,
  initMagicLinkForm,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';

type PageStatus = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-pricing-success',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonButton,
    IonSpinner,
  ],
  providers: [UserService],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/pricing"></ion-back-button>
        </ion-buttons>
        <ion-title>Subscription</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @switch (status()) {
        @case ('loading') {
          <div class="center-content">
            <ion-spinner name="crescent" />
            <p>Verifying your payment...</p>
            <p class="detail-text">
              Please wait while we confirm your subscription.
            </p>
          </div>
        }
        @case ('success') {
          @if (emailSent()) {
            <ion-card>
              <ion-card-header>
                <ion-card-title>Check your email!</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <p>
                  We've sent you a magic link to log in. Please check your
                  inbox.
                </p>
              </ion-card-content>
            </ion-card>
          } @else {
            <ion-card>
              <ion-card-header>
                <ion-card-title>Welcome to RinkLink!</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <h2>Your Subscription is Active!</h2>
                <p>
                  Thank you for subscribing to {{ planName() }}. Enter your email
                  below to receive a login link.
                </p>
                <form [formGroup]="magicLinkForm">
                  <ion-input
                    label="Email"
                    labelPlacement="floating"
                    type="email"
                    [formControl]="getFormControl(magicLinkForm, 'email')"
                    class="ion-margin-bottom"
                  />
                  <ion-button
                    expand="block"
                    color="secondary"
                    (click)="sendMagicLink()"
                    [disabled]="magicLinkForm.invalid || sendingEmail()"
                  >
                    @if (sendingEmail()) {
                      <ion-spinner name="crescent" />
                    } @else {
                      Get Login Link
                    }
                  </ion-button>
                </form>
              </ion-card-content>
            </ion-card>
          }
        }
        @case ('error') {
          <ion-card>
            <ion-card-header>
              <ion-card-title>Something Went Wrong</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>{{ errorMessage() }}</p>
              <p class="detail-text">
                If you were charged, please contact support with your session
                details.
              </p>
              <div class="action-buttons">
                <ion-button expand="block" color="secondary" (click)="goBack()">
                  Try Again
                </ion-button>
                <ion-button
                  expand="block"
                  fill="outline"
                  (click)="contactSupport()"
                >
                  Contact Support
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      .center-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem 1rem;
        text-align: center;
      }

      .detail-text {
        color: var(--ion-color-medium);
        font-size: 0.9rem;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-top: 1rem;
      }

      ion-card {
        max-width: 600px;
        margin: 0 auto;
      }

      h2 {
        margin-bottom: 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingSuccessPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptionService = inject(SubscriptionService);
  private userService = inject(UserService);
  private toastController = inject(ToastController);
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

  private verifyPayment(sessionId: string) {
    this.subscriptionService
      .getCheckoutStatus(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (session) => {
          if (session.status === 'paid') {
            this.status.set('success');
            this.planName.set(this.formatPlanName(session.seats));

            if (session.customerEmail) {
              this.magicLinkForm.get('email')?.setValue(session.customerEmail);
            }

            this.showToast(
              'Your subscription has been activated successfully.',
              'success',
            );
          } else {
            this.status.set('error');
            this.errorMessage.set(
              'Payment could not be verified. Please contact support if you were charged.',
            );
          }
        },
        error: (err) => {
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

  private formatPlanName(seats: number | null): string {
    if (!seats) return 'your plan';
    return `${seats}-Seat Plan`;
  }

  async sendMagicLink() {
    this.sendingEmail.set(true);

    const email = this.magicLinkForm.get('email')?.value;
    const { error } = await this.userService.loginWithMagicLink(email);

    this.sendingEmail.set(false);

    if (!error) {
      this.emailSent.set(true);
    } else {
      console.error('Magic link error:', error);
      this.showToast(
        error.message || 'Failed to send login link. Please try again.',
        'danger',
      );
    }
  }

  goBack() {
    this.router.navigate(['/pricing']);
  }

  contactSupport() {
    this.router.navigate(['/auth/contact']);
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger',
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
