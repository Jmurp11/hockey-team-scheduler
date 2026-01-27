import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { WELCOME_FEATURES, CHAT_SUGGESTIONS } from '../../rinklink-gpt.types';

@Component({
  selector: 'app-chat-welcome',
  standalone: true,
  template: `
    <div class="chat-welcome">
      <h2>Welcome to RinkLinkGPT!</h2>
      <p>I can help you with:</p>
      <ul>
        @for (feature of features; track feature.text) {
          <li>
            <i [class]="feature.icon"></i>
            {{ feature.text }}
          </li>
        }
      </ul>
      <div class="chat-welcome__suggestions">
        <p>Try asking:</p>
        <div class="chat-welcome__chips">
          @for (suggestion of suggestions; track suggestion) {
            <button
              class="chat-welcome__chip"
              (click)="suggestionClick.emit(suggestion)"
              [disabled]="disabled()"
            >
              {{ suggestion }}
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-welcome {
      text-align: center;
      padding: 2rem;
      color: var(--text-color);

      h2 {
        margin: 0 0 1rem;
        color: var(--primary-500, #0c4066);
      }

      p {
        margin: 0 0 1rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0 0 2rem;
        text-align: left;
        max-width: 300px;
        margin-left: auto;
        margin-right: auto;

        li {
          padding: 0.5rem 0;
          display: flex;
          align-items: center;
          gap: 0.75rem;

          i {
            color: var(--secondary-500, #f0622b);
            width: 20px;
          }
        }
      }

      &__suggestions {
        margin-top: 1.5rem;

        p {
          color: var(--text-color-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
      }

      &__chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
      }

      &__chip {
        background: var(--surface-card);
        border: 1px solid var(--surface-border);
        border-radius: 20px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        color: var(--text-color);

        &:hover:not(:disabled) {
          background: var(--secondary-500);
          color: white;
          border-color: var(--secondary-500);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatWelcomeComponent {
  disabled = input(false);
  suggestionClick = output<string>();

  features = WELCOME_FEATURES;
  suggestions = CHAT_SUGGESTIONS;
}
