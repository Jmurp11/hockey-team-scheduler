import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';

/**
 * Mobile header component for the AI Email Panel.
 * Contains the title, icon, and close button using Ionic components.
 */
@Component({
  selector: 'app-ai-panel-header',
  standalone: true,
  imports: [IonButton, IonIcon, IonCardHeader, IonCardTitle],
  template: `
    <ion-card-header class="ai-panel-header">
      <div class="ai-panel-header__content">
        <i class="bi bi-robot ai-panel-header__icon"></i>
        <ion-card-title>AI Email Assistant</ion-card-title>
      </div>
      <ion-button fill="clear" size="small" (click)="close.emit()">
        <ion-icon slot="icon-only" name="close-outline"></ion-icon>
      </ion-button>
    </ion-card-header>
  `,
  styles: [
    `
      .ai-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: var(--ion-color-light);

        &__content {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        &__icon {
          font-size: 1.5rem;
          color: var(--ion-color-secondary);
        }

        ion-card-title {
          font-size: 1rem;
          font-weight: 600;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanelHeaderComponent {
  close = output<void>();

  constructor() {
    addIcons({ closeOutline });
  }
}
