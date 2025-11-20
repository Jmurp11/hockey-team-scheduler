import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TableComponent } from '../../shared/components/table/table.component';
import { ExportColumn, TableOptions } from '@hockey-team-scheduler/shared-utilities';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-opponents-table',
  standalone: true,
  imports: [CommonModule, RouterModule, TableComponent],
  template: ` <div class="table-container">
    <app-table
      [tableOpts]="tableOpts"
      [tableData]="tableData"
      [exportColumns]="exportColumns"
    >
      <ng-template #header> </ng-template>
      <ng-template #body let-rowData>
        <tr>
          @for (col of tableOpts.columns; track col.field) {
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
  </div>`,
  styles: [
    `
      @use '../../scss/mixins/flex' as *;

      .table-container {
        @include flex(flex-start, stretch, column);
        flex: 1;
        width: 100%;
        height: 600px;
        min-height: 0;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentsTableComponent {
  @Input() tableData: any[] = [];

  exportColumns: ExportColumn[];

  tableOpts: TableOptions = {
    paginator: true,
    rows: 10,
    rowsPerPageOptions: [5, 10, 20, 50],
    sortField: 'distance',
    sortOrder: 1,
    loading: false,
    globalFilterFields: ['team_name', 'association'],
    scrollable: true,
    scrollHeight: 'calc(100vh - 200px)',
    frozenValue: undefined,
    stateStorage: 'session',
    stateKey: 'opponents-session',
    datakey: undefined,
    columns: [
      { field: 'team_name', header: 'Team', sortable: false },
      { field: 'name', header: 'Association', sortable: false },
      { field: 'distance', header: 'Distance (mi)', sortable: true },
      { field: 'rating', header: 'Rating', sortable: true },
    ],
  };

  constructor() {
    this.exportColumns = this.tableOpts.columns.map((col) => ({
      title: col.header,
      dataKey: col.field,
    }));
  }
}
