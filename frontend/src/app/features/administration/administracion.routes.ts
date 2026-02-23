import { Routes } from '@angular/router';
import { AdministracionModuleLayoutComponent } from './administracion-module-layout.component';

export const ADMINISTRACION_ROUTES: Routes = [
  {
    path: '',
    component: AdministracionModuleLayoutComponent,
    children: [
      // Default redirect to cost-centers
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'cost-centers',
      },

      // Centros de Costo
      {
        path: 'cost-centers',
        loadComponent: () =>
          import('./components/cost-center-list/cost-center-list.component').then(
            (m) => m.CostCenterListComponent
          ),
      },
      {
        path: 'cost-centers/new',
        loadComponent: () =>
          import('./components/cost-center-form/cost-center-form.component').then(
            (m) => m.CostCenterFormComponent
          ),
      },
      {
        path: 'cost-centers/:id/edit',
        loadComponent: () =>
          import('./components/cost-center-form/cost-center-form.component').then(
            (m) => m.CostCenterFormComponent
          ),
      },

      // Cuentas por Pagar
      {
        path: 'accounts-payable',
        loadComponent: () =>
          import('./components/accounts-payable-list/accounts-payable-list.component').then(
            (m) => m.AccountsPayableListComponent
          ),
      },
      {
        path: 'accounts-payable/new',
        loadComponent: () =>
          import('./components/accounts-payable-form/accounts-payable-form.component').then(
            (m) => m.AccountsPayableFormComponent
          ),
      },
      {
        path: 'accounts-payable/:id/edit',
        loadComponent: () =>
          import('./components/accounts-payable-form/accounts-payable-form.component').then(
            (m) => m.AccountsPayableFormComponent
          ),
      },

      // Cronograma de Pagos
      {
        path: 'payment-schedules',
        loadComponent: () =>
          import('./components/payment-schedule-list/payment-schedule-list.component').then(
            (m) => m.PaymentScheduleListComponent
          ),
      },
      {
        path: 'payment-schedules/new',
        loadComponent: () =>
          import('./components/payment-schedule-form/payment-schedule-form.component').then(
            (m) => m.PaymentScheduleFormComponent
          ),
      },
      {
        path: 'payment-schedules/:id/edit',
        loadComponent: () =>
          import('./components/payment-schedule-form/payment-schedule-form.component').then(
            (m) => m.PaymentScheduleFormComponent
          ),
      },
    ],
  },
];
