import { Component, Input } from '@angular/core';
import { IonSpinner } from '@ionic/angular/standalone';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [IonSpinner],
  template: `
    <ion-spinner [name]="name" [color]="color" [paused]="paused"></ion-spinner>
  `,
  styles: []
})
export class LoadingComponent {
  @Input() name?: string;
  @Input() color?: string;
  @Input() paused = false;
}
