import { Location, NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-chat-header',
  template: `
    <div class="chat-header">
      <div class="chat-header__left">
        <p-button
          icon="pi pi-arrow-left"
          [rounded]="true"
          variant="outlined"
          size="small"
          (click)="onBackClick()"
        />
      </div>
      <div class="chat-header__center">
        <div class="chat-header__title">{{ managerName }}</div>
      </div>
      <div class="chat-header__right">
        <p-button
          [label]="handleAiEnabled()"
          [ngClass]="{ 'ai-enabled': aiEnabled }"
          icon="bi bi-robot"
          size="small"
          (click)="onToggleAI()"
        />
      </div>
    </div>
  `,
  standalone: true,
  imports: [ButtonModule, NgClass],
  styleUrls: ['./chat-header.component.scss'],
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
    return this.aiEnabled ? 'Disable AI Agent' : 'Enable AI Agent';
  }
}
