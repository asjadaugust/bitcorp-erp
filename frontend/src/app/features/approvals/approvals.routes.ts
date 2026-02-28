import { Routes } from '@angular/router';

export const APPROVALS_ROUTES: Routes = [
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./approval-dashboard.component').then((m) => m.ApprovalDashboardComponent),
  },
  {
    path: 'templates',
    loadComponent: () =>
      import('./approval-templates-list.component').then((m) => m.ApprovalTemplatesListComponent),
  },
  {
    path: 'templates/new',
    loadComponent: () =>
      import('./approval-template-form.component').then((m) => m.ApprovalTemplateFormComponent),
  },
  {
    path: 'templates/:id/edit',
    loadComponent: () =>
      import('./approval-template-form.component').then((m) => m.ApprovalTemplateFormComponent),
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./approval-detail.component').then((m) => m.ApprovalDetailComponent),
  },
  {
    path: 'adhoc/new',
    loadComponent: () =>
      import('./adhoc-request-form.component').then((m) => m.AdhocRequestFormComponent),
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
];
