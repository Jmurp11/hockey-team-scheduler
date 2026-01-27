import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import {
  ChatMessage,
  EmailDraft,
  PendingAction,
  RinkLinkGptService,
} from './rinklink-gpt.service';

import {
  AgentInvocationContext,
  AgentWorkflow,
  DisplayMessage,
  EmailIntent,
  buildIntentMessage,
  buildEmailWorkflowPrompt,
  buildConversationHistory,
  createUserMessage,
  createAssistantMessage,
  markActionAsConfirmed,
  createUpdatedEmailAction,
} from '@hockey-team-scheduler/shared-utilities';

/**
 * Intent chip configuration for the AI panel.
 */
export interface IntentChip {
  intent: EmailIntent;
  label: string;
  /** Icon for web (PrimeNG) */
  webIcon: string;
  /** Icon for mobile (Ionic/Ionicons) */
  mobileIcon: string;
}

/**
 * Configuration options for the AI email panel state service.
 */
export interface AiEmailPanelConfig {
  userId: string;
  contact: AgentInvocationContext['contact'];
  relatedEntity?: AgentInvocationContext['relatedEntity'];
  workflow?: AgentWorkflow;
}

/**
 * State service for the AI Email Panel.
 * Manages shared state and logic between web and mobile implementations.
 *
 * This service is NOT provided in root - it should be provided at component level
 * to ensure each panel instance has its own state.
 */
@Injectable()
export class AiEmailPanelStateService {
  private rinkLinkGptService = inject(RinkLinkGptService);

  // Configuration (set via initialize)
  private userId = '';
  private contact: AgentInvocationContext['contact'] | null = null;
  private relatedEntity?: AgentInvocationContext['relatedEntity'];
  private workflow: AgentWorkflow = 'email-manager';

  // Reactive state
  readonly messages = signal<DisplayMessage[]>([]);
  readonly loading = signal(false);
  readonly inputMessage = signal('');
  readonly editableSubject = signal('');
  readonly editableBody = signal('');

  // Computed state
  readonly canSend = computed(() => {
    return this.inputMessage().trim().length > 0 && !this.loading();
  });

  readonly hasMessages = computed(() => this.messages().length > 0);

  readonly currentContact = computed(() => this.contact);

  readonly currentWorkflow = computed(() => this.workflow);

  /**
   * Default intent chips configuration.
   */
  readonly intentChips: IntentChip[] = [
    {
      intent: 'schedule',
      label: 'Schedule',
      webIcon: 'pi pi-calendar-plus',
      mobileIcon: 'calendar-outline',
    },
    {
      intent: 'reschedule',
      label: 'Reschedule',
      webIcon: 'pi pi-calendar',
      mobileIcon: 'calendar-outline',
    },
    {
      intent: 'cancel',
      label: 'Cancel Game',
      webIcon: 'pi pi-calendar-times',
      mobileIcon: 'calendar-outline',
    },
    {
      intent: 'general',
      label: 'General',
      webIcon: 'pi pi-envelope',
      mobileIcon: 'mail-outline',
    },
  ];

  /**
   * Initialize the service with configuration.
   * Must be called before using other methods.
   */
  initialize(config: AiEmailPanelConfig): void {
    this.userId = config.userId;
    this.contact = config.contact;
    this.relatedEntity = config.relatedEntity;
    this.workflow = config.workflow ?? 'email-manager';
  }

  /**
   * Reset all state to initial values.
   */
  reset(): void {
    this.messages.set([]);
    this.loading.set(false);
    this.inputMessage.set('');
    this.editableSubject.set('');
    this.editableBody.set('');
  }

  /**
   * Update the input message value.
   */
  setInputMessage(value: string): void {
    this.inputMessage.set(value);
  }

  /**
   * Update the editable subject value.
   */
  setEditableSubject(value: string): void {
    this.editableSubject.set(value);
  }

  /**
   * Update the editable body value.
   */
  setEditableBody(value: string): void {
    this.editableBody.set(value);
  }

  /**
   * Handle quick intent chip selection.
   * Uses workflow-aware message building to ensure email-manager workflow is triggered.
   */
  selectIntent(intent: EmailIntent): Observable<void> {
    if (!this.contact) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    // For email-manager workflow, use the comprehensive email workflow prompt
    if (this.workflow === 'email-manager') {
      const context: AgentInvocationContext = {
        source: 'contact-card',
        workflow: 'email-manager',
        contact: this.contact,
        suggestedIntent: intent,
      };
      const message = buildEmailWorkflowPrompt(intent, context);
      return this.sendMessageToAi(message, intent);
    } else {
      // Default behavior for other workflows
      const message = buildIntentMessage(
        intent,
        this.contact.name,
        this.contact.team,
        this.workflow
      );
      return this.sendMessageToAi(message, intent);
    }
  }

  /**
   * Send the current input message.
   */
  sendCurrentMessage(): Observable<void> | null {
    if (!this.canSend()) return null;

    const message = this.inputMessage().trim();
    this.inputMessage.set('');
    return this.sendMessageToAi(message);
  }

