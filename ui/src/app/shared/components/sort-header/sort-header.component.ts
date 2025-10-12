import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { SortDirection } from './sort-header.type';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectComponent } from '../select/select.component';
import { FormControl, FormGroup } from '@angular/forms';
import { getFormControl } from '../../utilities/form.utility';
import { SelectParams } from '../../types/form-item.type';
import { IconSelectButtonComponent } from '../icon-select-button/icon-select-button.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-sort-header',
  imports: [
    CommonModule,
    ButtonModule,
    SelectComponent,
    IconSelectButtonComponent,
  ],
  standalone: true,
  template: `
    <div class="sort-header">
      <div class="sort-header__results">
        Showing {{ resultsCount ?? 0 }} results
      </div>

      <div class="sort-header__sort">
        <app-select
          [control]="getFormControl(form, 'sort')"
          [options]="sortOptions"
          label="Sort by"
        />
        <app-icon-select-button
          [options]="[
            { icon: 'pi pi-sort-amount-up', value: 'asc' },
            { icon: 'pi pi-sort-amount-down', value: 'desc' }
          ]"
          [control]="getFormControl(form, 'sortDirection')"
        />
      </div>
    </div>
  `,
  styles: [
    `
      @use '../../../scss/mixins/flex' as *;

      :host {
        width: 100%;
        padding-top: 0.5rem;
      }
      .sort-header {
        @include flex(space-between, center, row);
      }

      .sort-header__results {
        @include flex(flex-start, center, row);
        font-size: 0.9rem;
        color: #64748b;
        width: 30%;
      }

      .sort-header__sort {
        @include flex(flex-end, center, row);
        width: 70%;

        ::ng-deep app-select {
          .p-select-option-selected {
            background: var(--secondary-100);
            color: var(--secondary-600);
          }

          .p-select {
            height: 3.5rem;
          }
          .form-field {
            min-width: 150px !important;
          }
        }

        ::ng-deep app-icon-select-button {
          .p-selectbutton {
            height: 3.5rem;
          }

          .form-field {
            min-width: 100px !important;
            margin-bottom: 0 !important;
          }
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortHeaderComponent implements OnInit {
  @Output() sortChanged = new EventEmitter<{
    field: string;
    sortDirection: SortDirection;
  }>();

  @Input() resultsCount: number | null = null;

  private destroyRef = inject(DestroyRef);

  sortFields = [
    { label: 'Distance', value: 'distance' },
    { label: 'Rating', value: 'rating' },
  ];

  sortOptions: SelectParams<{ label: string; value: string }> = {
    itemLabel: 'label',
    listItems: this.sortFields,
    placeholder: '',
    isAutoComplete: false,
    emptyMessage: 'No sort options',
    errorMessage: 'ERROR',
    showClear: false,
  };

  sortIconOptions: { icon: string; sort: SortDirection }[] = [
    { icon: 'pi pi-sort-amount-up', sort: 'asc' },
    { icon: 'pi pi-sort-amount-down', sort: 'desc' },
  ];

  form = new FormGroup({
    sort: new FormControl<{ label: string; value: string } | null>(
      this.sortFields[0]
    ),
    sortDirection: new FormControl<SortDirection>('asc'),
  });

  getFormControl = getFormControl;

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) =>
        this.sortChanged.emit({
          field: value.sort?.value ?? this.sortFields[0].value,
          sortDirection: value.sortDirection ?? 'asc',
        })
      );
  }
}
