import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
  AssociationService,
  AuthService,
  TeamsService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  OpponentSearchParams,
  Ranking,
  SelectOption,
  setSelect,
  sort,
  SortDirection,
  Team,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { SelectItem } from 'primeng/api';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  shareReplay,
  startWith,
  switchMap,
  take,
  tap,
} from 'rxjs';
// TODO: Implement AddGameDialogService for mobile
// import { AddGameDialogService } from '../schedule/add-game/add-game-dialog.service';
import { AccordionComponent } from '../shared/accordion/accordion.component';
import { LoadingComponent } from '../shared/loading/loading.component';
import { SelectComponent } from '../shared/select/select.component';
import { OpponentsFilterComponent } from './opponents-filter/opponents-filter.component';
import { OpponentsListComponent } from './opponents-list/opponents-list.component';
import { AddGameModalService } from '../schedule/add-game/add-game-modal.service';
import { AddGameLazyWrapperComponent } from '../schedule/add-game/add-game-lazy-wrapper.component';

@Component({
  selector: 'app-opponents',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonMenuButton,
    OpponentsFilterComponent,
    OpponentsListComponent,
    LoadingComponent,
    AccordionComponent,
    SelectComponent,
    IonSelectOption,
    AddGameLazyWrapperComponent,
  ],
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
        <ion-title>Find Opponents</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content [scrollY]="false" class="ion-padding">
      <div class="content-wrapper">
        <app-accordion [values]="['Filters', 'Sort By']">
          <ng-template>
            <app-opponents-filter
              (selectedInputs)="onSearchParamsChanged($event)"
              [associations$]="associations$"
              [userDefault$]="userAssociation$"
            />
          </ng-template>

          <ng-template>
            <div class="sort-container">
              <app-select
                [label]="'Sort By'"
                [labelPlacement]="'stacked'"
                [fill]="'outline'"
                [interface]="'action-sheet'"
                [value]="currentSort$.value.field"
                (ionChangeEvent)="onSortFieldChanged($event)"
              >
                @for (field of sortFields; track field.value) {
                  <ion-select-option [value]="field.value">{{
                    field.label
                  }}</ion-select-option>
                }
              </app-select>

              <app-select
                [label]="'Direction'"
                [labelPlacement]="'stacked'"
                [fill]="'outline'"
                [interface]="'action-sheet'"
                [value]="currentSort$.value.sortDirection"
                (ionChangeEvent)="onSortDirectionChanged($event)"
              >
                <ion-select-option value="asc">Ascending</ion-select-option>
                <ion-select-option value="desc">Descending</ion-select-option>
              </app-select>
            </div>
          </ng-template>
        </app-accordion>

        @if (isLoading()) {
          <div class="loading-container">
            <app-loading name="circular"></app-loading>
          </div>
        } @else {
          @if (nearbyTeams$ | async; as nearbyTeams) {
            <div class="results-count">
              {{ nearbyTeams?.length ?? 0 }} opponents found
            </div>

            <div class="scrollable-list">
              <app-opponents-list
                [opponents]="nearbyTeams"
                (opponentSelected)="onOpponentSelected($event)"
              />
            </div>
          }
        }
      </div>
    </ion-content>

    <app-add-game-lazy-wrapper />
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      :host {
        height: 100vh;
        width: 100%;
      }

      .content-wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .loading-container {
        @include flex(center, center, row);
        flex: 1;
      }

      .results-count {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--ion-color-medium);
        text-align: center;
      }

      .scrollable-list {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }

      .sort-container {
        @include flex(flex-start, center, column);
        gap: 0.5rem;
        width: 100%;

        app-select {
          width: 100% !important;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsPage implements OnInit {
  private addGameModalService = inject(AddGameModalService);

  nearbyTeams$!: Observable<Ranking[]>;
  associationService = inject(AssociationService);
  teamsService = inject(TeamsService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  isLoading = signal<boolean>(false);
  showBackButton = signal<boolean>(false);

  sortFields = [
    setSelect('Distance', 'distance'),
    setSelect('Rating', 'rating'),
  ];

  private searchParams$ = new BehaviorSubject<OpponentSearchParams | null>(
    null,
  );

  currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });

  user$: Observable<UserProfile> = toObservable(
    this.authService.currentUser,
  ).pipe(
    startWith(null),
    filter((user) => user != null),
  );

  userAssociation$: Observable<SelectItem> = this.user$.pipe(
    map((user) => ({
      label: user?.association_name,
      value: user?.association_id,
    })),
  );

  associations$: Observable<SelectItem[]> =
    this.associationService.getAssociations();

  ngOnInit(): void {
    // Check if we came from the schedule page
    this.route.queryParams
      .pipe(
        tap((params) => {
          this.showBackButton.set(params['from'] === 'schedule');
        }),
        take(1),
      )
      .subscribe();

    const teams$ = this.searchParams$.pipe(
      filter((params) => params !== null),
      switchMap((params) => this.getNearbyTeams(params)),
      tap(() => this.isLoading.set(false)),
      shareReplay(1),
    );

    this.nearbyTeams$ = combineLatest({
      teams: teams$,
      sort: this.currentSort$,
    }).pipe(
      map(({ teams, sort: sortDir }) => sort([...(teams as Team[])], sortDir)),
    );
  }

  onSearchParamsChanged(params: OpponentSearchParams) {
    this.isLoading.set(true);
    this.searchParams$.next(params);
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

  getNearbyTeams(params: OpponentSearchParams) {
    if (!params.association) {
      throw new Error('Association is required to search for opponents.');
    }

    return this.teamsService.nearbyTeams({
      p_id: params.association.value,
      p_girls_only: params.girlsOnly || false,
      p_age: this.authService.currentUser()?.age.toLowerCase() || '',
      p_max_rating: params.rating[1],
      p_min_rating: params.rating[0],
      p_max_distance: params.distance,
    });
  }

  onOpponentSelected(opponent: SelectOption<Ranking>) {
    this.addGameModalService.openModal({ opponent: { ...opponent } }, false);
  }
}
