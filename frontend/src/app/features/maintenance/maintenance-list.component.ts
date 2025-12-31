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
          equipment: equipmentTemplate,
          description: descriptionTemplate,
        }"
        (rowClick)="viewRecord($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #equipmentTemplate let-row>
        <div class="equipment-info">
          <span class="equip-code">{{ row.equipment?.code || 'N/A' }}</span>
          <span class="equip-model">{{ row.equipment?.brand }} {{ row.equipment?.model }}</span>
        </div>
      </ng-template>

      <ng-template #descriptionTemplate let-row>
        <div class="description-text" title="{{ row.description }}">
          {{ row.description }}
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
    { label: 'Programación', route: '/equipment/maintenance/schedule', icon: 'fa-calendar', animate: true },
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
        { label: 'Preventivo', value: 'preventive' },
        { label: 'Correctivo', value: 'corrective' },
        { label: 'Predictivo', value: 'predictive' },
      ],
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Programado', value: 'scheduled' },
        { label: 'En Progreso', value: 'in_progress' },
        { label: 'Completado', value: 'completed' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'equipment', label: 'Equipo', type: 'template' },
    {
      key: 'maintenance_type',
      label: 'Tipo',
      type: 'badge',
      badgeConfig: {
        preventive: { label: 'Preventivo', class: 'badge type-preventive' },
        corrective: { label: 'Correctivo', class: 'badge type-corrective' },
        predictive: { label: 'Predictivo', class: 'badge type-predictive' },
      },
    },
    { key: 'description', label: 'Descripción', type: 'template' },
    { key: 'start_date', label: 'Fecha Inicio', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'cost', label: 'Costo', type: 'currency', format: 'PEN' },
    { key: 'provider_name', label: 'Proveedor', type: 'text' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        completed: { label: 'Completado', class: 'badge status-completed' },
        in_progress: { label: 'En Progreso', class: 'badge status-in_progress' },
        scheduled: { label: 'Programado', class: 'badge status-scheduled' },
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
        this.records = data.map((r) => ({
          ...r,
          provider_name: r.provider?.business_name || '-',
        }));
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
      Equipo: record.equipment?.equipment_code || 'N/A',
      Tipo: record.maintenance_type || '',
      Descripción: record.description || '',
      'Fecha Inicio': record.start_date
        ? new Date(record.start_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': record.end_date ? new Date(record.end_date).toLocaleDateString('es-PE') : '',
      Costo: record.cost || 0,
      Proveedor: record.provider_name || '-',
      Estado: record.status || '',
      Horómetro: record.hourmeter_reading || 0,
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
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
      Equipo: record.equipment?.equipment_code || 'N/A',
      Tipo: record.maintenance_type || '',
      Descripción: record.description || '',
      'Fecha Inicio': record.start_date
        ? new Date(record.start_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': record.end_date ? new Date(record.end_date).toLocaleDateString('es-PE') : '',
      Costo: record.cost || 0,
      Proveedor: record.provider_name || '-',
      Estado: record.status || '',
      Horómetro: record.hourmeter_reading || 0,
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'mantenimientos');
  }
}
