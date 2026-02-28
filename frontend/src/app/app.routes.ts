import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { ROLES } from './core/types/roles';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./landing-page/landing-page.component').then((m) => m.LandingPageComponent),
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },

  // Main App Layout (Authenticated - Admin/Staff)
  {
    path: '',
    loadComponent: () =>
      import('./layouts/main-layout.component').then((m) => m.MainLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROLES.ADMIN, ROLES.DIRECTOR, ROLES.JEFE_EQUIPO] }, // Allow admin and other staff roles
    children: [
      {
        path: 'app',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'dashboard',
        redirectTo: 'app',
        pathMatch: 'full',
      },

      // Equipment Management
      {
        path: 'equipment',
        loadChildren: () =>
          import('./features/equipment/equipment.routes').then((m) => m.EQUIPMENT_ROUTES),
      },

      // Operators
      {
        path: 'operators',
        loadComponent: () =>
          import('./features/operators/operator-list-enhanced.component').then(
            (m) => m.OperatorListEnhancedComponent
          ),
      },
      {
        path: 'operators/new',
        loadComponent: () =>
          import('./features/operators/operator-edit.component').then(
            (m) => m.OperatorEditComponent
          ),
      },
      {
        path: 'operators/:id',
        loadComponent: () =>
          import('./features/operators/operator-detail.component').then(
            (m) => m.OperatorDetailComponent
          ),
      },
      {
        path: 'operators/:id/edit',
        loadComponent: () =>
          import('./features/operators/operator-edit.component').then(
            (m) => m.OperatorEditComponent
          ),
      },

      // Nivel 1 - SIG
      {
        path: 'sig',
        loadComponent: () =>
          import('./features/sig/sig-dashboard.component').then((m) => m.SigDashboardComponent),
        data: { title: 'Sistema Integrado de Gestión (SIG)' },
      },
      {
        path: 'sig/documents/new',
        loadComponent: () =>
          import('./features/sig/components/document-form/document-form.component').then(
            (m) => m.DocumentFormComponent
          ),
      },
      {
        path: 'sig/documents/:id/edit',
        loadComponent: () =>
          import('./features/sig/components/document-form/document-form.component').then(
            (m) => m.DocumentFormComponent
          ),
      },

      // Nivel 2 - Operaciones
      // Nivel 2 - Operaciones
      {
        path: 'licitaciones',
        loadComponent: () =>
          import('./features/tenders/components/tender-list/tender-list.component').then(
            (m) => m.TenderListComponent
          ),
        data: { title: 'Licitaciones' },
      },
      {
        path: 'licitaciones/new',
        loadComponent: () =>
          import('./features/tenders/components/tender-form/tender-form.component').then(
            (m) => m.TenderFormComponent
          ),
      },
      {
        path: 'licitaciones/:id/edit',
        loadComponent: () =>
          import('./features/tenders/components/tender-form/tender-form.component').then(
            (m) => m.TenderFormComponent
          ),
      },
      {
        path: 'operaciones',
        loadChildren: () =>
          import('./features/operations/operations.routes').then((m) => m.OPERATIONS_ROUTES),
      },
      // Fuel routes moved to Logistics module

      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/reports.component').then((m) => m.ReportsComponent),
      },

      // Daily Reports are now consolidated under /equipment/daily-reports

      // NOTE: Contracts & Valuations routes are now under /equipment/ to maintain better organization
      // See equipment.routes.ts for:
      // - /equipment/contracts
      // - /equipment/valuations

      // Payment Records (for valuations)
      {
        path: 'payments',
        loadComponent: () =>
          import('./features/payments/payment-list.component').then((m) => m.PaymentListComponent),
        data: { title: 'Registro de Pagos' },
      },
      {
        path: 'payments/create',
        loadComponent: () =>
          import('./features/payments/payment-form.component').then((m) => m.PaymentFormComponent),
      },
      {
        path: 'payments/:id',
        loadComponent: () =>
          import('./features/payments/payment-detail.component').then(
            (m) => m.PaymentDetailComponent
          ),
      },
      {
        path: 'payments/:id/edit',
        loadComponent: () =>
          import('./features/payments/payment-form.component').then((m) => m.PaymentFormComponent),
      },

      // Scheduling Engine - Moved to Operations
      // Timesheets & Scheduling - Moved to Operations
      // Projects - Moved to Operations

      // Nivel 3 - Departamentales
      {
        path: 'sst',
        loadComponent: () =>
          import('./features/sst/components/incident-list/incident-list.component').then(
            (m) => m.IncidentListComponent
          ),
        data: { title: 'Seguridad y Salud en el Trabajo' },
      },
      {
        path: 'sst/new',
        loadComponent: () =>
          import('./features/sst/components/incident-form/incident-form.component').then(
            (m) => m.IncidentFormComponent
          ),
      },
      {
        path: 'sst/:id/edit',
        loadComponent: () =>
          import('./features/sst/components/incident-form/incident-form.component').then(
            (m) => m.IncidentFormComponent
          ),
      },
      // Administration Module
      {
        path: 'administracion',
        loadChildren: () =>
          import('./features/administration/administracion.routes').then(
            (m) => m.ADMINISTRACION_ROUTES
          ),
      },
      {
        path: 'rrhh',
        loadChildren: () => import('./features/hr/hr.routes').then((m) => m.HR_ROUTES),
      },
      {
        path: 'logistics',
        loadChildren: () =>
          import('./features/logistics/logistics.module').then((m) => m.LogisticsModule),
      },
      {
        path: 'providers',
        loadComponent: () =>
          import('./features/providers/provider-list.component').then(
            (m) => m.ProviderListComponent
          ),
      },
      {
        path: 'providers/new',
        loadComponent: () =>
          import('./features/providers/provider-form.component').then(
            (m) => m.ProviderFormComponent
          ),
      },
      {
        path: 'providers/:id',
        loadComponent: () =>
          import('./features/providers/provider-detail.component').then(
            (m) => m.ProviderDetailComponent
          ),
      },
      {
        path: 'providers/:id/edit',
        loadComponent: () =>
          import('./features/providers/provider-form.component').then(
            (m) => m.ProviderFormComponent
          ),
      },
      // User Management (ADMIN only)
      {
        path: 'users',
        loadChildren: () => import('./features/users/user.routes').then((m) => m.USER_ROUTES),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
      // Checklists
      {
        path: 'checklists',
        loadChildren: () =>
          import('./features/checklists/checklists.routes').then((m) => m.checklistRoutes),
      },
      // Notifications
      {
        path: 'notificaciones',
        loadComponent: () =>
          import('./features/notificaciones/notificaciones-list.component').then(
            (m) => m.NotificacionesListComponent
          ),
      },
      // Analytics
      {
        path: 'analytics',
        loadChildren: () =>
          import('./features/analytics/analytics.routes').then((m) => m.ANALYTICS_ROUTES),
      },
      // Approvals
      {
        path: 'approvals',
        loadChildren: () =>
          import('./features/approvals/approvals.routes').then((m) => m.APPROVALS_ROUTES),
      },
    ],
  },

  // Operator Module (separate layout - mobile-first UI for field operators)
  {
    path: 'operator',
    loadComponent: () =>
      import('./features/operator/operator-layout.component').then(
        (m) => m.OperatorLayoutComponent
      ),
    canActivate: [authGuard, roleGuard],
    data: { roles: [ROLES.OPERADOR] },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/operator/dashboard/operator-dashboard.component').then(
            (m) => m.OperatorDashboardComponent
          ),
      },
      {
        path: 'daily-report',
        loadComponent: () =>
          import('./features/operator/daily-report/operator-daily-report.component').then(
            (m) => m.OperatorDailyReportComponent
          ),
      },
      {
        path: 'daily-report/:id',
        loadComponent: () =>
          import('./features/operator/daily-report/operator-daily-report.component').then(
            (m) => m.OperatorDailyReportComponent
          ),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./features/operator/history/operator-history.component').then(
            (m) => m.OperatorHistoryComponent
          ),
      },
      {
        path: 'pending-reports',
        loadComponent: () =>
          import('./features/operator/pending-reports/operator-pending-reports.component').then(
            (m) => m.OperatorPendingReportsComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/operator/profile/operator-profile.component').then(
            (m) => m.OperatorProfileComponent
          ),
      },
    ],
  },

  { path: '**', redirectTo: '/app' },
];
