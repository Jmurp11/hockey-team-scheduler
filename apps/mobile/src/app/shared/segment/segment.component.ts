import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonSegment } from '@ionic/angular/standalone';

@Component({
  selector: 'app-segment',
  standalone: true,
  imports: [IonSegment],
  template: `
    <ion-segment
      [value]="value"
      [color]="color"
      [disabled]="disabled"
      [mode]="mode"
      [scrollable]="scrollable"
      [selectOnFocus]="selectOnFocus"
      [swipeGesture]="swipeGesture"
      (ionChange)="onIonChange($event)"
    >
      <ng-content></ng-content>
    </ion-segment>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentComponent),
      multi: true
    }
  ]
})
export class SegmentComponent implements ControlValueAccessor {
  @Input() value?: string | number;
  @Input() color?: 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'danger' | 'light' | 'medium' | 'dark' | string;
  @Input() disabled = false;
  @Input() mode?: 'ios' | 'md';
  @Input() scrollable = false;
  @Input() selectOnFocus = false;
  @Input() swipeGesture = true;
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | number | undefined) => void = (_value: string | number | undefined) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  onIonChange(event: CustomEvent): void {
    const value = event.detail.value;
    this.value = value;
    this.onChange(value);
    this.onTouched();
    this.ionChangeEvent.emit(event);
  }

  writeValue(value: string | number | undefined): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string | number | undefined) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
