import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';

import { handleChatInputEnterKey } from '@hockey-team-scheduler/shared-utilities';

/**
 * Input component for the AI Email Panel.
 * Contains the text input and send button.
 */
@Component({
  selector: 'lib-ai-panel-input',
  standalone: true,
  imports: [FormsModule, ButtonModule, Textarea, TooltipModule],
  template: `
    <div class="ai-panel-input">
      <textarea
        pInputTextarea
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event)"
        placeholder="Type your message..."
        [rows]="1"
        [autoResize]="true"
        class="ai-panel-input__textarea"
        (keydown.enter)="onEnterKey($event)"
        [disabled]="disabled()"
      ></textarea>
      <button
        pButton
        icon="pi pi-send"
        class="p-button-rounded ai-panel-input__send-btn"
        (click)="send.emit()"
        [disabled]="!canSend()"
        pTooltip="Send message"
        tooltipPosition="top"
      ></button>
    </div>
  `,
  styles: [
    `
      .ai-panel-input {
        display: flex;
        gap: 0.5rem;
        align-items: flex-end;
        padding: 0.75rem 1rem;
        background: var(--surface-card);
        border-top: 1px solid var(--surface-border);

        &__textarea {
          flex: 1;
          resize: none !important;
          min-height: 36px;
          max-height: 80px;
          border-radius: 18px !important;
          padding: 0.5rem 0.875rem !important;
          font-size: 0.875rem !important;
        }

        &__send-btn {
          flex-shrink: 0;
          width: 36px !important;
          height: 36px !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanelInputComponent {
  /** Current input value */
  value = input('');

  /** Whether the input can be sent */
  canSend = input(false);

  /** Whether the input is disabled */
  disabled = input(false);

  /** Emitted when value changes */
  valueChange = output<string>();

  /** Emitted when user wants to send message */
  send = output<void>();

  /**
   * Handle enter key press.
   */
  onEnterKey(event: Event): void {
    if (handleChatInputEnterKey(event as KeyboardEvent, this.canSend())) {
      this.send.emit();
    }
  }
}
