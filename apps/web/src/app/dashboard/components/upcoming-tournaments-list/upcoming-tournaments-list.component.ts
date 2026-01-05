import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UpcomingTournament } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-upcoming-tournaments-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    @if (tournaments.length > 0) {
      <div class="scroll-container">
        <div class="tournaments-list">
          @for (tournament of tournaments; track tournament.id) {
            <div class="tournament-item">
              <div class="tournament-name">{{ tournament.name }}</div>
              <div class="tournament-dates">
                {{ tournament.startDate | date : 'MMM d' }}
                @if (tournament.startDate !== tournament.endDate) {
                  - {{ tournament.endDate | date : 'MMM d' }}
                }
              </div>
              <div class="tournament-location">{{ tournament.location }}</div>
              @if (tournament.rink) {
                <div class="tournament-rink">{{ tournament.rink }}</div>
              }
            </div>
          }
        </div>
      </div>
      <a routerLink="/app/tournaments" class="view-all-link"
        >Browse Tournaments →</a
      >
    } @else {
      <div class="empty-state">
        <p>No upcoming tournaments</p>
        <a routerLink="/app/tournaments" class="action-link"
          >Find Tournaments</a
        >
      </div>
    }
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      :host {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .scroll-container {
        height: calc(100% - 50px);
        overflow-y: auto;
        padding-right: 0.5rem;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-track {
          background: var(--gray-100, #f3f4f6);
          border-radius: 3px;
        }

        &::-webkit-scrollbar-thumb {
          background: var(--gray-300, #d1d5db);
          border-radius: 3px;

          &:hover {
            background: var(--gray-400, #9ca3af);
          }
        }
      }

      .tournaments-list {
        @include flex(flex-start, stretch, column);
        gap: 0.75rem;
        width: 100%;
        padding-bottom: 0.5rem;
      }

      .tournament-item {
        @include flex(flex-start, flex-start, column);
        gap: 0.25rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: var(--gray-50, #f9fafb);
        border: 1px solid var(--gray-200, #e5e7eb);
        flex-shrink: 0;

        .tournament-name {
          font-weight: 600;
          color: var(--primary-700);
          font-size: 0.9375rem;
        }

        .tournament-dates {
          color: var(--gray-600, #4b5563);
          font-size: 0.875rem;
        }

        .tournament-location {
          color: var(--gray-500, #6b7280);
          font-size: 0.8125rem;
        }

        .tournament-rink {
          color: var(--gray-400, #9ca3af);
          font-size: 0.75rem;
        }
      }

      .empty-state {
        @include flex(center, center, column);
        padding: 2rem;
        text-align: center;
        color: var(--gray-500, #6b7280);

        p {
          margin: 0 0 1rem 0;
        }

        .action-link {
          color: var(--primary-600);
          text-decoration: none;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .view-all-link {
        display: block;
        text-align: center;
        margin-top: 1rem;
        padding-top: 0.75rem;
        border-top: 1px solid var(--gray-200, #e5e7eb);
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 500;
        font-size: 0.875rem;
        flex-shrink: 0;

        &:hover {
          text-decoration: underline;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingTournamentsListComponent {
  @Input({ required: true }) tournaments!: UpcomingTournament[];
}
