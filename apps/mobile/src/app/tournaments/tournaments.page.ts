import { CommonModule } from '@angular/common';

import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
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
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { starOutline, thumbsUpOutline } from 'ionicons/icons';
import {
  BehaviorSubject,
  catchError,
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
import { ToolbarActionsComponent } from '../shared/components/toolbar-actions/toolbar-actions.component';

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
        <ion-buttons slot="end">
          <app-toolbar-actions />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      @if (isLoading()) {
        <div class="loading-container">
          <app-loading name="circular"></app-loading>
        </div>
      } @else {
        @if (tournamentsWithFit$ | async; as data) {
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

            <!-- Sort options -->
            <div class="sort-row">
              <ion-segment
                [value]="currentSortField()"
                (ionChange)="onSortChanged($event)"
                mode="ios"
                class="sort-segment"
              >
                @for (field of sortFields; track field.value) {
                  <ion-segment-button [value]="field.value">
                    <ion-label>{{ field.label }}</ion-label>
                  </ion-segment-button>
                }
              </ion-segment>
            </div>

            <!-- Results count below filters -->
            <div class="results-info">
              <span class="results-count">
                {{ (filteredTournaments$ | async)?.length ?? 0 }} tournaments found
              </span>
              @if (currentFilter() === 'featured') {
                <span class="filter-badge">Showing featured only</span>
              } @else {
                <span class="filter-hint">Best fits shown first</span>
              }
            </div>
          </div>

          <!-- Scrollable content area -->
          <div class="scrollable-content">
            <!-- Featured Tournaments Section -->
            @if (currentFilter() !== 'featured') {
              @if (featuredTournaments$ | async; as featured) {
                @if (featured.length > 0) {
                  <section class="featured-section">
                    <div class="section-header">
                      <ion-icon name="star-outline"></ion-icon>
                      <h3>Featured Tournaments</h3>
                    </div>
                    @for (tournament of featured; track tournament.id) {
                      <app-tournament-public-card
                        [tournament]="tournament"
                        [showAuthenticatedFeatures]="true"
                        [fitData]="tournament.fit"
                        (registerClick)="onRegisterClick($event)"
                        (addToScheduleClick)="onAddToScheduleClick($event)"
                      />
                    }
                  </section>
                }
              }
            }

            <!-- Recommended Section -->
            @if (data.recommended.length > 0) {
              <section class="recommended-section">
                <div class="section-header">
                  <ion-icon name="thumbs-up-outline"></ion-icon>
                  <h3>Recommended for Your Team</h3>
                </div>
                <p class="section-subtitle">Based on your team's rating, schedule, and location</p>
                @for (tournament of data.recommended; track tournament.id) {
                  <app-tournament-public-card
                    [tournament]="tournament"
                    [showAuthenticatedFeatures]="true"
                    [fitData]="tournament.fit"
                    (registerClick)="onRegisterClick($event)"
                    (addToScheduleClick)="onAddToScheduleClick($event)"
                  />
                }
              </section>
            }

            <!-- All / Filtered Tournaments -->
            @for (tournament of filteredTournaments$ | async; track tournament.id) {
              <app-tournament-public-card
                [tournament]="tournament"
                [showAuthenticatedFeatures]="true"
                [fitData]="tournament.fit"
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

      .sort-row {
        padding-top: 0.5rem;

        .sort-segment {
          --background: var(--ion-color-light);
          border-radius: 8px;
        }

        ion-segment-button {
          --indicator-color: var(--ion-color-primary);
          --color-checked: var(--ion-color-primary-contrast);
          font-size: 0.7rem;
          min-height: 28px;
          --padding-start: 6px;
          --padding-end: 6px;
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

      .section-header {
        @include flex(flex-start, center, row);
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        ion-icon {
          font-size: 1.125rem;
          color: var(--ion-color-secondary);
        }

        h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--ion-text-color);
        }
      }

      .section-subtitle {
        font-size: 0.75rem;
        color: var(--ion-color-medium);
        margin: 0 0 0.75rem 0;
      }

      .featured-section,
      .recommended-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--ion-color-light-shade);
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
    IonIcon,
    SearchbarComponent,
    LoadingComponent,
    TournamentPublicCardComponent,
    ToolbarActionsComponent,
  ],
})
export class TournamentsPage implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  private tournamentFitService = inject(TournamentFitService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private addGameService = inject(AddGameService);
  private toastService = inject(ToastService);

  tournamentsWithFit$: Observable<{
    tournaments: TournamentWithFit[];
    recommended: TournamentWithFit[];
  }> = new Observable();

  featuredTournaments$: Observable<TournamentWithFit[]> = new Observable();
  filteredTournaments$: Observable<TournamentWithFit[]> = new Observable();

  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );

  isLoading = signal<boolean>(false);
  showBackButton = signal<boolean>(false);
  currentFilter = signal<TournamentFilterType>('all');
  currentSortField = signal<string>('overallScore');

  sortFields = [
    { label: 'Best Fit', value: 'overallScore' },
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];

  private searchParams$ = new BehaviorSubject<string>('');
  private filterType$ = new BehaviorSubject<TournamentFilterType>('all');
  private currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'overallScore',
    sortDirection: 'desc',
  });

  constructor() {
    addIcons({ starOutline, thumbsUpOutline });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((params) => {
          this.showBackButton.set(params['from'] === 'schedule');
        }),
      )
      .subscribe();

    this.tournamentsWithFit$ = this.getTournamentsWithFit();
    this.featuredTournaments$ = this.createFeaturedTournaments$();
    this.filteredTournaments$ = this.createFilteredAndSortedTournaments$();
  }

  onFilterChanged(event: CustomEvent): void {
    const filterValue = event.detail.value as TournamentFilterType;
    this.currentFilter.set(filterValue);
    this.filterType$.next(filterValue);
  }

  onSortChanged(event: CustomEvent): void {
    const sortField = event.detail.value as string;
    this.currentSortField.set(sortField);
    this.currentSort$.next({
      field: sortField,
      sortDirection: sortField === 'overallScore' ? 'desc' : 'asc',
    });
  }

  onSearchChanged(event: CustomEvent): void {
    this.searchParams$.next(event.detail.value || '');
  }

  onRegisterClick(tournament: Tournament): void {
    registerForTournament(tournament);
  }

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

  private getTournamentsWithFit(): Observable<{
    tournaments: TournamentWithFit[];
    recommended: TournamentWithFit[];
  }> {
    return this.user$.pipe(
      tap(() => this.isLoading.set(true)),
      filter(
        (user): user is UserProfile =>
          !!user && !!user.association_id && !!user.team_id,
      ),
      switchMap((user: UserProfile) =>
        this.tournamentFitService
          .evaluateFit({
            teamId: user.team_id,
            userId: user.user_id,
            associationId: user.association_id,
          })
          .pipe(
            catchError(() => {
              // Fallback to basic nearby tournaments without fit data
              return this.tournamentsService
                .nearByTournaments({
                  p_id: user.association_id!,
                })
                .pipe(
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

  private createFeaturedTournaments$(): Observable<TournamentWithFit[]> {
    return this.tournamentsWithFit$.pipe(
      map(({ tournaments }) =>
        tournaments
          .filter((t) => t.featured === true)
          .sort(
            (a, b) =>
              (b.fit?.overallScore ?? 0) - (a.fit?.overallScore ?? 0),
          ),
      ),
      shareReplay(1),
    );
  }

  private createFilteredAndSortedTournaments$(): Observable<
    TournamentWithFit[]
  > {
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

        // Sort the results
        return this.sortTournaments(
          filtered,
          sort.field,
          sort.sortDirection,
        );
      }),
      shareReplay(1),
    );
  }

  private sortTournaments(
    tournaments: TournamentWithFit[],
    sortField: string,
    sortDirection: SortDirection,
  ): TournamentWithFit[] {
    return [...tournaments].sort((a, b) => {
      let aValue: number | string | undefined;
      let bValue: number | string | undefined;

      if (sortField === 'overallScore') {
        aValue = a.fit?.overallScore ?? 0;
        bValue = b.fit?.overallScore ?? 0;
      } else {
        aValue = a[sortField as keyof TournamentWithFit] as
          | number
          | string
          | undefined;
        bValue = b[sortField as keyof TournamentWithFit] as
          | number
          | string
          | undefined;
      }

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === 'asc' ? 1 : -1;
      if (bValue == null) return sortDirection === 'asc' ? -1 : 1;

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
}
