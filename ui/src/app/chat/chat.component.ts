import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatSummary } from '../shared/types/chat-summary.type';
import { ChatHeaderComponent } from './chat-header/chat-header.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar.component';
import { MessagesComponent } from './messages/messages.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    MessagesComponent,
    ChatInputComponent,
    ChatSidebarComponent,
    ChatHeaderComponent,
  ],
  template: `
    <div class="chat__main">
      <app-chat-header />
      <app-messages />
      <app-chat-input />
    </div>
    <div class="chat__sidebar">
      <app-chat-sidebar [chatSummaries]="chatSummaries" />
    </div>
  `,
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {
  chatSummaries: ChatSummary[] = [
    {
      title: 'Agent Details',
      content: [
        { label: 'Model', value: 'GPT-5 Chat' },
        { label: 'Status', value: 'Active' },
      ],
    },
    {
      title: 'Manager Details',
      content: [
        { label: 'Name', value: 'John Doe' },
        { label: 'Team', value: 'Rye Rangers 14UAA TB' },
        { label: 'Contact', value: '1 (222) 333-4444' },
      ],
    },
    {
      title: 'Conversation Details',
      content: [
        { label: 'Messages', value: '150' },
        { label: 'Duration', value: '2 hrs' },
        { label: 'Status', value: 'Active' },
      ],
    },
  ];
}
