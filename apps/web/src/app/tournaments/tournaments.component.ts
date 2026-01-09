import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  AddGameService,
  AuthService,
  TournamentsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  createTournamentGameInfo,
  filterAndSortTournaments,
  getDatesBetween,
  registerForTournament,
  SortDirection,
  Tournament,
  TournamentFilterType,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, switchMap, take, tap } from 'rxjs';
import { TournamentPublicCardComponent } from '../landing/tournaments/tournament-public-card/tournament-public-card.component';
import { SortHeaderComponent } from '../shared';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-tournaments',
  standalone: true,
  imports: [
    CommonModule,
    ProgressSpinnerModule,
    SortHeaderComponent,
    TournamentPublicCardComponent,
  ],
  providers: [],
  template: ` <div class="container">
    @if (isLoading()) {
      <div class="loading-spinner">
        <p-progressSpinner></p-progressSpinner>
      </div>
    } @else {
      @if (nearbyTournaments$ | async; as tournaments) {
        <div class="list-container">
          <!-- Sort header with integrated featured filter, searchbar, and distance sort -->
          <app-sort-header
            class="sort-header"
            (sortChanged)="onSortChanged($event)"
            (searchChanged)="onSearchChanged($event)"
            (featuredFilterChanged)="onFeaturedFilterChanged($event)"
            [sortFields]="sortFields"
            [showSearch]="true"
            [showFeaturedFilter]="true"
            [showResultsCount]="false"
          ></app-sort-header>

          <!-- Results count below filters -->
          <div class="results-info">
            <span class="results-count">{{ tournaments?.length ?? 0 }} tournaments found</span>
            @if (currentFilterType() === 'featured') {
              <span class="filter-badge">Showing featured only</span>
            } @else {
              <span class="filter-hint">Featured tournaments shown first</span>
            }
          </div>

          <!-- Tournament grid using public cards with authenticated features -->
          <div class="tournaments-grid">
            @for (tournament of tournaments; track tournament.id) {
              <app-tournament-public-card
                [tournament]="tournament"
                [showAuthenticatedFeatures]="true"
                (registerClick)="onRegisterClick($event)"
                (addToScheduleClick)="onAddToScheduleClick($event)"
              />
            }
          </div>
        </div>
      }
    }
  </div>`,
  styleUrls: ['./tournaments.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TournamentsComponent implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);

  tournaments$: Observable<Tournament[]> = new Observable<Tournament[]>();
  nearbyTournaments$: Observable<Tournament[]> = new Observable<Tournament[]>();
  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );

  isLoading = signal<boolean>(false);

  // Signal to track current filter type for display in results info
  currentFilterType = signal<TournamentFilterType>('all');

  // Sort field options for the sort header
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
  private searchParams$ = new BehaviorSubject<string>('');
  private filterType$ = new BehaviorSubject<TournamentFilterType>('all');

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

  onFeaturedFilterChanged(filterType: TournamentFilterType) {
    this.currentFilterType.set(filterType);
    this.filterType$.next(filterType);
  }

  /**
   * Opens the tournament registration URL in a new tab.
   */
  onRegisterClick(tournament: Tournament): void {
    registerForTournament(tournament);
  }

  /**
   * Adds the tournament to the user's schedule.
   * Creates game entries for each day of the tournament.
   */
  onAddToScheduleClick(tournament: Tournament): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.toastService.presentToast({
        severity: 'error',
        summary: 'Not Logged In',
        detail: 'Please log in to add tournaments to your schedule.',
      });
      return;
    }

    const gameInfo = createTournamentGameInfo(
      tournament,
      currentUser.user_id || '',
      currentUser.team_id,
      currentUser.association_id,
    );

    const dates = getDatesBetween(
      new Date(tournament.startDate),
      new Date(tournament.endDate),
    );
    const games = dates.map((date) => ({
      ...gameInfo,
      date,
    }));

    this.addGameService
      .addGame(games)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          if (
            response &&
            (response.hasOwnProperty('opponent') ||
              (Array.isArray(response) && response[0]?.hasOwnProperty('opponent')))
          ) {
            this.toastService.presentToast({
              severity: 'success',
              summary: 'Tournament Added',
              detail: `${tournament.name} has been added to your schedule.`,
            });
          } else {
            this.toastService.presentToast({
              severity: 'error',
              summary: 'Add Failed',
              detail: 'There was an error adding the tournament. Please try again.',
            });
          }
        },
        error: () => {
          this.toastService.presentToast({
            severity: 'error',
            summary: 'Add Failed',
            detail: 'There was an error adding the tournament. Please try again.',
          });
        },
      });
  }

  getNearbyTournaments(): Observable<Tournament[]> {
    return this.user$.pipe(
      tap(() => this.isLoading.set(true)),
      filter((user): user is UserProfile => !!user && !!user.association_id),
      switchMap(
        (user: UserProfile) =>
          this.tournamentsService.nearByTournaments({
            p_id: user.association_id!,
          }) as Observable<Tournament[]>,
      ),
      tap(() => this.isLoading.set(false)),
      shareReplay(1),
    );
  }

  /**
   * Creates the observable pipeline for filtering, searching, and sorting tournaments.
   * Featured tournaments are always displayed first within each filter/sort configuration.
   */
  private createFilteredAndSortedTournaments$(): Observable<Tournament[]> {
    return combineLatest({
      tournaments: this.tournaments$,
      sort: this.currentSort$,
      search: this.searchParams$,
      filterType: this.filterType$,
    }).pipe(
      map(({ tournaments, sort, search, filterType }) => {
        // First, apply text search filter
        let filtered = tournaments;
        if (search && search.trim().length > 0) {
          const searchLower = search.toLowerCase();
          filtered = tournaments.filter(
            (tournament: Tournament) =>
              tournament.name.toLowerCase().includes(searchLower) ||
              tournament.location.toLowerCase().includes(searchLower),
          );
        }

        // Apply featured filter and sort with featured-first priority
        // Uses the shared utility to ensure consistent behavior across apps
        return filterAndSortTournaments(
          filtered,
          filterType,
          sort.field as keyof Tournament,
          sort.sortDirection,
        );
      }),
      shareReplay(1),
    );
  }
}
