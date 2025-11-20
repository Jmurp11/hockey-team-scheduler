import { Component, Input } from '@angular/core';
import { IonFooter } from '@ionic/angular/standalone';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [IonFooter],
  template: `
    <ion-footer [translucent]="translucent">
      <ng-content></ng-content>
    </ion-footer>
  `,
  styles: []
})
export class FooterComponent {
  @Input() translucent?: boolean;
}
