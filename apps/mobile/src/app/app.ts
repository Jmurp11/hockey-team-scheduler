import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import {
  AuthService,
  ScheduleRiskService,
  ScheduleService,
  UserService,
} from '@hockey-team-scheduler/shared-data-access';
import { of, switchMap } from 'rxjs';
import {
  IonApp,
  IonContent,
  IonFooter,
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
  barChart,
  bug,
  calendar,
  chatbubbleEllipses,
  chatbubbles,
  cog,
  home,
  logOutOutline,
  people,
  person,
  search,
  trophy,
} from 'ionicons/icons';
import { GameMatchingModalComponent } from './game-matching/game-matching-modal.component';

interface MenuItem {
  title: string;
  url: string;
  icon?: string;
  cssIcon?: string;
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
    IonFooter,
    RouterModule,
    GameMatchingModalComponent,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private router = inject(Router);
  private scheduleService = inject(ScheduleService);
  private scheduleRiskService = inject(ScheduleRiskService);
  private destroyRef = inject(DestroyRef);

  private riskEvaluation$ = toObservable(this.authService.currentUser).pipe(
    switchMap((user) => {
      if (!user?.user_id) return of([]);
      return this.scheduleService.gamesFull(user.user_id);
    }),
    takeUntilDestroyed(this.destroyRef),
  );

  protected title = 'RinkLink.ai (Mobile)';

  private allMenuItems: MenuItem[] = [
    {
      title: 'Dashboard',
      url: '/app/dashboard',
      icon: 'bar-chart',
    },
    {
      title: 'Schedule',
      url: '/app/schedule',
      icon: 'calendar',
    },
    {
      title: 'RinkLinkGPT',
      url: '/app/rinklink-gpt',
      cssIcon: 'bi bi-robot',
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
      title: 'Bug Report',
      url: '/app/bug-report',
      cssIcon: 'bug',
    },
    {
      title: 'Admin',
      url: '/app/admin',
      icon: 'cog',
      adminOnly: true,
    },
  ];

  public isLoggedIn = computed(() => !!this.authService.currentUser()?.user_id);

  public menuItems = computed(() => {
    const user = this.authService.currentUser();
    const isAdmin = user?.role === 'ADMIN';

    return this.allMenuItems.filter((item) => !item.adminOnly || isAdmin);
  });

  constructor() {
    addIcons({
      barChart,
      bug,
      calendar,
      chatbubbleEllipses,
      people,
      trophy,
      chatbubbles,
      person,
      search,
      cog,
      logOutOutline,
    });
  }

  ngOnInit(): void {
    this.riskEvaluation$.subscribe((games) => {
      this.scheduleRiskService.evaluate(games);
    });
  }

  async logout() {
    try {
      await this.userService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}
