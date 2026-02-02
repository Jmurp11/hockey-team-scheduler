import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { openOutline } from 'ionicons/icons';

/**
 * Mobile footer component for the AI Email Panel.
 * Contains the "Open Full Chat" button using Ionic components.
 */
@Component({
  selector: 'app-ai-panel-footer',
  standalone: true,
  imports: [IonButton, IonIcon],
  template: `
    <div class="ai-panel-footer">
      <ion-button
        color="secondary"
        fill="clear"
        size="small"
        (click)="openFullChat.emit()"
        [disabled]="disabled()"
      >
        <ion-icon slot="start" name="open-outline"></ion-icon>
        Open Full Chat
      </ion-button>
    </div>
  `,
  styles: [
    `
      .ai-panel-footer {
        display: flex;
        justify-content: center;
        border-top: 1px solid var(--ion-color-light-shade);
        padding: 8px;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanelFooterComponent {
  /** Whether the button is disabled */
  disabled = input(false);

  /** Emitted when user clicks "Open Full Chat" */
  openFullChat = output<void>();

  constructor() {
    addIcons({ openOutline });
  }
}
