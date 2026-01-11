import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ExportColumn, TableOptions } from '@hockey-team-scheduler/shared-utilities';

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    TableModule,
  ],
  template: `<p-table
    #dt
    [value]="tableData"
    [paginator]="tableOpts.paginator ?? false"
    [loading]="tableOpts.loading ?? false"
    [globalFilterFields]="tableOpts.globalFilterFields"
    [scrollable]="tableOpts.scrollable"
    [scrollHeight]="tableOpts.scrollHeight"
    [frozenValue]="tableOpts.frozenValue"
    [stateStorage]="tableOpts.stateStorage"
    [stateKey]="tableOpts.stateKey"
    [dataKey]="tableOpts.datakey"
    [sortField]="tableOpts.sortField"
    [sortOrder]="tableOpts.sortOrder"
    [rows]="tableOpts.rows"
    [columns]="exportColumns"
    [rowsPerPageOptions]="tableOpts.rowsPerPageOptions"
    [tableStyle]="{ 'min-width': '85vw' }"
  >
    <ng-template #caption class="center">
      <div class="caption">
        <div>
          <p-iconfield iconPosition="left" class="ml-auto">
            <p-inputicon>
              <i class="pi pi-search"></i>
            </p-inputicon>
            <input
              pInputText
              type="text"
              (input)="onFilterInput(dt, $event)"
              placeholder="Search keyword"
            />
          </p-iconfield>
        </div>
        <div class="text-end pb-4">
          <p-button
            icon="pi pi-external-link"
            size="small"
            label="Export"
            (click)="exportCSV()"
          />
        </div>
      </div>
    </ng-template>
    <ng-template pTemplate="header">
      <tr>
        @for (col of tableOpts.columns; track col.field) { @if (col.sortable) {
        <th [pSortableColumn]="col.field">
          {{ col.header | titlecase }}
          <p-sortIcon [field]="col.field"></p-sortIcon>
        </th>
        } @else {
        <th>
          {{ col.header | titlecase }}
        </th>
        }} @if (hasActions) {
        <th></th>
        }
      </tr></ng-template
    >
    <ng-template pTemplate="body" let-rowData
      ><ng-container
        *ngTemplateOutlet="body; context: { $implicit: rowData }"
      ></ng-container
    ></ng-template>
    @if (emptymessage) {
      <ng-template pTemplate="emptymessage">
        <ng-container *ngTemplateOutlet="emptymessage"></ng-container>
      </ng-template>
    }
  </p-table>`,
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T> {
  @ContentChild('header') header: TemplateRef<any> | undefined;
  @ContentChild('body') body: TemplateRef<any> | undefined;
  @ContentChild('emptymessage') emptymessage: TemplateRef<any> | undefined;

  @Input() tableOpts: TableOptions;
  @Input() tableData: T[];
  @Input() exportColumns: ExportColumn[];
  @Input() hasActions: boolean = false;

  onFilterInput(dt: Table, event: Event): void {
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }

  exportCSV(): void {
    const data = this.createCsv(this.exportColumns, this.tableData);

    const headers = this.exportColumns.map((col) => col.title).join(',');
    const rows = this.formatRows(data);
    const csv = [headers, ...rows].join('\n');

    this.downloadCsv(csv, 'rinklink_team_schedule.csv');
  }

  createCsv(exportColumns: ExportColumn[], tableData: T[]): any[] {
    return tableData.map((row) => {
      const csvRow: any = {};
      exportColumns.forEach((col) => {
        csvRow[col.title] = row[col.dataKey as keyof T];
      });
      return csvRow;
    });
  }

  formatRows(data: any[]) {
    return data.map((row) =>
      this.exportColumns
        .map((col) => {
          const value = row[col.title];
          // Escape commas and quotes
          return typeof value === 'string' &&
            (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value ?? '';
        })
        .join(',')
    );
  }

  downloadCsv(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
