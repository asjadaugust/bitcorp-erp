import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import {
  ModuleNavComponent,
  TabItem,
} from '../../shared/components/module-nav/module-nav.component';

@Component({
  selector: 'app-equipment-module-layout',
  standalone: true,
  imports: [RouterModule, ModuleNavComponent],
  template: `
    <div class="module-shell">
      <div class="module-content">
        <app-module-nav [tabs]="tabs"></app-module-nav>
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
export class EquipmentModuleLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  tabs: TabItem[] = [];

  ngOnInit(): void {
    this.calculateTabs();
  }

  private get isAdmin(): boolean {
    return this.authService.getCurrentUserRole()?.toUpperCase() === 'ADMIN';
  }

  private calculateTabs(): void {
    const items: TabItem[] = [
      { label: 'Dashboard', route: '/equipment/dashboard', icon: 'fa-chart-line' },
      { label: 'Equipos', route: '/equipment', icon: 'fa-list', exact: true },
      { label: 'Solicitudes', route: '/equipment/solicitudes', icon: 'fa-file-invoice' },
      { label: 'Órdenes', route: '/equipment/ordenes-alquiler', icon: 'fa-file-contract' },
      { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
      { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
      { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-signature' },
      { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
      { label: 'Devoluciones', route: '/equipment/actas-devolucion', icon: 'fa-rotate-left' },
      {
        label: 'Inoperatividad',
        route: '/equipment/inoperatividad',
        icon: 'fa-triangle-exclamation',
      },
      { label: 'Combustible', route: '/equipment/vales-combustible', icon: 'fa-gas-pump' },
    ];

    if (this.isAdmin) {
      items.push({
        label: 'Precalentamiento',
        route: '/equipment/precalentamiento-config',
        icon: 'fa-fire-flame-curved',
      });
    }

    this.tabs = items;
  }
}
