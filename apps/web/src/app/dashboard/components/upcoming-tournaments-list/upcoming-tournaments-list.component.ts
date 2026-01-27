import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { sortTournamentsWithFeaturedFirst, UpcomingTournament } from '@hockey-team-scheduler/shared-utilities';

/**
 * Upcoming tournaments list component for the dashboard.
 * Displays upcoming tournaments with featured tournaments highlighted.
 * Featured tournaments are shown first and have a special badge.
 */
@Component({
  selector: 'app-upcoming-tournaments-list',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  template: `
    @if (tournaments.length > 0) {
      <div class="scroll-container">
        <div class="tournaments-list">
          @for (tournament of sortedTournaments; track tournament.id) {
            <div
              class="tournament-item"
              [class.tournament-item--featured]="tournament.featured"
            >
              <!-- Featured badge for highlighted tournaments -->
              @if (tournament.featured) {
                <div class="featured-badge">
                  <i class="pi pi-star-fill"></i>
                  <span>Featured</span>
                </div>
              }
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
        position: relative;
        gap: 0.25rem;
        padding: 0.75rem;
        border-radius: 0.5rem;
        background-color: var(--gray-50, #f9fafb);
        border: 1px solid var(--gray-200, #e5e7eb);
        flex-shrink: 0;
        transition: all 0.2s ease;

        // Featured tournament styling
        &--featured {
          background: linear-gradient(
            135deg,
            var(--p-primary-50, #eff6ff) 0%,
            white 100%
          );
          border-color: var(--p-primary-200, #bfdbfe);
          box-shadow: 0 2px 4px rgba(59, 130, 246, 0.08);

          .tournament-name {
            color: var(--p-primary-700, #1d4ed8);
          }
        }

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

      // Featured badge styling
      .featured-badge {
        position: absolute;
        top: -6px;
        right: 8px;
        @include flex(center, center, row);
        gap: 0.2rem;
        background: linear-gradient(135deg, #facc15 0%, #fb923c 100%);
        color: white;
        padding: 0.15rem 0.5rem;
        border-radius: 12px;
        font-size: 0.6rem;
        font-weight: 600;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);

        i {
          font-size: 0.5rem;
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
          color: var(--secondary-600);
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

  /**
   * Returns tournaments sorted with featured ones first.
   * Uses the shared utility function for consistent sorting across the app.
   */
  get sortedTournaments(): UpcomingTournament[] {
    return sortTournamentsWithFeaturedFirst(this.tournaments, 'startDate', 'asc');
  }
}
