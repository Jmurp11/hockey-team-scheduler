import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatLocation } from '@hockey-team-scheduler/shared-utilities';
import {
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-opponent-card-header',
  standalone: true,
  imports: [
    CommonModule,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
  ],
  template: `
    <ion-card-header>
      <ion-card-title
        ><div class="title-row">
          <div class="opponent-info">{{ opponent.team_name }}</div>
          <div class="distance-info">
            {{ opponent.distance | number: '1.1-1' }} mi
          </div>
        </div></ion-card-title
      >
      <ion-card-subtitle>
        <div>
          {{ opponent.name }} -
          {{ formatLocation(opponent.city, opponent.state, opponent.country) }}
        </div>
      </ion-card-subtitle>
    </ion-card-header>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .title-row {
        @include flex(space-between, flex-start, row);
      }

      .opponent-info {
        font-weight: 600;
        color: var(--primary-500);
        font-size: 1rem;
        width: 50%;
      }

      .distance-info {
        font-weight: 600;
        color: var(--secondary-500);
        font-size: 1rem;
        width: 50%;
        text-align: right;
      }
    `,
  ],
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