  /**
   * Confirm and send the email.
   * Returns an observable that completes when the email is sent.
   */
  confirmEmail(pendingAction: PendingAction): Observable<boolean> {
    // Create updated action with edited subject/body
    const updatedAction = createUpdatedEmailAction(
      pendingAction,
      this.editableSubject(),
      this.editableBody()
    );

    // Mark action as confirmed in UI
    this.messages.update((msgs) => markActionAsConfirmed(msgs, pendingAction));

    const history = buildConversationHistory(this.messages());

    this.loading.set(true);

    return new Observable<boolean>((observer) => {
      this.rinkLinkGptService
        .confirmAction(this.userId, updatedAction, history)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            const confirmationMessage = createAssistantMessage(response.message);
            this.messages.update((msgs) => [...msgs, confirmationMessage]);
            observer.next(true);
            observer.complete();
          },
          error: (error) => {
            console.error('Email send error:', error);
            const errorMessage = createAssistantMessage(
              'Sorry, I could not send the email. Please try again.'
            );
            this.messages.update((msgs) => [...msgs, errorMessage]);
            observer.next(false);
            observer.complete();
          },
        });
    });
  }

  /**
   * Decline the email draft.
   */
  declineEmail(): Observable<void> {
    const history = buildConversationHistory(this.messages());

    this.loading.set(true);

    return new Observable<void>((observer) => {
      this.rinkLinkGptService
        .declineAction(this.userId, history)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            const declineMessage = createAssistantMessage(response.message);
            this.messages.update((msgs) => [...msgs, declineMessage]);
            observer.next();
            observer.complete();
          },
          error: (error) => {
            console.error('Decline error:', error);
            observer.error(error);
          },
        });
    });
  }

  /**
   * Build the context for opening full chat.
   */
  buildFullChatContext(): {
    context: AgentInvocationContext;
    messages: DisplayMessage[];
  } {
    if (!this.contact) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    const context: AgentInvocationContext = {
      source: 'contact-card',
      workflow: this.workflow,
      contact: this.contact,
      relatedEntity: this.relatedEntity,
    };

    return {
      context,
      messages: this.messages(),
    };
  }

  /**
   * Get email draft from a pending action.
   */
  getEmailDraftFromAction(pendingAction: PendingAction): EmailDraft | null {
    if (pendingAction.type === 'send_email') {
      return pendingAction.data as EmailDraft;
    }
    return null;
  }

  /**
   * Send a message to the AI and handle the response.
   */
  private sendMessageToAi(message: string, intent?: EmailIntent): Observable<void> {
    if (!this.contact) {
      throw new Error('Service not initialized. Call initialize() first.');
    }

    // Add context to the message if it's the first message
    const contextualMessage = this.buildContextualMessage(message);

    // For display, show a cleaner version of the message
    const displayMessage = this.getDisplayMessage(message, intent);
    const userMessage = createUserMessage(displayMessage);
    this.messages.update((msgs) => [...msgs, userMessage]);

    // Build conversation history
    const history = buildConversationHistory(this.messages());

    this.loading.set(true);

    return new Observable<void>((observer) => {
      this.rinkLinkGptService
        .chat(contextualMessage, history, this.userId)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            const assistantMessage = createAssistantMessage(
              response.message,
              response.pendingAction
            );
            this.messages.update((msgs) => [...msgs, assistantMessage]);

            // Initialize editable fields if there's an email draft
            if (response.pendingAction?.type === 'send_email') {
              const draft = response.pendingAction.data as EmailDraft;
              this.editableSubject.set(draft.subject);
              this.editableBody.set(draft.body);
            }

            observer.next();
            observer.complete();
          },
          error: (error) => {
            console.error('AI chat error:', error);
            const errorMessage = createAssistantMessage(
              'Sorry, I encountered an error. Please try again.'
            );
            this.messages.update((msgs) => [...msgs, errorMessage]);
            observer.error(error);
          },
        });
    });
  }

  /**
   * Build a contextual message that includes contact information and workflow instructions.
   * For email-manager workflow, this ensures the AI understands to draft an email.
   */
  private buildContextualMessage(message: string): string {
    if (!this.contact) return message;

    // If this is the first message, add comprehensive context
    if (this.messages().length === 0) {
      const contextParts: string[] = [];

      // Add workflow instruction for email-manager
      if (this.workflow === 'email-manager') {
        contextParts.push('Workflow: EMAIL_TO_MANAGER');
        contextParts.push(
          'Task: Draft an email to this manager. Do not schedule games internally.'
        );
      }

      // Add contact context
      contextParts.push(`Recipient: ${this.contact.name}`);
      if (this.contact.email) contextParts.push(`Email: ${this.contact.email}`);
      if (this.contact.team) contextParts.push(`Team: ${this.contact.team}`);
      if (this.contact.association)
        contextParts.push(`Association: ${this.contact.association}`);

      return `[Context: ${contextParts.join(', ')}] ${message}`;
    }

    return message;
  }

  /**
   * Get a user-friendly display message (without the full context prefix).
   */
  private getDisplayMessage(message: string, intent?: EmailIntent): string {
    if (!this.contact) return message;

    // For intent selection with email-manager workflow, show a cleaner message
    if (intent && this.workflow === 'email-manager') {
      const target = this.contact.team
        ? `${this.contact.name} from ${this.contact.team}`
        : this.contact.name;
      const displayMessages: Record<EmailIntent, string> = {
        schedule: `Draft an email to ${target} to schedule a game.`,
        reschedule: `Draft an email to ${target} to reschedule a game.`,
        cancel: `Draft an email to ${target} to cancel a game.`,
        general: `Draft an email to ${target}.`,
      };
      return displayMessages[intent];
    }

    // For other cases, strip any workflow prefix if present
    if (message.startsWith('[EMAIL_MANAGER_WORKFLOW]')) {
      return message.replace('[EMAIL_MANAGER_WORKFLOW] ', '');
    }

    return message;
  }
}
