import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { statsChart } from 'ionicons/icons';
import {
  getStrengthOfScheduleClassification,
  getStrengthOfScheduleLabel,
  StrengthClassification,
} from '@hockey-team-scheduler/shared-utilities';
import { CardComponent } from '../../../shared/card/card.component';

@Component({
  selector: 'app-strength-of-schedule-card',
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
          <ion-icon name="stats-chart"></ion-icon>
          SOS
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="stat-value" [class]="strengthClass()">
          {{ strengthOfSchedule() | number : '1.1-1' }}
        </div>
        <div class="stat-label">{{ strengthLabel() }}</div>
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
        margin-bottom: 4px;

        &.strong {
          color: var(--ion-color-success);
        }

        &.moderate {
          color: var(--ion-color-warning);
        }

        &.weak {
          color: var(--ion-color-danger);
        }
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StrengthOfScheduleCardComponent {
  strengthOfSchedule = input.required<number>();
  teamRating = input.required<number>();

  constructor() {
    addIcons({ statsChart });
  }

  strengthClass = computed((): StrengthClassification => {
    return getStrengthOfScheduleClassification(this.strengthOfSchedule(), this.teamRating());
  });

  strengthLabel = computed((): string => {
    return getStrengthOfScheduleLabel(this.strengthClass());
  });
}
