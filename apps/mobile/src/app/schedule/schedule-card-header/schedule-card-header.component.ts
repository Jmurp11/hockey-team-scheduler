import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import {
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonChip,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-schedule-card-header',
  standalone: true,
  imports: [
    CommonModule,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonChip,
  ],
  template: `
    <ion-card-header>
      <ion-card-title>
        <div class="title-row">
          <div class="opponent-name">{{ game.displayOpponent }}</div>
          <div class="game-type">
            <ion-chip [color]="handleGameType(game.game_type)">{{
              game.game_type
            }}</ion-chip>
          </div>
        </div>
      </ion-card-title>
      <ion-card-subtitle>
        <div class="time-info">
          <div>
            {{ game.date | date: 'MMM d, y' }}
          </div>

          <div>
            {{ game.time }}
          </div>
        </div>
      </ion-card-subtitle>
    </ion-card-header>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .title-row {
        @include flex(space-between, flex-start, row);
        width: 100%;
      }

      .opponent-name {
        @include flex(flex-start, flex-start, row);

        font-weight: 600;
        color: var(--primary-500);
        font-size: 1rem;
        width: 50%;
      }

      .game-type {
        @include flex(flex-end, flex-start, row);
        width: 50%;
      }
      .time-info {
        @include flex(space-between, center, row);
      }
    `,
  ],
})
export class ScheduleCardHeaderComponent {
  @Input() game: any;

  handleGameType(gameType: string): string {
    switch (gameType) {
      case 'League':
        return 'primary';
      case 'Exhibition':
        return 'secondary';
      case 'Tournament':
        return 'success';
      case 'Playoff':
        return 'tertiary';
      case 'Open Slot':
        return 'warning';
      default:
        return 'medium';
    }
  }
}
