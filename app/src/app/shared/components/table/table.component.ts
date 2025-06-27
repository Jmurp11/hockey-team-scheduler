import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ContentChild,
  Input,
  TemplateRef,
} from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { Table, TableModule } from 'primeng/table';
import { ExportColumn } from '../../types/export-column.type';
import { TableOptions } from '../../types/table-options.type';

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
    stripedRows
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
            label="Export"
            (click)="exportCSV(dt)"
          />
        </div>
      </div>
    </ng-template>
    <ng-template pTemplate="header"
      ><ng-container *ngTemplateOutlet="header"></ng-container
    ></ng-template>
    <ng-template pTemplate="body" let-rowData
      ><ng-container
        *ngTemplateOutlet="body; context: { $implicit: rowData }"
      ></ng-container
    ></ng-template>
    <ng-template #emptymessage
      ><ng-container *ngTemplateOutlet="emptymessage"></ng-container>
    </ng-template>
  </p-table>`,
  styles: [
    `
      @use '../../../scss/mixins/flex' as *;

      .center {
        @include flex(center, center, column);
      }

      .caption {
        @include flex(flex-end, center, row);
        gap: 1rem;
        width: 100%;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableComponent<T> {
  @ContentChild('header') header: TemplateRef<any> | undefined;
  @ContentChild('body') body: TemplateRef<any> | undefined;
  @ContentChild('emptymessage') emptymessage: TemplateRef<any> | undefined;

  @Input() tableOpts: TableOptions;
  @Input() tableData: T[];
  @Input() exportColumns: ExportColumn[];


  onFilterInput(dt: Table, event: Event): void {
    const target = event.target as HTMLInputElement;
    dt.filterGlobal(target.value, 'contains');
  }

  exportCSV(dt: Table): void {
    console.log(dt.value);
    dt.exportCSV();
  }
}
