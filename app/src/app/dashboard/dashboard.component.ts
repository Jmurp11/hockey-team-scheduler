import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TeamsService } from '../shared/services/teams.service';
import { OpponentListComponent } from './opponent-list/opponent-list.component';
import { OpponentsComponent } from './opponents/opponents.component';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentsComponent,
    OpponentListComponent
  ],
  template: ` <div class="container">
    <app-opponents (selectedInputs)="fetchNearbyTeams($event)" />

    @if (nearbyTeams().length > 0) {
    <div class="opponent-list">
      <app-opponent-list [opponents]="nearbyTeams()" />
    </div>
    } @else {
    <p>No nearby teams found.</p>
    }
  </div>`,
  styleUrls: ['./dashboard.component.scss'],
  providers: [TeamsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  nearbyTeams = signal<any[]>([]);

  teamsService = inject(TeamsService);
  authService = inject(AuthService);

  constructor() {}

  async fetchNearbyTeams(params: any) {
    const user = await this.authService.currentUser();
    if (!user) {
      console.error('No user is currently logged in.');
      return;
    }

    const nearbyTeamsParams = {
      p_id: user.association_id as number,
      p_girls_only: params.girlsOnly as boolean,
      p_age: user.age as string,
      p_max_rating: params.rating[1] as number,
      p_min_rating: params.rating[0] as number,
      p_max_distance: params.distance as number,
    };

    this.nearbyTeams.set(await this.teamsService.nearbyTeams(nearbyTeamsParams));

    console.log('Nearby Teams:', this.nearbyTeams());
  }
}
