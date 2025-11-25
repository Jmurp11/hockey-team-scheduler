import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButtons,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonMenuButton,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { add, calendar, menu, people, trophy } from 'ionicons/icons';
import { ButtonComponent } from '../shared/button/button.component';
import { CardComponent } from '../shared/card/card.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    ButtonComponent,
    CommonModule,
    CardComponent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
    IonButtons,
    IonMenuButton,
  ],
})
export class HomePage {
  private router = inject(Router);

  cards = [
    {
      title: 'Welcome to RinkLink Mobile',
      description: 'Your hockey team companion app.',
    },
    {
      title: 'View Schedule',
      description: "Check your team's schedule.",
      icon: calendar,
      buttonLabel: 'View Schedule',
      action: () => this.router.navigate(['/app/schedule']),
    },
    {
      title: 'Add Games',
      description: 'Locate nearby teams to play against.',
      icon: people,
      buttonLabel: 'Find Opponents',
      action: () => this.router.navigate(['/app/find-opponents']),
    },
    {
      title: 'Tournaments',
      description: 'Discover upcoming tournaments.',
      icon: trophy,
      buttonLabel: 'Find Tournaments',
      action: () => this.router.navigate(['/app/tournaments']),
    },
  ];
  constructor() {
    addIcons({ add, calendar, people, trophy, menu });
  }
}
