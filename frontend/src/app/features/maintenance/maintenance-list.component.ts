import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { MaintenanceRecord } from '../../core/models/maintenance-record.model';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-maintenance-list',
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
      title="Gestión de Mantenimiento"
      icon="fa-wrench"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <button type="button" class="btn btn-primary" (click)="createMaintenance()">
          <i class="fa-solid fa-plus"></i> Nuevo Mantenimiento
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="records"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          equipo: equipmentTemplate,
          descripcion: descriptionTemplate,
        }"
        (rowClick)="viewRecord($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #equipmentTemplate let-row>
        <div class="equipment-info">
          <span class="equip-code">{{ row.equipo?.codigo_equipo || 'N/A' }}</span>
          <span class="equip-model">{{ row.equipo?.marca }} {{ row.equipo?.modelo }}</span>
        </div>
      </ng-template>

      <ng-template #descriptionTemplate let-row>
        <div class="description-text" title="{{ row.descripcion }}">
          {{ row.descripcion }}
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            class="btn-icon"
            (click)="viewRecord(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            class="btn-icon"
            (click)="editRecord(row); $event.stopPropagation()"
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
      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }

      .equipment-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .equip-code {
        font-weight: 600;
        color: var(--primary-800);
        font-family: monospace;
      }

      .equip-model {
        font-size: 12px;
        color: var(--grey-500);
      }

      .description-text {
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    `,
  ],
})
export class MaintenanceListComponent implements OnInit {
  maintenanceService = inject(MaintenanceService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private excelService = inject(ExcelExportService);

  records: MaintenanceRecord[] = [];
  loading = false;
  filters = { status: '', type: '', search: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Dashboard', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Mantenimiento' },
  ];

  tabs: TabItem[] = [
    { label: 'Lista de Equipos', route: '/equipment', icon: 'fa-list' },
    { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
    { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
    {
      label: 'Programación',
      route: '/equipment/maintenance/schedule',
      icon: 'fa-calendar',
      animate: true,
    },
    { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-contract' },
    { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por equipo, descripción...',
    },
    {
      key: 'type',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Preventivo', value: 'PREVENTIVO' },
        { label: 'Correctivo', value: 'CORRECTIVO' },
        { label: 'Predictivo', value: 'PREDICTIVO' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Programado', value: 'PROGRAMADO' },
        { label: 'En Proceso', value: 'EN_PROCESO' },
        { label: 'Completado', value: 'COMPLETADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
        { label: 'Pendiente', value: 'PENDIENTE' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'equipo', label: 'Equipo', type: 'template' },
    {
      key: 'tipoMantenimiento',
      label: 'Tipo',
      type: 'badge',
      badgeConfig: {
        PREVENTIVO: { label: 'Preventivo', class: 'badge type-preventive' },
        CORRECTIVO: { label: 'Correctivo', class: 'badge type-corrective' },
        PREDICTIVO: { label: 'Predictivo', class: 'badge type-predictive' },
      },
    },
    { key: 'descripcion', label: 'Descripción', type: 'template' },
    { key: 'fechaProgramada', label: 'Fecha Programada', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'costoEstimado', label: 'Costo Est.', type: 'currency', format: 'PEN' },
    { key: 'tecnicoResponsable', label: 'Técnico', type: 'text' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        COMPLETADO: { label: 'Completado', class: 'badge status-completed' },
        EN_PROCESO: { label: 'En Proceso', class: 'badge status-in_progress' },
        PROGRAMADO: { label: 'Programado', class: 'badge status-scheduled' },
        CANCELADO: { label: 'Cancelado', class: 'badge status-cancelled' },
        PENDIENTE: { label: 'Pendiente', class: 'badge status-pending' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading = true;
    this.maintenanceService.getAll(this.filters).subscribe({
      next: (data) => {
        this.records = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.type = filters['type'] || '';
    this.filters.status = filters['status'] || '';
    this.loadRecords();
  }

  viewRecord(record: MaintenanceRecord): void {
    this.router.navigate([record.id], { relativeTo: this.route });
  }

  editRecord(record: MaintenanceRecord): void {
    this.router.navigate([record.id, 'edit'], { relativeTo: this.route });
  }

  createMaintenance(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.records.length === 0) {
      alert('No hay registros de mantenimiento para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: record.equipo?.codigo_equipo || 'N/A',
      Tipo: record.tipoMantenimiento || '',
      Descripción: record.descripcion || '',
      'Fecha Programada': record.fechaProgramada
        ? new Date(record.fechaProgramada).toLocaleDateString('es-PE')
        : '',
      'Fecha Realizada': record.fechaRealizada
        ? new Date(record.fechaRealizada).toLocaleDateString('es-PE')
        : '',
      'Costo Estimado': record.costoEstimado || 0,
      'Costo Real': record.costoReal || 0,
      Técnico: record.tecnicoResponsable || '-',
      Estado: record.estado || '',
      Creado: record.createdAt ? new Date(record.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'mantenimientos',
      sheetName: 'Mantenimientos',
    });
  }

  exportToCSV(): void {
    if (this.records.length === 0) {
      alert('No hay registros de mantenimiento para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: record.equipo?.codigo_equipo || 'N/A',
      Tipo: record.tipoMantenimiento || '',
      Descripción: record.descripcion || '',
      'Fecha Programada': record.fechaProgramada
        ? new Date(record.fechaProgramada).toLocaleDateString('es-PE')
        : '',
      'Fecha Realizada': record.fechaRealizada
        ? new Date(record.fechaRealizada).toLocaleDateString('es-PE')
        : '',
      'Costo Estimado': record.costoEstimado || 0,
      'Costo Real': record.costoReal || 0,
      Técnico: record.tecnicoResponsable || '-',
      Estado: record.estado || '',
      Creado: record.createdAt ? new Date(record.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'mantenimientos');
  }
}
