import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonSearchbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-searchbar',
  standalone: true,
  imports: [IonSearchbar],
  template: `
    <ion-searchbar
      [value]="value"
      [placeholder]="placeholder"
      [showCancelButton]="showCancelButton"
      [showClearButton]="showClearButton"
      [animated]="animated"
      [color]="color"
      [disabled]="disabled"
      [debounce]="debounce"
      [searchIcon]="searchIcon"
      (ionInput)="onIonInput($event)"
      (ionChange)="onIonChange($event)"
      (ionClear)="ionClear.emit($event)"
      (ionCancel)="ionCancel.emit($event)"
    >
    </ion-searchbar>
  `,
  styles: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchbarComponent),
      multi: true
    }
  ]
})
export class SearchbarComponent implements ControlValueAccessor {
  @Input() value?: string | null;
  @Input() placeholder = 'Search';
  @Input() showCancelButton: 'focus' | 'always' | 'never' = 'never';
  @Input() showClearButton: 'focus' | 'always' | 'never' = 'always';
  @Input() animated = false;
  @Input() color?: string;
  @Input() disabled = false;
  @Input() debounce = 250;
  @Input() searchIcon = 'search';
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();
  @Output() ionClear = new EventEmitter<CustomEvent>();
  @Output() ionCancel = new EventEmitter<CustomEvent>();

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
