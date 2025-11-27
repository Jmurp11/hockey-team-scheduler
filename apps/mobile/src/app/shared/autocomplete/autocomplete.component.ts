import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { TypeaheadComponent } from '../typeahead/typeahead.component';
import { InputComponent } from '../input/input.component';
import { AutocompleteOption } from '../types/autocomplete-option.type';

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, IonModal, TypeaheadComponent, InputComponent],
  template: `
    <app-input
      [id]="label"
      class="form-field"
      [label]="label"
      [labelPlacement]="labelPlacement"
      [fill]="fill"
      [value]="displayValue"
      [readonly]="true"
      [disabled]="disabled"
      [formControl]="control"
    />

    <ion-modal [trigger]="label" #modal>
      <ng-template>
        <app-typeahead
          class="ion-page"
          [items]="items"
          (selectionChange)="onSelectionChange($event)"
          (selectionCancel)="onSelectionCancel()"
        ></app-typeahead>
      </ng-template>
    </ion-modal>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor {
  @ViewChild('modal', { static: false }) modal!: IonModal;

  @Input() items: AutocompleteOption[] = [];
  @Input() type: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' =
    'text';
  @Input() placeholder?: string;
  @Input() value?: string | number | null;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() clearInput = false;
  @Input() color?: string;
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked' | 'floating';
  @Input() fill?: 'outline' | 'solid';
  @Input() shape?: 'round';
  @Input() required = false;
  @Input() control?: FormControl;
  @Output() selectionCancel = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<AutocompleteOption>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | number | null) => void = (_value: string | number | null) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  get displayValue(): string {
    // If using FormControl, return its value directly (should be the label)
    if (this.control) {
      return this.control.value || '';
    }
    
    // Fallback to finding the label from the stored value
    if (this.value === null || this.value === undefined || !this.items.length) {
      return '';
    }

    const selectedItem = this.items.find(
      (item) => item.value === this.value,
    );
    return selectedItem ? selectedItem.label : '';
  }

  onSelectionChange(selectedItem: AutocompleteOption) {
    // Store the full object as the internal value for ControlValueAccessor
    this.value = selectedItem.value;
    
    // For FormControl, set the label as the display value without emitting changes
    if (this.control) {
      this.control.setValue(selectedItem.label, { emitEvent: false });
      this.control.markAsTouched();
    }
    
    // Notify the parent component about the actual value change (not the label)
    this.onChange(selectedItem.value);
    this.onTouched();

    this.selectionChange.emit(selectedItem);
    this.modal.dismiss();
  }

  onSelectionCancel() {
    this.selectionCancel.emit();
    this.modal.dismiss();
  }

  // ControlValueAccessor implementation
  writeValue(value: string | number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
