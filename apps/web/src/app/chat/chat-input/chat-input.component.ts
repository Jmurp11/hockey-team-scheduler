import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  ],
  template: `
    <div class="form-field">
      <p-inputgroup>
        <input type="text" pInputText placeholder="Type a message..." />
        <p-inputgroup-addon>
          <p-button icon="pi pi-send" />
        </p-inputgroup-addon>
      </p-inputgroup>
    </div>
  `,
  styleUrls: ['./chat-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputComponent {}
