import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MessagesComponent } from './messages/messages.component';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ChatHeaderComponent } from './chat-header/chat-header.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [MessagesComponent, ChatInputComponent, ChatSidebarComponent, ChatHeaderComponent],
  template: `
    <div class="chat__main">
      <app-chat-header />
      <app-messages />
      <app-chat-input />
    </div>
    <div class="chat__sidebar">
      <app-chat-sidebar />
    </div>
  `,
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {}
