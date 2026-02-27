import { Routes } from '@angular/router';
import { EquipmentModuleLayoutComponent } from './equipment-module-layout.component';

export const EQUIPMENT_ROUTES: Routes = [
  {
    path: '',
    component: EquipmentModuleLayoutComponent,
    children: [
      // Config. Precalentamiento (WS-19) — accessible via direct URL, not in tabs
      {
        path: 'precalentamiento-config',
        loadComponent: () =>
          import('./precalentamiento-config-list.component').then(
            (m) => m.PrecalentamientoConfigListComponent
          ),
      },

      // Períodos de Inoperatividad (WS-17) — accessible via direct URL, not in tabs
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

      // === Operaciones sub-shell (Solicitudes + Órdenes + Contratos) ===
      {
        path: 'operaciones',
        loadComponent: () =>
          import('./operaciones-layout.component').then((m) => m.OperacionesLayoutComponent),
        children: [
          { path: '', redirectTo: 'solicitudes', pathMatch: 'full' },

          // Solicitudes de Equipo
          {
            path: 'solicitudes',
            loadComponent: () =>
              import('./solicitud-equipo-list.component').then(
                (m) => m.SolicitudEquipoListComponent
              ),
          },
          {
            path: 'solicitudes/new',
            loadComponent: () =>
              import('./solicitud-equipo-form.component').then(
                (m) => m.SolicitudEquipoFormComponent
              ),
          },
          {
            path: 'solicitudes/:id',
            loadComponent: () =>
              import('./solicitud-equipo-detail.component').then(
                (m) => m.SolicitudEquipoDetailComponent
              ),
          },
          {
            path: 'solicitudes/:id/edit',
            loadComponent: () =>
              import('./solicitud-equipo-form.component').then(
                (m) => m.SolicitudEquipoFormComponent
              ),
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
              import('./orden-alquiler-detail.component').then(
                (m) => m.OrdenAlquilerDetailComponent
              ),
          },
          {
            path: 'ordenes-alquiler/:id/edit',
            loadComponent: () =>
              import('./orden-alquiler-form.component').then((m) => m.OrdenAlquilerFormComponent),
          },

          // Contratos
          {
            path: 'contratos',
            loadComponent: () =>
              import('../contracts/contract-list.component').then((m) => m.ContractListComponent),
          },
          {
            path: 'contratos/new',
            loadComponent: () =>
              import('../contracts/contract-form.component').then((m) => m.ContractFormComponent),
          },
          {
            path: 'contratos/:id',
            loadComponent: () =>
              import('../contracts/contract-detail.component').then(
                (m) => m.ContractDetailComponent
              ),
          },
          {
            path: 'contratos/:id/edit',
            loadComponent: () =>
              import('../contracts/contract-form.component').then((m) => m.ContractFormComponent),
          },
        ],
      },

      // Redirects for old paths
      { path: 'solicitudes', redirectTo: 'operaciones/solicitudes', pathMatch: 'full' },
      { path: 'ordenes-alquiler', redirectTo: 'operaciones/ordenes-alquiler', pathMatch: 'full' },
      { path: 'contracts', redirectTo: 'operaciones/contratos', pathMatch: 'full' },

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

      // Vales de Combustible (WS-23)
      {
        path: 'vales-combustible',
        loadComponent: () =>
          import('./vale-combustible-list.component').then((m) => m.ValeCombustibleListComponent),
      },
      {
        path: 'vales-combustible/new',
        loadComponent: () =>
          import('./vale-combustible-form.component').then((m) => m.ValeCombustibleFormComponent),
      },
      {
        path: 'vales-combustible/:id',
        loadComponent: () =>
          import('./vale-combustible-detail.component').then(
            (m) => m.ValeCombustibleDetailComponent
          ),
      },
      {
        path: 'vales-combustible/:id/edit',
        loadComponent: () =>
          import('./vale-combustible-form.component').then((m) => m.ValeCombustibleFormComponent),
      },

      // Equipment List (index)
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./equipment-list.component').then((m) => m.EquipmentListComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('./equipment-form.component').then((m) => m.EquipmentFormComponent),
      },

      // Daily Reports sub-module
      {
        path: 'daily-reports/new',
        loadComponent: () =>
          import('./components/daily-report-form/daily-report-form.component').then(
            (m) => m.DailyReportFormComponent
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
      {
        path: 'daily-reports',
        loadComponent: () =>
          import('../daily-reports/daily-report-list.component').then(
            (m) => m.DailyReportListComponent
          ),
      },

      // Inspection Tracking
      {
        path: 'inspection-tracking',
        loadComponent: () =>
          import('./inspection-tracking.component').then((m) => m.InspectionTrackingComponent),
      },

      // Maintenance Module — accessible via direct URL, not in tabs
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

      // Valuations sub-module
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
          import('../valuations/valuation-detail.component').then(
            (m) => m.ValuationDetailComponent
          ),
      },
      {
        path: 'valuations/:id/edit',
        loadComponent: () =>
          import('../valuations/valuation-form.component').then((m) => m.ValuationFormComponent),
      },

      // Dynamic equipment detail routes — MUST BE LAST
      {
        path: ':id',
        loadComponent: () =>
          import('./equipment-detail/equipment-detail.component').then(
            (m) => m.EquipmentDetailComponent
          ),
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import('./equipment-form.component').then((m) => m.EquipmentFormComponent),
      },
    ],
  },
];
