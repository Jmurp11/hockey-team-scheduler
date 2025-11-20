import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    inject,
    OnInit,
    signal,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import {
    AssociationService,
    AuthService,
    TeamsService,
} from '@hockey-team-scheduler/shared-data-access';
import { setSelect, sort, SortDirection } from '@hockey-team-scheduler/shared-utilities';
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
    tap,
} from 'rxjs';
// TODO: Implement AddGameDialogService for mobile
// import { AddGameDialogService } from '../schedule/add-game/add-game-dialog.service';
import { LoadingComponent } from '../shared/loading/loading.component';
import { SelectComponent } from '../shared/select/select.component';
import { OpponentsFilterComponent } from './opponents-filter/opponents-filter.component';
import { OpponentsListComponent } from './opponents-list/opponents-list.component';

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
    IonSelectOption,
    OpponentsFilterComponent,
    OpponentsListComponent,
    LoadingComponent,
    SelectComponent,
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
        <ion-title>Opponents</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <app-opponents-filter
        (selectedInputs)="onSearchParamsChanged($event)"
        [associations$]="associations$"
        [userDefault$]="userAssociation$"
      />

      @if (isLoading()) {
        <div class="loading-container">
          <app-loading name="circular"></app-loading>
        </div>
      } @else {
        @if (nearbyTeams$ | async; as nearbyTeams) {
          <div class="sort-container">
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
              {{ nearbyTeams?.length ?? 0 }} opponents found
            </div>
          </div>

          <app-opponents-list
            [opponents]="nearbyTeams"
            (opponentSelected)="onOpponentSelected($event)"
          />
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

    .sort-container {
      margin: 1rem 0;
    }

    .results-count {
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsPage implements OnInit {
  // TODO: Implement AddGameDialogService for mobile
  // private addGameDialogService = inject(AddGameDialogService);
  // private viewContainerRef = inject(ViewContainerRef);

  nearbyTeams$!: Observable<any>;
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

  private searchParams$ = new BehaviorSubject<any>(null);
  currentSort$ = new BehaviorSubject<{
    field: string;
    sortDirection: SortDirection;
  }>({
    field: 'distance',
    sortDirection: 'asc',
  });

  user$: Observable<any> = toObservable(this.authService.currentUser).pipe(
    startWith(null),
    filter((user) => user != null)
  );

  userAssociation$: Observable<SelectItem> = this.user$.pipe(
    map((user) => ({
      label: user?.association_name,
      value: user?.association_id,
    }))
  );

  associations$: Observable<SelectItem[]> =
    this.associationService.getAssociations();

  ngOnInit(): void {
    // TODO: Implement AddGameDialogService for mobile
    // this.addGameDialogService.setViewContainerRef(this.viewContainerRef);

    // Check if we came from the schedule page
    this.route.queryParams.pipe(
      tap((params) => {
        this.showBackButton.set(params['from'] === 'schedule');
      })
    ).subscribe();

    const teams$ = this.searchParams$.pipe(
      filter((params) => params !== null),
      switchMap((params) => this.getNearbyTeams(params)),
      tap(() => this.isLoading.set(false)),
      shareReplay(1)
    );

    this.nearbyTeams$ = combineLatest({
      teams: teams$,
      sort: this.currentSort$,
    }).pipe(
      map(({ teams, sort: sortDir }) => sort([...(teams as any[])], sortDir))
    );
  }

  onSearchParamsChanged(params: any) {
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

  getNearbyTeams(params: any) {
    return this.teamsService.nearbyTeams({
      p_id: params.association.value,
      p_girls_only: params.girlsOnly || false,
      p_age: this.authService.currentUser().age.toLowerCase(),
      p_max_rating: params.rating[1],
      p_min_rating: params.rating[0],
      p_max_distance: params.distance,
    });
  }

  onOpponentSelected(opponent: any) {
    // TODO: Implement AddGameDialogService for mobile
    // this.addGameDialogService.openDialog(opponent, false);
    console.log('Opponent selected:', opponent);
  }
}
