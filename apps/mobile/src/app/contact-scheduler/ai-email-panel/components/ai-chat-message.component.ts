import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';

import {
  DisplayMessage,
  shouldShowEmailPreview,
} from '@hockey-team-scheduler/shared-utilities';
import { EmailDraft, PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { EmailDraftFormComponent } from '../../../shared/components/email-draft-form/email-draft-form.component';

/**
 * Mobile single chat message component.
 * Renders a user or assistant message with optional email preview using Ionic components.
 */
@Component({
  selector: 'app-ai-chat-message',
  standalone: true,
  imports: [
    IonIcon,
    EmailDraftFormComponent,
  ],
  template: `
    <div
      class="ai-chat-message"
      [class.ai-chat-message--user]="message().role === 'user'"
      [class.ai-chat-message--assistant]="message().role === 'assistant'"
    >
      <div class="ai-chat-message__avatar">
        @if (message().role === 'user') {
          <ion-icon name="person-outline"></ion-icon>
        } @else {
          <i class="bi bi-robot"></i>
        }
      </div>
      <div class="ai-chat-message__content">
        <div class="ai-chat-message__text">
          {{ message().content }}
        </div>

        <!-- Email Preview using shared form -->
        @if (showEmailPreview() && emailDraft()) {
          <div class="ai-chat-message__email-preview">
            <app-email-draft-form
              [emailDraft]="emailDraft()!"
              [pendingAction]="message().pendingAction!"
              [editableSubject]="editableSubject()"
              [editableBody]="editableBody()"
              [disabled]="disabled()"
              [compact]="true"
              (subjectChange)="subjectChange.emit($event)"
              (bodyChange)="bodyChange.emit($event)"
              (confirm)="confirmEmail.emit($event)"
              (decline)="declineEmail.emit()"
            />
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ai-chat-message {
        display: flex;
        gap: 8px;
        max-width: 95%;

        &--user {
          align-self: flex-end;
          flex-direction: row-reverse;

          .ai-chat-message__content {
            background: var(--ion-color-primary);
            color: white;
            border-radius: 12px 12px 2px 12px;
          }
        }

        &--assistant {
          align-self: flex-start;

          .ai-chat-message__content {
            background: var(--ion-color-light);
            border-radius: 12px 12px 12px 2px;
          }
        }

        &__avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--ion-color-light-shade);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          ion-icon {
            font-size: 1rem;
            color: var(--ion-color-medium);
          }
        }

        &__content {
          padding: 10px 14px;
          max-width: 100%;
        }

        &__text {
          word-wrap: break-word;
          line-height: 1.4;
          font-size: 0.875rem;
        }

        &__email-preview {
          margin-top: 12px;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatMessageComponent {
  /** The message to display */
  message = input.required<DisplayMessage>();

  /** Current editable subject value */
  editableSubject = input('');

  /** Current editable body value */
  editableBody = input('');

  /** Whether inputs are disabled */
  disabled = input(false);

  /** Emitted when subject changes */
  subjectChange = output<string>();

  /** Emitted when body changes */
  bodyChange = output<string>();

  /** Emitted when user confirms email */
  confirmEmail = output<PendingAction>();

  /** Emitted when user declines email */
  declineEmail = output<void>();

  constructor() {
    addIcons({ personOutline });
  }

  /**
   * Check if email preview should be shown.
   */
  showEmailPreview(): boolean {
    return shouldShowEmailPreview(this.message());
  }

  /**
   * Get email draft from the message.
   */
  emailDraft(): EmailDraft | null {
    const action = this.message().pendingAction;
    if (action?.type === 'send_email') {
      return action.data as EmailDraft;
    }
    return null;
  }
}
