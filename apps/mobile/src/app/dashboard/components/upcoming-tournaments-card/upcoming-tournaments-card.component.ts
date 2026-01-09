import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { sortTournamentsWithFeaturedFirst, UpcomingTournament } from '@hockey-team-scheduler/shared-utilities';
import {
  IonBadge,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward, star, trophy } from 'ionicons/icons';
import { CardComponent } from '../../../shared/card/card.component';
import { ButtonComponent } from '../../../shared/button/button.component';

/**
 * Upcoming tournaments card component for the mobile dashboard.
 * Displays upcoming tournaments with featured tournaments highlighted.
 * Featured tournaments are shown first and have a special badge.
 */
@Component({
  selector: 'app-upcoming-tournaments-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CardComponent,
    ButtonComponent,
    IonBadge,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
  ],
  template: `
    <app-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="trophy"></ion-icon>
          Upcoming Tournaments
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @if (tournaments.length > 0) {
          <ion-list lines="full">
            @for (tournament of sortedTournaments.slice(0, 3); track tournament.id) {
              <ion-item [class.featured-item]="tournament.featured">
                <ion-label>
                  <div class="tournament-header">
                    <h3 [class.featured-name]="tournament.featured">{{ tournament.name }}</h3>
                    <!-- Featured badge for highlighted tournaments -->
                    @if (tournament.featured) {
                      <ion-badge class="featured-badge" color="warning">
                        <ion-icon name="star"></ion-icon>
                        Featured
                      </ion-badge>
                    }
                  </div>
                  <p>
                    {{ tournament.startDate | date : 'MMM d' }}
                    @if (tournament.startDate !== tournament.endDate) {
                      - {{ tournament.endDate | date : 'MMM d' }}
                    }
                  </p>
                  <p class="location">{{ tournament.location }}</p>
                  @if (tournament.rink) {
                    <p class="rink">{{ tournament.rink }}</p>
                  }
                </ion-label>
              </ion-item>
            }
          </ion-list>
          <div class="view-all">
            <app-button fill="clear" size="small" (onClick)="navigateToTournaments()">
              Browse Tournaments
              <ion-icon name="chevron-forward" slot="end"></ion-icon>
            </app-button>
          </div>
        } @else {
          <div class="empty-state">
            <p>No upcoming tournaments</p>
            <app-button fill="outline" size="small" (onClick)="navigateToTournaments()">
              Find Tournaments
            </app-button>
          </div>
        }
      </ion-card-content>
    </app-card>
  `,
  styles: [
    `
      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1rem;
      }

      ion-icon {
        font-size: 1.125rem;
        color: var(--ion-color-primary);
      }

      ion-card-content {
        padding: 0;
      }

      ion-list {
        padding: 0;
      }

      ion-item {
        --padding-start: 16px;
        --padding-end: 16px;
        transition: background 0.2s ease;

        // Featured item styling
        &.featured-item {
          --background: linear-gradient(
            135deg,
            var(--ion-color-primary-tint, #e0e7ff) 0%,
            white 100%
          );
        }

        h3 {
          font-weight: 600;
          font-size: 0.9375rem;
          margin-bottom: 4px;

          // Featured tournament name styling
          &.featured-name {
            color: var(--ion-color-primary-shade, #1d4ed8);
          }
        }

        p {
          font-size: 0.8125rem;
          color: var(--ion-color-medium);
        }

        .location {
          font-size: 0.75rem;
        }

        .rink {
          font-size: 0.6875rem;
          color: var(--ion-color-medium-shade);
        }
      }

      // Tournament header with name and badge
      .tournament-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        margin-bottom: 2px;
      }

      // Featured badge styling
      .featured-badge {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font-size: 0.6rem;
        padding: 2px 6px;
        border-radius: 8px;
        flex-shrink: 0;

        ion-icon {
          font-size: 0.55rem;
          color: inherit;
        }
      }

      .view-all {
        display: flex;
        justify-content: center;
        padding: 8px 16px 16px;
        border-top: 1px solid var(--ion-color-light);
      }

      .empty-state {
        text-align: center;
        padding: 24px 16px;

        p {
          color: var(--ion-color-medium);
          margin-bottom: 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingTournamentsCardComponent {
  private router = inject(Router);

  @Input({ required: true }) tournaments!: UpcomingTournament[];

  constructor() {
    addIcons({ trophy, chevronForward, star });
  }

  /**
   * Returns tournaments sorted with featured ones first.
   * Uses the shared utility function for consistent sorting across the app.
   */
  get sortedTournaments(): UpcomingTournament[] {
    return sortTournamentsWithFeaturedFirst(this.tournaments, 'startDate', 'asc');
  }

  navigateToTournaments(): void {
    this.router.navigate(['/app/tournaments']);
  }
}
