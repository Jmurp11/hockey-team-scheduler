import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { IonCardContent, IonChip } from '@ionic/angular/standalone';
import { OpponentStatItemComponent } from '../opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-opponent-card-content',
  standalone: true,
  imports: [CommonModule, IonCardContent, OpponentStatItemComponent, IonChip],
  template: `
    <ion-card-content>
      <div class="card-content">
        @for (item of values; track item.label) {
          <app-opponent-stat-item [label]="item.label" [value]="item.value" />
        }
      </div>
      <div class="leagues">
        @for (league of leagues; track league) {
          <ion-chip color="tertiary">{{ league }}</ion-chip>
        }
      </div>
    </ion-card-content>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;
      .card-content {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }

      .leagues {
        @include flex(space-around, center, row);
      }

      ion-chip {
        min-width: 65px !important;
        max-width: 65px !important;
        text-align: center !important;
      }

      @media (max-width: 576px) {
        .card-content {
          grid-template-columns: 1fr 1fr;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCardContentComponent {
  @Input()
  values: { label: string; value: string }[] = [];

  @Input()
  leagues: string[] = [];
}
