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
      <ion-card-title>{{ tournament.name }}</ion-card-title>
      <ion-card-subtitle>
        <div class="location-info">
          <div>{{ formatLocation(tournament.location) }}</div>
          <div>
            {{ tournament.startDate | date: 'MMM d, y' }} - 
            {{ tournament.endDate | date: 'MMM d, y' }}
          </div>
        </div>
        <div class="distance-info">
          Distance: {{ formatDistance(tournament.distance) }}
        </div>
      </ion-card-subtitle>
    </ion-card-header>
  `,
  styles: [`
    ion-card-subtitle {
      margin-top: 0.5rem;
    }

    .location-info {
      margin-bottom: 0.5rem;
    }

    .distance-info {
      font-weight: 600;
      color: var(--ion-color-primary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardHeaderComponent {
  @Input()
  tournament: any;

  formatLocation = formatTournamentLocation;
  
  formatDistance(distance: string): string {
    return `${distance} mi`;
  }
}
