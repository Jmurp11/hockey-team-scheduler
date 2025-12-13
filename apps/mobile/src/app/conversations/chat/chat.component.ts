import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonFooter } from '@ionic/angular/standalone';
import { Message } from '@hockey-team-scheduler/shared-utilities';
import { MessagesService } from '@hockey-team-scheduler/shared-data-access';
import { tap, catchError, of } from 'rxjs';
import { ChatHeaderComponent } from './chat-header.component';
import { ChatInputComponent } from './chat-input.component';
import { MessagesComponent } from './messages.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    IonContent,
    IonFooter,
    ChatHeaderComponent,
    MessagesComponent,
    ChatInputComponent,
  ],
  template: `
    <app-chat-header 
      [managerName]="managerName()" 
      [aiEnabled]="aiEnabled()" 
    />
    
    <ion-content class="chat-content">
      <app-messages [messages]="messages()" />
    </ion-content>

    <ion-footer class="ion-no-border">
      <app-chat-input 
        (messageSent)="onMessageSent($event)"
        [isSending]="isSending()"
      />
    </ion-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .chat-content {
        --padding-start: 0;
        --padding-end: 0;
        --padding-top: 0;
        --padding-bottom: 0;
      }

      ion-footer {
        background-color: var(--ion-color-light);
      }
    `,
  ],
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
}
