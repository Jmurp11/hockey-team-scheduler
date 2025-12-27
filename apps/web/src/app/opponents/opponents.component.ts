import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { AssociationService } from '@hockey-team-scheduler/shared-data-access';
import { AuthService } from '@hockey-team-scheduler/shared-data-access';
import { OpenAiService } from '@hockey-team-scheduler/shared-data-access';
import { TeamsService } from '@hockey-team-scheduler/shared-data-access';
import { OpponentSearchParams, Ranking, SelectOption, setSelect, sort, SortDirection, UserProfile } from '@hockey-team-scheduler/shared-utilities';
import { SelectItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BehaviorSubject, combineLatest, filter, map, Observable, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { AddGameDialogService } from '../schedule/add-game/add-game-dialog.service';
import { SortHeaderComponent } from '../shared/components/sort-header/sort-header.component';
import { OpponentListComponent } from './opponent-list/opponent-list.component';
import { OpponentsFilterComponent } from './opponents-filter/opponents-filter.component';
import { ContactSchedulerDialogService } from '../contact-scheduler/contact-scheduler.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    OpponentsFilterComponent,
    OpponentListComponent,
    ButtonModule,
    SortHeaderComponent,
    ProgressSpinnerModule,
  ],
  template: ` <div class="container">
    <app-opponents
      (selectedInputs)="onSearchParamsChanged($event)"
      [associations$]="associations$"
      [userDefault$]="userAssociation$"
    />

    @if (isLoading()) {
      <div class="loading-spinner">
        <p-progressSpinner></p-progressSpinner>
      </div>
    } @else {
      @if (nearbyTeams$ | async; as nearbyTeams) {
        <div class="list-container">
          <app-sort-header
            class="sort-header"
            (sortChanged)="onSortChanged($event)"
            [resultsCount]="nearbyTeams?.length ?? 0"
            [sortFields]="sortFields"
          ></app-sort-header>

          <div class="opponent-list">
            <app-opponent-list
              [opponents]="nearbyTeams"
              (opponentSelected)="onOpponentSelected($event)"
              (contactSchedulerClicked)="contactScheduler($event)"
            />
          </div>
        </div>
      }
    }
  </div>`,
  styleUrls: ['./opponents.component.scss'],
  providers: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsComponent implements OnInit {
  private addGameDialogService = inject(AddGameDialogService);
  private viewContainerRef = inject(ViewContainerRef);
  private openAiService = inject(OpenAiService);
  private contactSchedulerService = inject(ContactSchedulerDialogService);
  private destroyRef = inject(DestroyRef);

  nearbyTeams$: Observable<Ranking[]>;
  associationService = inject(AssociationService);
  teamsService = inject(TeamsService);
  authService = inject(AuthService);

  isLoading = signal<boolean>(false);

  sortFields = [
    setSelect('Distance', 'distance'),
    setSelect('Rating', 'rating'),
  ];

  private searchParams$ = new BehaviorSubject<OpponentSearchParams | null>(
    null,
  );
  private currentSort$ = new BehaviorSubject<{
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

  userAssociation$: Observable<SelectOption<number>> = this.user$.pipe(
    map((user) => ({
      label: user?.association_name,
      value: user?.association_id,
    })),
  );

  associations$: Observable<SelectItem[]> =
    this.associationService.getAssociations();

  ngOnInit(): void {
    this.addGameDialogService.setViewContainerRef(this.viewContainerRef);
    this.contactSchedulerService.setViewContainerRef(this.viewContainerRef);

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
      map(({ teams, sort: sortDir }) =>
        sort([...(teams as Ranking[])], sortDir),
      ),
    );
  }

  onSearchParamsChanged(params: OpponentSearchParams) {
    this.isLoading.set(true);
    this.searchParams$.next(params);
  }

  onSortChanged(sort: { field: string; sortDirection: SortDirection }) {
    this.currentSort$.next(sort);
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
    this.addGameDialogService.openDialog({ opponent: { ...opponent } }, false);
  }

  async contactScheduler(opponent: Ranking) {
    const params = {
      team: opponent.team_name,
      location: `${opponent.city}, ${opponent.state}, ${opponent.country}`,
    };

    // TODO: get scheduler contact info
    // TODO: if no contact info, show message and offer user to add it if they have it
    // TODO: if has contact info , bring up modal, give users the option of selecting open game slots to offer or offer all open games slots.
    // TODO: Let users confirm the initial message
    // TODO: once confirmed send initial message to scheduler using start-conversation endpoint
    return this.openAiService
      .contactScheduler(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response: any) => {
        console.log('contactScheduler response:', response);
        this.contactSchedulerService.openDialog(response[0]);
      });
  }
}
