import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonCardContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, createOutline, trashOutline } from 'ionicons/icons';
import { CardComponent } from '../../shared/card/card.component';
import { ScheduleCardContentComponent } from '../schedule-card-content/schedule-card-content.component';
import { ScheduleCardFooterComponent } from '../schedule-card-footer/schedule-card-footer.component';
import { ScheduleCardHeaderComponent } from '../schedule-card-header/schedule-card-header.component';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCardContent,
    CardComponent,
    ScheduleCardHeaderComponent,
    ScheduleCardContentComponent,
    ScheduleCardFooterComponent,
  ],
  template: `
    <div class="schedule-list">
      @if (games && games.length > 0) {
        @for (game of games; track game.id) {
          <app-card class="game-card">
            <app-schedule-card-header [game]="game" />
            <ion-card-content>
              <app-schedule-card-content [items]="handleGameDetails(game)" />
              <app-schedule-card-footer [game]="game" />
            </ion-card-content>
          </app-card>
        }
      } @else {
        <div class="no-games">
          <app-card>
            <ion-card-content>
              <p>
                You have no games scheduled. Click "Add Game" to get started!
                Click Upload CSV to upload a batch of games.
              </p>
            </ion-card-content>
          </app-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .schedule-list {
        padding: 0.5rem;
      }

      .game-card {
        margin-bottom: 1rem;
      }

      .game-details {
        margin-bottom: 1rem;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        padding: 0.25rem 0;
      }

      .detail-label {
        font-weight: 600;
        color: var(--ion-color-medium);
      }

      .detail-value {
        color: var(--ion-color-dark);
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 1rem;
      }

      .action-buttons app-button {
        flex: 1;
        min-width: 90px;
      }

      .no-games {
        padding: 1rem;
        text-align: center;
      }

      .no-games p {
        margin: 0;
        color: var(--ion-color-medium);
      }
    `,
  ],
})
export class ScheduleListComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() games: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() contactTeam = new EventEmitter<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() edit = new EventEmitter<any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() delete = new EventEmitter<any>();

  constructor() {
    addIcons({ chatbubbleOutline, createOutline, trashOutline });
  }

  handleGameDetails(game: any) {
    return [
      { label: game.location, icon: 'location-outline' },
      { label: game.rink, icon: 'time-outline' },
    ];
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onContactTeam(game: any): void {
    this.contactTeam.emit(game);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEdit(game: any): void {
    this.edit.emit(game);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onDelete(game: any): void {
    this.delete.emit(game);
  }
}
