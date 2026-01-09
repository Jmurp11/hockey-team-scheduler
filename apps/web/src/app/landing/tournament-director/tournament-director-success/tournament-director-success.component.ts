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
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToastModule } from 'primeng/toast';
import { CardComponent } from '../../../shared/components/card/card.component';

type PageStatus = 'loading' | 'success' | 'error';

/**
 * Handles the return from Stripe Checkout.
 * Verifies payment and creates the featured tournament via API.
 */
@Component({
  selector: 'app-tournament-director-success',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonModule,
    ProgressSpinnerModule,
    ToastModule,
  ],
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
                <p>Verifying your payment...</p>
                <p class="loading-detail">Please wait while we confirm your transaction.</p>
              </div>
            </ng-template>
          </app-card>
        }
        @case ('success') {
          <app-card class="status-card success">
            <ng-template #title>Payment Successful!</ng-template>
            <ng-template #content>
              <div class="success-content">
                <div class="success-icon-container">
                  <i class="pi pi-check-circle success-icon"></i>
                </div>
                <h2>Your Featured Tournament is Live!</h2>
                <p>
                  Your tournament has been created with a featured listing.
                  It will appear with priority placement in our tournament directory.
                </p>
                <div class="benefits-list">
                  <div class="benefit-item">
                    <i class="pi pi-star-fill"></i>
                    <span>Featured badge on your listing</span>
                  </div>
                  <div class="benefit-item">
                    <i class="pi pi-arrow-up"></i>
                    <span>Priority placement in search results</span>
                  </div>
                  <div class="benefit-item">
                    <i class="pi pi-eye"></i>
                    <span>Highlighted appearance for more visibility</span>
                  </div>
                </div>
                <div class="action-buttons">
                  <p-button
                    label="View All Tournaments"
                    icon="pi pi-list"
                    (click)="viewTournaments()"
                  />
                  <p-button
                    label="Submit Another Tournament"
                    icon="pi pi-plus"
                    severity="secondary"
                    [outlined]="true"
                    (click)="submitAnother()"
                  />
                </div>
              </div>
            </ng-template>
          </app-card>
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

  status = signal<PageStatus>('loading');
  errorMessage = signal('There was an issue processing your payment.');

  ngOnInit() {
    this.handleStripeReturn();
  }

  /**
   * Handles the return from Stripe Checkout.
   * Extracts session_id from URL and verifies payment via API.
   */
  private handleStripeReturn() {
    const params = this.route.snapshot.queryParams;
    const sessionId = params['session_id'];

    if (sessionId) {
      // Verify payment and create featured tournament
      this.verifyPaymentAndCreateTournament(sessionId);
    } else if (params['canceled'] === 'true') {
      // Payment was canceled
      this.status.set('error');
      this.errorMessage.set(
        'Payment was canceled. Your tournament was not submitted.',
      );
    } else {
      // No session_id and not canceled - invalid state
      this.status.set('error');
      this.errorMessage.set(
        'Invalid session. Please start the submission process again.',
      );
    }
  }

  /**
   * Verifies the Stripe payment and creates the featured tournament.
   * The API retrieves tournament data from the session metadata.
   */
  private verifyPaymentAndCreateTournament(sessionId: string) {
    this.loadingService.setLoading(true);

    this.tournamentsService
      .verifyPaymentAndCreateTournament({ sessionId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tournament) => {
          this.loadingService.setLoading(false);
          this.status.set('success');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `"${tournament.name}" has been created as a featured tournament!`,
          });
        },
        error: (err) => {
          this.loadingService.setLoading(false);
          this.status.set('error');

          // Handle specific error cases
          if (err.status === 400) {
            this.errorMessage.set(
              'Payment could not be verified. Please contact support if you were charged.',
            );
          } else if (err.status === 409) {
            this.errorMessage.set(
              'A tournament with this name and date already exists.',
            );
          } else {
            this.errorMessage.set(
              'Failed to create your tournament. Please contact support.',
            );
          }

          console.error('Error verifying payment:', err);
        },
      });
  }

  viewTournaments() {
    this.router.navigate(['/tournaments']);
  }

  goBack() {
    this.router.navigate(['/tournament-director']);
  }

  submitAnother() {
    this.router.navigate(['/tournament-director']);
  }

  contactSupport() {
    this.router.navigate(['/contact']);
  }
}
