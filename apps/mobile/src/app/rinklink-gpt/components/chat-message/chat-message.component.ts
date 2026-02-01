import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import {
  IonAvatar,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';
import { MessageFormatPipe } from '@hockey-team-scheduler/shared-ui';
import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import {
  DisplayMessage,
  GameMatchResults,
  shouldShowEmailPreview,
  shouldShowGameMatchResults,
  shouldShowStandardConfirmation,
} from '@hockey-team-scheduler/shared-utilities';
import { EmailPreviewComponent } from '../email-preview/email-preview.component';
import { GameMatchListComponent } from '../game-match-list/game-match-list.component';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    IonAvatar,
    IonButton,
    IonIcon,
    MessageFormatPipe,
    EmailPreviewComponent,
    GameMatchListComponent,
  ],
  template: `
    <div
      class="chat-message"
      [class.chat-message--user]="message().role === 'user'"
      [class.chat-message--assistant]="message().role === 'assistant'"
    >
      <div class="chat-message__avatar">
        @if (message().role === 'user') {
          <ion-avatar class="chat-message__user-avatar">
            <i class="bi bi-person"></i>
          </ion-avatar>
        } @else {
          <ion-avatar class="chat-message__bot-avatar">
            <i class="bi bi-robot"></i>
          </ion-avatar>
        }
      </div>
      <div class="chat-message__content">
        <div
          class="chat-message__text"
          [innerHTML]="message().content | messageFormat"
        ></div>
        <div class="chat-message__time">
          {{ message().timestamp | date:'shortTime' }}
        </div>

        <!-- Email Preview for send_email actions -->
        @if (showEmailPreview()) {
          <app-email-preview
            [pendingAction]="message().pendingAction!"
            [disabled]="disabled()"
            (confirm)="confirm.emit($event)"
            (decline)="decline.emit()"
          />
        }

        <!-- Game Match Results for find_game_matches actions -->
        @if (showGameMatchResults()) {
          <app-game-match-list
            [results]="getGameMatchResults()"
            [disabled]="disabled()"
            (sendEmail)="confirm.emit($event)"
          />
        }

        <!-- Standard confirmation for other actions -->
        @if (showStandardConfirmation()) {
          <div class="chat-message__confirmation">
            <p class="chat-message__confirmation-label">Confirm this action?</p>
            <div class="chat-message__confirmation-buttons">
              <ion-button
                color="secondary"
                size="small"
                (click)="confirm.emit(message().pendingAction!)"
                [disabled]="disabled()"
              >
                <ion-icon name="checkmark-outline" slot="start"></ion-icon>
                Yes, proceed
              </ion-button>
              <ion-button
                fill="outline"
                color="secondary"
                size="small"
                (click)="decline.emit()"
                [disabled]="disabled()"
              >
                <ion-icon name="close-outline" slot="start"></ion-icon>
                No, cancel
              </ion-button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .chat-message {
      display: flex;
      gap: 0.75rem;
      max-width: 85%;

      &--user {
        align-self: flex-end;
        flex-direction: row-reverse;

        .chat-message__content {
          background: linear-gradient(135deg, var(--ion-color-primary-tint, #10578b) 0%, var(--ion-color-primary, #0c4066) 100%);
          color: white;
          border-radius: 18px 18px 4px 18px;
        }

        .chat-message__time {
          text-align: right;
          color: rgba(255, 255, 255, 0.7);
        }
      }

      &--assistant {
        align-self: flex-start;

        .chat-message__content {
          background: var(--ion-color-light);
          border: 1px solid var(--ion-color-light-shade);
          border-radius: 18px 18px 18px 4px;
        }
      }

      &__avatar {
        flex-shrink: 0;

        ion-avatar {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            font-size: 1rem;
          }
        }
      }

      &__user-avatar {
        background: var(--ion-color-primary, #0c4066);

        i {
          color: white;
        }
      }

      &__bot-avatar {
        background: var(--ion-color-secondary-tint, #fbd3c3);

        i {
          color: var(--ion-color-secondary-shade, #d4460f);
        }
      }

      &__content {
        padding: 0.75rem 1rem;
        max-width: 100%;
      }

      &__text {
        word-wrap: break-word;
        line-height: 1.5;
        font-size: 0.9rem;

        :deep(strong) {
          font-weight: 600;
        }

        :deep(ul) {
          margin: 0.5rem 0;
          padding-left: 1.25rem;
        }

        :deep(li) {
          margin: 0.25rem 0;
        }
      }

      &__time {
        font-size: 0.7rem;
        color: var(--ion-color-medium);
        margin-top: 0.5rem;
      }

      &__confirmation {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--ion-color-light-shade);

        &-label {
          font-weight: 500;
          margin: 0 0 0.75rem;
          color: var(--ion-text-color);
          font-size: 0.9rem;
        }

        &-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  message = input.required<DisplayMessage>();
  disabled = input(false);

  confirm = output<PendingAction>();
  decline = output<void>();

  constructor() {
    addIcons({ checkmarkOutline, closeOutline });
  }

  showEmailPreview(): boolean {
    return shouldShowEmailPreview(this.message());
  }

  showStandardConfirmation(): boolean {
    return shouldShowStandardConfirmation(this.message());
  }

  showGameMatchResults(): boolean {
    return shouldShowGameMatchResults(this.message());
  }

  getGameMatchResults(): GameMatchResults {
    return this.message().pendingAction!.data as unknown as GameMatchResults;
  }
}
