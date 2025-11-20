import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonSelect } from '@ionic/angular/standalone';

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [IonSelect],
  template: `
    <ion-select
      [value]="value"
      [placeholder]="placeholder"
      [disabled]="disabled"
      [multiple]="multiple"
      [interface]="interface"
      [interfaceOptions]="interfaceOptions"
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
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ]
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
    this.value = event.detail.value;
    this.onChange(this.value);
    this.ionChangeEvent.emit(event);
  }

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
