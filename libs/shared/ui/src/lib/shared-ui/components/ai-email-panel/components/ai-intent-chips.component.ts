import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { EmailIntent } from '@hockey-team-scheduler/shared-utilities';
import { IntentChip } from '@hockey-team-scheduler/shared-data-access';

/**
 * Intent chips component for quick intent selection.
 * Shows clickable chips for common email intents.
 */
@Component({
  selector: 'lib-ai-intent-chips',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="ai-intent-chips">
      <p class="ai-intent-chips__label">
        What would you like to say to {{ recipientName() }}?
      </p>
      <div class="ai-intent-chips__container">
        @for (chip of chips(); track chip.intent) {
          <button
            pButton
            [label]="chip.label"
            [icon]="chip.webIcon"
            class="p-button-outlined p-button-sm"
            (click)="intentSelected.emit(chip.intent)"
            [disabled]="disabled()"
          ></button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ai-intent-chips {
        padding: 1rem;
        text-align: center;

        &__label {
          font-size: 0.875rem;
          color: var(--text-color-secondary);
          margin: 0 0 0.75rem;
        }

        &__container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiIntentChipsComponent {
  /** Recipient name to display in the prompt */
  recipientName = input.required<string>();

  /** Available intent chips */
  chips = input.required<IntentChip[]>();

  /** Whether the chips are disabled */
  disabled = input(false);

  /** Emitted when an intent is selected */
  intentSelected = output<EmailIntent>();
}
