import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ProviderService } from '../../core/services/provider.service';
import { Provider } from '../../core/models/provider.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Proveedores"
      icon="fa-handshake"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="providers.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <button class="btn btn-primary" (click)="createProvider()">
          <i class="fa-solid fa-plus"></i> Nuevo Proveedor
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="providers"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          provider: providerTemplate,
          ruc: rucTemplate,
          contact: contactTemplate,
          location: locationTemplate,
        }"
        (rowClick)="viewProvider($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #providerTemplate let-row>
        <div class="provider-info">
          <span class="provider-name">{{ row.razon_social }}</span>
          <!-- contact_name removed as not in backend entity -->
        </div>
      </ng-template>

      <ng-template #rucTemplate let-row>
        <span class="ruc-text">{{ row.ruc }}</span>
      </ng-template>

      <ng-template #contactTemplate let-row>
        <div class="contact-info">
          <div *ngIf="row.email" class="contact-item">
            <i class="fa-regular fa-envelope"></i> {{ row.email }}
          </div>
          <div *ngIf="row.telefono" class="contact-item">
            <i class="fa-solid fa-phone"></i> {{ row.telefono }}
          </div>
        </div>
      </ng-template>

      <ng-template #locationTemplate let-row>
        <div class="address-info" title="{{ row.direccion }}">
          <i class="fa-solid fa-location-dot"></i>
          <span class="address-text">{{ row.direccion || '-' }}</span>
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            class="btn-icon"
            (click)="viewProvider(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            class="btn-icon"
            (click)="editProvider(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }

      .provider-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .provider-name {
        font-weight: 600;
        color: var(--grey-900);
      }

      .provider-contact {
        font-size: 12px;
        color: var(--grey-500);
      }

      .ruc-text {
        font-family: monospace;
        color: var(--grey-700);
      }

      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 13px;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--grey-700);
      }

      .contact-item i {
        font-size: 12px;
        color: var(--grey-400);
        width: 14px;
        text-align: center;
      }

      .address-info {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--grey-700);
        max-width: 200px;
      }

      .address-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: color 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }
    `,
  ],
})
export class ProviderListComponent implements OnInit {
  providerService = inject(ProviderService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);

  providers: Provider[] = [];
  loading = false;
  filters = { status: '', search: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Dashboard', url: '/app' }, { label: 'Proveedores' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por razón social o RUC...',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Lista Proveedor', value: 'lista_proveedor' },
        { label: 'Lista de Otros proveedores', value: 'lista_otros_proveedores' },
        { label: 'Lista Negra', value: 'lista_negra' },
        { label: 'Inactivo', value: 'inactivo' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'razon_social', label: 'Razón Social', type: 'template' }, // KEY CHANGED but type is template, so key usage depends on template or sort. AeroTable uses key for template lookup if template name matches key? No, [templates]="{ provider: ... }"
    // Actually AeroTable uses `col.key` to access data for default render, BUT `type: 'template'` uses `getTemplate(col.key)`.
    // In HTML: [templates]="{ provider: providerTemplate }"
    // So the column key MUST be 'provider' to match the template key 'provider' in the input templates map.
    // Wait, let's keep keys as logical identifiers for templates if they are mapped in [templates].
    // BUT for `actionsTemplate` logic or data access, it might matter.
    // The previous code had: `{ key: 'provider', ... }` and `[templates]="{ provider: providerTemplate }"`.
    // So 'provider' is just a key for the template.
    // I will keep 'provider' key for the column but update the template content (which I did above).
    // Wait, no. I should probably align keys to data just in case.
    // But if I change key to 'razon_social', I must update `[templates]` map in HTML too.
    // It's cleaner to update keys to match data properties where possible, but for composite templates it's fine to use logical names.
    // I will keep 'provider' key but update the template content to use `row.razon_social`.
    // Oh wait, I replaced the template content above to use `row.razon_social`.
    // So I can keep `key: 'provider'` in columns if I map `provider` to the template.
    
    // HOWEVER, for `ruc` -> `tax_id` was `tax_id`. Now `ruc`.
    // I will change column key to `ruc` and update `[templates]` map in HTML to use `ruc`.
    
    { key: 'provider', label: 'Razón Social', type: 'template' },
    { key: 'ruc', label: 'RUC', type: 'template' },
    { key: 'contact', label: 'Contacto', type: 'template' },
    { key: 'location', label: 'Ubicación', type: 'template' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        true: { label: 'Activo', class: 'badge status-active' },
        false: { label: 'Inactivo', class: 'badge status-inactive' },
      },
      // Check if AeroTable handles boolean keys in badgeConfig. usually converts to string 'true'/'false'.
    },
  ];

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading = true;
    this.providerService.getAll(this.filters).subscribe({
      next: (data) => {
        this.providers = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.status = filters['status'] || '';
    this.loadProviders();
  }

  viewProvider(provider: Provider): void {
    this.router.navigate(['/providers', provider.id]);
  }

  editProvider(provider: Provider): void {
    this.router.navigate(['/providers', provider.id, 'edit']);
  }

  createProvider(): void {
    this.router.navigate(['/providers/new']);
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.providers.length === 0) {
      alert('No hay proveedores para exportar');
      return;
    }

    const exportData = this.providers.map((provider) => ({
      Código: provider.legacy_id || '',
      'Razón Social': provider.razon_social || '',
      RUC: provider.ruc || '',
      'Tipo Proveedor': provider.tipo_proveedor || '',
      // 'Nombre Contacto': provider.contact_name || '',
      Email: provider.email || '',
      Teléfono: provider.telefono || '',
      Dirección: provider.direccion || '',
      Estado: provider.is_active ? 'Activo' : 'Inactivo',
      'Fecha Registro': provider.created_at
        ? new Date(provider.created_at).toLocaleDateString('es-PE')
        : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'proveedores',
      sheetName: 'Proveedores',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.providers.length === 0) {
      alert('No hay proveedores para exportar');
      return;
    }

    const exportData = this.providers.map((provider) => ({
      'Razón Social': provider.razon_social || '',
      RUC: provider.ruc || '',
      'Tipo Proveedor': provider.tipo_proveedor || '',
      // 'Nombre Contacto': provider.contact_name || '', // Removed
      Email: provider.email || '',
      Teléfono: provider.telefono || '',
      Dirección: provider.direccion || '',
      Estado: provider.is_active ? 'Activo' : 'Inactivo',
      'Fecha Registro': provider.created_at
        ? new Date(provider.created_at).toLocaleDateString('es-PE')
        : '',
    }));

    this.excelService.exportToCSV(exportData, 'proveedores');
  }
}
