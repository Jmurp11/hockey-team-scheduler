import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@hockey-team-scheduler/shared-data-access';
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
  cog,
  home,
  people,
  person,
  search,
  trophy,
} from 'ionicons/icons';

interface MenuItem {
  title: string;
  url: string;
  icon: string;
  adminOnly?: boolean;
}

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
  private authService = inject(AuthService);

  protected title = 'RinkLink.ai (Mobile)';

  private allMenuItems: MenuItem[] = [
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
    {
      title: 'Admin',
      url: '/app/admin',
      icon: 'cog',
      adminOnly: true,
    },
  ];

  public menuItems = computed(() => {
    const user = this.authService.currentUser();
    const isAdmin = user?.role === 'ADMIN';
    
    return this.allMenuItems.filter(item => !item.adminOnly || isAdmin);
  });

  constructor() {
    addIcons({ home, calendar, people, trophy, chatbubbles, person, search, cog });
  }
}
