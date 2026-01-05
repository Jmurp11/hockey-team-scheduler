import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-goal-differential',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="stat-value"
      [ngClass]="{
        positive: averageGoalDifferential > 0,
        negative: averageGoalDifferential < 0
      }"
    >
      {{ averageGoalDifferential > 0 ? '+' : ''
      }}{{ averageGoalDifferential | number : '1.2-2' }}
    </div>
    <div class="stat-label">Goals per game</div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-600);
        line-height: 1.2;

        &.positive {
          color: var(--green-600, #16a34a);
        }

        &.negative {
          color: var(--red-600, #dc2626);
        }
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--gray-500, #6b7280);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalDifferentialComponent {
  @Input({ required: true }) averageGoalDifferential!: number;
}
