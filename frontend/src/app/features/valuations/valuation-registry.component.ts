import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';
import { AeroCardComponent } from '../../core/design-system/card/aero-card.component';
import { AeroInputComponent } from '../../core/design-system/input/aero-input.component';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import { EQUIPMENT_TABS } from '../equipment/equipment-tabs';

@Component({
  selector: 'app-valuation-registry',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    DropdownComponent,
    AeroCardComponent,
    AeroInputComponent,
    AeroDataGridComponent,
  ],
  template: `
    <app-page-layout
      title="Registro de Valorizaciones"
      icon="fa-file-invoice-dollar"
      [tabs]="tabs"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"></app-export-dropdown>
      </app-actions-container>

      <!-- Summary Stats -->
      <div class="summary-grid" *ngIf="summary">
        <aero-card [title]="'Total Valorizado'">
          <div class="stat-value">S/ {{ summary.total_valorizado | number: '1.2-2' }}</div>
          <div class="stat-label">Sin IGV</div>
        </aero-card>
        <aero-card [title]="'Total con IGV'">
          <div class="stat-value">S/ {{ summary.total_con_igv | number: '1.2-2' }}</div>
          <div class="stat-label">Facturado</div>
        </aero-card>
        <aero-card [title]="'Registros'">
          <div class="stat-value">{{ summary.total_count }}</div>
          <div class="stat-label">Total</div>
        </aero-card>
        <aero-card [title]="'Estados'">
          <div class="status-summary">
            <div *ngFor="let s of summary.by_status" class="status-item">
              <span [class]="'status-dot status-' + s.status"></span>
              <span class="status-count">{{ s.count }}</span>
              <span class="status-name">{{ getEstadoLabel(s.status) }}</span>
            </div>
          </div>
        </aero-card>
      </div>

      <!-- Filters -->
      <aero-card variant="outlined">
        <div class="filter-grid">
          <aero-input
            label="Periodo Desde"
            type="month"
            [(ngModel)]="filters['periodo_desde']"
            (ngModelChange)="loadRegistry()"
            inputId="filter-periodo-desde"
          ></aero-input>

          <aero-input
            label="Periodo Hasta"
            type="month"
            [(ngModel)]="filters['periodo_hasta']"
            (ngModelChange)="loadRegistry()"
            inputId="filter-periodo-hasta"
          ></aero-input>

          <div class="filter-group">
            <span class="aero-label">Estado</span>
            <app-dropdown
              [(ngModel)]="filters['estado']"
              [options]="statusOptions"
              [placeholder]="'Todos'"
              (ngModelChange)="loadRegistry()"
            ></app-dropdown>
          </div>

          <aero-input
            label="Proveedor"
            placeholder="RUC o razón social..."
            [(ngModel)]="filters['proveedor']"
            (input)="onProveedorSearch()"
            inputId="filter-proveedor"
          ></aero-input>
        </div>
      </aero-card>

      <!-- Data Table -->
      <aero-data-grid
        [gridId]="'valuation-registry'"
        [columns]="tableColumns"
        [data]="registryData"
        [loading]="loading"
        [serverSide]="true"
        [totalItems]="totalRecords"
        [dense]="true"
        [showColumnChooser]="true"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        (rowClick)="viewDetail($event)"
        (sortChange)="onSort($event)"
        [templates]="{
          equipo: equipoTemplate,
          proveedor: proveedorTemplate,
          contrato: contratoTemplate,
        }"
      >
      </aero-data-grid>

      <!-- Column Templates -->
      <ng-template #equipoTemplate let-row>
        <div class="cell-group">
          <span class="equipo-code">{{ row.equipo?.codigo || '-' }}</span>
          <span class="equipo-name">{{ row.equipo?.nombre }}</span>
        </div>
      </ng-template>

      <ng-template #proveedorTemplate let-row>
        <span class="text-truncate" [title]="row.contrato?.proveedor?.razon_social">
          {{ row.contrato?.proveedor?.razon_social || '-' }}
        </span>
      </ng-template>

      <ng-template #contratoTemplate let-row>
        <span class="code">{{ row.contrato?.codigo || '-' }}</span>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
        margin-bottom: var(--s-24);
      }

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--primary-800);
        font-family: monospace;
        letter-spacing: -0.5px;
      }

      .stat-label {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      .status-summary {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--grey-700);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .status-count {
        font-weight: 600;
        min-width: 20px;
      }

      .filter-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-16);
        align-items: flex-start;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .aero-label {
        font-size: var(--type-bodySmall-size);
        font-weight: 500;
        color: var(--primary-900);
        margin-bottom: var(--s-4);
      }

      .cell-group {
        display: flex;
        flex-direction: column;
      }

      .equipo-code {
        font-weight: 600;
        color: var(--primary-700);
        font-family: monospace;
      }

      .equipo-name {
        font-size: 12px;
        color: var(--grey-500);
      }

      .code {
        font-family: monospace;
        font-weight: 600;
      }

      .text-truncate {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 100%;
      }

      /* Reuse status colors for summary dots */
      .status-borrador {
        background: var(--grey-400);
      }
      .status-pendiente {
        background: var(--accent-500);
      }
      .status-en_revision {
        background: var(--semantic-blue-500);
      }
      .status-validado {
        background: var(--primary-900);
      }
      .status-aprobado {
        background: var(--semantic-blue-500);
      }
      .status-rechazado {
        background: var(--accent-500);
      }
      .status-pagado {
        background: var(--grey-700);
      }

      /* Ensure status badges in table (provided by AeroTable classes mostly, but we set custom classes in config) */
      /* We rely on global status classes or AeroTable's default behavior, but we used custom classes in previous impl. */
      /* Let's define them here to be safe if AeroTable falls back to class strings */
      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        white-space: nowrap;
      }
      .status-BORRADOR {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .status-PENDIENTE {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .status-EN_REVISION {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-VALIDADO {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .status-APROBADO {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .status-RECHAZADO {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .status-PAGADO {
        background: var(--grey-100);
        color: var(--grey-700);
      }
    `,
  ],
})
export class ValuationRegistryComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  private valuationService = inject(ValuationService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);
  private snackBar = inject(MatSnackBar);

  registryData: Record<string, unknown>[] = [];
  summary: Record<string, unknown> | null = null;
  loading = false;
  totalRecords = 0;

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Valorizaciones' },
  ];

  filters: Record<string, string | number> = {
    periodo_desde: '',
    periodo_hasta: '',
    estado: '',
    proveedor: '',
    page: 1,
    limit: 50,
  };

  tableColumns: DataGridColumn[] = [
    {
      key: 'numeroValorizacion',
      label: 'N° Val',
      width: '100px',
      sticky: true,
      sortable: true,
      customTemplate: (row: any) => row.numeroValorizacion || '-',
    },
    { key: 'periodo', label: 'Periodo', width: '100px', sortable: true, filterable: true },
    { key: 'equipo', label: 'Equipo', width: '180px', type: 'template', sortable: true },
    { key: 'proveedor', label: 'Proveedor', width: '250px', type: 'template', filterable: true },
    { key: 'contrato', label: 'Contrato', width: '120px', type: 'template' },
    {
      key: 'totalValorizado',
      label: 'Total Val.',
      align: 'right',
      type: 'currency',
      sortable: true,
    },
    { key: 'igvMonto', label: 'IGV', align: 'right', type: 'currency' },
    { key: 'totalConIgv', label: 'Total', align: 'right', type: 'currency' },
    {
      key: 'estado',
      label: 'Estado',
      align: 'center',
      type: 'badge',
      filterable: true,
      filterType: 'select',
      filterOptions: [
        { value: 'BORRADOR', label: 'Borrador' },
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'EN_REVISION', label: 'En Revisión' },
        { value: 'VALIDADO', label: 'Validado' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
        { value: 'PAGADO', label: 'Pagado' },
      ],
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-BORRADOR' },
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-PENDIENTE' },
        EN_REVISION: { label: 'En Revisión', class: 'status-badge status-EN_REVISION' },
        VALIDADO: { label: 'Validado', class: 'status-badge status-VALIDADO' },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-APROBADO' },
        RECHAZADO: { label: 'Rechazado', class: 'status-badge status-RECHAZADO' },
        PAGADO: { label: 'Pagado', class: 'status-badge status-PAGADO' },
        ELIMINADO: { label: 'Eliminado', class: 'status-badge status-ELIMINADO' },
      },
    },
    // Legacy columns (hidden by default, visible via column chooser)
    {
      key: 'horasOperativas',
      label: 'Hrs. Operativas',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    { key: 'horasStandby', label: 'Hrs. Standby', type: 'number', hidden: true, sortable: true },
    {
      key: 'horasInoperativas',
      label: 'Hrs. Inoperativas',
      type: 'number',
      hidden: true,
      sortable: true,
    },
    { key: 'dieselGalones', label: 'Diesel (gln)', type: 'number', hidden: true, sortable: true },
    { key: 'dieselMonto', label: 'Diesel (S/)', type: 'currency', hidden: true, sortable: true },
    { key: 'repuestosMonto', label: 'Repuestos', type: 'currency', hidden: true },
    { key: 'otrosGastos', label: 'Otros Gastos', type: 'currency', hidden: true },
    { key: 'penalidad', label: 'Penalidad', type: 'currency', hidden: true },
    { key: 'deduccion', label: 'Deducción', type: 'currency', hidden: true },
    { key: 'fechaEmision', label: 'Fecha Emisión', type: 'date', hidden: true, sortable: true },
    {
      key: 'fechaAprobacion',
      label: 'Fecha Aprobación',
      type: 'date',
      hidden: true,
      sortable: true,
    },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
    { key: 'usuario_registro', label: 'Registrado por', hidden: true },
  ];

  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  statusOptions = [
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'PENDIENTE', label: 'Pendiente' },
    { value: 'EN_REVISION', label: 'En Revisión' },
    { value: 'VALIDADO', label: 'Validado' },
    { value: 'APROBADO', label: 'Aprobado' },
    { value: 'RECHAZADO', label: 'Rechazado' },
    { value: 'PAGADO', label: 'Pagado' },
  ];

  ngOnInit(): void {
    this.loadRegistry();
  }

  loadRegistry(): void {
    this.loading = true;
    this.valuationService.getRegistry(this.filters).subscribe({
      next: (result: any) => {
        this.registryData = result.data || [];
        this.totalRecords = result.total || 0;
        this.summary = result.summary || null;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading registry:', err);
        this.loading = false;
      },
    });
  }

  onPageChange(page: number): void {
    this.filters['page'] = page;
    this.loadRegistry();
  }

  onPageSizeChange(size: number): void {
    this.filters['limit'] = size;
    this.filters['page'] = 1;
    this.loadRegistry();
  }

  onSort(event: { column: string; direction: string | null }): void {
    this.filters['sort_by'] = event.column;
    this.filters['sort_dir'] = event.direction || '';
    this.filters['page'] = 1;
    this.loadRegistry();
  }

  onProveedorSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.filters['page'] = 1;
      this.loadRegistry();
    }, 400);
  }

  viewDetail(row: any): void {
    this.router.navigate(['/equipment/valuations', row.id]);
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En Revisión',
      VALIDADO: 'Validado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      PAGADO: 'Pagado',
      ELIMINADO: 'Eliminado',
    };
    return labels[estado] || estado;
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  private getExportData() {
    return this.registryData.map((row: any) => ({
      'N° Valorización': row.numeroValorizacion || '',
      Periodo: row.periodo || '',
      Equipo: row?.equipo?.codigo || '',
      Proveedor: row?.contrato?.proveedor?.razon_social || '',
      Contrato: row?.contrato?.codigo || '',
      'Total Valorizado': row.totalValorizado || 0,
      IGV: row.igvMonto || 0,
      'Total con IGV': row.totalConIgv || 0,
      Estado: row.estado || '',
    }));
  }

  exportToExcel(): void {
    if (this.registryData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }
    this.excelService.exportToExcel(this.getExportData(), {
      filename: 'registro-valorizaciones',
      sheetName: 'Registro',
    });
  }

  exportToCSV(): void {
    if (this.registryData.length === 0) {
      this.snackBar.open('No hay datos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }
    this.excelService.exportToCSV(this.getExportData(), 'registro-valorizaciones');
  }
}
