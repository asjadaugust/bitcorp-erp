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
];
