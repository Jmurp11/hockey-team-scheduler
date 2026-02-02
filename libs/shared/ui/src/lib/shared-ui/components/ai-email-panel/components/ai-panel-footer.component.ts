import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

/**
 * Footer component for the AI Email Panel.
 * Contains the "Open Full Chat" button.
 */
@Component({
  selector: 'lib-ai-panel-footer',
  standalone: true,
  imports: [ButtonModule],
  template: `
    <div class="ai-panel-footer">
      <p-button
        label="Open Full Chat"
        icon="pi pi-external-link"
        class="p-button-text p-button-sm"
        (click)="openFullChat.emit()"
        [disabled]="disabled()"
      />
    </div>
  `,
  styles: [
    `
      .ai-panel-footer {
        display: flex;
        justify-content: center;
        padding: 0.5rem;
        background: var(--surface-card);
        border-top: 1px solid var(--surface-border);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiPanelFooterComponent {
  /** Whether the button is disabled */
  disabled = input(false);

  /** Emitted when user clicks "Open Full Chat" */
  openFullChat = output<void>();
}
