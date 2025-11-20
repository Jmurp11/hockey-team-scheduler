import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonCardContent } from '@ionic/angular/standalone';
import { OpponentStatItemComponent } from '../opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-opponent-card-content',
  standalone: true,
  imports: [CommonModule, IonCardContent, OpponentStatItemComponent],
  template: `
    <ion-card-content>
      <div class="card-content">
        @for (item of values; track item.label) {
          <app-opponent-stat-item
            [label]="item.label"
            [value]="item.value"
          />
        }
      </div>
    </ion-card-content>
  `,
  styles: [`
    .card-content {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (max-width: 576px) {
      .card-content {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCardContentComponent {
  @Input()
  values: { label: string; value: string }[] = [];
}
