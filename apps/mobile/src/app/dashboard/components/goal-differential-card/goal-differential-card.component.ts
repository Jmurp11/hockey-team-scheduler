import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { football } from 'ionicons/icons';
import { CardComponent } from '../../../shared/card/card.component';

@Component({
  selector: 'app-goal-differential-card',
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
          <ion-icon name="football"></ion-icon>
          Avg +/-
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="stat-value" [class]="differentialClass">
          {{ formattedDifferential }}
        </div>
        <div class="stat-label">per game</div>
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

        &.positive {
          color: var(--ion-color-success);
        }

        &.neutral {
          color: var(--ion-color-medium);
        }

        &.negative {
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
export class GoalDifferentialCardComponent {
  @Input({ required: true }) averageGoalDifferential!: number;

  constructor() {
    addIcons({ football });
  }

  get formattedDifferential(): string {
    const value = this.averageGoalDifferential;
    const formatted = Math.abs(value).toFixed(1);
    if (value > 0) return `+${formatted}`;
    if (value < 0) return `-${formatted}`;
    return formatted;
  }

  get differentialClass(): string {
    if (this.averageGoalDifferential > 0) return 'positive';
    if (this.averageGoalDifferential < 0) return 'negative';
    return 'neutral';
  }
}
