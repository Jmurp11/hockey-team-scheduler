import { Component, Input } from '@angular/core';
import { IonCard } from '@ionic/angular/standalone';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [IonCard],
  template: `
    <ion-card [color]="color" [button]="button" [disabled]="disabled">
      <ng-content></ng-content>
    </ion-card>
  `,
  styles: []
})
export class CardComponent {
  @Input() color?: string;
  @Input() button?: boolean;
  @Input() disabled?: boolean;
}
