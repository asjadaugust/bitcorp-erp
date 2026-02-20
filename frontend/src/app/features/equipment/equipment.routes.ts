import { Routes } from '@angular/router';

export const EQUIPMENT_ROUTES: Routes = [
  // Config. Precalentamiento (WS-19)
  {
    path: 'precalentamiento-config',
    loadComponent: () =>
      import('./precalentamiento-config-list.component').then(
        (m) => m.PrecalentamientoConfigListComponent
      ),
  },

  // Períodos de Inoperatividad (WS-17)
  {
    path: 'inoperatividad',
    loadComponent: () =>
      import('./periodo-inoperatividad-list.component').then(
        (m) => m.PeriodoInoperatividadListComponent
      ),
  },
  {
    path: 'inoperatividad/new',
    loadComponent: () =>
      import('./periodo-inoperatividad-form.component').then(
        (m) => m.PeriodoInoperatividadFormComponent
      ),
  },
  // Equipment Manager Dashboard
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./equipment-dashboard.component').then((m) => m.EquipmentDashboardComponent),
  },

  // Equipment Requests Module
  {
    path: 'solicitudes',
    loadComponent: () =>
      import('./solicitud-equipo-list.component').then((m) => m.SolicitudEquipoListComponent),
  },
  {
    path: 'solicitudes/new',
    loadComponent: () =>
      import('./solicitud-equipo-form.component').then((m) => m.SolicitudEquipoFormComponent),
  },
  {
    path: 'solicitudes/:id',
    loadComponent: () =>
      import('./solicitud-equipo-detail.component').then((m) => m.SolicitudEquipoDetailComponent),
  },
  {
    path: 'solicitudes/:id/edit',
    loadComponent: () =>
      import('./solicitud-equipo-form.component').then((m) => m.SolicitudEquipoFormComponent),
  },

  // Órdenes de Alquiler
  {
    path: 'ordenes-alquiler',
    loadComponent: () =>
      import('./orden-alquiler-list.component').then((m) => m.OrdenAlquilerListComponent),
  },
  {
    path: 'ordenes-alquiler/new',
    loadComponent: () =>
      import('./orden-alquiler-form.component').then((m) => m.OrdenAlquilerFormComponent),
  },
  {
    path: 'ordenes-alquiler/:id',
    loadComponent: () =>
      import('./orden-alquiler-detail.component').then((m) => m.OrdenAlquilerDetailComponent),
  },
  {
    path: 'ordenes-alquiler/:id/edit',
    loadComponent: () =>
      import('./orden-alquiler-form.component').then((m) => m.OrdenAlquilerFormComponent),
  },

  // Actas de Devolución / Desmovilización
  {
    path: 'actas-devolucion',
    loadComponent: () =>
      import('./acta-devolucion-list.component').then((m) => m.ActaDevolucionListComponent),
  },
  {
    path: 'actas-devolucion/new',
    loadComponent: () =>
      import('./acta-devolucion-form.component').then((m) => m.ActaDevolucionFormComponent),
  },
  {
    path: 'actas-devolucion/:id',
    loadComponent: () =>
      import('./acta-devolucion-detail.component').then((m) => m.ActaDevolucionDetailComponent),
  },
  {
    path: 'actas-devolucion/:id/edit',
    loadComponent: () =>
      import('./acta-devolucion-form.component').then((m) => m.ActaDevolucionFormComponent),
  },

  {
    path: '',
    loadComponent: () => import('./equipment-list.component').then((m) => m.EquipmentListComponent),
  },
  {
    path: 'new',
    loadComponent: () => import('./equipment-form.component').then((m) => m.EquipmentFormComponent),
  },

  // Sub-modules
  {
    path: 'daily-reports',
    loadComponent: () =>
      import('../daily-reports/daily-report-list.component').then(
        (m) => m.DailyReportListComponent
      ),
  },
  {
    path: 'daily-reports/reception',
    loadComponent: () =>
      import('../daily-reports/daily-report-reception.component').then(
        (m) => m.DailyReportReceptionComponent
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
      import('../valuations/valuation-registry.component').then(
        (m) => m.ValuationRegistryComponent
      ),
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
