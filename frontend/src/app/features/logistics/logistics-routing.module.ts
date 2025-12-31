import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProductListComponent } from './components/product-list/product-list.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { MovementListComponent } from './components/movement-list/movement-list.component';
import { MovementFormComponent } from './components/movement-form/movement-form.component';

const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },
  { path: 'products', component: ProductListComponent },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/:id/edit', component: ProductFormComponent },
  { path: 'movements', component: MovementListComponent },
  { path: 'movements/new', component: MovementFormComponent },
  { path: 'movements/:id', component: MovementFormComponent },
  
  // Fuel Routes
  {
    path: 'fuel',
    loadComponent: () =>
      import('../fuel/fuel-list.component').then((m) => m.FuelListComponent),
  },
  {
    path: 'fuel/new',
    loadComponent: () =>
      import('../fuel/fuel-form.component').then((m) => m.FuelFormComponent),
  },
  {
    path: 'fuel/:id',
    loadComponent: () =>
      import('../fuel/fuel-detail.component').then((m) => m.FuelDetailComponent),
  },
  {
    path: 'fuel/:id/edit',
    loadComponent: () =>
      import('../fuel/fuel-form.component').then((m) => m.FuelFormComponent),
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LogisticsRoutingModule {}
