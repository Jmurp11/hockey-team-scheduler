import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

import { DisplayMessage } from '@hockey-team-scheduler/shared-utilities';
import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { AiChatMessageComponent } from './ai-chat-message.component';

/**
 * Container component for chat messages.
 * Handles scrolling and renders individual message components.
 */
@Component({
  selector: 'lib-ai-chat-messages',
  standalone: true,
  imports: [AvatarModule, AiChatMessageComponent],
  template: `
    <div class="ai-chat-messages" #messagesContainer>
      @for (message of messages(); track $index) {
        <lib-ai-chat-message
          [message]="message"
          [editableSubject]="editableSubject()"
          [editableBody]="editableBody()"
          [disabled]="loading()"
          (subjectChange)="subjectChange.emit($event)"
          (bodyChange)="bodyChange.emit($event)"
          (confirmEmail)="confirmEmail.emit($event)"
          (declineEmail)="declineEmail.emit()"
        />
      }

      <!-- Typing Indicator -->
      @if (loading()) {
        <div class="ai-chat-messages__typing">
          <div class="ai-chat-messages__typing-avatar">
            <p-avatar
              icon="bi bi-robot"
              shape="circle"
              styleClass="ai-chat-messages__bot-avatar"
            />
          </div>
          <div class="ai-chat-messages__typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ai-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        min-height: 100px;
        max-height: 300px;

        &__typing {
          display: flex;
          gap: 0.5rem;
          align-self: flex-start;

          &-avatar {
            flex-shrink: 0;
          }

          &-dots {
            display: flex;
            gap: 3px;
            padding: 0.75rem;
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;

            span {
              width: 6px;
              height: 6px;
              background: var(--secondary-400, #f37e51);
              border-radius: 50%;
              animation: typing 1.4s ease-in-out infinite;

              &:nth-child(2) {
                animation-delay: 0.2s;
              }

              &:nth-child(3) {
                animation-delay: 0.4s;
              }
            }
          }
        }

        &__bot-avatar {
          background: var(--secondary-100, #fbd3c3) !important;
          color: var(--secondary-600, #d4460f) !important;
          width: 28px !important;
          height: 28px !important;
          font-size: 0.75rem !important;
        }
      }

      @keyframes typing {
        0%,
        60%,
        100% {
          transform: translateY(0);
          opacity: 0.4;
        }
        30% {
          transform: translateY(-6px);
          opacity: 1;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatMessagesComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  /** Messages to display */
  messages = input.required<DisplayMessage[]>();

  /** Whether AI is processing */
  loading = input(false);

  /** Current editable subject value */
  editableSubject = input('');

  /** Current editable body value */
  editableBody = input('');

  /** Emitted when subject changes */
  subjectChange = output<string>();

  /** Emitted when body changes */
  bodyChange = output<string>();

  /** Emitted when user confirms email */
  confirmEmail = output<PendingAction>();

  /** Emitted when user declines email */
  declineEmail = output<void>();

  private lastMessageCount = 0;

  ngAfterViewChecked(): void {
    // Auto-scroll when new messages are added
    const currentCount = this.messages().length;
    if (currentCount !== this.lastMessageCount) {
      this.lastMessageCount = currentCount;
      this.scrollToBottom();
    }
  }

  private scrollToBottom(): void {
    if (this.messagesContainer?.nativeElement) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
