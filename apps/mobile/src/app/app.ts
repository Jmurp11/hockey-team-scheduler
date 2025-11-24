import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonApp,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendar,
  chatbubbles,
  home,
  people,
  person,
  search,
  trophy,
} from 'ionicons/icons';

@Component({
  standalone: true,
  imports: [
    IonApp,
    IonRouterOutlet,
    IonMenu,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonMenuToggle,
    IonSplitPane,
    RouterModule,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'RinkLink.ai (Mobile)';

  public menuItems = [
    {
      title: 'Home',
      url: '/app/home',
      icon: 'home',
    },
    {
      title: 'Inbox',
      url: '/app/conversations',
      icon: 'chatbubbles',
    },
    {
      title: 'Schedule',
      url: '/app/schedule',
      icon: 'calendar',
    },
    {
      title: 'Opponents',
      url: '/app/opponents',
      icon: 'search',
    },
    {
      title: 'Tournaments',
      url: '/app/tournaments',
      icon: 'trophy',
    },
    {
      title: 'Profile',
      url: '/app/profile',
      icon: 'person',
    },
  ];

  constructor() {
    addIcons({ home, calendar, people, trophy, chatbubbles, person, search });
  }
}
