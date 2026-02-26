import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  ModuleNavComponent,
  TabItem,
} from '../../shared/components/module-nav/module-nav.component';

@Component({
  selector: 'app-analytics-module-layout',
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
export class AnalyticsModuleLayoutComponent {
  tabs: TabItem[] = [
    { label: 'Resumen de Flota', route: '/analytics/flota', icon: 'fa-truck-fast' },
    { label: 'Utilización', route: '/analytics/utilizacion', icon: 'fa-clock' },
    { label: 'Combustible', route: '/analytics/combustible', icon: 'fa-gas-pump' },
  ];
}
