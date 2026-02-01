import { CommonModule, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { SubscriptionService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Pricing configuration - single plan with per-seat pricing.
 */
const PRICE_PER_SEAT = 75; // $75 per seat per year

const FEATURES = [
  'AI-powered game matching by distance and skill level',
  'Schedule risk alerts for overlaps, tight turnarounds, and travel conflicts',
  'Tournament fit analysis based on team rating and schedule',
  'AI assistant for schedule questions, game planning, and email drafts',
  'Organization-level admin with master schedule across all teams',
];

/**
 * Pricing page component.
 * Allows users to choose a subscription plan and checkout via Stripe.
 *
 * Workflow:
 * 1. User views pricing options
 * 2. User enters email and selects a plan
 * 3. Redirect to Stripe Checkout for payment
 * 4. On success, user is redirected to /pricing/success
 */
@Component({
  selector: 'app-pricing',
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
  template: `
    <main class="pricing-container">
      <header class="hero-section">
        <h1>Simple, Transparent Pricing</h1>
        <p class="subtitle">
          Pay only for what you need. No hidden fees, cancel anytime.
        </p>
      </header>

      <app-card class="pricing-card">
        <ng-template #content>
          <div class="pricing-option">
            <div class="price-display">
              <span class="price">\${{ pricePerSeat }}</span>
              <span class="price-detail">per seat / year</span>
            </div>

            <div class="seat-selector">
              <label for="seats">Number of seats</label>
              <div class="seat-controls">
                <button
                  type="button"
                  class="seat-btn"
                  (click)="decrementSeats()"
                  [disabled]="seats() <= 1"
                >-</button>
                <span class="seat-count">{{ seats() }}</span>
                <button
                  type="button"
                  class="seat-btn"
                  (click)="incrementSeats()"
                >+</button>
              </div>
              <p class="total-price">\${{ totalPrice() }}/year</p>
            </div>

            <ul class="features-list">
              @for (feature of features; track feature) {
                <li>{{ feature }}</li>
              }
            </ul>

            <form [formGroup]="emailForm" class="email-form">
              <app-input [control]="emailControl" label="Email" />
            </form>

            <button
              class="btn-primary"
              (click)="subscribe()"
              [disabled]="loadingService.isLoading() || emailForm.invalid"
            >
              @if (loadingService.isLoading()) {
                <p-progressSpinner
                  strokeWidth="4"
                  [style]="{ width: '20px', height: '20px' }"
                />
                Processing...
              } @else {
                Get Started
              }
            </button>
          </div>
        </ng-template>
      </app-card>

      <div class="pricing-footer">
        <p class="contact-info">
          Need a custom plan? <a href="/contact">Contact us</a>
        </p>
      </div>
    </main>
    <p-toast />
  `,
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private subscriptionService = inject(SubscriptionService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private seoService = inject(SeoService);

  // Pricing configuration
  pricePerSeat = PRICE_PER_SEAT;
  features = FEATURES;

  // Seat selection
  seats = signal(1);
  totalPrice = computed(() => this.seats() * this.pricePerSeat);

  // Email form
  emailForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  get emailControl(): FormControl {
    return this.emailForm.get('email') as FormControl;
  }

  incrementSeats(): void {
    this.seats.update(s => s + 1);
  }

  decrementSeats(): void {
    if (this.seats() > 1) {
      this.seats.update(s => s - 1);
    }
  }

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'Pricing - RinkLink.ai Hockey Scheduling Plans',
      description:
        'Choose the perfect plan for your youth hockey team. Flexible pricing for AI-powered scheduling, tournament discovery, and team management. Free trial available.',
      url: 'https://rinklink.ai/pricing',
      keywords:
        'hockey scheduling pricing, youth hockey plans, sports management pricing, hockey team subscription, tournament management cost',
    });

    // Add Product structured data with detailed pricing and FAQ
    this.seoService.addMultipleStructuredData([
      {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'RinkLink.ai Hockey Scheduling',
        description:
          'AI-powered youth hockey scheduling and tournament management platform',
        brand: {
          '@type': 'Brand',
          name: 'RinkLink.ai',
        },
        offers: {
          '@type': 'Offer',
          price: '75.00',
          priceCurrency: 'USD',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: '75.00',
            priceCurrency: 'USD',
            unitText: 'per seat per year',
          },
          availability: 'https://schema.org/InStock',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '5',
          ratingCount: '1',
        },
      },
      // FAQ structured data
      this.seoService.getFAQPageSchema([
        {
          question: 'How much does RinkLink.ai cost?',
          answer:
            'RinkLink.ai costs $75 per seat per year. You can select the number of seats you need based on your organization size.',
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer:
            'Yes, you can cancel your subscription at any time with no questions asked. We also offer a 30-day money-back guarantee.',
        },
        {
          question: 'What features are included?',
          answer:
            'All plans include AI-powered game matching, schedule risk monitoring, tournament fit analysis, an AI assistant for scheduling and emails, and organization-level administration.',
        },
        {
          question: 'Is there a free trial?',
          answer:
            'We offer a 30-day money-back guarantee, allowing you to try RinkLink.ai risk-free.',
        },
      ]),
    ]);
  }

  /**
   * Handles subscription and initiates Stripe checkout.
   */
  subscribe(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.messageService.add({
        severity: 'warn',
        summary: 'Email Required',
        detail: 'Please enter a valid email address.',
      });
      return;
    }

    this.redirectToStripeCheckout();
  }

  /**
   * Creates a Stripe Checkout Session and redirects user to Stripe.
   */
  private redirectToStripeCheckout(): void {
    const email = this.emailForm.value.email || '';

    this.loadingService.setLoading(true);

    const baseUrl = this.document.location.origin;
    const successUrl = `${baseUrl}/pricing/success`;
    const cancelUrl = `${baseUrl}/pricing`;

    this.subscriptionService
      .createCheckout({
        email,
        seats: this.seats(),
        successUrl,
        cancelUrl,
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
              detail: 'Failed to create checkout session. Please try again.',
            });
          }
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          console.error('Stripe checkout error:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to process payment. Please try again.',
          });
        },
      });
  }
}
