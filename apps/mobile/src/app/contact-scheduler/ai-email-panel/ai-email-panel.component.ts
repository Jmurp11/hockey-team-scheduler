import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { IonCard, IonCardContent } from '@ionic/angular/standalone';

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
 * Mobile AI Email Panel component for inline AI interaction in modals.
 * Uses Ionic components for native mobile styling.
 *
 * This component acts as the orchestrating container, delegating to smaller
 * sub-components for each section of the UI.
 */
@Component({
  selector: 'app-ai-email-panel',
  standalone: true,
  imports: [
    IonCard,
    IonCardContent,
    AiPanelHeaderComponent,
    AiIntentChipsComponent,
    AiChatMessagesComponent,
    AiPanelInputComponent,
    AiPanelFooterComponent,
  ],
  providers: [AiEmailPanelStateService],
  template: `
    <ion-card class="ai-email-panel">
      <!-- Header -->
      <app-ai-panel-header (close)="cancel.emit()" />

      <ion-card-content class="ai-email-panel__content">
        <!-- Quick Intent Chips (shown when no messages) -->
        @if (!stateService.hasMessages()) {
          <app-ai-intent-chips
            [recipientName]="recipientDisplayName"
            [chips]="stateService.intentChips"
            [disabled]="stateService.loading()"
            (intentSelected)="onIntentSelect($event)"
          />
        }

        <!-- Messages Area -->
        @if (stateService.hasMessages()) {
          <app-ai-chat-messages
            [messages]="stateService.messages()"
            [loading]="stateService.loading()"
            [editableSubject]="stateService.editableSubject()"
            [editableBody]="stateService.editableBody()"
            (subjectChange)="stateService.setEditableSubject($event)"
            (bodyChange)="stateService.setEditableBody($event)"
            (confirmEmail)="onConfirmEmail($event)"
            (declineEmail)="onDeclineEmail()"
          />
        }

        <!-- Input Area -->
        @if (stateService.hasMessages()) {
          <app-ai-panel-input
            [value]="stateService.inputMessage()"
            [canSend]="stateService.canSend()"
            [disabled]="stateService.loading()"
            (valueChange)="stateService.setInputMessage($event)"
            (send)="sendMessage()"
          />
        }

        <!-- Footer Actions -->
        <app-ai-panel-footer
          [disabled]="stateService.loading()"
          (openFullChat)="onOpenFullChat()"
        />
      </ion-card-content>
    </ion-card>
  `,
  styles: [
    `
      .ai-email-panel {
        margin: 0;
        border-radius: 12px;

        &__content {
          padding: 0;
        }
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
