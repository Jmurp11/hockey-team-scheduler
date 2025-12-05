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
import { IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [IonInput, CommonModule],
  template: `
    <div class="form-field">
      <ion-input
        [type]="type"
        [placeholder]="placeholder"
        [value]="formControl?.value || value"
        [disabled]="disabled"
        [readonly]="readonly"
        [clearInput]="clearInput"
        [color]="color"
        [label]="label"
        [labelPlacement]="labelPlacement"
        [fill]="fill"
        [shape]="shape"
        [required]="required"
        [class.error-highlight]="formControl?.invalid && formControl?.touched"
        (ionInput)="onIonInput($event)"
        (ionChange)="onIonChange($event)"
        (ionBlur)="onBlur()"
      />
      @if (formControl?.invalid && formControl?.touched) {
        <p class="error-message">{{ label | titlecase }} is required.</p>
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
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
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
  @Input() formControl?: FormControl;
  @Output() ionInput = new EventEmitter<CustomEvent>();
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | number | null) => void = (
    _value: string | number | null,
  ) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonInput(event: CustomEvent): void {
    const value = event.detail.value;
    this.value = value;

    // Support both FormControl and ControlValueAccessor patterns
    if (this.formControl) {
      this.formControl.setValue(value);
    }
    this.onChange(value);

    this.ionInput.emit(event);
  }

  onIonChange(event: CustomEvent): void {
    this.ionChangeEvent.emit(event);
  }

  onBlur(): void {
    // Support both FormControl and ControlValueAccessor patterns
    if (this.formControl) {
      this.formControl.markAsTouched();
      console.log(
        'FormControl marked as touched:',
        this.formControl.touched,
        'Invalid:',
        this.formControl.invalid,
      );
    }
    this.onTouched();
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
