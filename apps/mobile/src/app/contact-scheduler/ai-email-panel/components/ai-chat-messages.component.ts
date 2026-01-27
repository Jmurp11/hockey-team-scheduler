import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

import { DisplayMessage } from '@hockey-team-scheduler/shared-utilities';
import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { AiChatMessageComponent } from './ai-chat-message.component';

/**
 * Mobile container component for chat messages.
 * Handles scrolling and renders individual message components using Ionic styling.
 */
@Component({
  selector: 'app-ai-chat-messages',
  standalone: true,
  imports: [IonSpinner, AiChatMessageComponent],
  template: `
    <div class="ai-chat-messages" #messagesContainer>
      @for (message of messages(); track $index) {
        <app-ai-chat-message
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
            <i class="bi bi-robot"></i>
          </div>
          <div class="ai-chat-messages__typing-dots">
            <ion-spinner name="dots"></ion-spinner>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .ai-chat-messages {
        max-height: 250px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;

        &__typing {
          display: flex;
          gap: 8px;
          align-self: flex-start;

          &-avatar {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--ion-color-light-shade);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          &-dots {
            padding: 10px 14px;
            background: var(--ion-color-light);
            border-radius: 12px;
          }
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
