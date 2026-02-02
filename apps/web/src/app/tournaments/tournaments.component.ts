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
  TournamentFitService,
  TournamentsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  createTournamentGameInfo,
  getDatesBetween,
  registerForTournament,
  SortDirection,
  Tournament,
  TournamentFilterType,
  TournamentWithFit,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, switchMap, take, tap, catchError } from 'rxjs';
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
      @if (tournamentsWithFit$ | async; as data) {
        <div class="list-container">
          <!-- Sort header with search, filters, and sort — pinned at top -->
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
            <span class="results-count">{{ (filteredTournaments$ | async)?.length ?? 0 }} tournaments found</span>
            @if (currentFilterType() === 'featured') {
              <span class="filter-badge">Showing featured only</span>
            } @else {
              <span class="filter-hint">Best fits shown first</span>
            }
          </div>

          <!-- Scrollable content area -->
          <div class="scrollable-content">
            <!-- Featured Tournaments Section -->
            @if (currentFilterType() !== 'featured') {
              @if (featuredTournaments$ | async; as featured) {
                @if (featured.length > 0) {
                  <section class="featured-section">
                    <div class="section-header">
                      <div class="section-title featured-title">
                        <i class="pi pi-star-fill"></i>
                        <h2>Featured Tournaments</h2>
                      </div>
                      <p class="section-subtitle">
                        Premium tournament listings with priority placement
                      </p>
                    </div>
                    <div class="featured-grid">
                      @for (tournament of featured; track tournament.id) {
                        <app-tournament-public-card
                          [tournament]="tournament"
                          [showAuthenticatedFeatures]="true"
                          (registerClick)="onRegisterClick($event)"
                          (addToScheduleClick)="onAddToScheduleClick($event)"
                        />
                      }
                    </div>
                  </section>
                }
              }
            }

            <!-- Recommended Section -->
            @if (data.recommended.length > 0) {
              <section class="recommended-section">
                <div class="section-header">
                  <div class="section-title">
                    <i class="pi pi-thumbs-up-fill"></i>
                    <h2>Recommended for Your Team</h2>
                  </div>
                  <p class="section-subtitle">
                    Based on your team's rating, schedule, and location
                  </p>
                </div>
                <div class="recommended-grid">
                  @for (tournament of data.recommended; track tournament.id) {
                    <app-tournament-public-card
                      [tournament]="tournament"
                      [showAuthenticatedFeatures]="true"
                      (registerClick)="onRegisterClick($event)"
                      (addToScheduleClick)="onAddToScheduleClick($event)"
                    />
                  }
                </div>
              </section>
            }

            <!-- All Tournaments grid -->
            <div class="tournaments-grid">
              @for (tournament of filteredTournaments$ | async; track tournament.id) {
                <app-tournament-public-card
                  [tournament]="tournament"
                  [showAuthenticatedFeatures]="true"
                  (registerClick)="onRegisterClick($event)"
                  (addToScheduleClick)="onAddToScheduleClick($event)"
                />
              }
            </div>
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
  private tournamentFitService = inject(TournamentFitService);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);

  /**
   * Observable of tournaments with fit evaluations and recommendations.
   */
  tournamentsWithFit$: Observable<{
    tournaments: TournamentWithFit[];
    recommended: TournamentWithFit[];
  }> = new Observable();

  /**
   * Featured tournaments shown in their own section.
   */
  featuredTournaments$: Observable<TournamentWithFit[]> = new Observable();

  /**
   * Non-featured tournaments for the main grid.
   */
  nonFeaturedTournaments$: Observable<TournamentWithFit[]> = new Observable();

  /**
   * Filtered and sorted tournaments based on user selections.
   */
  filteredTournaments$: Observable<TournamentWithFit[]> = new Observable();

  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );

  isLoading = signal<boolean>(false);

  // Signal to track current filter type for display in results info
  currentFilterType = signal<TournamentFilterType>('all');

  // Sort field options for the sort header - now includes fit score
  sortFields = [
    { label: 'Best Fit', value: 'overallScore' },
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];

  private currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'overallScore',
    sortDirection: 'desc', // Best fits first
  });
  private searchParams$ = new BehaviorSubject<string>('');
  private filterType$ = new BehaviorSubject<TournamentFilterType>('all');

  ngOnInit(): void {
    this.tournamentsWithFit$ = this.getTournamentsWithFit();
    this.featuredTournaments$ = this.createFeaturedTournaments$();
    this.nonFeaturedTournaments$ = this.createNonFeaturedTournaments$();
    this.filteredTournaments$ = this.createFilteredAndSortedTournaments$();
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

  /**
   * Fetches tournaments with fit evaluations from the Tournament Fit Agent.
   * Returns both the full list and recommended tournaments.
   */
  getTournamentsWithFit(): Observable<{
    tournaments: TournamentWithFit[];
    recommended: TournamentWithFit[];
  }> {
    return this.user$.pipe(
      tap(() => this.isLoading.set(true)),
      filter((user): user is UserProfile => !!user && !!user.association_id && !!user.team_id),
      switchMap((user: UserProfile) =>
        this.tournamentFitService.evaluateFit({
          teamId: user.team_id,
          userId: user.user_id,
          associationId: user.association_id,
        }).pipe(
          catchError((error) => {
            console.error('Error evaluating tournament fit:', error);
            // Fallback to basic nearby tournaments without fit data
            return this.tournamentsService.nearByTournaments({
              p_id: user.association_id!,
            }).pipe(
              map((tournaments) => ({
                tournaments: tournaments as TournamentWithFit[],
                recommended: [],
              })),
            );
          }),
        ),
      ),
      tap(() => this.isLoading.set(false)),
      shareReplay(1),
    );
  }

  /**
   * Creates an observable of featured tournaments only, sorted by fit score.
   */
  private createFeaturedTournaments$(): Observable<TournamentWithFit[]> {
    return this.tournamentsWithFit$.pipe(
      map(({ tournaments }) =>
        tournaments
          .filter((t) => t.featured === true)
          .sort((a, b) => (b.fit?.overallScore ?? 0) - (a.fit?.overallScore ?? 0)),
      ),
      shareReplay(1),
    );
  }

  /**
   * Creates an observable of non-featured tournaments for the main grid.
   */
  private createNonFeaturedTournaments$(): Observable<TournamentWithFit[]> {
    return this.tournamentsWithFit$.pipe(
      map(({ tournaments }) => tournaments.filter((t) => !t.featured)),
      shareReplay(1),
    );
  }

  /**
   * Creates the observable pipeline for filtering, searching, and sorting tournaments.
   * When showing 'all', excludes featured tournaments (they're in their own section).
   * When showing 'featured' only, shows featured tournaments in the main grid.
   */
  private createFilteredAndSortedTournaments$(): Observable<TournamentWithFit[]> {
    return combineLatest({
      data: this.tournamentsWithFit$,
      sort: this.currentSort$,
      search: this.searchParams$,
      filterType: this.filterType$,
    }).pipe(
      map(({ data, sort, search, filterType }) => {
        let filtered = data.tournaments;

        // When showing 'all', exclude featured tournaments (they're in their own section)
        // When showing 'featured', only show featured tournaments
        if (filterType === 'featured') {
          filtered = filtered.filter((t) => t.featured === true);
        } else {
          // Exclude featured from main grid - they have their own section
          filtered = filtered.filter((t) => !t.featured);
        }

        // Apply text search filter
        if (search && search.trim().length > 0) {
          const searchLower = search.toLowerCase();
          filtered = filtered.filter(
            (tournament: TournamentWithFit) =>
              tournament.name.toLowerCase().includes(searchLower) ||
              tournament.location.toLowerCase().includes(searchLower),
          );
        }

        // Sort the results (no longer need to prioritize featured - they're separate)
        return this.sortTournamentsWithoutFeaturedPriority(filtered, sort.field, sort.sortDirection);
      }),
      shareReplay(1),
    );
  }

  /**
   * Sorts tournaments based on the specified field and direction.
   * Used when featured tournaments are in their own section.
   */
  private sortTournamentsWithoutFeaturedPriority(
    tournaments: TournamentWithFit[],
    sortField: string,
    sortDirection: SortDirection,
  ): TournamentWithFit[] {
    return [...tournaments].sort((a, b) => {
      // Get the values to compare
      let aValue: number | string | undefined;
      let bValue: number | string | undefined;

      if (sortField === 'overallScore') {
        aValue = a.fit?.overallScore ?? 0;
        bValue = b.fit?.overallScore ?? 0;
      } else {
        aValue = a[sortField as keyof TournamentWithFit] as number | string | undefined;
        bValue = b[sortField as keyof TournamentWithFit] as number | string | undefined;
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      // Compare values
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
