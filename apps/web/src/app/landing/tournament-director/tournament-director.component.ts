import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { CreateTournamentDto } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentDirectorFormComponent } from './tournament-director-form/tournament-director-form.component';

/**
 * Tournament Director landing page component.
 * Allows tournament directors to submit their tournament for free or as a featured listing.
 *
 * Workflow:
 * 1. User fills out tournament details
 * 2. User chooses free submission or featured ($99)
 * 3. If featured: redirect to Stripe checkout, then save with featured=true on success
 * 4. If free: save immediately with featured=false
 */
@Component({
  selector: 'app-tournament-director',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    TournamentDirectorFormComponent,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <div class="tournament-director-container">
      <div class="hero-section">
        <h1>List Your Tournament</h1>
        <p class="subtitle">
          Reach thousands of hockey teams looking for their next tournament
        </p>
      </div>

      @switch (currentView()) {
        @case ('form') {
          <app-tournament-director-form
            (formSubmit)="onFormSubmit($event)"
            (showPricing)="onShowPricing($event)"
          />
        }
        @case ('pricing') {
          <app-card class="pricing-card">
            <ng-template #title>Choose Your Listing</ng-template>
            <ng-template #content>
              <div class="pricing-options">
                <div class="pricing-option free">
                  <h3>Free Listing</h3>
                  <p class="price">$0</p>
                  <ul>
                    <li>Basic tournament listing</li>
                    <li>Visible in search results</li>
                    <li>Contact information displayed</li>
                  </ul>
                  <button
                    class="btn-secondary"
                    (click)="submitFree()"
                    [disabled]="loadingService.isLoading()"
                  >
                    Submit Free Listing
                  </button>
                </div>
                <div class="pricing-option featured">
                  <div class="featured-badge">Recommended</div>
                  <h3>Featured Listing</h3>
                  <p class="price">$99</p>
                  <ul>
                    <li>Priority placement in search</li>
                    <li>Featured badge on listing</li>
                    <li>Highlighted in tournament list</li>
                    <li>Social media promotion</li>
                  </ul>
                  <button
                    class="btn-primary"
                    (click)="showStripeCheckout()"
                    [disabled]="loadingService.isLoading()"
                  >
                    Get Featured
                  </button>
                </div>
              </div>
              <button class="back-link" (click)="currentView.set('form')">
                &larr; Back to form
              </button>
            </ng-template>
          </app-card>
        }
        @case ('stripe') {
          <app-card class="stripe-card">
            <ng-template #title>Complete Your Payment</ng-template>
            <ng-template #content>
              <div class="stripe-container">
                <!-- Stripe Pricing Table embedded via script -->
                <div id="stripe-pricing-table"></div>
                <p class="stripe-note">
                  After successful payment, your tournament will be featured
                  automatically.
                </p>
              </div>
              <button class="back-link" (click)="currentView.set('pricing')">
                &larr; Back to options
              </button>
            </ng-template>
          </app-card>
        }
        @case ('success') {
          <app-card class="success-card">
            <ng-template #title>Tournament Submitted!</ng-template>
            <ng-template #content>
              <div class="success-content">
                <i class="pi pi-check-circle success-icon"></i>
                <p>
                  Your tournament has been successfully submitted
                  {{ pendingTournament()?.featured ? 'as a featured listing' : '' }}.
                </p>
                <p class="success-detail">
                  Teams can now discover your tournament in our listings.
                </p>
                <button class="btn-primary" (click)="resetForm()">
                  Submit Another Tournament
                </button>
              </div>
            </ng-template>
          </app-card>
        }
      }
    </div>
    <p-toast />
  `,
  styleUrls: ['./tournament-director.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDirectorComponent {
  protected loadingService = inject(LoadingService);
  private tournamentsService = inject(TournamentsService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);

  // View state management
  currentView = signal<'form' | 'pricing' | 'success' | 'stripe'>('form');

  // Stores the pending tournament data before submission
  pendingTournament = signal<CreateTournamentDto | null>(null);

  /**
   * Called when the form is submitted directly (for free listing).
   * Saves the tournament with featured=false.
   */
  onFormSubmit(tournament: CreateTournamentDto) {
    this.pendingTournament.set({ ...tournament, featured: false });
    this.submitTournament(false);
  }

  /**
   * Called when user wants to see pricing options.
   * Stores form data and shows pricing view.
   */
  onShowPricing(tournament: CreateTournamentDto) {
    this.pendingTournament.set(tournament);
    this.currentView.set('pricing');
  }

  /**
   * Submits as a free listing.
   */
  submitFree() {
    if (this.pendingTournament()) {
      this.submitTournament(false);
    }
  }

  /**
   * Shows the Stripe checkout for featured listings.
   * Injects the Stripe pricing table script.
   */
  showStripeCheckout() {
    this.currentView.set('stripe');

    // Inject Stripe pricing table after view update
    setTimeout(() => {
      this.injectStripePricingTable();
    }, 100);
  }

  /**
   * Injects the Stripe pricing table script and element.
   */
  private injectStripePricingTable() {
    const container = document.getElementById('stripe-pricing-table');
    if (!container) return;

    // Clear existing content
    container.innerHTML = '';

    // Create and add the stripe-pricing-table element
    const pricingTable = document.createElement('stripe-pricing-table');
    pricingTable.setAttribute(
      'pricing-table-id',
      'prctbl_1SniSJIIVtFpI9s5rZSb1nEy',
    );
    pricingTable.setAttribute(
      'publishable-key',
      'pk_test_51RjUsHIIVtFpI9s5sKbxndFhWOndlpzW4iDrP2vQd51cwATj9ic8CXFNKlh3TUMII43qihw9mrWT9nmJRNOH4Oaw00dgCssny1',
    );

    // Store tournament data in session storage for retrieval after Stripe redirect
    if (this.pendingTournament()) {
      sessionStorage.setItem(
        'pendingTournament',
        JSON.stringify(this.pendingTournament()),
      );
    }

    container.appendChild(pricingTable);

    // Load Stripe script if not already loaded
    if (!document.querySelector('script[src*="stripe.com/v3/pricing-table"]')) {
      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://js.stripe.com/v3/pricing-table.js';
      document.head.appendChild(script);
    }
  }

  /**
   * Submits the tournament to the backend.
   */
  private submitTournament(featured: boolean) {
    const tournament = this.pendingTournament();
    if (!tournament) return;

    this.loadingService.setLoading(true);

    const payload: CreateTournamentDto = {
      ...tournament,
      featured,
    };

    this.tournamentsService
      .createTournament(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loadingService.setLoading(false);
          this.pendingTournament.set({ ...payload });
          this.currentView.set('success');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Your tournament has been submitted successfully!',
          });
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          const message =
            err.status === 409
              ? 'A tournament with this name and date already exists.'
              : 'Failed to submit tournament. Please try again.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: message,
          });
        },
      });
  }

  /**
   * Resets the form for another submission.
   */
  resetForm() {
    this.pendingTournament.set(null);
    this.currentView.set('form');
  }
}
