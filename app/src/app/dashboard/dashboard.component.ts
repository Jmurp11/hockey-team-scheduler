import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { filter, map, Observable, startWith } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AssociationService } from '../shared/services/associations.service';
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
    <app-opponents
      (selectedInputs)="getNearbyTeams($event)"
      [associations$]="associations$"
      [userDefault$]="user$"
    />

    @if (nearbyTeams$ | async; as nearbyTeams) {
    <div class="opponent-list">
      <app-opponent-list [opponents]="nearbyTeams" />
    </div>
    }
  </div>`,
  styleUrls: ['./dashboard.component.scss'],
  providers: [AssociationService, TeamsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  nearbyTeams$: Observable<any>;
  associationService = inject(AssociationService);
  teamsService = inject(TeamsService);
  authService = inject(AuthService);

  user$: Observable<SelectItem> = toObservable(
    this.authService.currentUser
  ).pipe(
    startWith(null),
    filter((user) => user != null),
    map((user) => ({
      label: user?.association_name,
      value: user?.association_id,
    }))
  );

  associations$: Observable<SelectItem[]> =
    this.associationService.getAssociations();

  ngOnInit(): void {
    this.nearbyTeams$ = new Observable<any[]>();
  }

  async getNearbyTeams(params: any) {
    this.nearbyTeams$ = this.teamsService.nearbyTeams({
      p_id: params.association.value,
      p_girls_only: params.girlsOnly || false,
      p_age: params.age.value.toLowerCase(), 
      p_max_rating: params.rating[1],
      p_min_rating: params.rating[0],
      p_max_distance: params.distance,
    });
  }
}
