import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatLocation } from '@hockey-team-scheduler/shared-utilities';
import {
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
} from '@ionic/angular/standalone';
import { OpponentStatItemComponent } from '../opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-opponent-card-header',
  standalone: true,
  imports: [
    CommonModule,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    OpponentStatItemComponent,
  ],
  template: `
    <ion-card-header>
      <ion-card-title>{{ opponent.team_name }}</ion-card-title>
      <ion-card-subtitle>
        <div class="opponent-info">
          <div>
            {{ opponent.name }} -
            {{ formatLocation(opponent.city, opponent.state, opponent.country) }}
          </div>
          <div class="distance-info">
            <app-opponent-stat-item
              label="Distance"
              [value]="formatDistance(opponent.distance)"
            />
          </div>
        </div>
      </ion-card-subtitle>
    </ion-card-header>
  `,
  styles: [`
    ion-card-subtitle {
      margin-top: 0.5rem;
    }

    .opponent-info {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .distance-info {
      font-weight: 600;
      color: var(--ion-color-primary);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCardHeaderComponent {
  @Input()
  opponent: any;

  formatLocation = formatLocation;

  formatDistance(distance: string): string {
    return `${distance} mi`;
  }
}
