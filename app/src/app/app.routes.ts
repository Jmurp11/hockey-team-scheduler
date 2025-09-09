import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { ContainerComponent } from './container/container.component';
import { ProfileComponent } from './profile/profile.component';

import { HomeComponent } from './landing/home/home.component';
import { PricingComponent } from './landing/pricing/pricing.component';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { ContactComponent } from './landing/contact/contact.component';
import { NewUserComponent } from './auth/new-user/new-user.component';
import { authGuard } from './guards/auth.guard';
import { CallbackComponent } from './auth/callback/callback.component';
import { RegisterComponent } from './auth/register/register.component';

export const routes: Routes = [
  {
    path: '*',
    redirectTo: '/',
    pathMatch: 'full',
  },
  {
    path: '',
    component: LandingComponent,

    children: [
      {
        path: '',
        component: HomeComponent,
      },
      {
        path: 'pricing',
        component: PricingComponent,
      },
      {
        path: 'login',
        component: LoginComponent,
      },
      {
        path: 'welcome',
        component: NewUserComponent,
      },
      {
        path: 'contact',
        component: ContactComponent,
      },
       {
        path: 'callback',
        component: CallbackComponent,
      },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    component: ContainerComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: DashboardComponent,
      },
      {
        path: 'schedule',
        component: ScheduleComponent,
      },
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'complete-profile',
        component: RegisterComponent,
      },
    ],
  },
];
