import { Routes } from '@angular/router';

export const HR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./hr-dashboard.component').then((m) => m.HrDashboardComponent),
  },
  {
    path: 'employees',
    loadComponent: () =>
      import('./components/employee-list/employee-list.component').then(
        (m) => m.EmployeeListComponent
      ),
  },
  {
    path: 'employees/new',
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
  },
  {
    path: 'employees/:id',
    loadComponent: () =>
      import('./components/employee-detail/employee-detail.component').then(
        (m) => m.EmployeeDetailComponent
      ),
  },
  {
    path: 'employees/:id/edit',
    loadComponent: () =>
      import('./components/employee-form/employee-form.component').then(
        (m) => m.EmployeeFormComponent
      ),
  },
  {
    path: 'worker-registry',
    loadComponent: () =>
      import('./worker-registry/registro-list.component').then((m) => m.RegistroListComponent),
  },
  {
    path: 'worker-registry/new',
    loadComponent: () =>
      import('./worker-registry/registro-form.component').then((m) => m.RegistroFormComponent),
  },
  {
    path: 'worker-registry/:id',
    loadComponent: () =>
      import('./worker-registry/registro-detail.component').then((m) => m.RegistroDetailComponent),
  },
  {
    path: 'worker-registry/:id/edit',
    loadComponent: () =>
      import('./worker-registry/registro-form.component').then((m) => m.RegistroFormComponent),
  },
];
