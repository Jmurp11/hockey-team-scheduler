import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import {
  TournamentFitEvaluation,
  TournamentFitLabel,
  getFitLabelColor,
  getFitLabelIonIcon,
} from '@hockey-team-scheduler/shared-utilities';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  carOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  timeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-tournament-fit-badge',
  standalone: true,
  imports: [CommonModule, IonIcon],
  template: `
    @if (fit) {
      <div
        class="fit-badge"
        [class.good-fit]="fit.fitLabel === 'Good Fit'"
        [class.tight-schedule]="fit.fitLabel === 'Tight Schedule'"
        [class.travel-heavy]="fit.fitLabel === 'Travel Heavy'"
      >
        <ion-icon [name]="getIconName()"></ion-icon>
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
      gap: 0.25rem;
      padding: 0.2rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.7rem;
      font-weight: 600;
      line-height: 1;
      white-space: nowrap;
    }

    .fit-badge ion-icon {
      font-size: 0.7rem;
    }

    .fit-badge .score {
      font-weight: 400;
      opacity: 0.8;
    }

    /* Good Fit - Green */
    .fit-badge.good-fit {
      background-color: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }

    /* Tight Schedule - Yellow/Amber */
    .fit-badge.tight-schedule {
      background-color: #fef9c3;
      color: #854d0e;
      border: 1px solid #fef08a;
    }

    /* Travel Heavy - Blue */
    .fit-badge.travel-heavy {
      background-color: #dbeafe;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
    }

    .fit-explanation {
      margin: 0.375rem 0 0;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      line-height: 1.4;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentFitBadgeComponent {
  @Input() fit: TournamentFitEvaluation | undefined;
  @Input() showExplanation = false;
  @Input() showScore = false;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      timeOutline,
      carOutline,
      informationCircleOutline,
    });
  }

  getIconName(): string {
    if (!this.fit) return 'information-circle-outline';
    return getFitLabelIonIcon(this.fit.fitLabel);
  }
}
