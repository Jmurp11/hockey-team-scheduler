import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import {
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonItem,
  IonText,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-datetime-button',
  standalone: true,
  imports: [IonDatetimeButton, IonModal, IonDatetime, IonItem, IonText],
  template: `
    <ion-item class="date-time" lines="none">
      <ion-datetime-button [datetime]="datetime" [disabled]="disabled" />
      <ion-modal [keepContentsMounted]="true">
        <ng-template>
          <ion-datetime [id]="datetime"></ion-datetime>
        </ng-template>
      </ion-modal>
    </ion-item>
    @if (isInvalid()) {
      <ion-text color="danger">
        <p class="error-message">{{ label }} is required.</p>
      </ion-text>
    }
  `,
  styles: [
    `
      @use 'mixins/flex' as *;

      .error-message {
        margin: 0.25rem 1rem 0 1rem;
        font-size: 0.875rem;
      }

      .date-time {
        @include flex(center, center, row);
        padding: 0rem 1rem;

        ion-datetime-button {
          padding: 0.5rem;
        }
      }
      ion-item {
        --padding-start: 0;
        margin-bottom: 1rem;
      }
    `,
  ],
})
export class DatetimeButtonComponent {
  @Input() datetime!: string;
  @Input() disabled?: boolean;
  @Input() formControl?: FormControl;
  @Input() label?: string;

  isInvalid(): boolean {
    return !!(this.formControl?.invalid && this.formControl?.touched);
  }
}
