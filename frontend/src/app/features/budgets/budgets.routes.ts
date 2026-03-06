import { Routes } from '@angular/router';

export const BUDGETS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./presupuesto-list.component').then((m) => m.PresupuestoListComponent),
  },
  {
    path: 'insumos',
    loadComponent: () => import('./insumo-list.component').then((m) => m.InsumoListComponent),
  },
  {
    path: 'apus',
    loadComponent: () => import('./apu-list.component').then((m) => m.ApuListComponent),
  },
  {
    path: 'apus/:id',
    loadComponent: () => import('./apu-detail.component').then((m) => m.ApuDetailComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./presupuesto-detail.component').then((m) => m.PresupuestoDetailComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./presupuesto-detail.component').then((m) => m.PresupuestoDetailComponent),
  },
];
