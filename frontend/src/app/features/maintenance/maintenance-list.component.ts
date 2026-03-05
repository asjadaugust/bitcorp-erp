import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MaintenanceService } from '../../core/services/maintenance.service';
import { EquipmentService } from '../../core/services/equipment.service';
import { MaintenanceRecord } from '../../core/models/maintenance-record.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExcelExportService } from '../../core/services/excel-export.service';
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
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { forkJoin } from 'rxjs';
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-maintenance-list',
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
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Gestión de Mantenimiento"
      icon="fa-wrench"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nuevo Mantenimiento</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'maintenance-list'"
          [columns]="columns"
          [data]="records"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            equipo: equipmentTemplate,
            descripcion: descriptionTemplate,
            fechaProgramada: fechaTemplate,
          }"
          (rowClick)="viewRecord($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #equipmentTemplate let-row>
        <div class="equipment-info">
          <!-- Use the map to get equipment details -->
          <span class="equip-code">{{ getEquipmentCode(row.equipoId) }}</span>
          <span class="equip-model">{{ getEquipmentModel(row.equipoId) }}</span>
        </div>
      </ng-template>

      <ng-template #descriptionTemplate let-row>
        <div class="description-text" title="{{ row.descripcion }}">
          {{ row.descripcion }}
        </div>
      </ng-template>

      <ng-template #fechaTemplate let-row>
        <div class="fecha-cell">
          <span>{{ row.fechaProgramada | date: 'dd/MM/yyyy' }}</span>
          @if (isOverdue(row)) {
            <span class="overdue-indicator" title="Vencido">
              <i class="fa-solid fa-triangle-exclamation"></i> Vencido
            </span>
          }
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalles"
            (clicked)="viewRecord(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            (clicked)="editRecord(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteRecord(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
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

      .fecha-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .overdue-indicator {
        font-size: 11px;
        font-weight: 600;
        color: var(--semantic-red-500);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        align-items: center;
      }
    `,
  ],
})
export class MaintenanceListComponent implements OnInit {
  maintenanceService = inject(MaintenanceService);
  equipmentService = inject(EquipmentService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  records: MaintenanceRecord[] = [];
  loading = false;
  filters = { status: '', type: '', search: '' };
  equipmentMap = new Map<number, Record<string, unknown>>();

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Mantenimiento' },
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

  columns: DataGridColumn[] = [
    { key: 'equipo', label: 'Equipo', type: 'template', sortable: true },
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
    { key: 'descripcion', label: 'Descripcion', type: 'template' },
    {
      key: 'fechaProgramada',
      label: 'Fecha Prog.',
      type: 'template',
      width: '130px',
      sortable: true,
    },
    {
      key: 'costoEstimado',
      label: 'Costo Est.',
      type: 'currency',
      format: 'PEN',
      width: '110px',
      sortable: true,
    },
    {
      key: 'costoReal',
      label: 'Costo Real',
      type: 'currency',
      format: 'PEN',
      width: '110px',
      sortable: true,
    },
    { key: 'tecnicoResponsable', label: 'Tecnico', type: 'text', sortable: true },
    { key: 'horometro', label: 'Horometro', type: 'number', hidden: true },
    { key: 'proveedor', label: 'Proveedor', type: 'text', hidden: true },
    { key: 'repuestos', label: 'Repuestos', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        COMPLETADO: {
          label: 'Completado',
          class: 'status-badge status-completed',
          icon: 'fa-check-circle',
        },
        EN_PROCESO: {
          label: 'En Proceso',
          class: 'status-badge status-in-progress',
          icon: 'fa-spinner',
        },
        PROGRAMADO: {
          label: 'Programado',
          class: 'status-badge status-scheduled',
          icon: 'fa-calendar',
        },
        CANCELADO: { label: 'Cancelado', class: 'status-badge status-cancelled', icon: 'fa-ban' },
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-pending', icon: 'fa-clock' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    forkJoin({
      records: this.maintenanceService.getAll(this.filters),
      equipment: this.equipmentService.getAll(),
    }).subscribe({
      next: (result) => {
        this.records = result.records;

        const equipmentList = Array.isArray(result.equipment)
          ? result.equipment
          : ((result.equipment as any)['data'] as Record<string, unknown>[]) || [];

        (equipmentList as Record<string, unknown>[]).forEach((eq: Record<string, unknown>) => {
          this.equipmentMap.set(eq['id'] as number, eq);
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.loading = false;
      },
    });
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

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.type = (filters['type'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.loadRecords();
  }

  getEquipmentCode(id: number | undefined): string {
    if (!id) return 'N/A';
    const equip = this.equipmentMap.get(id);
    return equip ? (equip['codigo_equipo'] as string) || (equip['code'] as string) : 'N/A';
  }

  getEquipmentModel(id: number | undefined): string {
    if (!id) return '';
    const equip = this.equipmentMap.get(id);
    return equip ? `${(equip['marca'] as string) || ''} ${(equip['modelo'] as string) || ''}` : '';
  }

  isOverdue(record: MaintenanceRecord): boolean {
    if (!record.fechaProgramada) return false;
    if (!['PROGRAMADO', 'EN_PROCESO', 'PENDIENTE'].includes(record.estado)) return false;
    return new Date(record.fechaProgramada) < new Date();
  }

  viewRecord(record: MaintenanceRecord): void {
    this.router.navigate([record.id], { relativeTo: this.route });
  }

  editRecord(record: MaintenanceRecord): void {
    this.router.navigate([record.id, 'edit'], { relativeTo: this.route });
  }

  deleteRecord(record: MaintenanceRecord): void {
    this.confirmSvc.confirmDelete('este registro de mantenimiento').subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.maintenanceService.delete(record.id).subscribe({
          next: () => {
            this.loadRecords();
          },
          error: (err) => {
            console.error('Error deleting record', err);
            this.loading = false;
          },
        });
      }
    });
  }

  navigateToCreate(): void {
    this.router.navigate(['/equipment/maintenance/new']);
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
      this.snackBar.open('No hay registros de mantenimiento para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: this.getEquipmentCode(record.equipoId),
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
      this.snackBar.open('No hay registros de mantenimiento para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.records.map((record) => ({
      Equipo: this.getEquipmentCode(record.equipoId),
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
