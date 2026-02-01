import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import {
  TournamentFitEvaluation,
  TournamentFitLabel,
  getFitLabelPrimeIcon,
} from '@hockey-team-scheduler/shared-utilities';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Displays a tournament fit badge with a label and optional tooltip explanation.
 *
 * The badge shows one of three fit labels:
 * - "Good Fit" (green): Strong rating match, minimal schedule conflict, reasonable travel
 * - "Tight Schedule" (yellow): Rating OK but may conflict with existing games
 * - "Travel Heavy" (blue): Good fit otherwise but requires significant travel
 *
 * @example
 * ```html
 * <app-tournament-fit-badge
 *   [fit]="tournament.fit"
 *   [showExplanation]="true"
 * />
 * ```
 */
@Component({
  selector: 'app-tournament-fit-badge',
  standalone: true,
  imports: [CommonModule, TooltipModule],
  template: `
    @if (fit) {
      <div
        class="fit-badge"
        [class.good-fit]="fit.fitLabel === 'Good Fit'"
        [class.tight-schedule]="fit.fitLabel === 'Tight Schedule'"
        [class.travel-heavy]="fit.fitLabel === 'Travel Heavy'"
        [pTooltip]="showTooltip ? fit.explanation : ''"
        tooltipPosition="top"
      >
        <i [class]="getIconClass()"></i>
        <span class="label">{{ fit.fitLabel }}</span>
        @if (showScore) {
          <span class="score">({{ fit.overallScore }})</span>
        }
      </div>
      @if (showExplanation) {
        <p class="fit-explanation">{{ fit.explanation }}</p>
      }
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .fit-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
      cursor: default;
    }

    .fit-badge i {
      font-size: 0.75rem;
    }

    .fit-badge .score {
      font-weight: 400;
      opacity: 0.8;
    }

    /* Good Fit - Green */
    .fit-badge.good-fit {
      background-color: var(--green-100, #dcfce7);
      color: var(--green-700, #15803d);
      border: 1px solid var(--green-200, #bbf7d0);
    }

    /* Tight Schedule - Yellow/Amber */
    .fit-badge.tight-schedule {
      background-color: var(--yellow-100, #fef9c3);
      color: var(--yellow-800, #854d0e);
      border: 1px solid var(--yellow-200, #fef08a);
    }

    /* Travel Heavy - Blue */
    .fit-badge.travel-heavy {
      background-color: var(--blue-100, #dbeafe);
      color: var(--blue-700, #1d4ed8);
      border: 1px solid var(--blue-200, #bfdbfe);
    }

    .fit-explanation {
      margin: 0.5rem 0 0;
      font-size: 0.8125rem;
      color: var(--text-color-secondary, #6b7280);
      line-height: 1.4;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentFitBadgeComponent {
  /**
   * The tournament fit evaluation data to display.
   */
  @Input() fit: TournamentFitEvaluation | undefined;

  /**
   * Whether to show the plain-English explanation below the badge.
   * Default: false
   */
  @Input() showExplanation = false;

  /**
   * Whether to show the overall score in parentheses.
   * Default: false
   */
  @Input() showScore = false;

  /**
   * Whether to show the explanation as a tooltip on hover.
   * Default: true
   */
  @Input() showTooltip = true;

  getIconClass(): string {
    if (!this.fit) return 'pi pi-question-circle';
    return getFitLabelPrimeIcon(this.fit.fitLabel);
  }
}
