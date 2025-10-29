import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./opponents.component').then((m) => m.OpponentsComponent),
    children: [
      {
        path: 'opponents',
        loadComponent: () =>
          import('./opponents-filter/opponents-filter.component').then(
            (m) => m.OpponentsFilterComponent
          ),
      },
      {
        path: 'opponent-list',
        loadComponent: () =>
          import('./opponent-list/opponent-list.component').then(
            (m) => m.OpponentListComponent
          ),
      },
    ],
  },
];
