import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [AvatarModule, ButtonModule, TooltipModule],
  template: `
    <div class="chat-header">
      <div class="chat-header__content">
        @if (showBackButton()) {
          <p-button
            icon="pi pi-arrow-left"
            [text]="true"
            [rounded]="true"
            styleClass="chat-header__back-btn"
            (click)="backClick.emit()"
            pTooltip="Go back"
            tooltipPosition="bottom"
          />
        }
        <p-avatar
          icon="bi bi-robot"
          size="large"
          shape="circle"
          styleClass="chat-header__avatar"
        />
        <div class="chat-header__text">
          <h1>RinkLinkGPT</h1>
          <p>Your AI scheduling assistant</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .chat-header {
        background: white;
        padding: 1rem 1.5rem;
        color: var(--primary-500);

        &__content {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        &__back-btn {
          color: var(--primary-500) !important;

          &:hover {
            background: var(--surface-100) !important;
          }
        }

        &__text {
          h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
          }

          p {
            margin: 0;
            color: var(--secondary-300, #f59a77);
            font-size: 0.875rem;
          }
        }

        &__avatar {
          background: var(--secondary-500, #f0622b) !important;
          color: white !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatHeaderComponent {
  showBackButton = input(false);
  backClick = output<void>();
}
