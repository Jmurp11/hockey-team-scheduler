import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { InputComponent } from '../shared/components/input/input.component';
import { Conversation } from '../shared/types/conversation.type';
import { getFormControl } from '../shared/utilities/form.utility';
import { ConversationItemComponent } from './conversation-item/conversation-item.component';
import PageTitleComponent from './page-title/page-title.component';

@Component({
  selector: 'app-conversations',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    InputComponent,
    ConversationItemComponent,
    ReactiveFormsModule,
  ],
  template: `<div>
    <app-page-title title="Inbox"></app-page-title>
    <form [formGroup]="form">
      <app-input [label]="label" [control]="getFormControl(form, 'search')" />
    </form>

    <div class="conversations-list">
      @for (conversation of conversations; track conversation.id) {
      <app-conversation-item [conversation]="conversation" />
      }
    </div>
  </div>`,
  styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent {
  label = 'Search by contact name or message';

  form = new FormGroup({
    search: new FormControl(null),
  });

  conversations: Conversation[] = [
    {
      id: '1',
      managerName: 'John Smith',
      lastMessage: 'Hey, are we still on for practice tomorrow?',
      lastMessageTimestamp: new Date('2025-10-30T10:30:00').toDateString(),
      unreadCount: 2,
      user_id: '',
      managerTeam: '',
    },
    {
      id: '2',
      managerName: 'Sarah Johnson',
      lastMessage: 'Thanks for organizing the team dinner!',
      lastMessageTimestamp: new Date('2025-10-30T18:45:00').toDateString(),
      unreadCount: 0,
      user_id: '',
      managerTeam: '',
    },
    {
      id: '3',
      managerName: 'Mike Davis',
      lastMessage: 'Can you send me the game schedule?',
      lastMessageTimestamp: new Date('2025-10-30T14:20:00').toDateString(),
      unreadCount: 1,
      user_id: '',
      managerTeam: '',
    },
    {
      id: '4',
      managerName: 'Coach Williams',
      lastMessage: "Great job in today's practice everyone!",
      lastMessageTimestamp: new Date('2025-10-30T16:00:00').toDateString(),
      unreadCount: 0,
      user_id: '',
      managerTeam: '',
    },
  ];

  getFormControl = getFormControl;
}
