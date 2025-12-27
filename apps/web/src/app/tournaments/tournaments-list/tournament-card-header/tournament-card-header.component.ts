import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { OpponentStatItemComponent } from '../../../opponents/opponent-list/opponent-stat-item/opponent-stat-item.component';
import { formatTournamentLocation, Tournament } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-tournament-card-header',
  standalone: true,
  imports: [CommonModule, OpponentStatItemComponent],
  template: `
    <div class="tournament-card-header">
      <div class="header-main">
        <div class="tournament-info">
          <h3 class="tournament-name">{{ tournament.name }}</h3>
          <div class="subheader">
            <div>
              <p class="location">
                {{ formatLocation(tournament.location) }}
              </p>
            </div>
            <div class="location">
              {{ tournament.startDate | date: 'MMM d, y' }} -
              {{ tournament.endDate | date: 'MMM d, y' }}
            </div>
          </div>
        </div>
        <div class="stat-info">
          <app-opponent-stat-item
            class="stat-info__distance"
            label="Distance"
            [value]="formatDistance(tournament.distance)"
          ></app-opponent-stat-item>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./tournament-card-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentCardHeaderComponent {
  @Input()
  tournament!: Tournament;

  formatLocation = formatTournamentLocation;
  formatDistance(distance: number | undefined): string {
    return distance !== undefined ? `${distance} mi` : 'N/A';
  }
}
