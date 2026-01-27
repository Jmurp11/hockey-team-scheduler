import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonButton, IonIcon, IonTextarea } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';

import { handleChatInputEnterKey } from '@hockey-team-scheduler/shared-utilities';

/**
 * Mobile input component for the AI Email Panel.
 * Contains the text input and send button using Ionic components.
 */
@Component({
  selector: 'app-ai-panel-input',
  standalone: true,
  imports: [FormsModule, IonButton, IonIcon, IonTextarea],
  template: `
    <div class="ai-panel-input">
      <ion-textarea
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit($event ?? '')"
        placeholder="Type your message..."
        [autoGrow]="true"
        [rows]="1"
        [disabled]="disabled()"
        (keydown.enter)="onEnterKey($event)"
      ></ion-textarea>
      <ion-button fill="clear" (click)="send.emit()" [disabled]="!canSend()">
        <ion-icon slot="icon-only" name="send-outline"></ion-icon>
      </ion-button>
    </div>
  `,
  styles: [
    `
      .ai-panel-input {
        display: flex;
        gap: 8px;
        align-items: flex-end;
        padding: 8px;
        background: var(--ion-color-light);
        border-radius: 20px;
        margin: 12px;

        ion-textarea {
          flex: 1;
          --padding-start: 12px;
          --padding-end: 12px;
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

  constructor() {
    addIcons({ sendOutline });
  }

  /**
   * Handle enter key press.
   */
  onEnterKey(event: Event): void {
    if (handleChatInputEnterKey(event as KeyboardEvent, this.canSend())) {
      this.send.emit();
    }
  }
}
