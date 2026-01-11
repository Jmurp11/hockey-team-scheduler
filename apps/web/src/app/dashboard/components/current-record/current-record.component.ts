import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-current-record',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-value large">{{ record }}</div>
    <div class="stat-breakdown">
      <span class="wins">{{ wins }}W</span>
      <span class="losses">{{ losses }}L</span>
      <span class="ties">{{ ties }}T</span>
    </div>
    <div class="rating-badge">Rating: {{ rating | number : '1.1-1' }}</div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-600);
        line-height: 1.2;

        &.large {
          font-size: 3rem;
          color: var(--primary-500);
        }
      }

      .stat-breakdown {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        font-size: 1rem;
        font-weight: 500;

        .wins {
          color: var(--green-600, #16a34a);
        }

        .losses {
          color: var(--red-600, #dc2626);
        }

        .ties {
          color: var(--gray-500, #6b7280);
        }
      }

      .rating-badge {
        padding: 0.25rem 0.75rem;
        background-color: var(--secondary-300);
        color: var(--primary-700);
        border-radius: 1rem;
        font-size: 0.875rem;
        font-weight: 500;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentRecordComponent {
  @Input({ required: true }) record!: string;
  @Input({ required: true }) wins!: number;
  @Input({ required: true }) losses!: number;
  @Input({ required: true }) ties!: number;
  @Input({ required: true }) rating!: number;
}
