import { NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
    Message,
    getLastMessageTime,
} from '@hockey-team-scheduler/shared-utilities';
import { MessageAvatarComponent } from './message-avatar.component';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [MessageAvatarComponent, NgStyle],
  template: `
    <div class="message-wrapper">
      <div class="content">
        @if (message.sender === 'contact') {
          <app-message-avatar [sender]="message.sender" />

          <div
            class="message-content"
            [ngStyle]="getContentStyle(message.sender)"
          >
            {{ message.content }}
          </div>
        } @else {
          <div
            class="message-content"
            [ngStyle]="getContentStyle(message.sender)"
          >
            {{ message.content }}
          </div>
          <app-message-avatar [sender]="message.sender" />
        }
      </div>
      <div class="timestamp">
        {{ getLastMessageTime(message.createdAt) }}
      </div>
    </div>
  `,
  styles: [
    `
      .message-wrapper {
        width: 100%;
      }

      .content {
        display: flex;
        flex-direction: row;
        align-items: flex-end;
        
      }

      .message-content {
        padding: 0.75rem 1rem;
        border-radius: 1rem;
        max-width: 70%;
        word-wrap: break-word;
        font-size: 0.95rem;
      }

      .timestamp {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin-top: 0.25rem;
        text-align: right;
        padding-right: 2.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
  @Input({ required: true }) message!: Message;

  getLastMessageTime = getLastMessageTime;

  getContentStyle(sender: string) {
    if (sender === 'contact') {
      return {
        'background-color': 'var(--ion-color-light)',
        color: 'var(--ion-color-dark)',
      };
    } else if (sender === 'assistant') {
      return {
        'background-color': 'var(--tertiary-300)',
        color: 'var(--primary-600)',
      };
    } else {
      return {
        'background-color': 'var(--secondary-200)',
        color: 'var(--primary-600)',
      };
    }
  }
}
