import { Routes } from '@angular/router';
import { AnalyticsModuleLayoutComponent } from './analytics-module-layout.component';

export const ANALYTICS_ROUTES: Routes = [
  {
    path: '',
    component: AnalyticsModuleLayoutComponent,
    children: [
      { path: '', redirectTo: 'flota', pathMatch: 'full' },
      {
        path: ':tab',
        loadComponent: () =>
          import('./analytics-dashboard.component').then((m) => m.AnalyticsDashboardComponent),
      },
    ],
  },
];
