import { CommonModule } from '@angular/common';

import { Component, inject, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  AuthService,
  TournamentsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
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
  tap,
} from 'rxjs';
import { LoadingComponent } from '../shared/loading/loading.component';
import { SearchbarComponent } from '../shared/searchbar/searchbar.component';
import { TournamentListComponent } from './tournament-list/tournament-list.component';
import {
  Tournament,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';

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
            <div class="search-sort-container">
              <app-searchbar
                [placeholder]="'Search tournaments...'"
                (ionInputEvent)="onSearchChanged($event)"
              ></app-searchbar>

              <div class="results-count">
                {{ tournaments?.length ?? 0 }} tournaments found
              </div>
            </div>
          </div>

          <div class="scrollable-content">
            <app-tournament-list [tournaments]="tournaments" />
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
        padding: 1rem;
        border-bottom: 1px solid var(--ion-color-light-shade);
      }

      .search-sort-container {
        @include flex(center, center, column);
        gap: 1rem;

        app-searchbar {
          width: 100%;
        }
      }

      .results-count {
        padding: 0.275rem;
        font-size: 0.875rem;
        color: var(--ion-color-medium);
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
    SearchbarComponent,
    LoadingComponent,
    TournamentListComponent,
  ],
})
export class TournamentsPage implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  private route = inject(ActivatedRoute);

  tournaments$: Observable<Tournament[]> = new Observable<Tournament[]>();
  nearbyTournaments$!: Observable<Tournament[]>;
  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );

  isLoading = signal<boolean>(false);
  showBackButton = signal<boolean>(false);
  sortFields = [
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];

  private searchParams$ = new BehaviorSubject<any>(null);

  ngOnInit(): void {
    this.route.queryParams
      .pipe(
        tap((params) => {
          this.showBackButton.set(params['from'] === 'schedule');
        }),
      )
      .subscribe();

    this.tournaments$ = this.getNearbyTournaments();
    this.nearbyTournaments$ = this.createFilteredAndSortedTournaments$();
  }

  onSearchChanged(event: CustomEvent) {
    this.searchParams$.next(event.detail.value || '');
  }

  getNearbyTournaments(): Observable<Tournament[]> {
    return this.user$.pipe(
      tap(() => this.isLoading.set(true)),
      filter((user) => !!user && !!user.association_id),
      switchMap(
        (user: any) =>
          this.tournamentsService.nearByTournaments({
            p_id: user.association_id,
          }) as Observable<Tournament[]>,
      ),
      tap(() => this.isLoading.set(false)),
      shareReplay(1),
    );
  }

  private createFilteredAndSortedTournaments$(): Observable<Tournament[]> {
    return combineLatest({
      tournaments: this.tournaments$,
      search: this.searchParams$,
    }).pipe(
      map(({ tournaments, search }) =>
        this.performSearchFilter(tournaments, search),
      ),
      shareReplay(1),
    );
  }

  performSearchFilter(tournaments: any[], search: string): any[] {
    let filtered = tournaments;
    if (search && search.trim().length > 0) {
      const searchLower = search.toLowerCase();
      filtered = tournaments.filter((tournament: any) =>
        this.filterBySearch(tournament, searchLower),
      );
    }
    return filtered;
  }

  filterBySearch(tournaments: any[], search: string): any[] {
    const searchLower = search.toLowerCase();
    return tournaments.filter(
      (tournament: any) =>
        tournament.name.toLowerCase().includes(searchLower) ||
        tournament.location.toLowerCase().includes(searchLower) ||
        tournament.ages[0]
          .map((age: any) => age.toLowerCase())
          .some((age: string) => age.includes(searchLower)) ||
        tournament.levels
          .map((level: any) => level[0].toLowerCase())
          .some((level: string) => level.includes(searchLower)),
    );
  }
}
