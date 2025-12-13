import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    ButtonModule,
    ReactiveFormsModule,
  ],
  template: `
    <div class="form-field">
      <p-inputgroup>
        <input 
          type="text" 
          pInputText 
          placeholder="Type a message..." 
          [formControl]="messageControl"
          (keyup.enter)="onSend()"
        />
        <p-inputgroup-addon>
          <p-button 
            icon="pi pi-send" 
            (click)="onSend()"
            [disabled]="!messageControl.valid || isSending"
          />
        </p-inputgroup-addon>
      </p-inputgroup>
    </div>
  `,
  styleUrls: ['./chat-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {
  @Input() isSending = false;
  @Output() messageSent = new EventEmitter<string>();

  messageControl = new FormControl('', [Validators.required]);

  onSend(): void {
    if (!this.messageControl.valid || this.isSending) return;

    const message = this.messageControl.value?.trim();
    if (!message) return;

    this.messageSent.emit(message);
    this.messageControl.reset();
  }
}
