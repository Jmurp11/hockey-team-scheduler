import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonFooter,
  IonToolbar,
  IonTextarea,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';
import { handleChatInputEnterKey } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [FormsModule, IonFooter, IonToolbar, IonTextarea, IonButton, IonIcon],
  template: `
    <ion-footer class="chat-input">
      <ion-toolbar>
        <div class="chat-input__wrapper">
          <ion-textarea
            [ngModel]="message()"
            (ngModelChange)="message.set($event ?? '')"
            placeholder="Ask me about your schedule, opponents, tournaments..."
            [autoGrow]="true"
            [rows]="1"
            class="chat-input__textarea"
            (keydown.enter)="onEnterKey($event)"
            [disabled]="disabled()"
          ></ion-textarea>
          <ion-button
            shape="round"
            color="secondary"
            class="chat-input__send-button"
            (click)="send.emit()"
            [disabled]="!canSend()"
          >
            <ion-icon name="send-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
        <p class="chat-input__disclaimer">
          RinkLinkGPT uses AI to help with scheduling. Always verify important details.
        </p>
      </ion-toolbar>
    </ion-footer>
  `,
  styles: [`
    .chat-input {
      ion-toolbar {
        --background: var(--ion-color-light);
        --padding-start: 1rem;
        --padding-end: 1rem;
        --padding-top: 0.75rem;
        --padding-bottom: 0.5rem;
        border-top: 1px solid var(--ion-color-light-shade);
      }

      &__wrapper {
        display: flex;
        gap: 0.75rem;
        align-items: flex-end;
      }

      &__textarea {
        flex: 1;
        --background: white;
        --border-radius: 22px;
        --padding-start: 1rem;
        --padding-end: 1rem;
        --padding-top: 0.65rem;
        --padding-bottom: 0.65rem;
        min-height: 44px;
        max-height: 120px;
        font-size: 0.9rem;
        border: 1px solid var(--ion-color-light-shade);
        border-radius: 22px;

        &:focus-within {
          border-color: var(--ion-color-primary);
        }
      }

      &__send-button {
        flex-shrink: 0;
        --border-radius: 50%;
        width: 44px;
        height: 44px;
        margin: 0;

        &:disabled {
          opacity: 0.5;
        }
      }

      &__disclaimer {
        font-size: 0.65rem;
        color: var(--ion-color-medium);
        text-align: center;
        margin: 0.5rem 0 0;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  message = model('');
  disabled = input(false);
  send = output<void>();

  constructor() {
    addIcons({ sendOutline });
  }

  canSend = computed(() => {
    return this.message().trim().length > 0 && !this.disabled();
  });

  onEnterKey(event: Event): void {
    if (handleChatInputEnterKey(event as KeyboardEvent, this.canSend())) {
      this.send.emit();
    }
  }
}
