import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  ViewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { inputId, toTitleCase } from '@hockey-team-scheduler/shared-utilities';
import { FilterService, SelectItem } from 'primeng/api';
import {
  AutoComplete,
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-auto-complete',
  standalone: true,
  imports: [
    CommonModule,
    AutoCompleteModule,
    IftaLabelModule,
    MessageModule,
    ReactiveFormsModule,
    ButtonModule,
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <p-autocomplete
          #autoComplete
          [id]="inputId(label)"
          [formControl]="control"
          [forceSelection]="true"
          [suggestions]="filteredItems"
          (completeMethod)="filterItems($event)"
          [showClear]="true"
          [disabled]="disabled"
          (onSelect)="onSelect($event)"
          [optionLabel]="optionLabel"
          [optionValue]="optionValue"
        >
          <ng-template let-item pTemplate="selectedItem" #item>
            @if (isRink) {
              <div class="rink">
                <div class="rink__item">
                  <span class="rink__label">{{ item.label }}</span>
                </div>
                <div class="rink__address">
                  {{ item.value.city }}, {{ item.value.state }},
                  {{ item.value.country }}
                </div>
              </div>
            } @else {
              {{ item.label }}
            }
          </ng-template>
          @if (allowAddNew) {
            <ng-template #footer>
              <div class="px-3 py-3">
                <p-button
                  label="Add New"
                  fluid
                  severity="secondary"
                  text
                  size="small"
                  icon="pi pi-plus"
                  (click)="addNewItem()"
                />
              </div>
            </ng-template>
          }
        </p-autocomplete>
        <label [for]="inputId(label)">{{ label | titlecase }}</label>
      </p-iftalabel>
      @if (control.invalid && (control.dirty || control.touched)) {
        <p-message severity="error" size="small" variant="simple"
          >{{ label | titlecase }} is required.</p-message
        >
      }
    </div>
  `,
  styleUrls: ['./auto-complete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCompleteComponent {
  @ViewChild('autoComplete') autoComplete!: AutoComplete;

  @Input()
  control: FormControl;

  @Input()
  items: SelectItem[];

  @Input()
  label: string;

  @Input() disabled = false;

  @Input() optionLabel: string;

  @Input() optionValue: string;

  @Input() allowAddNew = false;

  @Input() isRink = false;

  filterService = inject(FilterService);

  filteredItems: SelectItem[] = [];
  private lastQuery = '';

  inputId = inputId;
  showOverlay = true;

  filterItems(event: AutoCompleteCompleteEvent) {
    const query = event.query.toLowerCase();
    this.lastQuery = event.query;

    this.filteredItems = this.items.filter((item) =>
      item.label?.toLowerCase().includes(query),
    );
  }

  onSelect(event: AutoCompleteSelectEvent) {
    this.control.setValue(event.value);
  }

  addNewItem() {
    if (!this.lastQuery) return;

    const newItem: SelectItem = {
      label: toTitleCase(this.lastQuery),
      value: 'New Item',
    };

    this.control.setValue(newItem);

    this.autoComplete.hide();
  }
}
