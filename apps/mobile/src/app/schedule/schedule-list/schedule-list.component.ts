import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonIcon,
    IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubbleOutline, createOutline, trashOutline } from 'ionicons/icons';
import { ButtonComponent } from '../../shared/button/button.component';
import { CardComponent } from '../../shared/card/card.component';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonIcon,
    IonLabel,
    CardComponent,
    ButtonComponent,
  ],
  template: `
    <div class="schedule-list">
      @if (games && games.length > 0) {
        @for (game of games; track game.id) {
          <app-card class="game-card">
            <ion-card-header>
              <ion-card-title>{{ game.displayOpponent }}</ion-card-title>
              <ion-card-subtitle>{{ game.gameType }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="game-details">
                <div class="detail-row">
                  <ion-label class="detail-label">Date:</ion-label>
                  <ion-label class="detail-value">{{ game.date }}</ion-label>
                </div>
                <div class="detail-row">
                  <ion-label class="detail-label">Time:</ion-label>
                  <ion-label class="detail-value">{{ game.time }}</ion-label>
                </div>
                <div class="detail-row">
                  <ion-label class="detail-label">Rink:</ion-label>
                  <ion-label class="detail-value">{{ game.rink }}</ion-label>
                </div>
                <div class="detail-row">
                  <ion-label class="detail-label">Location:</ion-label>
                  <ion-label class="detail-value">{{ game.location }}</ion-label>
                </div>
              </div>
              
              <div class="action-buttons">
                <app-button
                  [size]="'small'"
                  [fill]="'outline'"
                  [color]="'primary'"
                  (onClick)="onContactTeam(game)"
                >
                  <ion-icon slot="start" name="chatbubble-outline"></ion-icon>
                  Contact
                </app-button>
                <app-button
                  [size]="'small'"
                  [fill]="'outline'"
                  [color]="'secondary'"
                  (onClick)="onEdit(game)"
                >
                  <ion-icon slot="start" name="create-outline"></ion-icon>
                  Edit
                </app-button>
                <app-button
                  [size]="'small'"
                  [fill]="'outline'"
                  [color]="'danger'"
                  (onClick)="onDelete(game)"
                >
                  <ion-icon slot="start" name="trash-outline"></ion-icon>
                  Delete
                </app-button>
              </div>
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
  styles: [`
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
  `],
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

