import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
    ConversationDisplay,
    getFormControl,
    searchConversations,
} from '@hockey-team-scheduler/shared-utilities';
import { tap } from 'rxjs';
import { InputComponent } from '../shared/components/input/input.component';
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
    <app-page-title
      title="Inbox"
      [newMessageCount]="newMessageCount"
    ></app-page-title>
    <form [formGroup]="form">
      <app-input [label]="label" [control]="getFormControl(form, 'search')" />
    </form>

    <div class="conversations-list">
      @for (conversation of filtered; track conversation.id) {
      <app-conversation-item [conversation]="conversation" />
      }
    </div>
  </div>`,
  styleUrls: ['./conversations.component.scss'],
})
export class ConversationsComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  label = 'Search';

  form = new FormGroup({
    search: new FormControl(null),
  });

  conversations: ConversationDisplay[] = [
    {
      id: '1',
      managerName: 'John Smith',
      lastMessage: 'Hey, are we still on for practice tomorrow?',
      lastMessageTimestamp: new Date('2025-10-30T10:30:00').toDateString(),
      unreadCount: 2,
      user_id: '',
      managerTeam: 'Rye Rangers',
    },
    {
      id: '2',
      managerName: 'Sarah Johnson',
      lastMessage: 'Thanks for organizing the team dinner!',
      lastMessageTimestamp: new Date('2025-10-30T18:45:00').toDateString(),
      unreadCount: 0,
      user_id: '',
      managerTeam: 'Brewster Travel Hockey',
    },
    {
      id: '3',
      managerName: 'Mike Davis',
      lastMessage: 'Can you send me the game schedule?',
      lastMessageTimestamp: new Date('2025-10-30T14:20:00').toDateString(),
      unreadCount: 1,
      user_id: '',
      managerTeam: 'Pelham Pelicans',
    },
    {
      id: '4',
      managerName: 'Coach Williams',
      lastMessage: "Great job in today's practice everyone!",
      lastMessageTimestamp: new Date('2025-10-30T16:00:00').toDateString(),
      unreadCount: 0,
      user_id: '',
      managerTeam: 'Mamaroneck Tigers',
    },
  ];

  filtered: ConversationDisplay[] = this.conversations;

  newMessageCount = this.conversations.reduce(
    (count, convo) => count + convo.unreadCount,
    0
  );

  getFormControl = getFormControl;

  ngOnInit(): void {
    this.onSearchChange().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  onSearchChange() {
    return this.getFormControl(this.form, 'search').valueChanges.pipe(
      tap((search) => (this.filtered = searchConversations(this.conversations, search || '')))
    );
  }
}
