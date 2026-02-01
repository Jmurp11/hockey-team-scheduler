import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  GameMatchingStateService,
  PendingAction,
} from '@hockey-team-scheduler/shared-data-access';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonDatetimeButton,
  IonHeader,
  IonIcon,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  refreshOutline,
  warningOutline,
} from 'ionicons/icons';
import { GameMatchListComponent } from '../rinklink-gpt/components/game-match-list/game-match-list.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { GameMatchingModalService } from './game-matching-modal.service';

@Component({
  selector: 'app-game-matching-modal',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonButtons,
    IonContent,
    IonDatetime,
    IonDatetimeButton,
    IonHeader,
    IonIcon,
    IonLabel,
    IonModal,
    IonTitle,
    IonToolbar,
    LoadingComponent,
    GameMatchListComponent,
  ],
  template: `
    <ion-modal
      [isOpen]="modalService.isOpen()"
      (didDismiss)="onDismiss()"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Find Opponents</ion-title>
            <ion-buttons slot="end">
              <ion-button color="secondary" (click)="cancel()">
                <ion-icon color="secondary" name="close-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          @if (matchingState.state() === 'idle' || matchingState.state() === 'loading') {
            <div class="form-section">
              <p class="instructions">
                Select a date range to find the best-matched opponents for your team.
              </p>

              <div class="date-row">
                @for (field of dateFields; track field.id) {
                  <div class="date-field">
                    <ion-label>{{ field.label }}</ion-label>
                    <ion-datetime-button [datetime]="field.id"></ion-datetime-button>
                    <ion-modal [keepContentsMounted]="true">
                      <ng-template>
                        <ion-datetime
                          [id]="field.id"
                          presentation="date"
                          [min]="minDate"
                          [max]="maxDate"
                          (ionChange)="onDateChange(field.signal, $event)"
                          [disabled]="matchingState.state() === 'loading'"
                        ></ion-datetime>
                      </ng-template>
                    </ion-modal>
                  </div>
                }
              </div>
            </div>
          }

          @if (matchingState.state() === 'loading') {
            <div class="loading-section">
              <app-loading name="circular" />
              <p>Finding the best opponents for your team...</p>
            </div>
          }

          @if (matchingState.state() === 'results' && matchingState.results()) {
            <app-game-match-list
              [results]="matchingState.results()!"
              (sendEmail)="onSendEmail($event)"
            />
          }

          @if (matchingState.state() === 'error') {
            <div class="error-section">
              <ion-icon name="warning-outline"></ion-icon>
              <p>{{ matchingState.errorMessage() }}</p>
            </div>
          }
        </ion-content>

        <div class="modal-footer">
          @if (matchingState.state() === 'results') {
            <ion-button color="secondary" fill="outline" size="small" (click)="searchAgain()">
              <ion-icon name="refresh-outline" slot="start"></ion-icon>
              Search Again
            </ion-button>
          }
          @if (matchingState.state() === 'idle') {
            <ion-button
              color="secondary"
              [disabled]="!isFormValid()"
              (click)="search()"
              expand="block"
            >
              <i class="bi bi-robot" style="margin-right: 0.5rem; font-size: 1.125rem;"></i>
              Find Matches
            </ion-button>
          }
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .instructions {
      color: var(--ion-color-medium);
      font-size: 0.875rem;
      margin: 0;
    }

    .date-row {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .date-field {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      ion-label {
        font-size: 0.875rem;
        font-weight: 600;
        min-width: 5.5rem;
      }
    }

    .loading-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;

      p {
        color: var(--ion-color-medium);
        font-size: 0.875rem;
      }
    }

    .error-section {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      color: var(--ion-color-danger);

      ion-icon {
        font-size: 1.25rem;
      }

      p {
        margin: 0;
      }
    }

    .modal-footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--ion-color-light-shade);
      display: flex;
      justify-content: center;
      gap: 0.5rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMatchingModalComponent {
  modalService = inject(GameMatchingModalService);
  matchingState = inject(GameMatchingStateService);

  startDate = signal<string | undefined>(undefined);
  endDate = signal<string | undefined>(undefined);

  private now = new Date();
  minDate = this.now.toISOString().split('T')[0];
  maxDate = new Date(
    new Date().setFullYear(this.now.getFullYear() + 1),
  ).toISOString().split('T')[0];

  dateFields: { label: string; id: string; signal: WritableSignal<string | undefined> }[] = [
    { label: 'Start Date', id: 'gm-start-date', signal: this.startDate },
    { label: 'End Date', id: 'gm-end-date', signal: this.endDate },
  ];

  constructor() {
    addIcons({
      closeOutline,
      warningOutline,
      refreshOutline,
    });
  }

  onDateChange(target: WritableSignal<string | undefined>, event: CustomEvent): void {
    target.set(event.detail.value);
  }

  isFormValid(): boolean {
    return !!this.startDate() && !!this.endDate();
  }

  search(): void {
    const start = this.startDate();
    const end = this.endDate();
    if (!start || !end) return;

    this.matchingState.search(
      start.split('T')[0],
      end.split('T')[0],
    );
  }

  searchAgain(): void {
    this.matchingState.resetToForm();
  }

  cancel(): void {
    this.matchingState.reset();
    this.startDate.set(undefined);
    this.endDate.set(undefined);
    this.modalService.close();
  }

  onDismiss(): void {
    this.matchingState.reset();
    this.startDate.set(undefined);
    this.endDate.set(undefined);
    this.modalService.close();
  }

  onSendEmail(action: PendingAction): void {
    // The email action is emitted from the game-match-list/card
    // For now, the card handles closing itself after emit
  }
}
