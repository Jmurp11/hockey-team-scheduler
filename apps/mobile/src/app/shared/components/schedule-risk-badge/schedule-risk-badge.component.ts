import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
} from '@angular/core';
import {
  ScheduleRiskEvaluation,
  ScheduleRiskSeverity,
  ScheduleRiskType,
  getRiskCountLabel,
  getRiskEventIonIcon,
  getRiskSeverityColor,
  getRiskSeverityIonIcon,
  getRiskTypeLabel,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  closeCircleOutline,
  closeOutline,
  informationCircleOutline,
  trophyOutline,
  warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-schedule-risk-badge',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonContent,
  ],
  template: `
    @if (evaluation && evaluation.totalRisks > 0) {
      <button
        class="risk-badge"
        [class.has-errors]="evaluation.countBySeverity.error > 0"
        [class.has-warnings]="evaluation.countBySeverity.error === 0 && evaluation.countBySeverity.warning > 0"
        (click)="showModal.set(true)"
      >
        <ion-icon name="warning-outline"></ion-icon>
        <span>{{ getRiskCountLabel(evaluation.totalRisks) }}</span>
      </button>

      <ion-modal
        [isOpen]="showModal()"
        (didDismiss)="showModal.set(false)"
        [breakpoints]="[0, 0.5, 0.75, 1]"
        [initialBreakpoint]="0.75"
      >
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Schedule Risks</ion-title>
              <ion-buttons slot="end">
                <ion-button color="secondary" (click)="showModal.set(false)">
                  <ion-icon name="close-outline" slot="icon-only"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="risk-list">
              @for (risk of evaluation.risks; track risk.id) {
                <div class="risk-item" [class]="'severity-' + risk.severity">
                  <div class="risk-header">
                    <ion-icon [name]="getIconName(risk.severity)"></ion-icon>
                    <span class="risk-type">{{ getRiskTypeLabel(risk.riskType) }}</span>
                  </div>
                  <p class="risk-explanation">{{ risk.explanation }}</p>
                  <div class="affected-events">
                    @for (event of risk.affectedEvents; track event.id) {
                      <div class="event-chip">
                        <ion-icon [name]="getEventIconName(event.type)"></ion-icon>
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
          </ion-content>
        </ng-template>
      </ion-modal>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.625rem;
      border: none;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      background-color: #fef9c3;
      color: #854d0e;
      border: 1px solid #fef08a;
    }

    .risk-badge.has-errors {
      background-color: #fee2e2;
      color: #b91c1c;
      border-color: #fecaca;
    }

    .risk-badge.has-warnings {
      background-color: #fef9c3;
      color: #854d0e;
      border-color: #fef08a;
    }

    .risk-badge ion-icon {
      font-size: 0.875rem;
    }

    ion-content {
      --overflow: auto;
      -webkit-overflow-scrolling: touch;
    }

    .risk-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding-bottom: env(safe-area-inset-bottom, 1rem);
    }

    .risk-item {
      padding: 1rem;
      border-radius: 0.5rem;
      border-left: 4px solid;
    }

    .risk-item.severity-error {
      background-color: #fef2f2;
      border-left-color: #ef4444;
    }

    .risk-item.severity-warning {
      background-color: #fefce8;
      border-left-color: #eab308;
    }

    .risk-item.severity-info {
      background-color: #eff6ff;
      border-left-color: #3b82f6;
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
      background-color: var(--ion-color-light);
      border-radius: 0.25rem;
      font-size: 0.75rem;
    }

    .event-chip ion-icon {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .risk-suggestion {
      margin: 0.5rem 0 0;
      font-size: 0.8125rem;
      color: var(--ion-color-medium);
      line-height: 1.4;
    }

    .risk-suggestion strong {
      color: var(--ion-text-color);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleRiskBadgeComponent {
  @Input() evaluation: ScheduleRiskEvaluation | null = null;

  showModal = signal(false);

  getRiskCountLabel = getRiskCountLabel;
  getRiskTypeLabel = getRiskTypeLabel;

  constructor() {
    addIcons({
      warningOutline,
      closeOutline,
      closeCircleOutline,
      informationCircleOutline,
      calendarOutline,
      trophyOutline,
    });
  }

  getIconName(severity: ScheduleRiskSeverity): string {
    return getRiskSeverityIonIcon(severity);
  }

  getEventIconName(eventType: 'game' | 'tournament'): string {
    return getRiskEventIonIcon(eventType);
  }
}
