import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-slots',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="stat-value">{{ openGameSlots }} / {{ totalGames }}</div>
    <div class="stat-label">Open / Total</div>
    @if (openGameSlots > 0) {
      <a routerLink="/app/opponents" class="action-link">Find Opponents</a>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--primary-500);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 0.875rem;
        color: var(--gray-500, #6b7280);
      }

      .action-link {
        display: inline-block;
        margin-top: 0.75rem;
        color: var(--secondary-600);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.875rem;

        &:hover {
          text-decoration: underline;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameSlotsComponent {
  @Input({ required: true }) openGameSlots!: number;
  @Input({ required: true }) totalGames!: number;
}
