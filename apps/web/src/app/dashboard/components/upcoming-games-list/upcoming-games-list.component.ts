import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UpcomingGame } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-upcoming-games-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    @if (games.length > 0) {
      <div class="scroll-container">
        <div class="games-list">
          @for (game of games; track game.id) {
            <div class="game-item" [ngClass]="{ 'home-game': game.isHome }">
              <div class="game-date">
                {{ game.date | date : 'EEE, MMM d' }}
                <span class="game-time">{{ formatTime(game.time) }}</span>
              </div>
              <div class="game-details">
                <span class="opponent">
                  {{ game.isHome ? 'vs' : '@' }} {{ game.opponent }}
                  @if (game.opponentRating) {
                    <span class="opponent-rating"
                      >({{ game.opponentRating | number : '1.1-1' }})</span
                    >
                  }
                </span>
                <span class="location">{{ game.rink }}</span>
                <span class="city">{{ game.city }}, {{ game.state }}</span>
              </div>
              <div class="game-type">{{ game.gameType }}</div>
            </div>
          }
        </div>
      </div>
      <a routerLink="/app/schedule" class="view-all-link"
        >View Full Schedule →</a
      >
    } @else {
      <div class="empty-state">
        <p>No upcoming games scheduled</p>
        <a routerLink="/app/schedule" class="action-link">Add a Game</a>
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

      .games-list {
        @include flex(flex-start, stretch, column);
        gap: 0.75rem;
        width: 100%;
        padding-bottom: 0.5rem;
      }

      .game-item {
        @include flex(flex-start, flex-start, row);
        gap: 1rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: var(--gray-50, #f9fafb);
        border: 1px solid var(--gray-200, #e5e7eb);
        transition: background-color 0.2s ease;
        flex-shrink: 0;

        &.home-game {
          background-color: var(--secondary-200);
          border-color: var(--secondary-300);
        }
      }

      .game-date {
        @include flex(flex-start, flex-start, column);
        min-width: 80px;
        font-weight: 600;
        color: var(--primary-700);
        font-size: 0.875rem;

        .game-time {
          font-weight: 400;
          color: var(--gray-500, #6b7280);
          font-size: 0.75rem;
        }
      }

      .game-details {
        @include flex(flex-start, flex-start, column);
        flex: 1;
        gap: 0.125rem;

        .opponent {
          font-weight: 600;
          color: var(--gray-800, #1f2937);
          font-size: 0.9375rem;

          .opponent-rating {
            font-weight: 400;
            color: var(--gray-500, #6b7280);
            font-size: 0.8125rem;
          }
        }

        .location {
          color: var(--gray-600, #4b5563);
          font-size: 0.8125rem;
        }

        .city {
          color: var(--gray-500, #6b7280);
          font-size: 0.75rem;
        }
      }

      .game-type {
        font-size: 0.75rem;
        color: var(--gray-500, #6b7280);
        padding: 0.125rem 0.5rem;
        background-color: var(--gray-200, #e5e7eb);
        border-radius: 0.25rem;
        white-space: nowrap;
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
export class UpcomingGamesListComponent {
  @Input({ required: true }) games!: UpcomingGame[];

  formatTime(time: string): string {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  }
}
