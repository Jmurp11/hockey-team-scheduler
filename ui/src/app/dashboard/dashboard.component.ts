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
import { ButtonModule } from 'primeng/button';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap
} from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { SortHeaderComponent } from '../shared/components/sort-header/sort-header.component';
import { SortDirection } from '../shared/components/sort-header/sort-header.type';
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
    ButtonModule,
    SortHeaderComponent,
  ],
  template: ` <div class="container">
    <app-opponents
      (selectedInputs)="onSearchParamsChanged($event)"
      [associations$]="associations$"
      [userDefault$]="user$"
    />

    @if (nearbyTeams$ | async; as nearbyTeams) {
    <div class="list-container">
      <app-sort-header
        class="sort-header"
        (sortChanged)="onSortChanged($event)"
        [resultsCount]="nearbyTeams?.length ?? 0"
      ></app-sort-header>

      <div class="opponent-list">
        <app-opponent-list [opponents]="nearbyTeams" />
      </div>
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

  private searchParams$ = new BehaviorSubject<any>(null);
  private currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });

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
    const teams$ = this.searchParams$.pipe(
      filter((params) => params !== null),
      switchMap((params) => this.getNearbyTeams(params)),
      shareReplay(1)
    );

    this.nearbyTeams$ = combineLatest({
      teams: teams$,
      sort: this.currentSort$,
    }).pipe(map(({ teams, sort }) => this.sort([...(teams as any[])], sort)));
  }

  onSearchParamsChanged(params: any) {
    this.searchParams$.next(params);
  }

  onSortChanged(sort: { field: string; sortDirection: SortDirection }) {
    this.currentSort$.next(sort);
  }

  getNearbyTeams(params: any) {
    return this.teamsService.nearbyTeams({
      p_id: params.association.value,
      p_girls_only: params.girlsOnly || false,
      p_age: params.age.value.toLowerCase(),
      p_max_rating: params.rating[1],
      p_min_rating: params.rating[0],
      p_max_distance: params.distance,
    });
  }

  sort(teams: any[], sort: { field: string; sortDirection: SortDirection }) {
    return teams.sort((a, b) => {
      const fieldA = a[sort.field];
      const fieldB = b[sort.field];

      if (fieldA < fieldB) return sort.sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sort.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
