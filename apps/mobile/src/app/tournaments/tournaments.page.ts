import { CommonModule } from '@angular/common';

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
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
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { LoadingComponent } from '../shared/loading/loading.component';
import { SearchbarComponent } from '../shared/searchbar/searchbar.component';
import { ToastService } from '../shared/toast/toast.service';
import { TournamentPublicCardComponent } from './tournament-public-card/tournament-public-card.component';

@Component({
  selector: 'app-tournaments',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          @if (showBackButton()) {
            <ion-back-button defaultHref="/app/schedule"></ion-back-button>
          } @else {
            <ion-menu-button></ion-menu-button>
          }
        </ion-buttons>
        <ion-title>Tournaments</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (isLoading()) {
        <div class="loading-container">
          <app-loading name="circular"></app-loading>
        </div>
      } @else {
        @if (nearbyTournaments$ | async; as tournaments) {
          <div class="fixed-header">
            <!-- Inline filters row: featured filter, searchbar -->
            <div class="filters-row">
              <ion-segment
                [value]="currentFilter()"
                (ionChange)="onFilterChanged($event)"
                mode="ios"
                class="filter-segment"
              >
                <ion-segment-button value="all">
                  <ion-label>All</ion-label>
                </ion-segment-button>
                <ion-segment-button value="featured">
                  <ion-label>Featured</ion-label>
                </ion-segment-button>
              </ion-segment>

              <app-searchbar
                class="search-field"
                [placeholder]="'Search tournaments...'"
                (ionInputEvent)="onSearchChanged($event)"
              ></app-searchbar>
            </div>

            <!-- Results count below filters -->
            <div class="results-info">
              <span class="results-count">
                {{ tournaments?.length ?? 0 }} tournaments found
              </span>
              @if (currentFilter() === 'featured') {
                <span class="filter-badge">Showing featured only</span>
              } @else {
                <span class="filter-hint">Featured shown first</span>
              }
            </div>
          </div>

          <!-- Tournament list using public cards with authenticated features -->
          <div class="scrollable-content">
            @for (tournament of tournaments; track tournament.id) {
              <app-tournament-public-card
                [tournament]="tournament"
                [showAuthenticatedFeatures]="true"
                (registerClick)="onRegisterClick($event)"
                (addToScheduleClick)="onAddToScheduleClick($event)"
              />
            }
          </div>
        }
      }
    </ion-content>
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      ion-content {
        --padding-top: 0;
        --padding-bottom: 0;
        --padding-start: 0;
        --padding-end: 0;
      }

      .loading-container {
        @include flex(center, center, row);
        height: 100%;
      }

      .fixed-header {
        position: sticky;
        top: 0;
        z-index: 10;
        background: var(--ion-background-color, #fff);
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--ion-color-light-shade);
      }

      // Inline filters row: featured filter, searchbar
      .filters-row {
        @include flex(flex-start, center, row);
        gap: 0.75rem;

        .filter-segment {
          flex-shrink: 0;
          max-width: 140px;
          --background: var(--ion-color-light);
          border-radius: 8px;
        }

        ion-segment-button {
          --indicator-color: var(--ion-color-secondary);
          --color-checked: var(--ion-color-secondary-contrast);
          font-size: 0.75rem;
          min-height: 32px;
          --padding-start: 8px;
          --padding-end: 8px;
        }

        .search-field {
          flex: 1;
          min-width: 0;
        }
      }

      // Results info below filters
      .results-info {
        @include flex(flex-start, center, row);
        gap: 0.5rem;
        padding-top: 0.5rem;
        flex-wrap: wrap;

        .results-count {
          font-size: 0.8rem;
          color: var(--ion-color-medium);
          font-weight: 500;
        }

        .filter-badge {
          font-size: 0.7rem;
          color: var(--secondary-700);
          background: var(--secondary-100);
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
          font-weight: 500;
        }

        .filter-hint {
          font-size: 0.7rem;
          color: var(--ion-color-medium);
          font-style: italic;
        }
      }

      .scrollable-content {
        padding: 1rem;
        overflow-y: auto;
      }
    `,
  ],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    SearchbarComponent,
    LoadingComponent,
    TournamentPublicCardComponent,
  ],
})
export class TournamentsPage implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);

  tournaments$: Observable<Tournament[]> = new Observable<Tournament[]>();
  nearbyTournaments$!: Observable<Tournament[]>;
  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );

  isLoading = signal<boolean>(false);
  showBackButton = signal<boolean>(false);

  // Signal to track current filter selection
  currentFilter = signal<TournamentFilterType>('all');

  sortFields = [
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];

  private searchParams$ = new BehaviorSubject<string>('');
  private filterType$ = new BehaviorSubject<TournamentFilterType>('all');
  private currentSort$ = new BehaviorSubject<{
    field: keyof Tournament;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((params) => {
          this.showBackButton.set(params['from'] === 'schedule');
        }),
      )
      .subscribe();

    this.tournaments$ = this.getNearbyTournaments();
    this.nearbyTournaments$ = this.createFilteredAndSortedTournaments$();
  }

  /**
   * Handles filter segment change events.
   * Updates the filter type for the tournament list.
   */
  onFilterChanged(event: CustomEvent): void {
    const filterValue = event.detail.value as TournamentFilterType;
    this.currentFilter.set(filterValue);
    this.filterType$.next(filterValue);
  }

  onSearchChanged(event: CustomEvent): void {
    this.searchParams$.next(event.detail.value || '');
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
      this.toastService.presentErrorToast(
        'Please log in to add tournaments to your schedule.',
      );
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
        next: () => {
          this.toastService.presentSuccessToast(
            `${tournament.name} has been added to your schedule!`,
          );
        },
        error: () => {
          this.toastService.presentErrorToast(
            'Failed to add tournament. Please try again.',
          );
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
      search: this.searchParams$,
      filterType: this.filterType$,
      sort: this.currentSort$,
    }).pipe(
      map(({ tournaments, search, filterType, sort }) => {
        // First, apply text search filter
        let filtered = tournaments;
        if (search && search.trim().length > 0) {
          const searchLower = search.toLowerCase();
          filtered = tournaments.filter((tournament: Tournament) =>
            this.matchesSearch(tournament, searchLower),
          );
        }

        // Apply featured filter and sort with featured-first priority
        // Uses the shared utility to ensure consistent behavior across apps
        return filterAndSortTournaments(
          filtered,
          filterType,
          sort.field,
          sort.sortDirection,
        );
      }),
      shareReplay(1),
    );
  }

  /**
   * Checks if a tournament matches the search query.
   * Searches across name, location, ages, and levels.
   */
  private matchesSearch(tournament: Tournament, searchLower: string): boolean {
    // Check name and location
    if (
      tournament.name.toLowerCase().includes(searchLower) ||
      tournament.location.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Check ages if available
    if (tournament.ages?.some((age) => age.toLowerCase().includes(searchLower))) {
      return true;
    }

    // Check levels if available
    if (tournament.levels?.some((level) => level.toLowerCase().includes(searchLower))) {
      return true;
    }

    return false;
  }
}
