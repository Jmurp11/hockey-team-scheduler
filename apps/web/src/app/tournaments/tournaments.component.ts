import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AuthService, TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { SortHeaderComponent } from '../shared';
import { SortDirection } from '../shared/components/sort-header/sort-header.type';
import { TournamentsListComponent } from './tournaments-list/tournaments-list.component';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [
    CommonModule,
    TournamentsListComponent,
    ProgressSpinnerModule,
    SortHeaderComponent,
  ],
  providers: [],
  template: ` <div class="container">
    @if (isLoading()) {
    <div class="loading-spinner">
      <p-progressSpinner></p-progressSpinner>
    </div>
    } @else { @if (nearbyTournaments$ | async; as tournaments) {
    <div class="list-container">
      <app-sort-header
        class="sort-header"
        (sortChanged)="onSortChanged($event)"
        (searchChanged)="onSearchChanged($event)"
        [resultsCount]="tournaments?.length ?? 0"
        [sortFields]="sortFields"
        [showSearch]="true"
      ></app-sort-header>

      <div class="tournament-list">
        <app-tournaments-list [tournaments]="tournaments" />
      </div>
    </div>
    } }
  </div>`,
  styleUrls: ['./tournaments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsComponent implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  tournaments$: Observable<any> = new Observable<any>();
  nearbyTournaments$: Observable<any>;
  user$: Observable<any> = toObservable(this.authService.currentUser);

  isLoading = signal<boolean>(false);
  sortFields = [
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];
  private currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });
  private searchParams$ = new BehaviorSubject<any>(null);

  ngOnInit(): void {
    this.tournaments$ = this.getNearbyTournaments();
    this.nearbyTournaments$ = this.createFilteredAndSortedTournaments$();
  }

  onSortChanged(sort: { field: string; sortDirection: SortDirection }) {
    this.currentSort$.next(sort);
  }

  onSearchChanged(search: string | null) {
    this.searchParams$.next(search || '');
  }

  getNearbyTournaments(): Observable<any> {
    return this.user$.pipe(
      tap(() => this.isLoading.set(true)),
      filter((user) => !!user && !!user.association_id),
      switchMap((user) =>
        this.tournamentsService.nearByTournaments({
          p_id: user.association_id,
        })
      ),
      tap(() => this.isLoading.set(false)),
      shareReplay(1)
    );
  }

  private createFilteredAndSortedTournaments$(): Observable<any[]> {
    return combineLatest({
      tournaments: this.tournaments$,
      sort: this.currentSort$,
      search: this.searchParams$,
    }).pipe(
      map(({ tournaments, sort, search }) => {
        let filtered = tournaments;
        if (search && search.trim().length > 0) {
          const searchLower = search.toLowerCase();
          filtered = tournaments.filter(
            (tournament: any) =>
              tournament.name.toLowerCase().includes(searchLower) ||
              tournament.location.toLowerCase().includes(searchLower)
          );
        }
        return this.sort([...filtered], sort);
      }),
      shareReplay(1)
    );
  }

  sort(
    tournaments: any[],
    sort: { field: string; sortDirection: SortDirection }
  ) {
    return tournaments.sort((a, b) => {
      const fieldA = a[sort.field];
      const fieldB = b[sort.field];

      if (fieldA < fieldB) return sort.sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sort.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
