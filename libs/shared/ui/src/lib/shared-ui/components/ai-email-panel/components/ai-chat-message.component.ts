import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarModule } from 'primeng/avatar';

import {
  DisplayMessage,
  shouldShowEmailPreview,
} from '@hockey-team-scheduler/shared-utilities';
import { EmailDraft, PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { MessageFormatPipe } from '../../../pipes/message-format.pipe';
import { EmailDraftFormComponent } from '../../email-draft-form/email-draft-form.component';

/**
 * Single chat message component.
 * Renders a user or assistant message with optional email preview.
 */
@Component({
  selector: 'lib-ai-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    MessageFormatPipe,
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
          <p-avatar
            icon="pi pi-user"
            shape="circle"
            styleClass="ai-chat-message__user-avatar"
          />
        } @else {
          <p-avatar
            icon="bi bi-robot"
            shape="circle"
            styleClass="ai-chat-message__bot-avatar"
          />
        }
      </div>
      <div class="ai-chat-message__content">
        <div
          class="ai-chat-message__text"
          [innerHTML]="message().content | messageFormat"
        ></div>

        <!-- Email Preview using shared form -->
        @if (showEmailPreview() && emailDraft()) {
          <div class="ai-chat-message__email-preview">
            <lib-email-draft-form
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
        gap: 0.5rem;
        max-width: 95%;

        &--user {
          align-self: flex-end;
          flex-direction: row-reverse;

          .ai-chat-message__content {
            background: linear-gradient(
              135deg,
              var(--primary-400, #10578b) 0%,
              var(--primary-500, #0c4066) 100%
            );
            color: white;
            border-radius: 12px 12px 2px 12px;
          }
        }

        &--assistant {
          align-self: flex-start;

          .ai-chat-message__content {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px 12px 12px 2px;
          }
        }

        &__avatar {
          flex-shrink: 0;
        }

        &__content {
          padding: 0.625rem 0.875rem;
          max-width: 100%;
        }

        &__text {
          word-wrap: break-word;
          line-height: 1.4;
          font-size: 0.875rem;
        }

        &__user-avatar {
          background: var(--primary-500, #0c4066) !important;
          color: white !important;
          width: 28px !important;
          height: 28px !important;
          font-size: 0.75rem !important;
        }

        &__bot-avatar {
          background: var(--secondary-100, #fbd3c3) !important;
          color: var(--secondary-600, #d4460f) !important;
          width: 28px !important;
          height: 28px !important;
          font-size: 0.75rem !important;
        }

        &__email-preview {
          margin-top: 0.75rem;
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
