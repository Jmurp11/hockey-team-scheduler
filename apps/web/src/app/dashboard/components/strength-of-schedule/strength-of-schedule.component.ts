import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-strength-of-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-value">{{ strengthOfSchedule | number : '1.1-1' }}</div>
    <div class="stat-label">Avg Opponent Rating</div>
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
        color: var(--primary-500);
        line-height: 1.2;
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
  @Input({ required: true }) strengthOfSchedule!: number;
}
