import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';

@Component({
  selector: 'app-chat-typing-indicator',
  standalone: true,
  imports: [AvatarModule],
  template: `
    <div class="typing-indicator">
      <div class="typing-indicator__avatar">
        <p-avatar
          icon="bi bi-robot"
          shape="circle"
          styleClass="typing-indicator__bot-avatar"
        />
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
      }

      &__content {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 18px 18px 18px 4px;
        padding: 0.875rem 1rem;
      }

      &__dots {
        display: flex;
        gap: 4px;
        padding: 0.5rem 0;

        span {
          width: 8px;
          height: 8px;
          background: var(--secondary-400, #f37e51);
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

      &__bot-avatar {
        background: var(--secondary-100, #fbd3c3) !important;
        color: var(--secondary-600, #d4460f) !important;
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
