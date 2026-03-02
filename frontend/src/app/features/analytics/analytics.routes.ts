import { Routes } from '@angular/router';

export const ANALYTICS_ROUTES: Routes = [
  { path: '', redirectTo: 'flota', pathMatch: 'full' },
  {
    path: ':tab',
    loadComponent: () =>
      import('./analytics-dashboard.component').then((m) => m.AnalyticsDashboardComponent),
  },
];
