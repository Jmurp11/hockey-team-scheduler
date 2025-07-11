import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TableComponent } from '../shared/components/table/table.component';
import { ExportColumn } from '../shared/types/export-column.type';
import { TableOptions } from '../shared/types/table-options.type';
import { ScheduleActionsComponent } from './schedule-actions/schedule-actions.component';

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TableComponent,
    ScheduleActionsComponent,
  ],
  template: ` <div class="container">
    <app-schedule-actions class="actions-container"></app-schedule-actions>
    <div class="table-container">
      <app-table
        [tableOpts]="tableOpts"
        [tableData]="tableData"
        [exportColumns]="exportColumns"
      >
        <ng-template #header>
          <tr>
            @for (col of columns; track col.field) {
            <th style="width: 20%">
              {{ col.header | titlecase }}
            </th>
            }
          </tr></ng-template
        >
        <ng-template #body let-rowData>
          <tr>
            @for (col of columns; track col.field) {
            <td>
              {{ rowData[col.field] }}
            </td>
            }
          </tr></ng-template
        >
        <ng-template #emptymessage>
          <tr>
            <td colspan="5">No data found.</td>
          </tr>
        </ng-template>
        ></app-table
      >
    </div>
  </div>`,
  styles: [
    `
      @use '../scss/mixins/flex' as *;

      .container {
        @include flex(flex-start, stretch, column);
        height: 100vh;
        width: 100%;
        padding: 1rem;
        box-sizing: border-box;
      }

      .actions-container {
        @include flex(flex-start, center, column);
        height: auto;
        width: 100%;
        flex-shrink: 0;
        margin-bottom: 1rem;
      }

      .table-container {
        @include flex(flex-start, stretch, column);
        flex: 1;
        width: 100 %;

        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleComponent {
  exportColumns: ExportColumn[];

  tableOpts: TableOptions = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    sortField: 'date',
    sortOrder: 1,
    loading: false,
    globalFilterFields: ['date', 'location', 'opponent', 'gameType'],
    scrollable: true,
    scrollHeight: 'calc(100vh - 200px)',
    frozenValue: undefined,
    stateStorage: 'session',
    stateKey: 'hs-schedule-session',
    datakey: undefined,
  };

  columns = [
    { field: 'date', header: 'Date' },
    { field: 'time', header: 'Time' },
    { field: 'location', header: 'Location' },
    { field: 'opponent', header: 'Opponent' },
    { field: 'gameType', header: 'Game Type' },
  ];
  tableData = [
    {
      id: 1,
      date: '2025-09-15',
      time: '19:30',
      location: 'Scotiabank Arena',
      opponent: 'Toronto Marauders',
      gameType: 'Exhibition',
    },
    {
      id: 2,
      date: '2025-09-22',
      time: '20:00',
      location: 'Valley Ice Center',
      opponent: 'Oakville Blades',
      gameType: 'Regular Season',
    },
    {
      id: 3,
      date: '2025-09-29',
      time: '18:45',
      location: 'Riverside Community Rink',
      opponent: 'Hamilton Hawks',
      gameType: 'Regular Season',
    },
    {
      id: 4,
      date: '2025-10-06',
      time: '19:00',
      location: 'Memorial Sports Complex',
      opponent: 'Mississauga Monarchs',
      gameType: 'Regular Season',
    },
    {
      id: 5,
      date: '2025-10-13',
      time: '17:30',
      location: 'Scotiabank Arena',
      opponent: 'Burlington Bulldogs',
      gameType: 'Regular Season',
    },
    {
      id: 6,
      date: '2025-10-20',
      time: '20:15',
      location: 'East End Ice Palace',
      opponent: 'Brampton Bears',
      gameType: 'Regular Season',
    },
    {
      id: 7,
      date: '2025-10-27',
      time: '19:30',
      location: 'Scotiabank Arena',
      opponent: 'Vaughan Vikings',
      gameType: 'Regular Season',
    },
    {
      id: 8,
      date: '2025-11-03',
      time: '18:00',
      location: 'West Hill Arena',
      opponent: 'Etobicoke Eagles',
      gameType: 'Cup Tournament',
    },
    {
      id: 9,
      date: '2025-11-10',
      time: '19:45',
      location: 'Scotiabank Arena',
      opponent: 'Richmond Hill Raiders',
      gameType: 'Cup Tournament',
    },
    {
      id: 10,
      date: '2025-11-17',
      time: '20:30',
      location: 'Northern Community Center',
      opponent: 'Markham Mustangs',
      gameType: 'Cup Final',
    },
    {
      id: 11,
      date: '2025-11-24',
      time: '19:15',
      location: 'Caledon Centre',
      opponent: 'Caledon Cougars',
      gameType: 'Regular Season',
    },
    {
      id: 12,
      date: '2025-12-01',
      time: '18:30',
      location: 'Pickering Recreation Complex',
      opponent: 'Pickering Panthers',
      gameType: 'Regular Season',
    },
    {
      id: 13,
      date: '2025-12-08',
      time: '20:45',
      location: 'Aurora Community Centre',
      opponent: 'Aurora Tigers',
      gameType: 'Regular Season',
    },
    {
      id: 14,
      date: '2025-12-15',
      time: '17:45',
      location: 'Newmarket Ice Palace',
      opponent: 'Newmarket Hurricanes',
      gameType: 'Regular Season',
    },
    {
      id: 15,
      date: '2025-12-22',
      time: '19:00',
      location: 'Whitby Sports Centre',
      opponent: 'Whitby Wolves',
      gameType: 'Holiday Tournament',
    },
    {
      id: 16,
      date: '2025-12-29',
      time: '18:15',
      location: 'Oshawa Civic Centre',
      opponent: 'Oshawa Generals',
      gameType: 'Holiday Tournament',
    },
    {
      id: 17,
      date: '2026-01-05',
      time: '20:00',
      location: 'Ajax Community Centre',
      opponent: 'Ajax Knights',
      gameType: 'Regular Season',
    },
    {
      id: 18,
      date: '2026-01-12',
      time: '19:30',
      location: 'Richmond Hill Arena',
      opponent: 'Richmond Hill Rockets',
      gameType: 'Regular Season',
    },
    {
      id: 19,
      date: '2026-01-19',
      time: '18:00',
      location: 'Thornhill Community Centre',
      opponent: 'Thornhill Thunder',
      gameType: 'Regular Season',
    },
    {
      id: 20,
      date: '2026-01-26',
      time: '20:15',
      location: 'Scarborough Ice Arena',
      opponent: 'Scarborough Sharks',
      gameType: 'Playoff',
    },
  ];

  constructor() {
    this.exportColumns = this.columns.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }
}
