import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatTournamentLocation } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-tournament-card-header',
  standalone: true,
  imports: [CommonModule, IonCardHeader, IonCardTitle, IonCardSubtitle],
  template: `
    <ion-card-header>
      <ion-card-title>
        <div class="title-row">
          <div class="tournament-name">{{ tournament.name }}</div>
          <div class="tournament-distance">
            {{ tournament.distance | number: '1.1-1' }} mi
          </div>
        </div>
      </ion-card-title>
      <ion-card-subtitle>
        <div class="location-info">
          <div>{{ formatLocation(tournament.location) }}</div>
          <div>
            {{ tournament.startDate | date: 'MMM d, y' }} -
            {{ tournament.endDate | date: 'MMM d, y' }}
          </div>
        </div>
      </ion-card-subtitle>
    </ion-card-header>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      ion-card-subtitle {
        margin-top: 0.5rem;
      }

      .title-row {
        @include flex(space-between, flex-start, row);
      }

      .tournament-name {
        font-weight: 600;
        color: var(--primary-500);
        font-size: 0.9rem;
        width: 50%;
      }

      .tournament-distance {
        font-weight: 600;
        color: var(--secondary-500);
        font-size: 0.9rem;
        width: 50%;
        text-align: right;
      }

    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardHeaderComponent {
  @Input()
  tournament: any;

  formatLocation = formatTournamentLocation;
}
