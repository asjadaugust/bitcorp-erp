import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./equipment-list.component').then((m) => m.EquipmentListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./equipment-form.component').then((m) => m.EquipmentFormComponent),
  },

  // Sub-modules (MUST BE BEFORE :id)
  {
    path: 'daily-reports',
    loadComponent: () =>
      import('../daily-reports/daily-report-list.component').then(
        (m) => m.DailyReportListComponent
      ),
  },
  {
    path: 'daily-reports/new',
    loadComponent: () =>
      import('./components/daily-report-form/daily-report-form.component').then(
        (m) => m.DailyReportFormComponent
      ),
  },
  {
    path: 'daily-reports/:id',
    loadComponent: () =>
      import('./components/daily-report-form/daily-report-form.component').then(
        (m) => m.DailyReportFormComponent
      ),
  },
  {
    path: 'daily-reports/:id/edit',
    loadComponent: () =>
      import('./components/daily-report-form/daily-report-form.component').then(
        (m) => m.DailyReportFormComponent
      ),
  },

  // Maintenance Module
  {
    path: 'maintenance',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../maintenance/maintenance-list.component').then(
            (m) => m.MaintenanceListComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('../maintenance/maintenance-form.component').then(
            (m) => m.MaintenanceFormComponent
          ),
      },
      {
        path: 'schedule',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../scheduling/maintenance-schedule/maintenance-schedule-list.component').then(
                (m) => m.MaintenanceScheduleListComponent
              ),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('../scheduling/maintenance-schedule/maintenance-schedule-form.component').then(
                (m) => m.MaintenanceScheduleFormComponent
              ),
          },
          {
            path: ':id/edit',
            loadComponent: () =>
              import('../scheduling/maintenance-schedule/maintenance-schedule-form.component').then(
                (m) => m.MaintenanceScheduleFormComponent
              ),
          },
        ],
      },
      {
        path: ':id',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('../maintenance/maintenance-detail.component').then(
                (m) => m.MaintenanceDetailComponent
              ),
          },
          {
            path: 'edit',
            loadComponent: () =>
              import('../maintenance/maintenance-form.component').then(
                (m) => m.MaintenanceFormComponent
              ),
          },
        ],
      },
    ],
  },

  {
    path: 'contracts',
    loadComponent: () =>
      import('../contracts/contract-list.component').then((m) => m.ContractListComponent),
  },
  {
    path: 'contracts/new',
    loadComponent: () =>
      import('../contracts/contract-form.component').then((m) => m.ContractFormComponent),
  },
  {
    path: 'contracts/:id',
    loadComponent: () =>
      import('../contracts/contract-detail.component').then((m) => m.ContractDetailComponent),
  },
  {
    path: 'contracts/:id/edit',
    loadComponent: () =>
      import('../contracts/contract-form.component').then((m) => m.ContractFormComponent),
  },

  {
    path: 'valuations',
    loadComponent: () =>
      import('../valuations/valuation-list.component').then((m) => m.ValuationListComponent),
  },
  {
    path: 'valuations/new',
    loadComponent: () =>
      import('../valuations/valuation-form.component').then((m) => m.ValuationFormComponent),
  },
  {
    path: 'valuations/:id',
    loadComponent: () =>
      import('../valuations/valuation-detail.component').then((m) => m.ValuationDetailComponent),
  },
  {
    path: 'valuations/:id/edit',
    loadComponent: () =>
      import('../valuations/valuation-form.component').then((m) => m.ValuationFormComponent),
  },

  // Dynamic routes (MUST BE LAST)
  {
    path: ':id',
    loadComponent: () =>
      import('./equipment-detail/equipment-detail.component').then(
        (m) => m.EquipmentDetailComponent
      ),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./equipment-form.component').then((m) => m.EquipmentFormComponent),
  },
];
