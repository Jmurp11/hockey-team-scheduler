import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, mailOutline } from 'ionicons/icons';

import { EmailIntent } from '@hockey-team-scheduler/shared-utilities';
import { IntentChip } from '@hockey-team-scheduler/shared-data-access';

/**
 * Mobile intent chips component for quick intent selection.
 * Uses Ionic chips for native mobile styling.
 */
@Component({
  selector: 'app-ai-intent-chips',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel],
  template: `
    <div class="ai-intent-chips">
      <p class="ai-intent-chips__label">
        What would you like to say to {{ recipientName() }}?
      </p>
      <div class="ai-intent-chips__container">
        @for (chip of chips(); track chip.intent) {
          <ion-chip
            [outline]="true"
            (click)="intentSelected.emit(chip.intent)"
            [disabled]="disabled()"
          >
            <ion-icon [name]="chip.mobileIcon"></ion-icon>
            <ion-label>{{ chip.label }}</ion-label>
          </ion-chip>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .ai-intent-chips {
        text-align: center;
        padding: 16px;

        &__label {
          font-size: 0.875rem;
          color: var(--ion-color-medium);
          margin-bottom: 12px;
        }

        &__container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
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

  constructor() {
    addIcons({ calendarOutline, mailOutline });
  }
}
