import { Component, Input } from '@angular/core';
import { IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';

@Component({
  selector: 'app-datetime-button',
  standalone: true,
  imports: [IonDatetimeButton, IonModal, IonDatetime],
  template: `
    <ion-datetime-button [datetime]="datetime" [disabled]="disabled" />
    <ion-modal [keepContentsMounted]="true">
      <ng-template>
        <ion-datetime id="datetime"></ion-datetime>
      </ng-template>
    </ion-modal>
  `,
  styles: [],
})
export class DatetimeButtonComponent {
  @Input() datetime!: string;
  @Input() disabled?: boolean;
}
