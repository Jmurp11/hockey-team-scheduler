import { Component, EventEmitter, forwardRef, Input, Output, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonButton, IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';

@Component({
  selector: 'app-password-input',
  standalone: true,
  imports: [IonInput, IonButton, IonIcon],
  template: `
    <ion-input
      [type]="showPassword() ? 'text' : 'password'"
      [placeholder]="placeholder"
      [value]="value"
      [disabled]="disabled"
      [readonly]="readonly"
      [clearInput]="false"
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
      <ion-button
        slot="end"
        fill="clear"
        type="button"
        [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
        (click)="togglePassword($event)"
      >
        <ion-icon 
          slot="icon-only" 
          [name]="showPassword() ? 'eye-off' : 'eye'"
          color="secondary"
        ></ion-icon>
      </ion-button>
    </ion-input>
  `,
  styles: [`
    ion-button {
      --padding-start: 0;
      --padding-end: 0;
      margin: 0;
      height: 100%;
    }
    
    ion-input {
      --padding-end: 0;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PasswordInputComponent),
      multi: true
    }
  ]
})
export class PasswordInputComponent implements ControlValueAccessor {
  @Input() placeholder?: string;
  @Input() value?: string | null;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() color?: string;
  @Input() label?: string;
  @Input() labelPlacement?: 'start' | 'end' | 'fixed' | 'stacked' | 'floating';
  @Input() fill?: 'outline' | 'solid';
  @Input() shape?: 'round';
  @Input() required = false;
  @Output() ionInput = new EventEmitter<CustomEvent>();
  @Output() ionChangeEvent = new EventEmitter<CustomEvent>();

  showPassword = signal(false);

  constructor() {
    addIcons({ eye, eyeOff });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: string | null | undefined) => void = (_value: string | null | undefined) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  togglePassword(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showPassword.set(!this.showPassword());
  }

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
