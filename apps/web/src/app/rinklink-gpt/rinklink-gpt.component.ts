import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { filter } from 'rxjs';

import {
  AgentContextService,
  AuthService,
  ChatResponse,
  PendingAction,
  RinkLinkGptService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  UserProfile,
  buildConversationHistory,
  createUserMessage,
  createAssistantMessage,
  markActionAsConfirmed,
  markAllActionsAsConfirmed,
  AgentInvocationContext,
} from '@hockey-team-scheduler/shared-utilities';

import {
  ChatHeaderComponent,
  ChatWelcomeComponent,
  ChatMessageComponent,
  ChatTypingIndicatorComponent,
  ChatInputComponent,
} from './components';
import { DisplayMessage } from './rinklink-gpt.types';

@Component({
  selector: 'app-rinklink-gpt',
  standalone: true,
  imports: [
    ChatHeaderComponent,
    ChatWelcomeComponent,
    ChatMessageComponent,
    ChatTypingIndicatorComponent,
    ChatInputComponent,
  ],
  template: `
    <div class="rinklink-gpt">
      <app-chat-header
        [showBackButton]="!!returnRoute()"
        (backClick)="navigateBack()"
      />

      <div class="rinklink-gpt__messages" #messagesContainer>
        @if (messages().length === 0) {
          <app-chat-welcome
            [disabled]="loading()"
            (suggestionClick)="sendSuggestion($event)"
          />
        }

        <!-- Context restoration banner -->
        @if (restoredContext()) {
          <div class="rinklink-gpt__context-banner">
            <i class="pi pi-info-circle"></i>
            <span>
              Continuing conversation about
              <strong>{{ restoredContext()?.contact?.team || restoredContext()?.contact?.name }}</strong>
            </span>
          </div>
        }

        @for (message of messages(); track $index) {
          <app-chat-message
            [message]="message"
            [disabled]="loading()"
            (confirm)="confirmAction($event)"
            (decline)="declineAction()"
          />
        }

        @if (loading()) {
          <app-chat-typing-indicator />
        }
      </div>

      <app-chat-input
        [(message)]="inputMessage"
        [disabled]="loading()"
        (send)="sendMessage()"
      />
    </div>
  `,
  styleUrls: ['./rinklink-gpt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RinkLinkGptComponent implements OnInit {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private authService = inject(AuthService);
  private agentContextService = inject(AgentContextService);
  private rinkLinkGptService = inject(RinkLinkGptService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  private user$ = toObservable(this.authService.currentUser);
  private userId = signal<string | null>(null);

  messages = signal<DisplayMessage[]>([]);
  inputMessage = signal('');
  loading = signal(false);

  // Context restoration state
  restoredContext = signal<AgentInvocationContext | null>(null);
  returnRoute = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeUserSubscription();
    this.restoreContextIfAvailable();
  }

  sendMessage(): void {
    const message = this.inputMessage().trim();
    if (!message || !this.userId()) return;

    this.addUserMessage(message);
    this.inputMessage.set('');
    this.sendChatRequest(message);
  }

  sendSuggestion(suggestion: string): void {
    this.inputMessage.set(suggestion);
    this.sendMessage();
  }

  confirmAction(action: PendingAction): void {
    if (!this.userId()) return;

    this.markPendingActionAsConfirmed(action);
    this.addUserMessage('Yes, please proceed.');
    this.sendConfirmRequest(action);
  }

  declineAction(): void {
    if (!this.userId()) return;

    this.markAllPendingActionsAsConfirmed();
    this.addUserMessage("No, I don't want to proceed with this action.");
    this.sendDeclineRequest();
  }

  /**
   * Navigate back to the return route (if set from modal context).
   */
  navigateBack(): void {
    const route = this.returnRoute();
    if (route) {
      this.router.navigateByUrl(route);
    }
  }

  // --- Private Methods ---

  private initializeUserSubscription(): void {
    this.user$
      .pipe(
        filter((user): user is UserProfile => !!user?.user_id),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((user) => this.userId.set(user.user_id));
  }

  /**
   * Restore context from the AgentContextService if available.
   * This allows continuing a conversation started in a modal.
   */
  private restoreContextIfAvailable(): void {
    if (!this.agentContextService.hasActiveContext()) {
      return;
    }

    const { context, conversationHistory, returnRoute } =
      this.agentContextService.consumeContext();

    if (context && conversationHistory.length > 0) {
      // Restore the conversation history
      this.messages.set(conversationHistory);

      // Store context for display
      this.restoredContext.set(context);

      // Store return route for back navigation
      if (returnRoute) {
        this.returnRoute.set(returnRoute);
      }

      // Scroll to bottom after restoration
      this.scheduleScrollToBottom();
    }
  }

  private addUserMessage(content: string): void {
    this.addMessage(createUserMessage(content));
  }

  private addAssistantMessage(content: string, pendingAction?: PendingAction): void {
    this.addMessage(createAssistantMessage(content, pendingAction));
  }

  private addMessage(message: DisplayMessage): void {
    this.messages.update((current) => [...current, message]);
    this.scheduleScrollToBottom();
  }

  private sendChatRequest(message: string): void {
    this.loading.set(true);
    const history = buildConversationHistory(this.messages());

    this.rinkLinkGptService
      .chat(message, history, this.userId()!)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleResponse(response),
        error: (err) => this.handleError(err),
      });
  }

  private sendConfirmRequest(action: PendingAction): void {
    this.loading.set(true);
    const history = buildConversationHistory(this.messages());

    this.rinkLinkGptService
      .confirmAction(this.userId()!, action, history)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleResponse(response),
        error: (err) => this.handleError(err),
      });
  }

  private sendDeclineRequest(): void {
    this.loading.set(true);
    const history = buildConversationHistory(this.messages());

    this.rinkLinkGptService
      .declineAction(this.userId()!, history)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => this.handleResponse(response),
        error: (err) => this.handleError(err),
      });
  }

  private handleResponse(response: ChatResponse): void {
    this.loading.set(false);
    this.addAssistantMessage(response.message, response.pendingAction);
    this.scrollToBottom();
  }

  private handleError(error: unknown): void {
    this.loading.set(false);
    console.error('Chat error:', error);
    this.addAssistantMessage('I apologize, but I encountered an error. Please try again.');
    this.scrollToBottom();
  }

  private markPendingActionAsConfirmed(action: PendingAction): void {
    this.messages.update((messages) => markActionAsConfirmed(messages, action));
  }

  private markAllPendingActionsAsConfirmed(): void {
    this.messages.update((messages) => markAllActionsAsConfirmed(messages));
  }

  private scheduleScrollToBottom(): void {
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }
}
