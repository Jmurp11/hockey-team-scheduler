import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonIcon, IonChip, IonLabel, IonList, IonItem } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  peopleOutline,
  trophyOutline,
  addCircleOutline,
  mailOutline,
  locationOutline,
} from 'ionicons/icons';
import { WELCOME_FEATURES, CHAT_SUGGESTIONS } from '../../rinklink-gpt.types';

@Component({
  selector: 'app-chat-welcome',
  standalone: true,
  imports: [IonIcon, IonChip, IonLabel, IonList, IonItem],
  template: `
    <div class="chat-welcome">
      <h2>Welcome to RinkLinkGPT!</h2>
      <p>I can help you with:</p>
      <ion-list lines="none" class="chat-welcome__features">
        @for (feature of features; track feature.text) {
          <ion-item class="chat-welcome__feature">
            <ion-icon [name]="feature.icon" slot="start" color="secondary"></ion-icon>
            <ion-label>{{ feature.text }}</ion-label>
          </ion-item>
        }
      </ion-list>
      <div class="chat-welcome__suggestions">
        <p>Try asking:</p>
        <div class="chat-welcome__chips">
          @for (suggestion of suggestions; track suggestion) {
            <ion-chip
              [disabled]="disabled()"
              (click)="!disabled() && suggestionClick.emit(suggestion)"
            >
              <ion-label>{{ suggestion }}</ion-label>
            </ion-chip>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-welcome {
      text-align: center;
      padding: 1.5rem 1rem;
      color: var(--ion-text-color);

      h2 {
        margin: 0 0 0.75rem;
        color: var(--ion-color-primary, #0c4066);
        font-size: 1.5rem;
      }

      p {
        margin: 0 0 0.75rem;
        color: var(--ion-color-medium);
      }

      &__features {
        background: transparent;
        max-width: 320px;
        margin: 0 auto 1.5rem;
      }

      &__feature {
        --background: transparent;
        --padding-start: 0;
        --inner-padding-end: 0;

        ion-icon {
          font-size: 1.25rem;
          margin-right: 0.75rem;
        }

        ion-label {
          font-size: 0.9rem;
        }
      }

      &__suggestions {
        margin-top: 1rem;

        p {
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
      }

      &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;

        ion-chip {
          --background: var(--ion-color-light);
          --color: var(--ion-text-color);
          font-size: 0.8rem;
          height: auto;
          padding: 0.5rem 0.75rem;

          &:hover:not([disabled]) {
            --background: var(--ion-color-primary);
            --color: white;
          }
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWelcomeComponent {
  disabled = input(false);
  suggestionClick = output<string>();

  features = WELCOME_FEATURES;
  suggestions = CHAT_SUGGESTIONS;

  constructor() {
    addIcons({
      calendarOutline,
      peopleOutline,
      trophyOutline,
      addCircleOutline,
      mailOutline,
      locationOutline,
    });
  }
}
