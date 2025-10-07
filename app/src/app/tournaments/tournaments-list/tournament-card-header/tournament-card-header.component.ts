import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatLocation } from '../../../shared/utilities/location.utility';
import { OpponentStatItemComponent } from '../../../dashboard/opponent-list/opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-tournament-card-header',
  standalone: true,
  imports: [CommonModule, OpponentStatItemComponent],
  template: `
    <div class="tournament-card-header">
      <div class="header-main">
        <div class="tournament-info">
          <h3 class="tournament-name">{{ tournament.name }}</h3>
          <p class="location">
            {{
              formatLocation(
                tournament.city,
                tournament.state,
                tournament.country
              )
            }}
          </p>
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
  tournament: any;

  formatLocation = formatLocation;

  formatDistance(distance: string): string {
    return `${distance} mi`;
  }
}
