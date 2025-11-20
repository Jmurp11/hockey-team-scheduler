import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-opponent-stat-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-item">
      <span [ngClass]="label === 'Leagues' ? 'stat-value-leagues' : 'stat-value'">
        {{ value }}
      </span>
      <span class="stat-label">{{ label }}</span>
    </div>
  `,
  styles: [`
    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .stat-value-leagues {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-color-dark);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentStatItemComponent {
  @Input()
  label = '';

  @Input()
  value = '';
}
