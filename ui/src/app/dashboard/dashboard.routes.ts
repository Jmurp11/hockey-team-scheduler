import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard.component').then(m => m.DashboardComponent),
    children: [
      {
        path: 'opponents',
        loadComponent: () => import('./opponents/opponents.component').then(m => m.OpponentsComponent)
      },
      {
        path: 'opponent-list',
        loadComponent: () => import('./opponent-list/opponent-list.component').then(m => m.OpponentListComponent)
      }
    ]
  }
];
