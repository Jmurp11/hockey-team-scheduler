import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  AuthService,
  ScheduleRiskService,
} from '@hockey-team-scheduler/shared-data-access';
import { GameMatchingModalService } from '../../../game-matching/game-matching-modal.service';
import {
  ScheduleRiskSeverity,
  getRiskCountLabel,
  getRiskEventIonIcon,
  getRiskSeverityIonIcon,
  getRiskTypeLabel,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  closeCircleOutline,
  closeOutline,
  informationCircleOutline,
  notificationsOutline,
  trophyOutline,
  warningOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-toolbar-actions',
  standalone: true,
  imports: [
    CommonModule,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
  template: `
    @if (authService.currentUser()?.team_id) {
      <div class="toolbar-actions">
        <ion-button color="secondary" fill="clear" size="small" (click)="openGameMatching()">
          <i class="bi bi-robot" style="font-size: 1.25rem; color: var(--ion-color-secondary);"></i>
        </ion-button>

        <ion-button color="secondary" fill="clear" size="small" (click)="onBellClick()">
          <ion-icon color="secondary" slot="icon-only" name="notifications-outline"></ion-icon>
          @if (riskService.hasRisks()) {
            <span
              class="risk-count-badge"
              [class.has-errors]="riskService.hasErrors()"
            >
              {{ riskService.totalRisks() }}
            </span>
          }
        </ion-button>
      </div>
    }

    <ion-modal
      [isOpen]="showRiskModal()"
      (didDismiss)="showRiskModal.set(false)"
      [breakpoints]="[0, 0.5, 0.75, 1]"
      [initialBreakpoint]="0.75"
    >
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Schedule Risks</ion-title>
            <ion-buttons slot="end">
              <ion-button color="secondary" (click)="showRiskModal.set(false)">
                <ion-icon color="secondary" name="close-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          @if (riskService.hasRisks()) {
            <div class="risk-list">
              @for (risk of riskService.risks(); track risk.id) {
                <div class="risk-item" [class]="'severity-' + risk.severity">
                  <div class="risk-header">
                    <ion-icon color="secondary" [name]="getIconName(risk.severity)" />
                    <span class="risk-type">{{ getRiskTypeLabel(risk.riskType) }}</span>
                  </div>
                  <p class="risk-explanation">{{ risk.explanation }}</p>
                  <div class="affected-events">
                    @for (event of risk.affectedEvents; track event.id) {
                      <div class="event-chip">
                        <ion-icon color="secondary" [name]="getEventIconName(event.type)" />
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
          } @else {
            <div class="empty-state">
              <ion-icon color="secondary" name="notifications-outline" />
              <p>No schedule risks detected</p>
            </div>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .toolbar-actions {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .toolbar-actions ion-button {
      position: relative;
    }

    .risk-count-badge {
      position: absolute;
      top: 2px;
      right: 0;
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      font-size: 0.625rem;
      font-weight: 700;
      line-height: 16px;
      text-align: center;
      background-color: #eab308;
      color: #fff;
      pointer-events: none;
    }

    .risk-count-badge.has-errors {
      background-color: #ef4444;
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

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem;
      text-align: center;
      color: var(--ion-color-medium);
    }

    .empty-state ion-icon {
      font-size: 2rem;
    }

    .empty-state p {
      margin: 0;
      font-size: 0.875rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarActionsComponent {
  riskService = inject(ScheduleRiskService);
  authService = inject(AuthService);
  private gameMatchingModalService = inject(GameMatchingModalService);

  showRiskModal = signal(false);

  getRiskCountLabel = getRiskCountLabel;
  getRiskTypeLabel = getRiskTypeLabel;

  constructor() {
    addIcons({
      notificationsOutline,
      warningOutline,
      closeOutline,
      closeCircleOutline,
      informationCircleOutline,
      calendarOutline,
      trophyOutline,
    });
  }

  openGameMatching(): void {
    this.gameMatchingModalService.open();
  }

  onBellClick(): void {
    this.showRiskModal.set(true);
  }

  getIconName(severity: ScheduleRiskSeverity): string {
    return getRiskSeverityIonIcon(severity);
  }

  getEventIconName(eventType: 'game' | 'tournament'): string {
    return getRiskEventIonIcon(eventType);
  }
}
