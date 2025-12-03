import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-opponent-stat-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-item">
      <span
        [ngClass]="label === 'Leagues' ? 'stat-value-leagues' : 'stat-value'"
      >
        {{ value }}
      </span>
      <span class="stat-label">{{ label }}</span>
    </div>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .stat-item {
        @include flex(center, center, column);
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 1.15rem;
        font-weight: 600;
        color: var(--primary-500);
      }

      .stat-value-leagues {
        font-size: .875rem;
        font-weight: 600;
        color: var(--primary-500);
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentStatItemComponent {
  @Input()
  label = '';

  @Input()
  value = '';
}
