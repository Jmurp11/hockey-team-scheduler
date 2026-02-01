import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';

import {
  AiEmailPanelStateService,
  PendingAction,
} from '@hockey-team-scheduler/shared-data-access';
import {
  AgentInvocationContext,
  AgentWorkflow,
  DisplayMessage,
  EmailIntent,
} from '@hockey-team-scheduler/shared-utilities';

import { AiPanelHeaderComponent } from './components/ai-panel-header.component';
import { AiIntentChipsComponent } from './components/ai-intent-chips.component';
import { AiChatMessagesComponent } from './components/ai-chat-messages.component';
import { AiPanelInputComponent } from './components/ai-panel-input.component';
import { AiPanelFooterComponent } from './components/ai-panel-footer.component';

/**
 * AI Email Panel component for inline AI interaction in modals.
 * Allows users to draft and send AI-generated emails without leaving the modal.
 *
 * This component acts as the orchestrating container, delegating to smaller
 * sub-components for each section of the UI.
 */
@Component({
  selector: 'lib-ai-email-panel',
  standalone: true,
  imports: [
    AiPanelHeaderComponent,
    AiIntentChipsComponent,
    AiChatMessagesComponent,
    AiPanelInputComponent,
    AiPanelFooterComponent,
  ],
  providers: [AiEmailPanelStateService],
  template: `
    <div class="ai-email-panel">
      <!-- Header -->
      <lib-ai-panel-header (close)="cancel.emit()" />

      <!-- Quick Intent Chips (shown when no messages) -->
      @if (!stateService.hasMessages()) {
        <lib-ai-intent-chips
          [recipientName]="recipientDisplayName"
          [chips]="stateService.intentChips"
          [disabled]="stateService.loading()"
          (intentSelected)="onIntentSelect($event)"
        />
      }

      <!-- Messages Area -->
      <lib-ai-chat-messages
        [messages]="stateService.messages()"
        [loading]="stateService.loading()"
        [editableSubject]="stateService.editableSubject()"
        [editableBody]="stateService.editableBody()"
        (subjectChange)="stateService.setEditableSubject($event)"
        (bodyChange)="stateService.setEditableBody($event)"
        (confirmEmail)="onConfirmEmail($event)"
        (declineEmail)="onDeclineEmail()"
      />

      <!-- Input Area -->
      @if (stateService.hasMessages()) {
        <lib-ai-panel-input
          [value]="stateService.inputMessage()"
          [canSend]="stateService.canSend()"
          [disabled]="stateService.loading()"
          (valueChange)="stateService.setInputMessage($event)"
          (send)="sendMessage()"
        />
      }

      <!-- Footer Actions -->
      <lib-ai-panel-footer
        [disabled]="stateService.loading()"
        (openFullChat)="onOpenFullChat()"
      />
    </div>
  `,
  styles: [
    `
      .ai-email-panel {
        display: flex;
        flex-direction: column;
        background: var(--surface-ground);
        border-radius: 8px;
        border: 1px solid var(--surface-border);
        max-height: 500px;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiEmailPanelComponent implements OnInit {
  protected stateService = inject(AiEmailPanelStateService);

  // Inputs
  contact = input.required<AgentInvocationContext['contact']>();
  relatedEntity = input<AgentInvocationContext['relatedEntity']>();
  userId = input.required<string>();
  /** Workflow to use - defaults to 'email-manager' for contact card invocation */
  workflow = input<AgentWorkflow>('email-manager');
  /** The user's own team name, used as the "from" in display messages */
  sourceTeamName = input<string>();

  // Outputs
  emailSent = output<void>();
  openFullChat = output<{
    context: AgentInvocationContext;
    messages: DisplayMessage[];
  }>();
  cancel = output<void>();

  /**
   * Display name for the recipient.
   */
  get recipientDisplayName(): string {
    const c = this.contact();
    return c.team || c.name;
  }

  ngOnInit(): void {
    // Initialize the state service with configuration
    this.stateService.initialize({
      userId: this.userId(),
      contact: this.contact(),
      relatedEntity: this.relatedEntity(),
      workflow: this.workflow(),
      sourceTeamName: this.sourceTeamName(),
    });
  }

  /**
   * Handle quick intent chip selection.
   */
  onIntentSelect(intent: EmailIntent): void {
    this.stateService.selectIntent(intent).subscribe();
  }

  /**
   * Send the current input message.
   */
  sendMessage(): void {
    this.stateService.sendCurrentMessage()?.subscribe();
  }

  /**
   * Confirm and send the email.
   */
  onConfirmEmail(pendingAction: PendingAction): void {
    this.stateService.confirmEmail(pendingAction).subscribe({
      next: (success) => {
        if (success) {
          this.emailSent.emit();
        }
      },
    });
  }

  /**
   * Decline the email draft.
   */
  onDeclineEmail(): void {
    this.stateService.declineEmail().subscribe();
  }

  /**
   * Navigate to full chat with preserved context.
   */
  onOpenFullChat(): void {
    const fullChatContext = this.stateService.buildFullChatContext();
    this.openFullChat.emit(fullChatContext);
  }

  /**
   * Get current messages for external access.
   */
  getMessages(): DisplayMessage[] {
    return this.stateService.messages();
  }
}
