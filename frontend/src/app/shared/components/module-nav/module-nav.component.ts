import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TabItem } from '../page-layout/page-layout.component';
import { AeroTabsComponent } from '../aero-tabs/aero-tabs.component';

export { TabItem };

/**
 * ModuleNavComponent — persistent horizontal tab bar for multi-section modules.
 *
 * Usage:
 *   <app-module-nav [tabs]="tabs"></app-module-nav>
 *
 * Visual design matches PageLayoutComponent's tab-navigation / tab-item exactly.
 * This is the single source of truth for module-level navigation styling.
 */
@Component({
  selector: 'app-module-nav',
  standalone: true,
  imports: [CommonModule, RouterModule, AeroTabsComponent],
  template: `
    <div class="nav-container" *ngIf="tabs && tabs.length > 0">
      <app-aero-tabs [tabs]="tabs"></app-aero-tabs>
    </div>
  `,
  styles: [
    `
      .nav-container {
        padding: 0 54px;
        background: transparent;
      }

      @media (max-width: 768px) {
        .nav-container {
          padding: 0 var(--s-16);
        }
      }
    `,
  ],
})
export class ModuleNavComponent {
  @Input() tabs: TabItem[] = [];
}
