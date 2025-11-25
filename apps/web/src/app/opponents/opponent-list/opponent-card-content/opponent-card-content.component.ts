import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpponentStatItemComponent } from '../opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-opponent-card-content',
  standalone: true,
  imports: [CommonModule, OpponentStatItemComponent],
  template: `
    <div class="card-content">
      @for (item of values; track item.label) {
        <app-opponent-stat-item [label]="item.label" [value]="item.value" />
      }
      <app-opponent-stat-item
        [label]="'Leagues'"
        [value]="leagues.join(', ')"
      />
    </div>
  `,
  styleUrls: [`./opponent-card-content.component.scss`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCardContentComponent {
  @Input()
  values: { label: string; value: string }[];

  @Input()
  leagues: string[];
}
