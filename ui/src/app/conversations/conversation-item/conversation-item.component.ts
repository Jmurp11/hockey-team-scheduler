import { Component, Input } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Conversation } from '../../shared/types/conversation.type';

@Component({
  selector: 'app-conversation-item',
  imports: [AvatarModule, OverlayBadgeModule, ButtonModule],
  template: `<div class="conversation-item">
    <div class="align-right">
      <p-avatar
        [label]="getInitials(conversation.managerName)"
        class="avatar"
        size="large"
        shape="circle"
      />
      <div class="message-container">
        <div class="message-container__recipient">
          {{ conversation.managerName }}
        </div>
        <div class="message-container__last-message">
          {{ conversation.lastMessage }}
        </div>
      </div>
    </div>

    <div class="align-left">
      <div class="timestamp">
        {{ getLastMessageTime(conversation.lastMessageTimestamp) }}
      </div>

      <p-button label="Monitor" size="small" />
    </div>
  </div>`,
  styleUrls: ['./conversation-item.component.scss'],
})
export class ConversationItemComponent {
  @Input() conversation: Conversation;

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map((n) => n.charAt(0).toUpperCase());
    return initials.join('');
  }

  getLastMessageTime(timestamp: string): string {
    const date = new Date(timestamp);
    const current = new Date();
    const diffInMs = current.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hr ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}
