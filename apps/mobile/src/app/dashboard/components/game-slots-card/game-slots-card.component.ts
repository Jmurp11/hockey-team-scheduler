import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timer } from 'ionicons/icons';
import { CardComponent } from '../../../shared/card/card.component';

@Component({
  selector: 'app-game-slots-card',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
  ],
  template: `
    <app-card>
      <ion-card-header>
        <ion-card-title>
          <ion-icon name="timer"></ion-icon>
          Slots
        </ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="stat-value" [class]="slotsClass">
          {{ openGameSlots }}
        </div>
        <div class="stat-label">of {{ totalGames }} open</div>
      </ion-card-content>
    </app-card>
  `,
  styles: [
    `
      ion-card-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.875rem;
      }

      ion-icon {
        font-size: 1rem;
        color: var(--ion-color-primary);
      }

      ion-card-content {
        text-align: center;
        padding-top: 0;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 4px;

        &.has-slots {
          color: var(--ion-color-warning);
        }

        &.no-slots {
          color: var(--ion-color-success);
        }
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSlotsCardComponent {
  @Input({ required: true }) openGameSlots!: number;
  @Input({ required: true }) totalGames!: number;

  constructor() {
    addIcons({ timer });
  }

  get slotsClass(): string {
    return this.openGameSlots > 0 ? 'has-slots' : 'no-slots';
  }
}
