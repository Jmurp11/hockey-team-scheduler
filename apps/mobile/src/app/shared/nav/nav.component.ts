import { Component } from '@angular/core';
import { IonNav } from '@ionic/angular/standalone';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [IonNav],
  template: `
    <ion-nav>
      <ng-content></ng-content>
    </ion-nav>
  `,
  styles: []
})
export class NavComponent {}
