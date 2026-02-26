import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ModuleNavComponent,
  TabItem,
} from '../../shared/components/module-nav/module-nav.component';

@Component({
  selector: 'app-operaciones-layout',
  standalone: true,
  imports: [RouterModule, ModuleNavComponent],
  template: `
    <app-module-nav [tabs]="tabs"></app-module-nav>
    <router-outlet></router-outlet>
  `,
})
export class OperacionesLayoutComponent {
  tabs: TabItem[] = [
    { label: 'Solicitudes', route: '/equipment/operaciones/solicitudes', icon: 'fa-file-invoice' },
    {
      label: 'Órdenes de Alquiler',
      route: '/equipment/operaciones/ordenes-alquiler',
      icon: 'fa-file-contract',
    },
    {
      label: 'Contratos',
      route: '/equipment/operaciones/contratos',
      icon: 'fa-file-signature',
    },
  ];
}
