import { Route } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadComponent: () => import('./auth/auth.page').then((m) => m.AuthPage),
    children: authRoutes,
  },
  {
    path: 'app',
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./schedule/schedule.page').then((m) => m.SchedulePage),
      },
      {
        path: 'opponents',
        loadComponent: () =>
          import('./opponents/opponents.page').then((m) => m.OpponentsPage),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./tournaments/tournaments.page').then(
            (m) => m.TournamentsPage,
          ),
      },
      {
        path: 'conversations',
        loadComponent: () =>
          import('./conversations/conversations.page').then(
            (m) => m.ConversationsPage,
          ),
      },
      {
        path: 'chat/:id',
        loadComponent: () =>
          import('./conversations/chat/chat.component').then(
            (m) => m.ChatComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
];
