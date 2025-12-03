import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonCheckbox } from '@ionic/angular/standalone';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [IonCheckbox],
  template: `
    <ion-checkbox
      [checked]="checked"
      [color]="color"
      [disabled]="disabled"
      [indeterminate]="indeterminate"
      [value]="value"
      (ionChange)="onIonChange($event)"
    >
      <ng-content></ng-content>
    </ion-checkbox>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true
    }
  ]
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() checked = false;
  @Input() color?: string;
  @Input() disabled = false;
  @Input() indeterminate = false;
  @Input() value?: unknown;
  @Output() ionChange = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: boolean) => void = (_value: boolean) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonChange(event: CustomEvent): void {
    this.checked = event.detail.checked;
    this.onChange(this.checked);
    this.ionChange.emit(event);
  }

  writeValue(value: boolean): void {
    this.checked = value;
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
