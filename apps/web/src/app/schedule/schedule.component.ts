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
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinner } from 'primeng/progressspinner';
import { BehaviorSubject, Observable, of, switchMap, take, tap } from 'rxjs';
import {
  AuthService,
  OpenAiService,
  ScheduleRiskService,
} from '@hockey-team-scheduler/shared-data-access';
import { CardComponent } from '../shared/components/card/card.component';
import { TableComponent } from '../shared/components/table/table.component';
import {
  AddGameService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  ExportColumn,
  Game,
  Ranking,
  TableOptions,
  UserProfile,
} from '@hockey-team-scheduler/shared-utilities';
import {
  ScheduleActionsComponent,
  TeamSelectionEvent,
} from './schedule-actions/schedule-actions.component';
import { AddGameDialogService } from './add-game/add-game-dialog.service';
import { ToastService } from '../shared/services/toast.service';
import { ContactSchedulerDialogService } from '../contact-scheduler/contact-scheduler.service';

@Component({
  selector: 'app-schedule',
  standalone: true,
  providers: [],
  imports: [
    CommonModule,
    ButtonModule,
    MenuModule,
    RouterModule,
    TableComponent,
    ScheduleActionsComponent,
    CardComponent,
    ProgressSpinner,
  ],
  template: ` <div class="container">
    @if (contactingScheduler()) {
      <div class="loading-overlay">
        <p-progressSpinner></p-progressSpinner>
      </div>
    }
    <div class="schedule-header">
      <app-schedule-actions
        class="actions-container"
        (teamSelectionChange)="onTeamSelectionChange($event)"
      />
    </div>
    @if (tableData$ | async; as tableData) {
      @if (loading()) {
        <div class="loading-spinner">
          <p-progressSpinner></p-progressSpinner>
        </div>
      } @else if (tableData.length > 0) {
        <app-table
          [tableOpts]="tableOpts"
          [tableData]="tableData"
          [exportColumns]="exportColumns"
          [hasActions]="true"
        >
          <ng-template #header></ng-template>
          <ng-template #body let-rowData>
            <tr [ngClass]="getRowClass(rowData)">
              @for (col of tableOpts.columns; track col.field) {
                <td [ngStyle]="{ width: col.width }">
                  {{ rowData[col.field] }}
                </td>
              }
              <td>
                <p-button
                  (click)="actionsMenu.toggle($event)"
                  icon="pi pi-chevron-down"
                  label="Actions"
                  iconPos="right"
                  text="true"
                  rounded="true"
                  severity="primary"
                />
                <p-menu
                  #actionsMenu
                  [popup]="true"
                  [model]="actions"
                  (onShow)="getActions(rowData)"
                  appendTo="body"
                />
              </td>
            </tr>
          </ng-template>
          <ng-template #emptymessage>
            <tr>
              <td colspan="5">No data found.</td>
            </tr>
          </ng-template>
        </app-table>
      } @else {
        <div class="no-games">
          <app-card class="card">
            <ng-template #content>
              <p>
                You have no games scheduled. Click "Add Game" to get started!
                Click Upload CSV to upload a batch of games
              </p>
            </ng-template>
          </app-card>
        </div>
      }
    } @else {
      <div class="loading-spinner">
        <p-progressSpinner></p-progressSpinner>
      </div>
    }
  </div>`,
  styleUrls: ['./schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private scheduleRiskService = inject(ScheduleRiskService);
  private addGameDialogService = inject(AddGameDialogService);
  private viewContainerRef = inject(ViewContainerRef);
  private toastService = inject(ToastService);
  private contactSchedulerService = inject(ContactSchedulerDialogService);
  private openAiService = inject(OpenAiService);
  private destroyRef = inject(DestroyRef);

  // Team selection for reactive games loading
  private currentUser = this.authService.currentUser;
  private teamSelection$ = new BehaviorSubject<TeamSelectionEvent | null>(null);

  // Loading state
  loading = signal(true);
  contactingScheduler = signal(false);

  exportColumns: ExportColumn[];

  tableOpts: TableOptions = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    sortField: 'date',
    sortOrder: 1,
    loading: false,
    globalFilterFields: ['date', 'location', 'opponent', 'rink', 'game_type'],
    scrollable: true,
    scrollHeight: 'calc(100vh - 200px)',
    frozenValue: undefined,
    stateStorage: 'session',
    stateKey: 'hs-schedule-session',
    datakey: undefined,
    columns: [
      { field: 'date', header: 'Date', sortable: true },
      { field: 'time', header: 'Time', sortable: false },
      { field: 'rink', header: 'Rink', sortable: false },
      {
        field: 'location',
        header: 'Location',
        sortable: false,
      },
      {
        field: 'displayOpponent',
        header: 'Opponent',
        sortable: false,
      },
      {
        field: 'game_type',
        header: 'Game Type',
        sortable: false,
      },
    ],
  };

  user$: Observable<UserProfile | null> = toObservable(
    this.authService.currentUser,
  );
  tableData$: Observable<Game[] | null> | undefined;

  actions: any[] = [];

  constructor() {
    this.exportColumns = this.tableOpts.columns.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  ngOnInit(): void {
    this.addGameDialogService.setViewContainerRef(this.viewContainerRef);
    this.contactSchedulerService.setViewContainerRef(this.viewContainerRef);

    const user = this.currentUser();

    // Set up reactive games based on team selection
    this.tableData$ = this.teamSelection$.pipe(
      tap(() => this.loading.set(true)),
      switchMap((selection) => {
        return this.dynamicTableData(selection).pipe(
          tap((games) => {
            this.loading.set(false);
            // Evaluate schedule risks whenever games change
            this.scheduleRiskService.evaluate(games);
          })
        );
      }),
    );

    // Initialize with user's own schedule
    if (user?.user_id) {
      this.teamSelection$.next({ type: 'user', id: user.user_id });
    }
  }

  onTeamSelectionChange(event: TeamSelectionEvent): void {
    this.teamSelection$.next(event);
  }

  dynamicTableData(selection: TeamSelectionEvent | null): Observable<Game[]> {
    if (!selection) {
      // Default: show current user's games
      const userId = this.currentUser()?.user_id;
      return userId ? this.scheduleService.gamesFull(userId) : of([]);
    }

    switch (selection.type) {
      case 'association':
        return this.scheduleService.gamesFullByAssociation(selection.id);
      case 'team':
        return this.scheduleService.gamesFullByTeam(selection.id);
      case 'user':
      default:
        return this.scheduleService.gamesFull(selection.id);
    }
  }

  getRowClass(rowData: any) {
    return !rowData.displayOpponent ? 'is-open' : null;
  }

  getActions(rowData: any) {
    this.actions = [
      {
        label: 'Contact Team Manager',
        icon: 'pi pi-comment',
        iconPos: 'right',
        command: () => {
          const opponent = {
            ...rowData.opponent[0],
            team_name: rowData.opponent[0].name,
          };
          this.contactScheduler(opponent);
        },
      },
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        iconPos: 'right',
        command: () => {
          this.addGameDialogService.openDialog(
            this.scheduleService.formatUpdateData(rowData),
            true,
          );
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        iconPos: 'right',
        command: () => {
          this.scheduleService.setDeleteRecord(rowData.id);
          this.scheduleService
            .deleteGame(rowData.id)
            .pipe(take(1))
            .subscribe((response) => {
              if (response.message === 'Game deleted successfully') {
                this.toastService.presentToast({
                  severity: 'success',
                  summary: 'Game Deleted',
                  detail: 'The game has been successfully deleted.',
                });
              } else {
                this.toastService.presentToast({
                  severity: 'error',
                  summary: 'Delete Failed',
                  detail:
                    'There was an error deleting the game. Please try again.',
                });
              }
            });
        },
      },
    ];
  }

  //TODO: move to shared service
  async contactScheduler(opponent: Ranking) {
    const params = {
      team: opponent.team_name,
      location: `${opponent.city}, ${opponent.state}, ${opponent.country}`,
    };

    this.contactingScheduler.set(true);

    return this.openAiService
      .contactScheduler(params)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.contactingScheduler.set(false);
          this.contactSchedulerService.openDialog(response[0]);
        },
        error: () => {
          this.contactingScheduler.set(false);
        },
      });
  }
}
