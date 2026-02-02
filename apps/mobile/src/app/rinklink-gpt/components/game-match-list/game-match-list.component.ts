import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  peopleOutline,
} from 'ionicons/icons';

import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { GameMatchResults } from '@hockey-team-scheduler/shared-utilities';
import { GameMatchCardComponent } from '../game-match-card/game-match-card.component';

@Component({
  selector: 'app-game-match-list',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    IonIcon,
    GameMatchCardComponent,
  ],
  template: `
    <div class="game-match-list">
      <div class="game-match-list__header">
        <div class="game-match-list__title">
          <ion-icon name="people-outline"></ion-icon>
          <span>Opponent Matches</span>
        </div>
        <ion-badge color="primary">
          {{ results().matches.length }} found
        </ion-badge>
      </div>

      <div class="game-match-list__context">
        <div class="game-match-list__detail">
          <span class="label">Your Team:</span>
          <span class="value">{{ results().userTeam.name }} ({{ results().userTeam.rating }})</span>
        </div>
        <div class="game-match-list__detail">
          <span class="label">Date Range:</span>
          <span class="value">{{ results().dateRange.start }} to {{ results().dateRange.end }}</span>
        </div>
        <div class="game-match-list__detail">
          <span class="label">Radius:</span>
          <span class="value">{{ results().searchRadius }} mi</span>
        </div>
      </div>

      <div class="game-match-list__matches">
        @for (match of results().matches; track match.team.id) {
          <app-game-match-card
            [match]="match"
            [disabled]="disabled()"
            [isSearching]="searchingTeamId() === match.team.id"
            (sendEmail)="sendEmail.emit($event)"
            (findContact)="findContact.emit($event)"
          />
        }
      </div>

      <div class="game-match-list__footer">
        <ion-icon name="information-circle-outline"></ion-icon>
        <span>Tap a team to expand and review the email draft.</span>
      </div>
    </div>
  `,
  styles: [`
    .game-match-list {
      background: var(--ion-color-light-tint);
      border: 1px solid var(--ion-color-light-shade);
      border-radius: 8px;
      overflow: hidden;
      margin-top: 0.75rem;

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0.625rem 0.75rem;
        background: var(--ion-color-primary);
        color: white;
      }

      &__title {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-weight: 600;
        font-size: 0.875rem;

        ion-icon {
          font-size: 1rem;
        }
      }

      &__context {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        padding: 0.625rem 0.75rem;
        background: var(--ion-background-color);
        border-bottom: 1px solid var(--ion-color-light-shade);
        font-size: 0.75rem;
      }

      &__detail {
        display: flex;
        gap: 0.25rem;

        .label {
          color: var(--ion-color-medium);
        }

        .value {
          font-weight: 500;
          color: var(--ion-text-color);
        }
      }

      &__matches {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
      }

      &__footer {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0.75rem;
        background: var(--ion-color-light);
        border-top: 1px solid var(--ion-color-light-shade);
        font-size: 0.6875rem;
        color: var(--ion-color-medium);

        ion-icon {
          color: var(--ion-color-primary);
          font-size: 0.875rem;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMatchListComponent {
  results = input.required<GameMatchResults>();
  disabled = input(false);
  searchingTeamId = input<number | null>(null);
  sendEmail = output<PendingAction>();
  findContact = output<{ teamId: number; team: string; location: string }>();

  constructor() {
    addIcons({ peopleOutline, informationCircleOutline });
  }
}
