import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ScheduleRiskSeverity,
  ScheduleRiskType,
} from '@hockey-team-scheduler/shared-utilities';
import { ScheduleRiskService } from '@hockey-team-scheduler/shared-data-access';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { Popover, PopoverModule } from 'primeng/popover';

@Component({
  selector: 'app-schedule-risk-notification',
  standalone: true,
  imports: [CommonModule, BadgeModule, ButtonModule, OverlayBadgeModule, PopoverModule],
  template: `
    @if (riskService.hasRisks()) {
      <p-overlayBadge
        [value]="riskService.totalRisks().toString()"
        [severity]="riskService.hasErrors() ? 'danger' : 'warn'"
      >
        <i
          class="pi pi-bell notification-bell"
          (click)="op.toggle($event)"
        ></i>
      </p-overlayBadge>
    } @else {
      <i
        class="pi pi-bell notification-bell"
        (click)="op.toggle($event)"
      ></i>
    }

    <p-popover #op>
      @if (riskService.hasRisks()) {
        <div class="risk-popover">
          <div class="risk-popover__header">
            <span class="risk-popover__title">Schedule Risks</span>
            <span class="risk-popover__count">
              {{ riskService.totalRisks() }} issue{{ riskService.totalRisks() !== 1 ? 's' : '' }}
            </span>
          </div>
          <div class="risk-popover__list">
            @for (risk of riskService.risks(); track risk.id) {
              <div class="risk-item" [class]="'severity-' + risk.severity">
                <div class="risk-item__header">
                  <i [class]="getIconClass(risk.severity)"></i>
                  <span class="risk-item__type">{{ getRiskTypeLabel(risk.riskType) }}</span>
                </div>
                <p class="risk-item__explanation">{{ risk.explanation }}</p>
                <div class="risk-item__events">
                  @for (event of risk.affectedEvents; track event.id) {
                    <div class="event-chip">
                      <i [class]="event.type === 'game' ? 'pi pi-calendar' : 'pi pi-trophy'"></i>
                      <span>{{ event.displayName }} - {{ event.date }} {{ event.time }}</span>
                    </div>
                  }
                </div>
                <p class="risk-item__suggestion">
                  <strong>Suggestion:</strong> {{ risk.suggestion }}
                </p>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="risk-popover risk-popover--empty">
          <i class="pi pi-check-circle risk-popover__empty-icon"></i>
          <span>No schedule risks detected</span>
        </div>
      }
    </p-popover>
  `,
  styles: [
    `
      :host {
        display: flex;
        align-items: center;
      }

      .notification-bell {
        font-size: 1.25rem;
        cursor: pointer;
        color: var(--secondary-500);
        transition: color 0.2s;
      }

      .notification-bell:hover {
        color: var(--secondary-700);
      }

      .risk-popover {
        width: 380px;
        max-width: 90vw;
        font-family: 'Space Grotesk', 'Noto Sans', sans-serif;
      }

      .risk-popover--empty {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0;
        color: var(--p-text-muted-color);
        font-size: 0.875rem;
      }

      .risk-popover__empty-icon {
        color: var(--green-500, #22c55e);
      }

      .risk-popover__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--p-surface-200);
        margin-bottom: 0.75rem;
      }

      .risk-popover__title {
        font-weight: 600;
        font-size: 0.9375rem;
      }

      .risk-popover__count {
        font-size: 0.75rem;
        color: var(--p-text-muted-color);
      }

      .risk-popover__list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        max-height: 400px;
        overflow-y: auto;
      }

      .risk-item {
        padding: 0.75rem;
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

      .risk-item__header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
        font-weight: 600;
        font-size: 0.8125rem;
      }

      .risk-item__type {
        font-size: 0.8125rem;
      }

      .risk-item__explanation {
        margin: 0.375rem 0;
        line-height: 1.4;
        font-size: 0.8125rem;
      }

      .risk-item__events {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin: 0.5rem 0;
      }

      .event-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.2rem 0.4rem;
        background-color: var(--p-surface-100, #f3f4f6);
        border-radius: 0.25rem;
        font-size: 0.6875rem;
      }

      .event-chip i {
        font-size: 0.6875rem;
        opacity: 0.7;
      }

      .risk-item__suggestion {
        margin: 0.375rem 0 0;
        font-size: 0.75rem;
        color: var(--p-text-muted-color, #6b7280);
        line-height: 1.4;
      }

      .risk-item__suggestion strong {
        color: var(--p-text-color, #374151);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleRiskNotificationComponent {
  riskService = inject(ScheduleRiskService);

  getIconClass(severity: ScheduleRiskSeverity): string {
    const iconMap: Record<ScheduleRiskSeverity, string> = {
      error: 'pi pi-times-circle',
      warning: 'pi pi-exclamation-triangle',
      info: 'pi pi-info-circle',
    };
    return iconMap[severity] || 'pi pi-info-circle';
  }

  getRiskTypeLabel(riskType: ScheduleRiskType): string {
    const labels: Record<ScheduleRiskType, string> = {
      HARD_TIME_CONFLICT: 'Time Conflict',
      CLOSE_START_WARNING: 'Back-to-Back Games',
      SAME_DAY_TRAVEL_RISK: 'Travel Risk',
    };
    return labels[riskType] || riskType;
  }
}
