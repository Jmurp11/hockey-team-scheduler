import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeveloperPortalService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * API features available to developers
 */
const API_FEATURES = [
  'Association data - organizations, teams, and leagues',
  'Rankings data - team records, ratings, and more',
  'Leagues data - member associations, teams and more',
  'Rink data - names and locations',
];

/**
 * Developer Signup Component
 *
 * Handles the signup flow for developer API access:
 * 1. User enters email
 * 2. Redirects to Stripe Checkout
 * 3. On success, user receives API key via email
 * 4. User is redirected to success page
 *
 * Also handles checkout success callback when returning from Stripe.
 */
@Component({
  selector: 'app-developer-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    InputComponent,
    ToastModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="signup-container">
      @if (checkoutSuccess()) {
        <!-- Success State -->
        <div class="success-card">
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>
          <h1>Welcome to RinkLink.ai API!</h1>
          <p class="success-message">
            Your API key has been generated and sent to your email.
            Please check your inbox for the welcome email containing your API key.
          </p>
          <div class="success-actions">
            <button class="btn-primary" (click)="navigateToLogin()">
              <i class="pi pi-envelope"></i>
              Request Login Link
            </button>
            <button class="btn-secondary" (click)="navigateToDocs()">
              <i class="pi pi-book"></i>
              View Documentation
            </button>
          </div>
          <p class="security-note">
            <i class="pi pi-shield"></i>
            Your API key is shown only in the email for security reasons.
            Store it securely - you can rotate it from your dashboard.
          </p>
        </div>
      } @else {
        <!-- Signup Form -->
        <header class="hero-section">
          <h1>Get Your API Key</h1>
          <p class="subtitle">
            Pay only for what you use. No hidden fees, cancel anytime.
          </p>
        </header>

        <app-card class="signup-card">
          <ng-template #content>
            <div class="signup-option">
              <div class="price-display">
                <span class="price">\$0.05</span>
                <span class="price-detail">per API request</span>
              </div>

              <ul class="features-list">
                @for (feature of features; track feature) {
                  <li>{{ feature }}</li>
                }
              </ul>

              <form [formGroup]="signupForm" class="email-form">
                <app-input [control]="emailControl" label="Email" />
              </form>

              <button
                class="btn-primary"
                (click)="onSubmit()"
                [disabled]="loadingService.isLoading() || signupForm.invalid"
              >
                @if (loadingService.isLoading()) {
                  <p-progressSpinner
                    strokeWidth="4"
                    [style]="{ width: '20px', height: '20px' }"
                  />
                  Processing...
                } @else {
                  Continue to Payment
                }
              </button>

              <div class="existing-account">
                <p>Already have an account?</p>
                <a (click)="navigateToLogin()">Sign in with magic link</a>
              </div>
            </div>
          </ng-template>
        </app-card>

        <div class="signup-footer">
          <p class="guarantee">
            <i class="pi pi-lock"></i>
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      }
    </main>
    <p-toast />
  `,
  styleUrl: './developer-signup.component.scss',
})
export class DeveloperSignupComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private developerPortalService = inject(DeveloperPortalService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private seoService = inject(SeoService);

  features = API_FEATURES;
  checkoutSuccess = signal(false);

  signupForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  get emailControl(): FormControl {
    return this.signupForm.get('email') as FormControl;
  }

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'API Signup - Get Your RinkLink.ai API Key',
      description:
        'Sign up for RinkLink.ai API access. Pay-per-request pricing at $0.05 per call. Get instant access to youth hockey data including associations, rankings, leagues, and rinks.',
      url: 'https://rinklink.ai/developer/signup',
      keywords:
        'API signup, hockey API key, developer registration, API access, hockey data API',
    });

    // Check for successful checkout callback
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const sessionId = params['session_id'];
        if (sessionId) {
          this.verifyCheckout(sessionId);
        }
      });
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.redirectToCheckout();
  }

  private redirectToCheckout(): void {
    const email = this.signupForm.value.email || '';
    const baseUrl = this.document.location.origin;

    this.loadingService.setLoading(true);

    this.developerPortalService
      .createCheckout({
        email,
        successUrl: `${baseUrl}/developer/signup`,
        cancelUrl: `${baseUrl}/developer/signup`,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingService.setLoading(false);
          if (response.url) {
            window.location.href = response.url;
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create checkout session.',
            });
          }
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          console.error('Checkout error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.error?.error || 'Failed to process. Please try again.',
          });
        },
      });
  }

  private verifyCheckout(sessionId: string): void {
    this.loadingService.setLoading(true);

    this.developerPortalService
      .getCheckoutStatus(sessionId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (status) => {
          this.loadingService.setLoading(false);
          if (status.status === 'paid') {
            this.checkoutSuccess.set(true);
          } else {
            this.messageService.add({
              severity: 'warn',
              summary: 'Payment Pending',
              detail: 'Your payment is still processing. Please try again shortly.',
            });
          }
        },
        error: () => {
          this.loadingService.setLoading(false);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to verify checkout. Please contact support.',
          });
        },
      });
  }

  navigateToLogin(): void {
    this.router.navigate(['/developer/login']);
  }

  navigateToDocs(): void {
    this.router.navigate(['/developer']);
  }
}
