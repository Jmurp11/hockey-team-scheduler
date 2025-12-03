import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonTextarea } from '@ionic/angular/standalone';

@Component({
  selector: 'app-text-area',
  standalone: true,
  imports: [IonTextarea],
  template: `
    <ion-textarea
      [placeholder]="placeholder"
      [value]="value"
      [disabled]="disabled"
      [readonly]="readonly"
      [rows]="rows"
      [cols]="cols"
      [autoGrow]="autoGrow"
      [maxlength]="maxlength"
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
    </ion-textarea>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextAreaComponent),
      multi: true
    }
  ]
})
export class TextAreaComponent implements ControlValueAccessor {
  @Input() placeholder?: string;
  @Input() value?: string | null;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() rows?: number;
  @Input() cols?: number;
  @Input() autoGrow = false;
  @Input() maxlength?: number;
  @Input() color?: string;
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked' | 'floating';
  @Input() fill?: 'outline' | 'solid';
  @Input() shape?: 'round';
  @Input() required = false;
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | null | undefined) => void = (_value: string | null | undefined) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonInput(event: CustomEvent): void {
    this.value = event.detail.value;
    this.onChange(this.value);
  }

  onIonChange(event: CustomEvent): void {
    this.ionChangeEvent.emit(event);
  }

  onBlur(): void {
    this.onTouched();
  }

  writeValue(value: string | null): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | null | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
