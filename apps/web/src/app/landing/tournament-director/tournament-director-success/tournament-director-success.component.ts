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
import { TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import { LoadingService } from '@hockey-team-scheduler/shared-ui';
import { CreateTournamentDto } from '@hockey-team-scheduler/shared-utilities';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../../shared/components/card/card.component';

/**
 * Handles the return from Stripe checkout.
 * Checks for payment success and saves the tournament as featured.
 */
@Component({
  selector: 'app-tournament-director-success',
  standalone: true,
  imports: [CommonModule, CardComponent, ProgressSpinnerModule, ToastModule],
  providers: [MessageService],
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
                <p>Processing your payment...</p>
              </div>
            </ng-template>
          </app-card>
        }
        @case ('success') {
          <app-card class="status-card">
            <ng-template #title>Payment Successful!</ng-template>
            <ng-template #content>
              <div class="success-content">
                <i class="pi pi-check-circle success-icon"></i>
                <p>Your featured tournament listing has been created.</p>
                <p class="success-detail">
                  Your tournament will appear with priority placement in our
                  listings.
                </p>
                <button class="btn-primary" (click)="goToHome()">
                  Return to Home
                </button>
                <button class="btn-secondary" (click)="submitAnother()">
                  Submit Another Tournament
                </button>
              </div>
            </ng-template>
          </app-card>
        }
        @case ('error') {
          <app-card class="status-card">
            <ng-template #title>Payment Issue</ng-template>
            <ng-template #content>
              <div class="error-content">
                <i class="pi pi-times-circle error-icon"></i>
                <p>{{ errorMessage() }}</p>
                <button class="btn-primary" (click)="goBack()">
                  Try Again
                </button>
              </div>
            </ng-template>
          </app-card>
        }
      }
    </div>
    <p-toast />
  `,
  styleUrls: ['./tournament-director-success.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentDirectorSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private tournamentsService = inject(TournamentsService);
  private messageService = inject(MessageService);
  private loadingService = inject(LoadingService);
  private destroyRef = inject(DestroyRef);

  status = signal<'loading' | 'success' | 'error'>('loading');
  errorMessage = signal('There was an issue processing your payment.');

  ngOnInit() {
    this.handleStripeReturn();
  }

  /**
   * Handles the return from Stripe checkout.
   * Checks query params for success/cancel status and submits the tournament.
   */
  private handleStripeReturn() {
    const params = this.route.snapshot.queryParams;

    // Stripe redirect typically includes session_id on success
    if (params['session_id'] || params['success'] === 'true') {
      this.submitFeaturedTournament();
    } else if (params['canceled'] === 'true') {
      this.status.set('error');
      this.errorMessage.set(
        'Payment was canceled. Your tournament was not submitted.',
      );
    } else {
      // No clear indicator - check for stored tournament data
      const storedTournament = sessionStorage.getItem('pendingTournament');
      if (storedTournament) {
        this.submitFeaturedTournament();
      } else {
        this.status.set('error');
        this.errorMessage.set('No tournament data found. Please try again.');
      }
    }
  }

  /**
   * Submits the tournament with featured=true after successful payment.
   */
  private submitFeaturedTournament() {
    const storedData = sessionStorage.getItem('pendingTournament');

    if (!storedData) {
      this.status.set('error');
      this.errorMessage.set(
        'Tournament data not found. Please submit your tournament again.',
      );
      return;
    }

    try {
      const tournament: CreateTournamentDto = JSON.parse(storedData);
      tournament.featured = true;

      this.loadingService.setLoading(true);

      this.tournamentsService
        .createTournament(tournament)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.loadingService.setLoading(false);
            // Clear the stored tournament data
            sessionStorage.removeItem('pendingTournament');
            this.status.set('success');
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Your featured tournament has been created!',
            });
          },
          error: (err) => {
            this.loadingService.setLoading(false);
            this.status.set('error');
            if (err.status === 409) {
              this.errorMessage.set(
                'A tournament with this name and date already exists.',
              );
            } else {
              this.errorMessage.set(
                'Failed to create tournament. Please contact support.',
              );
            }
          },
        });
    } catch {
      this.status.set('error');
      this.errorMessage.set('Invalid tournament data. Please try again.');
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  goBack() {
    this.router.navigate(['/tournament-director']);
  }

  submitAnother() {
    this.router.navigate(['/tournament-director']);
  }
}
