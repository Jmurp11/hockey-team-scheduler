import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [IonInput],
  template: `
    <ion-input
      [type]="type"
      [placeholder]="placeholder"
      [value]="value"
      [disabled]="disabled"
      [readonly]="readonly"
      [clearInput]="clearInput"
      [color]="color"
      [label]="label"
      [labelPlacement]="labelPlacement"
      [fill]="fill"
      [shape]="shape"
      [required]="required"
      (ionInput)="onIonInput($event)"
      (ionChange)="onIonChange($event)"
      (ionBlur)="onBlur()"
    >
    </ion-input>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ]
})
export class InputComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' = 'text';
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
  @Output() ionInput = new EventEmitter<CustomEvent>();
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | number | null | undefined) => void = (_value: string | number | null | undefined) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonInput(event: CustomEvent): void {
    this.value = event.detail.value;
    this.onChange(this.value);
    this.ionInput.emit(event);
  }

  onIonChange(event: CustomEvent): void {
    this.ionChangeEvent.emit(event);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | number | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | null | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
