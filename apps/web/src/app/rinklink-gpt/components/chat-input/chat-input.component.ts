import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { handleChatInputEnterKey } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule, ButtonModule, Textarea, TooltipModule],
  template: `
    <div class="chat-input">
      <div class="chat-input__wrapper">
        <textarea
          pInputTextarea
          [ngModel]="message()"
          (ngModelChange)="message.set($event)"
          placeholder="Ask me about your schedule, opponents, tournaments..."
          [rows]="1"
          [autoResize]="true"
          class="chat-input__textarea"
          (keydown.enter)="onEnterKey($event)"
          [disabled]="disabled()"
        ></textarea>
        <p-button
          icon="pi pi-send"
          [rounded]="true"
          styleClass="chat-input__send-button"
          (click)="send.emit()"
          [disabled]="!canSend()"
          pTooltip="Send message"
          tooltipPosition="top"
        />
      </div>
      <p class="chat-input__disclaimer">
        RinkLinkGPT uses AI to help with scheduling. Always verify important details.
      </p>
    </div>
  `,
  styles: [`
    .chat-input {
      padding: 1rem 1.5rem 1.5rem;
      background: var(--surface-card);
      border-top: 1px solid var(--surface-border);

      &__wrapper {
        display: flex;
        gap: 0.75rem;
        align-items: flex-end;
      }

      &__textarea {
        flex: 1;
        resize: none !important;
        min-height: 44px;
        max-height: 120px;
        border-radius: 22px !important;
        padding: 0.75rem 1rem !important;

        &:focus {
          box-shadow: 0 0 0 2px var(--primary-400, #10578b) !important;
          border-color: var(--primary-400, #10578b) !important;
        }
      }

      &__send-button {
        flex-shrink: 0;
        width: 44px;
        height: 44px;

        &:disabled {
          opacity: 0.5;
        }
      }

      &__disclaimer {
        font-size: 0.75rem;
        color: var(--text-color-secondary);
        text-align: center;
        margin: 0.75rem 0 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  message = model('');
  disabled = input(false);
  send = output<void>();

  canSend = computed(() => {
    return this.message().trim().length > 0 && !this.disabled();
  });

  onEnterKey(event: Event): void {
    if (handleChatInputEnterKey(event as KeyboardEvent, this.canSend())) {
      this.send.emit();
    }
  }
}
