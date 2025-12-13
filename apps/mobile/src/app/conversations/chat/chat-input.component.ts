import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { sendOutline } from 'ionicons/icons';
import { ButtonComponent } from '../../shared/button/button.component';
import { InputComponent } from '../../shared/input/input.component';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [InputComponent, ButtonComponent, IonIcon, ReactiveFormsModule],
  template: `
    <div class="chat-input">
      <app-input
        type="text"
        placeholder="Type a message..."
        fill="outline"
        class="message-input"
        [formControl]="messageControl"
        (keyup.enter)="onSend()"
      ></app-input>
      <app-button 
        (onClick)="onSend()" 
        shape="round" 
        class="send-button" 
        color="secondary"
        [disabled]="!messageControl.valid || isSending"
      >
        <ion-icon slot="icon-only" name="send-outline"></ion-icon>
      </app-button>
    </div>
  `,
  styles: [`
    .chat-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background-color: var(--ion-color-light);
      border-top: 1px solid var(--ion-color-light-shade);
    }

    .message-input {
      flex: 1;
      --padding-start: 1rem;
      --padding-end: 1rem;
    }

    .send-button {
      --padding-start: 0.75rem;
      --padding-end: 0.75rem;
      height: 40px;
      width: 40px;
    }

    ion-icon {
      font-size: 20px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  @Input() isSending = false;
  @Output() messageSent = new EventEmitter<string>();

  messageControl = new FormControl('', [Validators.required]);

  constructor() {
    addIcons({ sendOutline });
  }

  onSend(): void {
    if (!this.messageControl.valid || this.isSending) return;

    const message = this.messageControl.value?.trim();
    if (!message) return;

    this.messageSent.emit(message);
    this.messageControl.reset();
  }
}
