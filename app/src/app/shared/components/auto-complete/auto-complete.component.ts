import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterService, SelectItem } from 'primeng/api';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
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
  ],
  template: `
    <form [formGroup]="parentForm">
      <div class="form-field">
        <p-iftalabel>
          <p-autocomplete
            [formControlName]="fcName"
            [forceSelection]="true"
            [suggestions]="filteredItems"
            (completeMethod)="filterItems($event)"
            (onSelect)="onSelect($event)"
          >
            <ng-template let-item pTemplate="selectedItem">
              {{ item.label }}
            </ng-template>
          </p-autocomplete>
          <label [for]="fcName">{{ fcName | titlecase }}</label>
        </p-iftalabel>
        @if (isInvalid(fcName)) {
        <p-message severity="error" size="small" variant="simple"
          >{{ fcName | titlecase }} is required.</p-message
        >
        }
      </div>
    </form>
  `,
  styleUrls: ['./auto-complete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoCompleteComponent {
  @Input()
  parentForm: FormGroup;

  @Input()
  fcName: string;

  @Input()
  items: SelectItem[];

  filterService = inject(FilterService);

  filteredItems: SelectItem[];

  onSelect(event: AutoCompleteSelectEvent) {
    this.parentForm.get(this.fcName)?.setValue(event.value);
    console.log(this.parentForm.get(this.fcName)?.value);
  }

  isInvalid(formControlName: string) {
    return (
      this.parentForm.get(formControlName)?.invalid &&
      this.parentForm.get(formControlName)?.touched
    );
  }

  filterItems(event: AutoCompleteCompleteEvent) {
    console.log({ items: this.items });
    let query = event.query;

    this.filteredItems = this.items.filter((item: SelectItem) =>
      item.label?.toLowerCase().includes(query.toLowerCase())
    );
  }
}
