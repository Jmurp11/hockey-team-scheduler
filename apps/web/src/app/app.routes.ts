import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '*',
    redirectTo: '/',
  },
  {
    path: '',
    loadComponent: () =>
      import('./landing/landing.component').then((m) => m.LandingComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./landing/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'pricing',
        loadComponent: () =>
          import('./landing/pricing/pricing.component').then(
            (m) => m.PricingComponent,
          ),
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./auth/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./auth/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'welcome',
        loadComponent: () =>
          import('./auth/new-user/new-user.component').then(
            (m) => m.NewUserComponent,
          ),
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./landing/contact/contact.component').then(
            (m) => m.ContactComponent,
          ),
      },
      {
        path: 'developer',
        loadComponent: () =>
          import('./developer/developer.component').then(
            (m) => m.DeveloperComponent,
          ),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import(
            './landing/tournaments/tournaments-public.component'
          ).then((m) => m.TournamentsPublicComponent),
      },
      {
        path: 'tournament-director',
        loadComponent: () =>
          import(
            './landing/tournament-director/tournament-director.component'
          ).then((m) => m.TournamentDirectorComponent),
      },
      {
        path: 'tournament-director/success',
        loadComponent: () =>
          import(
            './landing/tournament-director/tournament-director-success/tournament-director-success.component'
          ).then((m) => m.TournamentDirectorSuccessComponent),
      },
      {
        path: 'callback',
        loadComponent: () =>
          import('./auth/callback/callback.component').then(
            (m) => m.CallbackComponent,
          ),
      },
      {
        path: 'auth/invite-accept',
        loadComponent: () =>
          import('./auth/invite-accept/invite-accept.component').then(
            (m) => m.InviteAcceptComponent,
          ),
      },
    ],
  },
  {
    path: 'app',
    canActivate: [() => import('./guards/auth.guard').then((m) => m.authGuard)],
    loadComponent: () =>
      import('./container/container.component').then(
        (m) => m.ContainerComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'opponents',
        loadComponent: () =>
          import('./opponents/opponents.component').then(
            (m) => m.OpponentsComponent,
          ),
      },
      {
        path: 'tournaments',
        loadComponent: () =>
          import('./tournaments/tournaments.component').then(
            (m) => m.TournamentsComponent,
          ),
      },
      {
        path: 'schedule',
        loadComponent: () =>
          import('./schedule/schedule.component').then(
            (m) => m.ScheduleComponent,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./association-admin/association-admin.component').then(
            (m) => m.AssociationAdminComponent,
          ),
      },
      {
        path: 'complete-profile',
        loadComponent: () =>
          import('./auth/register/register.component').then(
            (m) => m.RegisterComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./auth/update-password/update-password.component').then(
            (m) => m.UpdatePasswordComponent,
          ),
      },
      // {
      //   path: 'inbox',
      //   loadComponent: () =>
      //     import('./conversations/conversations.component').then(
      //       (m) => m.ConversationsComponent,
      //     ),
      // },
      // {
      //   path: 'chat/:id',
      //   loadComponent: () =>
      //     import('./chat/chat.component').then((m) => m.ChatComponent),
      // },
    ],
  },
];
