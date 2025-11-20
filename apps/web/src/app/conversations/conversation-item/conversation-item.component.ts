import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Conversation, getLastMessageTime } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-conversation-item',
  imports: [AvatarModule, OverlayBadgeModule, ButtonModule],
  template: `<div class="conversation-item">
    <div class="align-right" (click)="onMonitorClick()">
      <p-overlayBadge
        [value]="conversation.unreadCount"
        severity="danger"
        [badgeDisabled]="conversation.unreadCount === 0"
        size="small"
      >
        <p-avatar
          [label]="getInitials(conversation.managerName)"
          class="avatar"
          size="large"
          shape="circle"
        />
      </p-overlayBadge>
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

      <p-button label="Monitor" size="small" (click)="onMonitorClick()" />
    </div>
  </div>`,
  styleUrls: ['./conversation-item.component.scss'],
})
export class ConversationItemComponent {
  @Input() conversation: Conversation;

  private router = inject(Router);

  getLastMessageTime = getLastMessageTime;

  onMonitorClick() {
    this.router.navigate(['/app/chat', this.conversation.id]);
  }

  getInitials(name: string): string {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map((n) => n.charAt(0).toUpperCase());
    return initials.join('');
  }
}
