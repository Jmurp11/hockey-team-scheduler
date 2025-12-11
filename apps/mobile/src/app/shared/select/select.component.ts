import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  forwardRef,
  Input,
  Output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';
import { IonSelect } from '@ionic/angular/standalone';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IonSelect, CommonModule],
  template: `
    <div class="form-field">
      <ion-select
        [class.error-highlight]="formControl?.invalid && formControl?.touched"
        [value]="formControl?.value || value"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [multiple]="multiple"
        [interface]="interface"
        [interfaceOptions]="interfaceOptions || {}"
        [color]="color"
        [label]="label"
        [labelPlacement]="labelPlacement"
        [fill]="fill"
        [shape]="shape"
        (ionChange)="onIonChange($event)"
        (ionCancel)="ionCancel.emit($event)"
        (ionDismiss)="ionDismiss.emit($event)"
      >
        <ng-content></ng-content>
      </ion-select>

      @if (formControl?.invalid && formControl?.touched) {
        <p class="error-message">>{{ label | titlecase }} is required.</p>
      }
    </div>
  `,
  styles: [
    `
      .form-field {
        width: 100%;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  @Input() value?: unknown;
  @Input() placeholder?: string;
  @Input() disabled = false;
  @Input() multiple = false;
  @Input() interface: 'action-sheet' | 'alert' | 'popover' = 'alert';
  @Input() interfaceOptions?: unknown;
  @Input() color?: string;
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked' | 'floating';
  @Input() fill?: 'outline' | 'solid';
  @Input() shape?: 'round';
  @Input() formControl?: FormControl;
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();
  @Output() ionCancel = new EventEmitter<CustomEvent>();
  @Output() ionDismiss = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: unknown) => void = (_value: unknown) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonChange(event: CustomEvent): void {
    const value = event.detail.value;
    this.value = value;

    // Support both FormControl and ControlValueAccessor patterns
    if (this.formControl) {
      this.formControl.setValue(value);
      this.formControl.markAsTouched();
    }
    this.onChange(value);
    this.onTouched();

    this.ionChangeEvent.emit(event);
  }

  // ControlValueAccessor implementation
  writeValue(value: unknown): void {
    this.value = value;
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
