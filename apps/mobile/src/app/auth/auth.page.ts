import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent, IonRouterOutlet } from '@ionic/angular/standalone';
import { TextLogoComponent } from '../shared/text-logo/text-logo.component';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [IonContent, IonRouterOutlet, RouterModule, TextLogoComponent],
  template: `
    <ion-content>
      <app-text-logo class="ion-margin-top ion-margin-bottom" />
      <ion-router-outlet></ion-router-outlet>
    </ion-content>
  `,
  styles: [
    `
      ion-content {
        --background: transparent;
        background-color: #ffffff;
        background-image: url('/wave.svg');
        background-size: cover;
        background-position: center bottom;
        background-repeat: no-repeat;
      }

      @media (prefers-color-scheme: dark) {
        ion-content {
          background-color: #000000;
        }
      }
    `,
  ],
})
export class AuthPage {}
