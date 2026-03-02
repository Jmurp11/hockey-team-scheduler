import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
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
import {
  PRICE_PER_SEAT,
  PRICING_FEATURES,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonContent,
  IonHeader,
  IonInput,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-pricing',
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
    IonCardContent,
    IonInput,
    IonButton,
    IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/auth"></ion-back-button>
        </ion-buttons>
        <ion-title>Pricing</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-content>
          <div class="price-display">
            <span class="price">\${{ pricePerSeat }}</span>
            <span class="price-detail">per user / year</span>
          </div>

          <div class="seat-selector">
            <label>Number of users</label>
            <div class="seat-controls">
              <ion-button
                fill="outline"
                size="small"
                (click)="decrementSeats()"
                [disabled]="seats() <= 1"
              >-</ion-button>
              <span class="seat-count">{{ seats() }}</span>
              <ion-button
                fill="outline"
                size="small"
                (click)="incrementSeats()"
              >+</ion-button>
            </div>
            <p class="total-price">\${{ totalPrice() }}/year</p>
          </div>

          <ul class="features-list">
            @for (feature of features; track feature) {
              <li>{{ feature }}</li>
            }
          </ul>

          <form [formGroup]="emailForm">
            <ion-input
              label="Email"
              labelPlacement="floating"
              type="email"
              formControlName="email"
              class="ion-margin-bottom"
            />
          </form>

          <ion-button
            expand="block"
            color="secondary"
            (click)="subscribe()"
            [disabled]="loading() || emailForm.invalid"
          >
            @if (loading()) {
              <ion-spinner name="crescent" />
            } @else {
              Get Started
            }
          </ion-button>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
  styles: [
    `
      .price-display {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .price {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--ion-color-secondary);
      }

      .price-detail {
        display: block;
        color: var(--ion-color-medium);
        font-size: 0.9rem;
      }

      .seat-selector {
        text-align: center;
        margin-bottom: 1.5rem;
      }

      .seat-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin: 0.5rem 0;
      }

      .seat-count {
        font-size: 1.5rem;
        font-weight: 600;
        min-width: 2rem;
        text-align: center;
      }

      .total-price {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--ion-color-secondary);
      }

      .features-list {
        padding-left: 1.25rem;
        margin-bottom: 1.5rem;
      }

      .features-list li {
        margin-bottom: 0.5rem;
        line-height: 1.4;
      }

      ion-card {
        max-width: 600px;
        margin: 0 auto;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricingPage {
  private subscriptionService = inject(SubscriptionService);
  private toastController = inject(ToastController);
  private destroyRef = inject(DestroyRef);

  pricePerSeat = PRICE_PER_SEAT;
  features = PRICING_FEATURES;

  seats = signal(1);
  totalPrice = computed(() => this.seats() * this.pricePerSeat);
  loading = signal(false);

  emailForm = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
    }),
  });

  incrementSeats(): void {
    this.seats.update((s) => s + 1);
  }

  decrementSeats(): void {
    if (this.seats() > 1) {
      this.seats.update((s) => s - 1);
    }
  }

  subscribe(): void {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.showToast('Please enter a valid email address.', 'warning');
      return;
    }

    this.redirectToStripeCheckout();
  }

  private redirectToStripeCheckout(): void {
    const email = this.emailForm.value.email || '';

    this.loading.set(true);

    const baseUrl = window.location.origin;
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
          this.loading.set(false);
          if (response.url) {
            window.open(response.url, '_self');
          } else {
            this.showToast(
              'Failed to create checkout session. Please try again.',
              'danger',
            );
          }
        },
        error: (err) => {
          this.loading.set(false);
          console.error('Stripe checkout error:', err);
          this.showToast(
            'Failed to process payment. Please try again.',
            'danger',
          );
        },
      });
  }

  private async showToast(
    message: string,
    color: 'success' | 'danger' | 'warning',
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
