import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ProviderService } from '../../core/services/provider.service';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { Provider } from '../../core/models/provider.model';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
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
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
    PageCardComponent,
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

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createProvider()"
          >Nuevo Proveedor</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'provider-list'"
          [columns]="columns"
          [data]="providers"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="pageSize"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            provider: providerTemplate,
            ruc: rucTemplate,
            contact: contactTemplate,
            location: locationTemplate,
          }"
          (rowClick)="viewProvider($event)"
          (sortChange)="onSort($event)"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
        >
        </aero-data-grid>
      </app-page-card>

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
          <div *ngIf="row.correo_electronico" class="contact-item">
            <i class="fa-regular fa-envelope"></i> {{ row.correo_electronico }}
          </div>
          <div *ngIf="row.telefono" class="contact-item">
            <i class="fa-solid fa-phone"></i> {{ row.telefono }}
          </div>
          <div *ngIf="!row.correo_electronico && !row.telefono" class="text-muted">-</div>
        </div>
      </ng-template>

      <ng-template #locationTemplate let-row>
        <div class="address-info" title="{{ row.direccion }}" *ngIf="row.direccion">
          <i class="fa-solid fa-location-dot"></i>
          <span class="address-text">{{ row.direccion }}</span>
        </div>
        <div *ngIf="!row.direccion" class="text-muted">-</div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalles"
            (clicked)="viewProvider(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            (clicked)="editProvider(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteProvider(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
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
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  providers: Provider[] = [];
  loading = false;
  total = 0;
  pageSize = 50;
  page = 1;
  filters = { status: '', search: '' };

  breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', url: '/dashboard' }, { label: 'Proveedores' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por razón social, RUC o email...',
    },
    {
      key: 'tipo_proveedor',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Equipos', value: 'EQUIPOS' },
        { label: 'Materiales', value: 'MATERIALES' },
        { label: 'Servicios', value: 'SERVICIOS' },
        { label: 'Mixto', value: 'MIXTO' },
      ],
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

  columns: DataGridColumn[] = [
    { key: 'provider', label: 'Razón Social', type: 'template', sortable: true, filterable: true },
    { key: 'ruc', label: 'RUC', type: 'template', sortable: true, filterable: true },
    { key: 'contact', label: 'Contacto', type: 'template' },
    { key: 'location', label: 'Ubicación', type: 'template' },
    {
      key: 'is_active',
      label: 'Estado',
      type: 'badge',
      sortable: true,
      filterable: true,
      badgeConfig: {
        true: {
          label: 'Activo',
          class: 'status-badge status-active',
          icon: 'fa-solid fa-check',
        },
        false: {
          label: 'Inactivo',
          class: 'status-badge status-inactive',
          icon: 'fa-solid fa-ban',
        },
      },
    },
    // Legacy hidden columns (from 307_Proveedor.tbl_C07001_Proveedor)
    { key: 'direccion', label: 'Dirección', hidden: true },
    { key: 'telefono', label: 'Teléfono', hidden: true },
    { key: 'email', label: 'Email', hidden: true },
    { key: 'contacto_nombre', label: 'Contacto', hidden: true },
    { key: 'contacto_cargo', label: 'Cargo Contacto', hidden: true },
    { key: 'contacto_telefono', label: 'Tel. Contacto', hidden: true },
    { key: 'departamento', label: 'Departamento', hidden: true },
    { key: 'provincia', label: 'Provincia', hidden: true },
    { key: 'distrito', label: 'Distrito', hidden: true },
    { key: 'tipo_proveedor', label: 'Tipo', hidden: true, filterable: true },
    { key: 'cuenta_bancaria', label: 'Cuenta Bancaria', hidden: true },
    { key: 'banco', label: 'Banco', hidden: true },
    { key: 'cci', label: 'CCI', hidden: true },
    { key: 'cuenta_detraccion', label: 'Cta. Detracción', hidden: true },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true, sortable: true },
    { key: 'usuario_registro', label: 'Registrado por', hidden: true },
  ];

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading = true;
    this.providerService
      .getAllPaginated({
        page: this.page,
        limit: this.pageSize,
        search: this.filters.search || undefined,
        status: this.filters.status || undefined,
      })
      .subscribe({
        next: (response) => {
          this.providers = response.data;
          this.total = response.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.page = 1;
    this.loadProviders();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadProviders();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadProviders();
  }

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
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

  deleteProvider(provider: Provider): void {
    this.confirmSvc
      .confirmDelete(`el proveedor ${provider.razon_social}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.providerService.delete(provider.id).subscribe({
            next: () => {
              this.loadProviders();
              this.snackBar.open('Proveedor eliminado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al eliminar proveedor', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
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
      this.snackBar.open('No hay proveedores para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.providers.map((provider) => ({
      Código: provider.legacy_id || '',
      'Razón Social': provider.razon_social || '',
      RUC: provider.ruc || '',
      'Tipo Proveedor': provider.tipo_proveedor || '',
      // 'Nombre Contacto': provider.contact_name || '',
      Email: provider.correo_electronico || '',
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
      this.snackBar.open('No hay proveedores para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.providers.map((provider) => ({
      'Razón Social': provider.razon_social || '',
      RUC: provider.ruc || '',
      'Tipo Proveedor': provider.tipo_proveedor || '',
      // 'Nombre Contacto': provider.contact_name || '', // Removed
      Email: provider.correo_electronico || '',
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
