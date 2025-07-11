import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { ContainerComponent } from './container/container.component';
import { ProfileComponent } from './profile/profile.component';

import { LandingComponent } from './landing/landing.component';
import { PricingComponent } from './landing/pricing/pricing.component';
export const routes: Routes = [
  {
    path: 'landing',
    component: LandingComponent,
  },
  {
    path: 'pricing',
    component: PricingComponent,
  },
  {
    path: '',
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
    ],
  },
];
