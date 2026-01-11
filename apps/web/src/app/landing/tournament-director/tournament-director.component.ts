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
import { TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { CreateTournamentDto } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../shared/components/card/card.component';
import { TournamentDirectorFormComponent } from './tournament-director-form/tournament-director-form.component';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Tournament Director landing page component.
 * Allows tournament directors to submit their tournament for free or as a featured listing.
 *
 * Workflow:
 * 1. User fills out tournament details
 * 2. User chooses free submission or featured ($99)
 * 3. If featured: redirect to Stripe Checkout, then save with featured=true on success callback
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
    ProgressSpinnerModule,
  ],
  providers: [MessageService],
  template: `
    <main class="tournament-director-container">
      <header class="hero-section">
        <h1>List Your Tournament</h1>
        <p class="subtitle">
          Reach hockey teams across North America looking for their next tournament
        </p>
      </header>

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
                    (click)="redirectToStripeCheckout()"
                    [disabled]="loadingService.isLoading()"
                  >
                    @if (loadingService.isLoading()) {
                      <p-progressSpinner
                        strokeWidth="4"
                        [style]="{ width: '20px', height: '20px' }"
                      />
                      Processing...
                    } @else {
                      Get Featured
                    }
                  </button>
                </div>
              </div>
              <button class="back-link" (click)="currentView.set('form')">
                &larr; Back to form
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
                <div class="success-actions">
                  <button class="btn-primary" (click)="resetForm()">
                    Submit Another Tournament
                  </button>
                  <button class="btn-secondary" (click)="viewTournaments()">
                    View All Tournaments
                  </button>
                </div>
              </div>
            </ng-template>
          </app-card>
        }
      }
    </main>
    <p-toast />
  `,
  styleUrls: ['./tournament-director.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDirectorComponent implements OnInit {
  protected loadingService = inject(LoadingService);
  private tournamentsService = inject(TournamentsService);
  private messageService = inject(MessageService);
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateTags({
      title: 'List Your Hockey Tournament - RinkLink.ai Tournament Directors',
      description:
        'List your youth hockey tournament on RinkLink.ai and reach thousands of teams. Free listings available. Featured listings get priority placement and promotion for $99.',
      url: 'https://rinklink.ai/tournament-director',
      keywords:
        'list hockey tournament, tournament director, hockey tournament marketing, promote hockey tournament, youth hockey events',
    });
  }

  // View state management
  currentView = signal<'form' | 'pricing' | 'success'>('form');

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
   * Creates a Stripe Checkout Session and redirects user to Stripe.
   * Tournament data is stored in the session metadata for retrieval after payment.
   */
  redirectToStripeCheckout() {
    const tournament = this.pendingTournament();
    if (!tournament) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill out the tournament form first.',
      });
      return;
    }

    this.loadingService.setLoading(true);

    const baseUrl = this.document.location.origin;
    const successUrl = `${baseUrl}/tournament-director/success`;
    const cancelUrl = `${baseUrl}/tournament-director`;

    this.tournamentsService
      .createFeaturedCheckout({
        tournament: { ...tournament, featured: true },
        successUrl,
        cancelUrl,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loadingService.setLoading(false);
          // Redirect to Stripe Checkout
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

  /**
   * Submits the tournament to the backend (for free listings).
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

  /**
   * Navigate to view all tournaments.
   */
  viewTournaments() {
    window.location.href = '/tournaments';
  }
}
