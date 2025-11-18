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
import { AuthService } from '../auth/auth.service';
import { CardComponent } from '../shared/components/card/card.component';
import { TableComponent } from '../shared/components/table/table.component';
import { AddGameService } from '../shared/services/add-game.service';
import { ScheduleService } from '../shared/services/schedule.service';
import { ExportColumn } from '../shared/types/export-column.type';
import { TableOptions } from '../shared/types/table-options.type';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';

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
    @if (tableData$ | async; as tableData) { @if (tableData === null) {
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
        <tr>
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
            You have no games scheduled. Click "Add Game" to get started! Click
            Upload CSV to upload a batch of games
          </p>
        </ng-template>
      </app-card>
    </div>
    } }
  </div>`,
  styleUrls: ['./schedule.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent implements OnInit {
  private authService = inject(AuthService);
  private scheduleService = inject(ScheduleService);
  private addGameService = inject(AddGameService);
  private viewContainerRef = inject(ViewContainerRef);

  exportColumns: ExportColumn[];

  tableOpts: TableOptions = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    sortField: 'date',
    sortOrder: 1,
    loading: false,
    globalFilterFields: ['date', 'location', 'opponent', 'rink', 'gameType'],
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
        field: 'gameType',
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
    this.addGameService.setViewContainerRef(this.viewContainerRef);

    this.tableData$ = this.user$.pipe(
      filter((user) => !!user && !!user.user_id),
      switchMap((user) => this.scheduleService.gamesFull(user.user_id))
    );
  }

  getActions(rowData: any) {
    this.actions = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        iconPos: 'right',
        command: () => {
          this.addGameService.openDialog(
            this.scheduleService.formatUpdateData(rowData),
            true
          );
        },
      },
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        iconPos: 'right',
        command: () => {
          this.scheduleService.optimisticDeleteGame(rowData.id);
          this.scheduleService.deleteGame(rowData.id).pipe(take(1)).subscribe();
        },
      },
    ];
  }
}
