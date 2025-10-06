import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FilterService, SelectItem } from 'primeng/api';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { IftaLabelModule } from 'primeng/iftalabel';
import { MessageModule } from 'primeng/message';
import { inputId } from '../../utilities/form.utility';

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
  ],
  template: `
    <div class="form-field">
      <p-iftalabel>
        <p-autocomplete
          [id]="inputId(label)"
          [formControl]="control"
          [forceSelection]="true"
          [suggestions]="filteredItems"
          (completeMethod)="filterItems($event)"
          (onSelect)="onSelect($event)"
        >
          <ng-template let-item pTemplate="selectedItem">
            {{ item.label }}
          </ng-template>
        </p-autocomplete>
        <label [for]="inputId(label)">{{ label | titlecase }}</label>
      </p-iftalabel>
      @if (isInvalid()) {
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
  @Input()
  control: FormControl;

  @Input()
  items: SelectItem[];

  @Input()
  label: string;

  filterService = inject(FilterService);

  filteredItems: SelectItem[];

  inputId = inputId;

  onSelect(event: AutoCompleteSelectEvent) {
    this.control?.setValue(event.value);
  }

  isInvalid() {
    return this.control?.invalid && this.control?.touched;
  }

  filterItems(event: AutoCompleteCompleteEvent) {
    let query = event.query;

    this.filteredItems = this.items.filter((item: SelectItem) =>
      item.label?.toLowerCase().includes(query.toLowerCase())
    );
  }
}
