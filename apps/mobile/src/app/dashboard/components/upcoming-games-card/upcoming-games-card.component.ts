import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { UpcomingGame } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendar, chevronForward } from 'ionicons/icons';
import { CardComponent } from '../../../shared/card/card.component';
import { ButtonComponent } from '../../../shared/button/button.component';

@Component({
  selector: 'app-upcoming-games-card',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    CardComponent,
    ButtonComponent,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
  ],
  template: `
    <app-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="calendar"></ion-icon>
          Upcoming Games
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        @if (games.length > 0) {
          <ion-list lines="full">
            @for (game of games.slice(0, 5); track game.id) {
              <ion-item [class.home-game]="game.isHome">
                <ion-label>
                  <h3>{{ game.isHome ? 'vs' : '@' }} {{ game.opponent }}</h3>
                  <p>{{ game.date | date : 'EEE, MMM d' }} · {{ formatTime(game.time) }}</p>
                  <p class="location">{{ game.rink }}</p>
                </ion-label>
                @if (game.opponentRating) {
                  <ion-note slot="end">{{ game.opponentRating | number : '1.1-1' }}</ion-note>
                }
              </ion-item>
            }
          </ion-list>
          <div class="view-all">
            <app-button fill="clear" size="small" (onClick)="navigateToSchedule()">
              View Full Schedule
              <ion-icon name="chevron-forward" slot="end"></ion-icon>
            </app-button>
          </div>
        } @else {
          <div class="empty-state">
            <p>No upcoming games</p>
            <app-button fill="outline" size="small" (onClick)="navigateToSchedule()">
              Add a Game
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

        &.home-game {
          --background: var(--ion-color-secondary-tint);
        }

        h3 {
          font-weight: 600;
          font-size: 0.9375rem;
          margin-bottom: 4px;
        }

        p {
          font-size: 0.8125rem;
          color: var(--ion-color-medium);
        }

        .location {
          font-size: 0.75rem;
        }
      }

      ion-note {
        font-size: 0.875rem;
        font-weight: 500;
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
export class UpcomingGamesCardComponent {
  private router = inject(Router);
  
  @Input({ required: true }) games!: UpcomingGame[];

  constructor() {
    addIcons({ calendar, chevronForward });
  }

  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  }

  navigateToSchedule(): void {
    this.router.navigate(['/app/schedule']);
  }
}
