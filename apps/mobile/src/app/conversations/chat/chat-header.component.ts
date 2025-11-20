import { Location, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import {
    IonBackButton,
    IonButtons,
    IonHeader,
    IonTitle,
    IonToolbar,
} from '@ionic/angular/standalone';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [
    NgClass,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    ButtonComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button 
            defaultHref="/app/conversations"
            (click)="onBackClick()"
          ></ion-back-button>
        </ion-buttons>
        <ion-title>{{ managerName }}</ion-title>
        <ion-buttons slot="end">
          <app-button
            [ngClass]="{ 'ai-enabled': aiEnabled }"
            (onClick)="onToggleAI()"
            size="small"
          >
            <i class="bi bi-robot"></i>
            {{ handleAiEnabled() }}
          </app-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
  `,
  styles: [`
    app-button.ai-enabled {
      --background: var(--ion-color-success);
      --color: white;
    }

    .bi-robot {
      margin-right: 0.5rem;
      font-size: 1.1rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHeaderComponent {
  @Input() managerName = 'Manager Name';
  @Input() aiEnabled = true;

  private location = inject(Location);

  onBackClick() {
    this.location.back();
  }

  onToggleAI() {
    this.aiEnabled = !this.aiEnabled;
  }

  handleAiEnabled() {
    return this.aiEnabled ? 'Disable AI' : 'Enable AI';
  }
}
