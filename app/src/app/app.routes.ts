import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ScheduleComponent } from './schedule/schedule.component';
import { ContainerComponent } from './container/container.component';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
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
