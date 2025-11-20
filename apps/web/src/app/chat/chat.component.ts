import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChatSummary } from '@hockey-team-scheduler/shared-utilities';
import { setSelect } from '@hockey-team-scheduler/shared-utilities';
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
        setSelect('Model', 'GPT-5 Chat'),
        setSelect('Status', 'Active'),
      ],
    },
    {
      title: 'Manager Details',
      content: [
        setSelect('Name', 'John Doe'),
        setSelect('Team', 'Rye Rangers 14UAA TB'),
        setSelect('Contact', '1 (222) 333-4444'),
      ],
    },
    {
      title: 'Conversation Details',
      content: [
        setSelect('Messages', '150'),
        setSelect('Duration', '2 hrs'),
        setSelect('Status', 'Active'),
      ],
    },
  ];
}
