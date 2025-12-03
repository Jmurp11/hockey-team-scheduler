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
import { SortDirection } from '@hockey-team-scheduler/shared-utilities';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectComponent } from '../select/select.component';
import { FormControl, FormGroup } from '@angular/forms';
import { getFormControl } from '@hockey-team-scheduler/shared-utilities';
import { SelectParams } from '@hockey-team-scheduler/shared-utilities';
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
  styleUrls: ['./sort-header.component.scss'],
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
