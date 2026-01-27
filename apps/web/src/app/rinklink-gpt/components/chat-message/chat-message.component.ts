import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { MessageFormatPipe } from '@hockey-team-scheduler/shared-ui';
import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import {
  DisplayMessage,
  shouldShowEmailPreview,
  shouldShowStandardConfirmation,
} from '@hockey-team-scheduler/shared-utilities';
import { EmailPreviewComponent } from '../email-preview/email-preview.component';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [
    CommonModule,
    AvatarModule,
    ButtonModule,
    MessageFormatPipe,
    EmailPreviewComponent,
  ],
  template: `
    <div
      class="chat-message"
      [class.chat-message--user]="message().role === 'user'"
      [class.chat-message--assistant]="message().role === 'assistant'"
    >
      <div class="chat-message__avatar">
        @if (message().role === 'user') {
          <p-avatar
            icon="pi pi-user"
            shape="circle"
            styleClass="chat-message__user-avatar"
          />
        } @else {
          <p-avatar
            icon="bi bi-robot"
            shape="circle"
            styleClass="chat-message__bot-avatar"
          />
        }
      </div>
      <div class="chat-message__content">
        <div
          class="chat-message__text"
          [innerHTML]="message().content | messageFormat"
        ></div>
        <div class="chat-message__time">
          {{ message().timestamp | date: 'shortTime' }}
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

        <!-- Standard confirmation for other actions -->
        @if (showStandardConfirmation()) {
          <div class="chat-message__confirmation">
            <p class="chat-message__confirmation-label">Confirm this action?</p>
            <div class="chat-message__confirmation-buttons">
              <p-button
                label="Yes, proceed"
                icon="pi pi-check"
                class="p-button-success p-button-sm"
                (click)="confirm.emit(message().pendingAction!)"
                [disabled]="disabled()"
              />
              <p-button
                label="No, cancel"
                icon="pi pi-times"
                class="p-button-secondary p-button-sm"
                (click)="decline.emit()"
                [disabled]="disabled()"
              />
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .chat-message {
        display: flex;
        gap: 0.75rem;
        max-width: 85%;

        &--user {
          align-self: flex-end;
          flex-direction: row-reverse;

          .chat-message__content {
            background: linear-gradient(
              135deg,
              var(--primary-400, #10578b) 0%,
              var(--primary-500, #0c4066) 100%
            );
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
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 18px 18px 18px 4px;
          }
        }

        &__avatar {
          flex-shrink: 0;
        }

        &__content {
          padding: 0.875rem 1rem;
          max-width: 100%;
        }

        &__text {
          word-wrap: break-word;
          line-height: 1.5;

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
          font-size: 0.75rem;
          color: var(--text-color-secondary);
          margin-top: 0.5rem;
        }

        &__user-avatar {
          background: var(--primary-500, #0c4066) !important;
          color: white !important;
        }

        &__bot-avatar {
          background: var(--secondary-100, #fbd3c3) !important;
          color: var(--secondary-600, #d4460f) !important;
        }

        &__confirmation {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--surface-border);

          &-label {
            font-weight: 500;
            margin: 0 0 0.75rem;
            color: var(--text-color);
          }

          &-buttons {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatMessageComponent {
  message = input.required<DisplayMessage>();
  disabled = input(false);

  confirm = output<PendingAction>();
  decline = output<void>();

  showEmailPreview(): boolean {
    return shouldShowEmailPreview(this.message());
  }

  showStandardConfirmation(): boolean {
    return shouldShowStandardConfirmation(this.message());
  }
}
