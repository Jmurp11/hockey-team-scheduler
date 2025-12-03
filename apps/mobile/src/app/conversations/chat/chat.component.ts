import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonContent, IonFooter } from '@ionic/angular/standalone';
import { ChatHeaderComponent } from './chat-header.component';
import { ChatInputComponent } from './chat-input.component';
import { MessagesComponent } from './messages.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    IonContent,
    IonFooter,
    ChatHeaderComponent,
    MessagesComponent,
    ChatInputComponent,
  ],
  template: `
    <app-chat-header />
    
    <ion-content class="chat-content">
      <app-messages />
    </ion-content>

    <ion-footer class="ion-no-border">
      <app-chat-input />
    </ion-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .chat-content {
        --padding-start: 0;
        --padding-end: 0;
        --padding-top: 0;
        --padding-bottom: 0;
      }

      ion-footer {
        background-color: var(--ion-color-light);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatComponent {}
