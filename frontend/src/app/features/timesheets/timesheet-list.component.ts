import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimesheetService, PaginatedResponse } from '../../core/services/timesheet.service';
import { Timesheet } from '../../core/models/scheduling.model';
import { ExcelExportService } from '../../core/services/excel-export.service';

import {
  PageLayoutComponent,
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
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Planillas de Tiempo"
      icon="fa-clock"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToGenerate()"
          >Generar Planilla</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <!-- DEBUG: Remove after fixing -->
      <!-- DEBUG: Remove after fixing -->
      <!-- <pre *ngIf="timesheets.length > 0">{{ timesheets[0] | json }}</pre> -->

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <p>❌ Error: {{ error }}</p>
        <aero-button variant="secondary" (clicked)="loadTimesheets()">Reintentar</aero-button>
      </div>

      <!-- Timesheets Table -->
      <aero-data-grid
        [gridId]="'timesheet-list'"
        [columns]="columns"
        [data]="timesheets"
        [loading]="loading"
        [dense]="true"
        [showColumnChooser]="true"
        [serverSide]="true"
        [totalItems]="total"
        [templates]="{
          id: idTemplate,
          trabajador: trabajadorTemplate,
          periodo: periodoTemplate,
          acciones: accionesTemplate,
        }"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        (rowClick)="viewTimesheet($event.id)"
      >
      </aero-data-grid>

      <!-- Custom Templates -->
      <ng-template #idTemplate let-row>
        <strong>#{{ row.id }}</strong>
      </ng-template>

      <ng-template #trabajadorTemplate let-row>
        <div class="worker-info">
          <i class="fa-solid fa-user-circle"></i>
          <span>{{
            row.trabajador_nombre || row.trabajador?.nombre_completo || 'Sin Nombre'
          }}</span>
        </div>
      </ng-template>

      <ng-template #periodoTemplate let-row>
        <div class="period-badge">
          <i class="fa-regular fa-calendar"></i>
          {{ row.periodo }}
        </div>
      </ng-template>

      <ng-template #accionesTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalle"
            (clicked)="viewTimesheet(row.id); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'BORRADOR'"
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteTimesheet(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .worker-info {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        font-weight: 500;
        color: var(--grey-900);
      }

      .worker-info i {
        color: var(--grey-500);
      }

      .period-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--s-4);
        padding: var(--s-4) var(--s-8);
        background: var(--primary-50);
        color: var(--primary-700);
        border-radius: var(--s-4);
        font-size: 13px;
        font-weight: 500;
      }

      .error-message {
        background: var(--error-100);
        color: var(--error-800);
        padding: var(--s-16);
        border-radius: var(--s-8);
        text-align: center;
        margin-bottom: var(--s-16);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-8);
      }

      .text-muted {
        color: var(--grey-500);
        font-style: italic;
      }
    `,
  ],
})
export class TimesheetListComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  timesheets: Timesheet[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  loading = false;
  error: string | null = null;

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Operaciones', url: '/operaciones' },
    { label: 'Planillas' },
  ];

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Enviado', value: 'ENVIADO' },
        { label: 'Aprobado', value: 'APROBADO' },
        { label: 'Rechazado', value: 'RECHAZADO' },
      ],
    },
    {
      key: 'periodo',
      label: 'Período',
      type: 'text',
      placeholder: 'YYYY-MM',
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'id', label: 'ID', type: 'template', sortable: true },
    { key: 'trabajador', label: 'Trabajador', type: 'template', sortable: true },
    { key: 'periodo', label: 'Periodo', type: 'template', sortable: true },
    { key: 'totalHoras', label: 'Horas Totales', type: 'text', sortable: true },
    { key: 'totalDiasTrabajados', label: 'Dias Trab.', type: 'text', sortable: true },
    { key: 'proyecto', label: 'Proyecto', type: 'text', hidden: true },
    { key: 'aprobado_por', label: 'Aprobado Por', type: 'text', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-draft' },
        ENVIADO: { label: 'Enviado', class: 'status-badge status-submitted' },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-approved' },
        RECHAZADO: { label: 'Rechazado', class: 'status-badge status-rejected' },
      },
    },
    { key: 'acciones', label: 'Acciones', type: 'template' },
  ];

  currentFilters: Record<string, unknown> = {};

  ngOnInit() {
    this.loadTimesheets();
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadTimesheets();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadTimesheets();
  }

  onFilterChange(filters: Record<string, unknown>) {
    this.currentFilters = filters;
    this.page = 1;
    this.loadTimesheets();
  }

  loadTimesheets() {
    this.loading = true;
    this.error = null;

    this.timesheetService
      .listTimesheetsPaginated({
        page: this.page,
        limit: this.pageSize,
        estado: (this.currentFilters['estado'] as string) || undefined,
        periodo: (this.currentFilters['periodo'] as string) || undefined,
      })
      .subscribe({
        next: (res: PaginatedResponse<Timesheet>) => {
          this.timesheets = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading timesheets:', err);
          this.timesheets = [];
          this.error = 'No se pudieron cargar las planillas';
          this.loading = false;
        },
      });
  }

  navigateToGenerate() {
    this.router.navigate(['/operaciones/timesheets/generate']);
  }

  viewTimesheet(id: number) {
    this.router.navigate(['/operaciones/timesheets', id]);
  }

  deleteTimesheet(timesheet: Timesheet) {
    this.confirmSvc.confirmDelete(`la planilla #${timesheet.id}`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.timesheetService.deleteTimesheet(timesheet.id).subscribe({
          next: () => {
            this.timesheets = this.timesheets.filter((t) => t.id !== timesheet.id);
            this.loading = false;
          },
          error: (err) => {
            console.error('Error deleting timesheet:', err);
            this.snackBar.open('Error al eliminar la planilla', 'Cerrar', { duration: 3000 });
            this.loading = false;
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
    if (this.timesheets.length === 0) {
      this.snackBar.open('No hay planillas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.timesheets.map((timesheet) => ({
      ID: timesheet.id || '',
      Trabajador: timesheet.trabajador?.nombre_completo || 'N/A',
      Período: timesheet.periodo || '',
      'Total Horas': timesheet.totalHoras || 0,
      'Total Días': timesheet.totalDiasTrabajados || 0,
      'Monto Calculado': timesheet.montoCalculado || 0,
      Estado: this.getEstadoLabel(timesheet.estado || ''),
      Observaciones: timesheet.observaciones || '',
      Creado: timesheet.createdAt
        ? new Date(timesheet.createdAt as string).toLocaleDateString('es-PE')
        : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'planillas',
      sheetName: 'Planillas de Tiempo',
    });
  }

  private getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
    };
    return labels[estado] || estado;
  }

  exportToCSV(): void {
    if (this.timesheets.length === 0) {
      this.snackBar.open('No hay planillas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.timesheets.map((timesheet) => ({
      ID: timesheet.id || '',
      Trabajador: timesheet.trabajador?.nombre_completo || 'N/A',
      Período: timesheet.periodo || '',
      'Total Horas': timesheet.totalHoras || 0,
      'Total Días': timesheet.totalDiasTrabajados || 0,
      'Monto Calculado': timesheet.montoCalculado || 0,
      Estado: this.getEstadoLabel(timesheet.estado || ''),
      Observaciones: timesheet.observaciones || '',
      Creado: timesheet.createdAt
        ? new Date(timesheet.createdAt as string).toLocaleDateString('es-PE')
        : '',
    }));

    this.excelService.exportToCSV(exportData, 'planillas');
  }
}
