import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
} from '@angular/forms';
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
      (click)="modal.present()"
    />

    <ion-modal [trigger]="label" #modal>
      <ng-template>
        <app-typeahead
          class="ion-page"
          [items]="items"
          [title]="label"
          (selectionChange)="onSelectionChange($event)"
          (selectionCancel)="onSelectionCancel()"
        ></app-typeahead>
      </ng-template>
    </ion-modal>
  `,
  styles: [``],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent implements ControlValueAccessor {
  @ViewChild('modal') modal!: IonModal;

  @Input() items: AutocompleteOption[] = [];
  @Input() control?: FormControl;

  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked' | 'floating';
  @Input() fill?: 'outline' | 'solid';
  @Input() disabled = false;

  @Output() selectionCancel = new EventEmitter<void>();
  @Output() selectionChange = new EventEmitter<AutocompleteOption>();

  private internalValue: any = null;
  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  /**
   * COMPUTED DISPLAY VALUE
   * Always returns the label based on the FormControl's value
   */
  get displayValue(): string | null {
    if (!this.control?.value) {
      return null;
    }

    if (
      !Array.isArray(this.control.value) &&
      typeof this.control.value === 'object'
    ) {
      return (
        this.control.value.name || this.control.value.value.team_name || null
      );
    }

    const realValue = this.control?.value[0] ?? this.internalValue;

    if (!realValue) return '';

    return realValue?.name;
  }

  /**
   * USER SELECTS AN ITEM
   */
  onSelectionChange(option: AutocompleteOption) {
    const actualValue = option.value;

    // Store real value (object, id, etc.)
    if (this.control) {
      this.control.setValue(actualValue);
      this.control.markAsTouched();
    }

    this.internalValue = actualValue;
    this.onChange(actualValue);
    this.onTouched();

    this.selectionChange.emit(option);
    this.modal.dismiss();
  }

  onSelectionCancel() {
    this.selectionCancel.emit();
    this.modal.dismiss();
  }

  // ----------------------------------------------------
  // CONTROL VALUE ACCESSOR IMPLEMENTATION
  // ----------------------------------------------------

  writeValue(value: any): void {
    this.internalValue = value;

    if (this.control && this.control.value !== value) {
      this.control.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
