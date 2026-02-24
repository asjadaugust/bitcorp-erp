import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ModuleNavComponent, TabItem } from '../../shared/components/module-nav/module-nav.component';

@Component({
  selector: 'app-administracion-module-layout',
  standalone: true,
  imports: [RouterModule, ModuleNavComponent],
  template: `
    <div class="module-shell">
      <app-module-nav [tabs]="tabs"></app-module-nav>
      <div class="module-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [
    `
      .module-shell {
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 72px);
      }

      .module-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class AdministracionModuleLayoutComponent {
  tabs: TabItem[] = [
    { label: 'Centros de Costo', route: '/administracion/cost-centers', icon: 'fa-building-columns' },
    { label: 'Cuentas por Pagar', route: '/administracion/accounts-payable', icon: 'fa-file-invoice-dollar' },
    { label: 'Cronograma de Pagos', route: '/administracion/payment-schedules', icon: 'fa-calendar-check' },
  ];
}
