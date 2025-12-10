import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewContainerRef,
} from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { ProgressSpinner } from 'primeng/progressspinner';
import { filter, Observable, switchMap, take } from 'rxjs';
import { AuthService } from '@hockey-team-scheduler/shared-data-access';
import { CardComponent } from '../shared/components/card/card.component';
import { TableComponent } from '../shared/components/table/table.component';
import {
  AddGameService,
  ScheduleService,
} from '@hockey-team-scheduler/shared-data-access';
import {
  ExportColumn,
  TableOptions,
} from '@hockey-team-scheduler/shared-utilities';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';
import { AddGameDialogService } from './add-game/add-game-dialog.service';
import { ToastService } from '../shared/services/toast.service';

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
    <app-schedule-actions class="actions-container" />
    @if (tableData$ | async; as tableData) {
      @if (tableData === null) {
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
    }
  </div>`,
  styleUrls: ['./schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private addGameDialogService = inject(AddGameDialogService);
  private viewContainerRef = inject(ViewContainerRef);
  private toastService = inject(ToastService);

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

  user$: Observable<any> = toObservable(this.authService.currentUser);
  tableData$: Observable<any[] | null> | undefined;

  actions: any[] = [];

  constructor() {
    this.exportColumns = this.tableOpts.columns.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }

  ngOnInit(): void {
    this.addGameDialogService.setViewContainerRef(this.viewContainerRef);

    this.tableData$ = this.user$.pipe(
      filter((user) => !!user && !!user.user_id),
      switchMap((user) => this.scheduleService.gamesFull(user.user_id)),
    );
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
          console.log('Contact Team Manager for game id:', rowData.id);
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
          this.scheduleService.optimisticDeleteGame(rowData.id);
          this.scheduleService
            .deleteGame(rowData.id)
            .pipe(take(1))
            .subscribe((response) => {
              if (!response) {
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
}
