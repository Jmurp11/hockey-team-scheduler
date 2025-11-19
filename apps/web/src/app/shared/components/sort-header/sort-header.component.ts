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
import { InputComponent } from '../input/input.component';
import { combineLatest, startWith } from 'rxjs';

@Component({
  selector: 'app-sort-header',
  imports: [
    CommonModule,
    ButtonModule,
    InputComponent,
    SelectComponent,
    IconSelectButtonComponent,
  ],
  standalone: true,
  template: `
    <div class="sort-header">
      <div class="sort-header__results">
        Showing {{ resultsCount ?? 0 }} results
      </div>
      @if (showSearch) {
      <div class="sort-header__search">
        <app-input
          [control]="getFormControl(form, 'search')"
          [label]="'Search Tournaments, Locations, etc.'"
        />
      </div>
      }
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

      .sort-header__search {
        @include flex(flex-start, center, row);
        width: 40%;

        ::ng-deep app-input {
          width: 100%;

          .p-input {
            height: 3.5rem !important;
          }

          .form-field {
            width: 100% !important;
            margin-bottom: 0 !important;

            @media (max-width: 1024px) {
              min-width: 150px !important;
              max-width: 215px !important;
            }
          }
        }
      }

      .sort-header__sort {
        @include flex(flex-end, center, row);
        width: 30%;

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

  @Output() searchChanged = new EventEmitter<string | null>();

  @Input() resultsCount: number | null = null;

  @Input() sortFields: { label: string; value: string }[] = [];

  @Input() showSearch = false;

  private destroyRef = inject(DestroyRef);

  sortOptions: SelectParams<{ label: string; value: string }>;

  sortIconOptions: { icon: string; sort: SortDirection }[] = [
    { icon: 'pi pi-sort-amount-up', sort: 'asc' },
    { icon: 'pi pi-sort-amount-down', sort: 'desc' },
  ];

  form: FormGroup;

  getFormControl = getFormControl;

  ngOnInit() {
    this.sortOptions = {
      itemLabel: 'label',
      listItems: this.sortFields,
      placeholder: '',
      isAutoComplete: false,
      emptyMessage: 'No sort options',
      errorMessage: 'ERROR',
      showClear: false,
    };

    this.form = new FormGroup({
      search: new FormControl<string | null>(null),
      sort: new FormControl<{ label: string; value: string } | null>(
        this.sortFields[0]
      ),
      sortDirection: new FormControl<SortDirection>('asc'),
    });

    combineLatest([
      this.getFormControl(this.form, 'sort').valueChanges.pipe(
        startWith(this.getFormControl(this.form, 'sort').value)
      ),
      this.getFormControl(this.form, 'sortDirection').valueChanges.pipe(
        startWith(this.getFormControl(this.form, 'sortDirection').value)
      ),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([sort, sortDirection]) => {
        this.onSortChanged({ sort, sortDirection });
      });

    this.getFormControl(this.form, 'search')
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((search) => {
        this.onSearchChanged({ search });
      });
  }

  onSortChanged(value: {
    sort: {
      label: string;
      value: string;
    } | null;
    sortDirection: SortDirection | null;
  }) {
    this.sortChanged.emit({
      field: value.sort?.value ?? this.sortFields[0].value,
      sortDirection: value.sortDirection ?? 'asc',
    });
  }

  onSearchChanged(value: { search: string | null }) {
    this.searchChanged.emit(value.search);
  }
}
