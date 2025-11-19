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
  styleUrls: [`./opponent-stat-item.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentStatItemComponent {
  @Input()
  label: string;

  @Input()
  value: string;
}
