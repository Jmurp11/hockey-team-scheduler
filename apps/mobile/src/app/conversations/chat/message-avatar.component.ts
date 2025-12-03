import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@Component({
  selector: 'app-message-avatar',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  template: `
    <div
      [ngClass]="
        sender === 'contact' ? 'avatar-container-contact' : 'avatar-container'
      "
    >
      <app-avatar [ngClass]="getAvatarClass(sender)">
        <div class="avatar-label">
          @if (sender === 'assistant') {
            <i class="bi bi-robot"></i>
          } @else {
            {{ getAvatarLabel(sender) }}
          }
        </div>
      </app-avatar>
    </div>
  `,
  styles: [
    `
      .avatar-container {
        margin-left: 0.05rem;
      }

      .avatar-container-contact {
        margin-right: 0.05rem;
      }

      app-avatar {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .avatar-label {
        font-size: 0.875rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }

      .avatar-user .avatar-label {
        background: var(--secondary-200);
        color: var(--primary-500);
      }

      .avatar-contact .avatar-label {
        background: var(--ion-color-light);
        color: var(--ion-color-dark);
      }

      .avatar-assistant .avatar-label {
        background: var(--tertiary-300);
        color: var(--primary-500);
      }

      .avatar-assistant .bi-robot {
        font-size: 1.25rem;
      }
    `,
  ],
})
export class MessageAvatarComponent {
  @Input()
  message!: string;
  @Input() sender!: string;

  // TODO: fix this to correct labels
  getAvatarLabel(sender: string): string {
    switch (sender) {
      case 'user':
        return 'C'; // Coach
      case 'contact':
        return 'P'; // Player/Parent
      default:
        return sender.charAt(0).toUpperCase();
    }
  }
  getInitials(name: string): string {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .substring(0, 2);
  }

  getAvatarClass(sender: string): string {
    switch (sender) {
      case 'user':
        return 'avatar-user';
      case 'contact':
        return 'avatar-contact';
      case 'assistant':
        return 'avatar-assistant';
      default:
        return '';
    }
  }
}
