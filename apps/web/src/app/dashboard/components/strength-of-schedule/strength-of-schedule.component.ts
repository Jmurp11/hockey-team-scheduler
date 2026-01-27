import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  getStrengthOfScheduleClassification,
  getStrengthOfScheduleLabel,
  StrengthClassification,
} from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-strength-of-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-value" [class]="strengthClass()">
      {{ strengthOfSchedule() | number : '1.1-1' }}
    </div>
    <div class="stat-label">{{ strengthLabel() }}</div>
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
        line-height: 1.2;

        &.strong {
          color: var(--green-600, #16a34a);
        }

        &.moderate {
          color: var(--primary-500);
        }

        &.weak {
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
export class StrengthOfScheduleComponent {
  strengthOfSchedule = input.required<number>();
  teamRating = input.required<number>();

  strengthClass = computed((): StrengthClassification => {
    return getStrengthOfScheduleClassification(this.strengthOfSchedule(), this.teamRating());
  });

  strengthLabel = computed((): string => {
    return getStrengthOfScheduleLabel(this.strengthClass());
  });
}
