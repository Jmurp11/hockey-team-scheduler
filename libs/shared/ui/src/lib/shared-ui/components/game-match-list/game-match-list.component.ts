import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

import { PendingAction } from '@hockey-team-scheduler/shared-data-access';
import { GameMatchResults } from '@hockey-team-scheduler/shared-utilities';
import { OpponentMatchCardComponent } from '../opponent-match-card/opponent-match-card.component';

/**
 * Displays a list of ranked opponent matches with email drafts.
 * Used by the RinkLinkGPT chat interface when the find_game_matches tool returns results.
 */
@Component({
  selector: 'lib-game-match-list',
  standalone: true,
  imports: [CommonModule, TagModule, OpponentMatchCardComponent],
  template: `
    <div class="game-match-list">
      <div class="game-match-list__header">
        <div class="game-match-list__title">
          <i class="pi pi-users"></i>
          <span>Opponent Matches</span>
        </div>
        <div class="game-match-list__meta">
          <p-tag
            [value]="results().matches.length + ' matches found'"
            severity="info"
          />
        </div>
      </div>

      <div class="game-match-list__context">
        <div class="game-match-list__team">
          <span class="game-match-list__label">Your Team:</span>
          <span class="game-match-list__value">
            {{ results().userTeam.name }} (Rating: {{ results().userTeam.rating }})
          </span>
        </div>
        <div class="game-match-list__date-range">
          <span class="game-match-list__label">Date Range:</span>
          <span class="game-match-list__value">
            {{ results().dateRange.start }} to {{ results().dateRange.end }}
          </span>
        </div>
        <div class="game-match-list__radius">
          <span class="game-match-list__label">Search Radius:</span>
          <span class="game-match-list__value">
            {{ results().searchRadius }} miles
          </span>
        </div>
      </div>

      <div class="game-match-list__matches">
        @for (match of results().matches; track match.team.id) {
          <lib-opponent-match-card
            [match]="match"
            [disabled]="disabled()"
            [searching]="searchingTeamId() === match.team.id"
            (sendEmail)="handleSendEmail($event)"
            (findContact)="findContact.emit($event)"
          />
        }
      </div>

      <div class="game-match-list__footer">
        <i class="pi pi-info-circle"></i>
        <span>
          Click on a team to expand and review the email draft.
          Emails are sent individually after your review.
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .game-match-list {
        background: var(--surface-ground);
        border: 1px solid var(--surface-border);
        border-radius: 8px;
        overflow: hidden;
        margin-top: 1rem;

        &__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          background: var(--primary-500);
          color: white;
        }

        &__title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
          font-size: 0.9375rem;

          i {
            font-size: 1rem;
          }
        }

        &__context {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem 2rem;
          padding: 0.75rem 1rem;
          background: var(--surface-card);
          border-bottom: 1px solid var(--surface-border);
          font-size: 0.8125rem;
        }

        &__team,
        &__date-range,
        &__radius {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }

        &__label {
          color: var(--text-color-secondary);
        }

        &__value {
          font-weight: 500;
          color: var(--text-color);
        }

        &__matches {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          padding: 1rem;
        }

        &__footer {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: var(--surface-50);
          border-top: 1px solid var(--surface-border);
          font-size: 0.75rem;
          color: var(--text-color-secondary);

          i {
            color: var(--primary-400);
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameMatchListComponent {
  /** The game match results to display */
  results = input.required<GameMatchResults>();

  /** Whether the component is disabled */
  disabled = input(false);

  /** Team ID currently being searched for contact info */
  searchingTeamId = input<number | null>(null);

  /** Emitted when user sends an email */
  sendEmail = output<PendingAction>();

  /** Emitted when user clicks "Find Contact" on a match card */
  findContact = output<{ teamId: number; team: string; location: string }>();

  /** Handle send email from a match card */
  handleSendEmail(action: PendingAction): void {
    this.sendEmail.emit(action);
  }
}
