import { Component, Input } from '@angular/core';
import { IonDatetimeButton } from '@ionic/angular/standalone';

@Component({
  selector: 'app-datetime-button',
  standalone: true,
  imports: [IonDatetimeButton],
  template: `
    <ion-datetime-button [datetime]="datetime" [disabled]="disabled">
    </ion-datetime-button>
  `,
  styles: []
})
export class DatetimeButtonComponent {
  @Input() datetime!: string;
  @Input() disabled?: boolean;
}
