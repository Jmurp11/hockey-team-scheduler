import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
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
    OpponentListComponent,
  ],
  template: ` <div class="container">
    <app-opponents (selectedInputs)="getNearbyTeams($event)" />

    @if (nearbyTeams$ | async; as nearbyTeams) {
    <div class="opponent-list">
      <app-opponent-list [opponents]="nearbyTeams" />
    </div>
    } @else {
    <p>No nearby teams found.</p>
    }
  </div>`,
  styleUrls: ['./dashboard.component.scss'],
  providers: [TeamsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  nearbyTeams$: Observable<any>;

  teamsService = inject(TeamsService);
  authService = inject(AuthService);

  user$: Observable<any> = toObservable(this.authService.currentUser);

  ngOnInit(): void {
    this.nearbyTeams$ = new Observable<any[]>();
  }

  async getNearbyTeams(params: any) {
    console.log({ params });
    this.nearbyTeams$ = this.user$.pipe(
      switchMap((user) =>
        this.teamsService.nearbyTeams({
          p_id: user.association_id,
          p_girls_only: params.girlsOnly,
          p_age: user.age,
          p_max_rating: params.rating[1],
          p_min_rating: params.rating[0],
          p_max_distance: params.distance,
        })
      )
    );
  }
}
