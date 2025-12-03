import { Component, Input } from '@angular/core';
import { IonItemDivider } from '@ionic/angular/standalone';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [IonItemDivider],
  template: `
    <ion-item-divider [color]="color" [sticky]="sticky">
      <ng-content></ng-content>
    </ion-item-divider>
  `,
  styles: []
})
export class DividerComponent {
  @Input() color?: string;
  @Input() sticky?: boolean;
}
