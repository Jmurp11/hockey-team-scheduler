import { Component, Input } from '@angular/core';
import { IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [IonToolbar],
  template: `
    <ion-toolbar [color]="color">
      <ng-content></ng-content>
    </ion-toolbar>
  `,
  styles: []
})
export class ToolbarComponent {
  @Input() color?: string;
}
