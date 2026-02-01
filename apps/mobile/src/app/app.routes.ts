import { Route } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'error',
    loadComponent: () =>
      import('./error/api-error.page').then((m) => m.ApiErrorPage),
  },
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
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.page').then((m) => m.DashboardPage),
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
        path: 'rinklink-gpt',
        loadComponent: () =>
          import('./rinklink-gpt/rinklink-gpt.page').then(
            (m) => m.RinkLinkGptPage,
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
        path: 'admin',
        loadComponent: () =>
          import('./association-admin/association-admin.page').then(
            (m) => m.AssociationAdminPage,
          ),
      },
      {
        path: 'bug-report',
        loadComponent: () =>
          import('./bug-report/bug-report.page').then(
            (m) => m.BugReportPage,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
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
