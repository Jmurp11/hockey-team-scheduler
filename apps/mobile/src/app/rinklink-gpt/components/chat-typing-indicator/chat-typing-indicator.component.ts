import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonAvatar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-chat-typing-indicator',
  standalone: true,
  imports: [IonAvatar],
  template: `
    <div class="typing-indicator">
      <div class="typing-indicator__avatar">
        <ion-avatar>
          <i class="bi bi-robot"></i>
        </ion-avatar>
      </div>
      <div class="typing-indicator__content">
        <div class="typing-indicator__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .typing-indicator {
      display: flex;
      gap: 0.75rem;
      align-self: flex-start;

      &__avatar {
        flex-shrink: 0;

        ion-avatar {
          width: 36px;
          height: 36px;
          background: var(--ion-color-secondary-tint, #fbd3c3);
          display: flex;
          align-items: center;
          justify-content: center;

          i {
            color: var(--ion-color-secondary-shade, #d4460f);
            font-size: 1rem;
          }
        }
      }

      &__content {
        background: var(--ion-color-light);
        border: 1px solid var(--ion-color-light-shade);
        border-radius: 18px 18px 18px 4px;
        padding: 0.875rem 1rem;
      }

      &__dots {
        display: flex;
        gap: 4px;
        padding: 0.25rem 0;

        span {
          width: 8px;
          height: 8px;
          background: var(--ion-color-secondary, #f0622b);
          border-radius: 50%;
          animation: typing 1.4s ease-in-out infinite;

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }

    @keyframes typing {
      0%, 60%, 100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-8px);
        opacity: 1;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatTypingIndicatorComponent {}
