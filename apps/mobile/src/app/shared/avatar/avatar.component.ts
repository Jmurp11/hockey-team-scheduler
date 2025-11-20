import { Component } from '@angular/core';
import { IonAvatar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [IonAvatar],
  template: `
    <ion-avatar>
      <ng-content></ng-content>
    </ion-avatar>
  `,
  styles: []
})
export class AvatarComponent {}
