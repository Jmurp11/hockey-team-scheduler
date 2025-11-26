import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import {
    IonButton,
    IonContent,
    IonItem,
    IonLabel,
    IonList,
    IonModal,
    IonSearchbar,
} from '@ionic/angular/standalone';
import { InputComponent } from '../input/input.component';

export interface AutocompleteOption {
  label: string;
  value: string | number;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonModal,
    IonButton,
    IonContent,
    InputComponent,
  ],
  template: `
    <ion-item lines="none">
      <ion-label [position]="labelPlacement">{{ label }}</ion-label>
      <app-input
        [readonly]="true"
        [value]="selectedLabel"
        [placeholder]="label"
        (click)="openModal()"
        [fill]="fill"
        style="width: 100%; border: none; background: transparent; padding: 8px 0;"
      />
    </ion-item>
    <ion-modal [isOpen]="modalOpen" (didDismiss)="closeModal()">
      <ion-content>
        <ion-searchbar
          [placeholder]="label"
          [(ngModel)]="searchTerm"
          (ionInput)="onSearchChange()"
          [debounce]="debounce"
          [disabled]="disabled"
          [color]="fill"
          [searchIcon]="interface === 'action-sheet' ? 'search' : undefined"
        ></ion-searchbar>
        @if (filteredOptions.length > 0 && searchTerm) {
          <ion-list>
            @for (option of filteredOptions; track option.value) {
              <ion-item
                lines="none"
                button
                (click)="selectOption(option)"
              >
                {{ option.label }}
              </ion-item>
            }
          </ion-list>
        }
        <ion-button expand="block" fill="clear" (click)="closeModal()">Cancel</ion-button>
      </ion-content>
    </ion-modal>
  `,
  styles: [
    `
      ion-list {
        position: relative;
        z-index: 10;
        width: 100%;
        background: var(--ion-background-color, #fff);
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        max-height: 240px;
        overflow-y: auto;
      }
      input[readonly] {
        cursor: pointer;
      }
    `,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent implements ControlValueAccessor {
  @Input() options: AutocompleteOption[] = [];
  @Input() label = 'Search';
  @Input() labelPlacement: 'start' | 'end' | 'fixed' | 'stacked' | 'floating' =
    'stacked';
  @Input() fill: 'outline' | 'solid' = 'outline';
  @Input() interface: 'action-sheet' | 'alert' | 'popover' = 'alert';
  @Input() debounce = 300;
  @Input() disabled = false;
  @Output() optionSelected = new EventEmitter<AutocompleteOption>();

  searchTerm = '';
  filteredOptions: AutocompleteOption[] = [];
  modalOpen = false;
  selectedLabel = '';
  value: any = null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onChange: (value: any) => void = (_value: any) => {
    // Placeholder for ControlValueAccessor
  };
  private onTouched: () => void = () => {
    // Placeholder for ControlValueAccessor
  };

  openModal(): void {
    this.modalOpen = true;
    this.searchTerm = '';
    this.filteredOptions = this.options;
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  onSearchChange(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredOptions = this.options.filter((opt) =>
      opt.label.toLowerCase().includes(term),
    );
  }

  selectOption(option: AutocompleteOption): void {
    this.selectedLabel = option.label;
    this.value = option.value;
    this.onChange(this.value);
    this.onTouched();
    this.optionSelected.emit(option);
    this.closeModal();
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.value = value;
    // Find the option with this value to set the label
    const option = this.options.find(opt => opt.value === value);
    this.selectedLabel = option ? option.label : '';
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
