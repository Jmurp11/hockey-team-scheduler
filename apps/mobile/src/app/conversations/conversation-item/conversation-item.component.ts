import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import {
  ConversationDisplay,
  getInitials,
  getLastMessageTime,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonBadge,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { ItemComponent } from '../../shared/item/item.component';

@Component({
  selector: 'app-conversation-item',
  standalone: true,
  imports: [
    CommonModule,
    ItemComponent,
    AvatarComponent,
    IonLabel,
    IonNote,
    IonBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-item [button]="true" [detail]="false" (itemClick)="onMonitorClick()">
      <app-avatar slot="start">
        <div class="avatar-initials">
          {{ getInitials(conversation.managerName) }}
        </div>
      </app-avatar>

      <ion-label>
        <h2>{{ conversation.managerName }}</h2>
        <h3>{{ conversation.managerTeam }}</h3>
        <p>{{ conversation.lastMessage }}</p>
      </ion-label>

      <ion-note slot="end" class="time-note">
        <div class="note-content">
          <span>{{ getLastMessageTime(conversation.lastMessageTimestamp) }}</span>
          @if (conversation.unreadCount > 0) {
            <ion-badge color="danger">{{ conversation.unreadCount }}</ion-badge>
          }
        </div>
      </ion-note>
    </app-item>
  `,
  styles: [
    `
      app-item {
        --padding-start: 16px;
        --padding-end: 16px;
        --min-height: 80px;
      }

      .avatar-initials {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--secondary-100);
        color: var(--primary-500);
        font-weight: 600;
        font-size: 1.2rem;
        border-radius: 50%;
      }

      ion-label h2 {
        font-weight: 600;
        color: var(--ion-color-primary);
        margin-bottom: 4px;
      }

      ion-label h3 {
        font-size: 0.9rem;
        color: var(--ion-color-medium);
        margin-bottom: 4px;
      }

      ion-label p {
        font-size: 0.9rem;
        color: var(--ion-color-medium);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .time-note {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .note-content {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 8px;
      }

      .note-content span {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
      }

      ion-badge {
        --padding-top: 4px;
        --padding-bottom: 4px;
        --padding-start: 8px;
        --padding-end: 8px;
      }
    `,
  ],
})
export class ConversationItemComponent {
  @Input() conversation!: ConversationDisplay;

  private router = inject(Router);

  getLastMessageTime = getLastMessageTime;
  getInitials = getInitials;

  onMonitorClick() {
    this.router.navigate(['/app/chat', this.conversation.id]);
  }
}
