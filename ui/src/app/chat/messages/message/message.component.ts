import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Message } from '../../../shared/types/message.type';
import { AvatarModule } from 'primeng/avatar';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [AvatarModule, NgStyle],
  template: `
    <div class="content">
      @if (message.sender === 'contact') {
      <div class="avatar-container-contact">
        <p-avatar
          class="avatar-contact"
          shape="circle"
          size="normal"
          [label]="getAvatarLabel(message.sender)"
        />
      </div>
      <div class="content" [ngStyle]="getContentStyle(message.sender)">
        {{ message.content }}
      </div>
      } @else {
      <div class="content" [ngStyle]="getContentStyle(message.sender)">
        {{ message.content }}
      </div>
      <div class="avatar-container">
        @if (message.sender === 'assistant') {
        <p-avatar
          icon="bi bi-robot"
          class="avatar-assistant"
          shape="circle"
          size="normal"
        />
        } @else if (message.sender === 'user') {
        <p-avatar
          class="avatar"
          shape="circle"
          size="normal"
          [label]="getAvatarLabel(message.sender)"
        />
        }
      </div>
      }
    </div>
    <div class="timestamp">
      {{ message.createdAt }}
    </div>
  `,
  styleUrl: './message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageComponent {
  @Input() message: Message;

  getAvatarLabel(sender: string): string {
    switch (sender) {
      case 'user':
        return 'C'; // Coach
      case 'contact':
        return 'P'; // Player/Parent
      default:
        return sender.charAt(0).toUpperCase();
    }
  }

  getContentStyle(sender: string) {
    return sender === 'contact'
      ? {
          'background-color': 'var(--gray-100)',
          color: 'var(--primary-500)',
        }
      : {
          'background-color': 'var(--secondary-100)',
          color: 'var(--primary-500)',
        };
  }
}
