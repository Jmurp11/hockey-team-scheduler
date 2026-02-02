import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Header component for the AI Email Panel.
 * Contains the title, icon, and close button.
 */
@Component({
  selector: 'lib-ai-panel-header',
  standalone: true,
  imports: [ButtonModule, TooltipModule],
  template: `
    <div class="ai-panel-header">
      <i class="bi bi-robot ai-panel-header__icon"></i>
      <span class="ai-panel-header__title">AI Email Assistant</span>
      <button
        pButton
        icon="pi pi-times"
        class="p-button-text p-button-rounded p-button-sm ai-panel-header__close-btn"
        (click)="close.emit()"
        pTooltip="Close"
        tooltipPosition="left"
      ></button>
    </div>
  `,
  styles: [
    `
      .ai-panel-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--surface-card);
        border-bottom: 1px solid var(--surface-border);

        &__icon {
          font-size: 1.25rem;
          color: var(--secondary-500, #f37e51);
        }

        &__title {
          font-weight: 600;
          font-size: 0.875rem;
          flex: 1;
        }

        &__close-btn {
          width: 2rem !important;
          height: 2rem !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanelHeaderComponent {
  close = output<void>();
}
