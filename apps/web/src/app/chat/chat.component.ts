import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ChatSummary, Message } from '@hockey-team-scheduler/shared-utilities';
import { setSelect } from '@hockey-team-scheduler/shared-utilities';
import { MessagesService } from '@hockey-team-scheduler/shared-data-access';
import { tap, catchError, of } from 'rxjs';
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
      <app-chat-header 
        [managerName]="managerName()" 
        [aiEnabled]="aiEnabled()" 
      />
      <app-messages [messages]="messages()" />
      <app-chat-input 
        (messageSent)="onMessageSent($event)"
        [isSending]="isSending()"
      />
    </div>
    <div class="chat__sidebar">
      <app-chat-sidebar [chatSummaries]="chatSummaries" />
    </div>
  `,
  styleUrls: ['./chat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private messagesService = inject(MessagesService);

  conversationId = signal<string>('');
  managerName = signal<string>('Manager Name');
  aiEnabled = signal<boolean>(true);
  messages = signal<Message[]>([]);
  isSending = signal<boolean>(false);

  ngOnInit(): void {
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((params) => {
        this.conversationId.set(params['id']);
        this.loadMessages();
      })
    ).subscribe();
  }

  loadMessages(): void {
    const id = this.conversationId();
    if (!id) return;

    this.messagesService.getMessages(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((messages) => this.messages.set(messages)),
      catchError((error) => {
        console.error('Error loading messages:', error);
        return of([]);
      })
    ).subscribe();
  }

  onMessageSent(messageContent: string): void {
    if (this.isSending()) return;

    this.isSending.set(true);

    // Optimistically add the message to the UI
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
    };

    this.messages.update(msgs => [...msgs, optimisticMessage]);

    this.messagesService.sendMessage(this.conversationId(), messageContent).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(() => {
        this.isSending.set(false);
        // Reload messages to get the actual message from the server
        this.loadMessages();
      }),
      catchError((error) => {
        console.error('Error sending message:', error);
        this.isSending.set(false);
        // Remove optimistic message on error
        this.messages.update(msgs => msgs.filter(m => m.id !== optimisticMessage.id));
        return of(null);
      })
    ).subscribe();
  }
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
