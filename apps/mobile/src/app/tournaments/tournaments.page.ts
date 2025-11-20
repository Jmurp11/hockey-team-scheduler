import { CommonModule } from '@angular/common';

import { Component, inject, OnInit, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { AuthService, TournamentsService } from '@hockey-team-scheduler/shared-data-access';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSelectOption,
  IonTitle,
  IonToolbar
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
import { SelectComponent } from '../shared/select/select.component';
import { TournamentListComponent } from './tournament-list/tournament-list.component';

type SortDirection = 'asc' | 'desc';

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

    <ion-content class="ion-padding">
      @if (isLoading()) {
        <div class="loading-container">
          <app-loading name="circular"></app-loading>
        </div>
      } @else {
        @if (nearbyTournaments$ | async; as tournaments) {
          <div class="search-sort-container">
            <app-searchbar
              [placeholder]="'Search tournaments...'"
              (ionChangeEvent)="onSearchChanged($event)"
            ></app-searchbar>
            
            <app-select
              [label]="'Sort By'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
              [value]="currentSort$.value.field"
              (ionChangeEvent)="onSortFieldChanged($event)"
            >
              @for (field of sortFields; track field.value) {
                <ion-select-option [value]="field.value">{{ field.label }}</ion-select-option>
              }
            </app-select>

            <app-select
              [label]="'Direction'"
              [labelPlacement]="'stacked'"
              [fill]="'outline'"
              [value]="currentSort$.value.sortDirection"
              (ionChangeEvent)="onSortDirectionChanged($event)"
            >
              <ion-select-option value="asc">Ascending</ion-select-option>
              <ion-select-option value="desc">Descending</ion-select-option>
            </app-select>

            <div class="results-count">
              {{ tournaments?.length ?? 0 }} tournaments found
            </div>
          </div>

          <app-tournament-list [tournaments]="tournaments" />
        }
      }
    </ion-content>
  `,
  styles: [`
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .search-sort-container {
      margin-bottom: 1rem;
    }

    .results-count {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }
  `],
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    IonSelectOption,
    SearchbarComponent,
    SelectComponent,
    LoadingComponent,
    TournamentListComponent,
  ],
})
export class TournamentsPage implements OnInit {
  authService = inject(AuthService);
  tournamentsService = inject(TournamentsService);
  private route = inject(ActivatedRoute);
  
  tournaments$: Observable<any> = new Observable<any>();
  nearbyTournaments$!: Observable<any>;
  user$: Observable<any> = toObservable(this.authService.currentUser);

  isLoading = signal<boolean>(false);
  showBackButton = signal<boolean>(false);
  sortFields = [
    { label: 'Distance', value: 'distance' },
    { label: 'Date', value: 'startDate' },
  ];
  currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });
  private searchParams$ = new BehaviorSubject<any>(null);

  ngOnInit(): void {
    // Check if we came from the schedule page
    this.route.queryParams.pipe(
      tap((params) => {
        this.showBackButton.set(params['from'] === 'schedule');
      })
    ).subscribe();

    this.tournaments$ = this.getNearbyTournaments();
    this.nearbyTournaments$ = this.createFilteredAndSortedTournaments$();
  }

  onSortFieldChanged(event: CustomEvent) {
    this.currentSort$.next({
      ...this.currentSort$.value,
      field: event.detail.value,
    });
  }

  onSortDirectionChanged(event: CustomEvent) {
    this.currentSort$.next({
      ...this.currentSort$.value,
      sortDirection: event.detail.value,
    });
  }

  onSearchChanged(event: CustomEvent) {
    this.searchParams$.next(event.detail.value || '');
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
