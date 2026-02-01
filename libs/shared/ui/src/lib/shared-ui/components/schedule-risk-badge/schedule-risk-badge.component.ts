import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import {
  ScheduleRisk,
  ScheduleRiskEvaluation,
  ScheduleRiskSeverity,
  ScheduleRiskType,
  getRiskCountLabel,
  getRiskSeverityPrimeIcon,
  getRiskTypeLabel,
} from '@hockey-team-scheduler/shared-utilities';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

/**
 * Displays a schedule risk badge with count and optional risk list dialog.
 *
 * The badge shows the number of detected schedule risks:
 * - Red badge when there are time conflicts (errors)
 * - Yellow badge when there are warnings only
 *
 * Clicking the badge opens a dialog showing all detected risks with
 * explanations and suggestions.
 *
 * @example
 * ```html
 * <app-schedule-risk-badge
 *   [evaluation]="scheduleRiskService.evaluation()"
 * />
 * ```
 */
@Component({
  selector: 'app-schedule-risk-badge',
  standalone: true,
  imports: [CommonModule, ButtonModule, DialogModule, TooltipModule],
  template: `
    @if (evaluation && evaluation.totalRisks > 0) {
      <button
        type="button"
        class="risk-badge-button"
        [class.has-errors]="evaluation.countBySeverity.error > 0"
        [class.has-warnings]="evaluation.countBySeverity.error === 0 && evaluation.countBySeverity.warning > 0"
        (click)="showDialog = true"
        pTooltip="Click to view schedule risks"
        tooltipPosition="bottom"
      >
        <i class="pi pi-exclamation-triangle"></i>
        <span class="badge-text">
          {{ getRiskCountLabel(evaluation.totalRisks) }}
        </span>
      </button>

      <p-dialog
        [(visible)]="showDialog"
        [modal]="true"
        [closable]="true"
        [draggable]="false"
        header="Schedule Risks"
        [style]="{ width: '500px', maxWidth: '95vw' }"
      >
        <div class="risk-list">
          @for (risk of evaluation.risks; track risk.id) {
            <div class="risk-item" [class]="'severity-' + risk.severity">
              <div class="risk-header">
                <i [class]="getIconClass(risk.severity)"></i>
                <span class="risk-type">{{ getRiskTypeLabel(risk.riskType) }}</span>
              </div>
              <p class="risk-explanation">{{ risk.explanation }}</p>
              <div class="affected-events">
                @for (event of risk.affectedEvents; track event.id) {
                  <div class="event-chip">
                    <i [class]="event.type === 'game' ? 'pi pi-calendar' : 'pi pi-trophy'"></i>
                    <span>{{ event.displayName }} - {{ event.date }} {{ event.time }}</span>
                  </div>
                }
              </div>
              <p class="risk-suggestion">
                <strong>Suggestion:</strong> {{ risk.suggestion }}
              </p>
            </div>
          }
        </div>

        <ng-template pTemplate="footer">
          <p-button
            label="Close"
            (click)="showDialog = false"
            [text]="true"
          />
        </ng-template>
      </p-dialog>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      .risk-badge-button {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.375rem 0.75rem;
        border: none;
        border-radius: 1rem;
        font-size: 0.8125rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background-color 0.2s,
          transform 0.1s;
        background-color: var(--yellow-100, #fef9c3);
        color: var(--yellow-800, #854d0e);
        border: 1px solid var(--yellow-200, #fef08a);
      }

      .risk-badge-button:hover {
        transform: scale(1.02);
      }

      .risk-badge-button:focus {
        outline: 2px solid var(--p-primary-500);
        outline-offset: 2px;
      }

      .risk-badge-button.has-errors {
        background-color: var(--red-100, #fee2e2);
        color: var(--red-700, #b91c1c);
        border-color: var(--red-200, #fecaca);
      }

      .risk-badge-button.has-warnings {
        background-color: var(--yellow-100, #fef9c3);
        color: var(--yellow-800, #854d0e);
        border-color: var(--yellow-200, #fef08a);
      }

      .badge-text {
        white-space: nowrap;
      }

      .risk-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-height: 60vh;
        overflow-y: auto;
      }

      .risk-item {
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid;
      }

      .risk-item.severity-error {
        background-color: var(--red-50, #fef2f2);
        border-left-color: var(--red-500, #ef4444);
      }

      .risk-item.severity-warning {
        background-color: var(--yellow-50, #fefce8);
        border-left-color: var(--yellow-500, #eab308);
      }

      .risk-item.severity-info {
        background-color: var(--blue-50, #eff6ff);
        border-left-color: var(--blue-500, #3b82f6);
      }

      .risk-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }

      .risk-type {
        font-size: 0.875rem;
      }

      .risk-explanation {
        margin: 0.5rem 0;
        line-height: 1.5;
        font-size: 0.875rem;
      }

      .affected-events {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin: 0.75rem 0;
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.25rem 0.5rem;
        background-color: var(--surface-100, #f3f4f6);
        border-radius: 0.25rem;
        font-size: 0.75rem;
      }

      .event-chip i {
        font-size: 0.75rem;
        opacity: 0.7;
      }

      .risk-suggestion {
        margin: 0.5rem 0 0;
        font-size: 0.8125rem;
        color: var(--text-color-secondary, #6b7280);
        line-height: 1.4;
      }

      .risk-suggestion strong {
        color: var(--text-color, #374151);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleRiskBadgeComponent {
  /**
   * The schedule risk evaluation data to display.
   */
  @Input() evaluation: ScheduleRiskEvaluation | null = null;

  /** Controls visibility of the risk details dialog */
  showDialog = false;

  getRiskCountLabel = getRiskCountLabel;
  getRiskTypeLabel = getRiskTypeLabel;

  getIconClass(severity: ScheduleRiskSeverity): string {
    return getRiskSeverityPrimeIcon(severity);
  }
}
