import { Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { ProductDetailComponent } from './components/product-detail/product-detail.component';
import { MovementListComponent } from './components/movement-list/movement-list.component';
import { MovementFormComponent } from './components/movement-form/movement-form.component';
import { MovementDetailComponent } from './components/movement-detail/movement-detail.component';

export const LOGISTICS_ROUTES: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'products/:id/edit', component: ProductFormComponent },
  { path: 'movements', component: MovementListComponent },
  { path: 'movements/new', component: MovementFormComponent },
  { path: 'movements/:id', component: MovementDetailComponent },
  { path: 'movements/:id/edit', component: MovementFormComponent },
  // Material Requests
  {
    path: 'material-requests',
    loadComponent: () =>
      import('./requests/solicitud-list.component').then((m) => m.SolicitudListComponent),
  },
  {
    path: 'material-requests/new',
    loadComponent: () =>
      import('./requests/solicitud-form.component').then((m) => m.SolicitudFormComponent),
  },
  {
    path: 'material-requests/:id',
    loadComponent: () =>
      import('./requests/solicitud-form.component').then((m) => m.SolicitudFormComponent),
  },
  {
    path: 'material-requests/:id/edit',
    loadComponent: () =>
      import('./requests/solicitud-form.component').then((m) => m.SolicitudFormComponent),
  },
  // Requirements
  {
    path: 'requirements',
    loadComponent: () =>
      import('./requests/requerimiento-list.component').then((m) => m.RequerimientoListComponent),
  },
  {
    path: 'requirements/new',
    loadComponent: () =>
      import('./requests/requerimiento-form.component').then((m) => m.RequerimientoFormComponent),
  },
  {
    path: 'requirements/:id',
    loadComponent: () =>
      import('./requests/requerimiento-form.component').then((m) => m.RequerimientoFormComponent),
  },
  {
    path: 'requirements/:id/edit',
    loadComponent: () =>
      import('./requests/requerimiento-form.component').then((m) => m.RequerimientoFormComponent),
  },
  // Categories
  {
    path: 'categories',
    loadComponent: () =>
      import('./requests/categoria-list.component').then((m) => m.CategoriaListComponent),
  },
];
