import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { formatLocation } from '@hockey-team-scheduler/shared-utilities';
import { OpponentStatItemComponent } from '../opponent-stat-item/opponent-stat-item.component';

@Component({
  selector: 'app-opponent-card-header',
  standalone: true,
  imports: [CommonModule, OpponentStatItemComponent],
  template: `
    <div class="opp-card-header">
      <div class="header-main">
        <div class="team-info">
          <h3 class="team-name">{{ opponent.team_name }}</h3>
          <p class="association-name">
            {{ opponent.name }} -
            {{
              formatLocation(opponent.city, opponent.state, opponent.country)
            }}
          </p>
        </div>
        <div class="stat-info">
          <app-opponent-stat-item
            class="stat-info__distance"
            label="Distance"
            [value]="formatDistance(opponent.distance)"
          ></app-opponent-stat-item>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./opponent-card-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCardHeaderComponent {
  @Input()
  opponent: any;

  formatLocation = formatLocation;

  formatDistance(distance: string): string {
    return `${distance} mi`;
  }
}
