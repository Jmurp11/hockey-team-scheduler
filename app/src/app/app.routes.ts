import { Routes } from '@angular/router';
import { ContainerComponent } from './container/container.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { ScheduleComponent } from './schedule/schedule.component';

import { CallbackComponent } from './auth/callback/callback.component';
import { LoginComponent } from './auth/login/login.component';
import { NewUserComponent } from './auth/new-user/new-user.component';
import { RegisterComponent } from './auth/register/register.component';
import { UpdatePasswordComponent } from './auth/update-password/update-password.component';
import { authGuard } from './guards/auth.guard';
import { ContactComponent } from './landing/contact/contact.component';
import { HomeComponent } from './landing/home/home.component';
import { LandingComponent } from './landing/landing.component';
import { PricingComponent } from './landing/pricing/pricing.component';

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
      {
        path: 'reset-password',
        component: UpdatePasswordComponent,
      },
    ],
  },
];
