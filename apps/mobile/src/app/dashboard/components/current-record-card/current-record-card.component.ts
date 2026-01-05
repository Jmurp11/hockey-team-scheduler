import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trophy } from 'ionicons/icons';
import { CardComponent } from '../../../shared/card/card.component';

@Component({
  selector: 'app-current-record-card',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
  ],
  template: `
    <app-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="trophy"></ion-icon>
          Record
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="stat-value">{{ record }}</div>
        <div class="stat-breakdown">
          <span class="wins">{{ wins }}W</span>
          <span class="separator">-</span>
          <span class="losses">{{ losses }}L</span>
          <span class="separator">-</span>
          <span class="ties">{{ ties }}T</span>
        </div>
        <div class="rating">Rating: {{ rating | number : '1.1-1' }}</div>
      </ion-card-content>
    </app-card>
  `,
  styles: [
    `
      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
      }

      ion-icon {
        font-size: 1rem;
        color: var(--ion-color-primary);
      }

      ion-card-content {
        text-align: center;
        padding-top: 0;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--ion-color-primary);
        margin-bottom: 4px;
      }

      .stat-breakdown {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin-bottom: 4px;

        .wins {
          color: var(--ion-color-success);
        }

        .losses {
          color: var(--ion-color-danger);
        }

        .ties {
          color: var(--ion-color-warning);
        }

        .separator {
          margin: 0 2px;
        }
      }

      .rating {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentRecordCardComponent {
  @Input({ required: true }) record!: string;
  @Input({ required: true }) wins!: number;
  @Input({ required: true }) losses!: number;
  @Input({ required: true }) ties!: number;
  @Input({ required: true }) rating!: number;

  constructor() {
    addIcons({ trophy });
  }
}
