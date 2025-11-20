import { Component, Input } from '@angular/core';
import { IonList } from '@ionic/angular/standalone';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [IonList],
  template: `
    <ion-list [inset]="inset" [lines]="lines">
      <ng-content></ng-content>
    </ion-list>
  `,
  styles: []
})
export class ListComponent {
  @Input() inset = false;
  @Input() lines?: 'full' | 'inset' | 'none';
}
