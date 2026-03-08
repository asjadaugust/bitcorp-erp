import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { AdministrationService, PaymentSchedule } from '../../services/administration.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
import { ADMINISTRACION_TABS } from '../../administracion-tabs';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../../shared/components/filter-bar/filter-bar.component';
import { ExcelExportService } from '../../../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { AeroButtonComponent } from '../../../../core/design-system';

@Component({
  selector: 'app-payment-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
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
      title="Programación de Pagos"
      icon="fa-calendar-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="schedules.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createSchedule()"
          >Nueva Programación</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'payment-schedule-list'"
          [columns]="columns"
          [data]="schedules"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="total"
          [actionsTemplate]="actionsTemplate"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (sortChange)="onSort($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            iconCenter="fa-eye"
            size="small"
            (clicked)="viewSchedule(row)"
          ></aero-button>

          <!-- Draft status actions -->
          <ng-container *ngIf="row.estado === 'BORRADOR' || row.estado === 'PROGRAMADO'">
            <aero-button
              variant="ghost"
              iconCenter="fa-check"
              size="small"
              (clicked)="approveSchedule(row)"
            ></aero-button>
            <aero-button
              variant="ghost"
              iconCenter="fa-pen"
              size="small"
              (clicked)="editSchedule(row)"
            ></aero-button>
            <aero-button
              variant="ghost"
              iconCenter="fa-trash"
              size="small"
              (clicked)="deleteSchedule(row)"
            ></aero-button>
          </ng-container>

          <!-- Approved status actions -->
          <aero-button
            *ngIf="row.estado === 'APROBADO'"
            variant="ghost"
            iconCenter="fa-play"
            size="small"
            (clicked)="processSchedule(row)"
          ></aero-button>

          <!-- Cancel button (for draft/programado and approved) -->
          <aero-button
            *ngIf="
              row.estado === 'BORRADOR' || row.estado === 'PROGRAMADO' || row.estado === 'APROBADO'
            "
            variant="ghost"
            iconCenter="fa-ban"
            size="small"
            (clicked)="cancelSchedule(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 4px;
      }
    `,
  ],
})
export class PaymentScheduleListComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  tabs = ADMINISTRACION_TABS;
  loading = false;
  schedules: PaymentSchedule[] = [];
  total = 0;
  page = 1;
  pageSize = 20;
  filters: Record<string, string> = { search: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/dashboard' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Programación de Pagos' },
  ];

  filterConfig: FilterConfig[] = [
    { key: 'search', label: 'Buscar', type: 'text', placeholder: 'Buscar programaciones...' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'PROGRAMADO', label: 'Programado' },
        { value: 'BORRADOR', label: 'Borrador' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'PROCESADO', label: 'Procesado' },
        { value: 'CANCELADO', label: 'Cancelado' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'periodo', label: 'Período', type: 'text', sortable: true, filterable: true },
    { key: 'schedule_date', label: 'Fecha Programación', type: 'date', sortable: true },
    { key: 'description', label: 'Descripción', type: 'text', filterable: true },
    { key: 'total_amount', label: 'Monto Total', type: 'currency', format: 'PEN', sortable: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      filterable: true,
      sortable: true,
      badgeConfig: {
        PROGRAMADO: { label: 'Programado', class: 'badge status-PROGRAMADO' },
        BORRADOR: { label: 'Borrador', class: 'badge status-BORRADOR' },
        APROBADO: { label: 'Aprobado', class: 'badge status-APROBADO' },
        PROCESADO: { label: 'Procesado', class: 'badge status-COMPLETADO' },
        CANCELADO: { label: 'Cancelado', class: 'badge status-CANCELADO' },
      },
    },
  ];

  ngOnInit() {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;
    this.adminService
      .getPaymentSchedulesPaginated({
        page: this.page,
        limit: this.pageSize,
        estado: this.filters['estado'] || undefined,
        search: this.filters['search'] || undefined,
      })
      .subscribe({
        next: (res) => {
          this.schedules = res.data;
          this.total = res.pagination.total;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onPageChange(page: number): void {
    this.page = page;
    this.loadSchedules();
  }
  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.page = 1;
    this.loadSchedules();
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters['search'] = (filters['search'] as string) || '';
    this.filters['estado'] = (filters['estado'] as string) || '';
    this.page = 1;
    this.loadSchedules();
  }

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled server-side
  }

  createSchedule(): void {
    this.router.navigate(['/administracion/payment-schedules/new']);
  }

  viewSchedule(schedule: PaymentSchedule): void {
    this.router.navigate(['/administracion/payment-schedules', schedule.id]);
  }

  editSchedule(schedule: PaymentSchedule): void {
    this.router.navigate(['/administracion/payment-schedules', schedule.id, 'edit']);
  }

  deleteSchedule(schedule: PaymentSchedule): void {
    this.confirmSvc.confirmDelete('esta programación de pago').subscribe((confirmed) => {
      if (confirmed) {
        this.adminService.deletePaymentSchedule(schedule.id).subscribe({
          next: () => {
            this.loadSchedules();
            this.snackBar.open('Programación eliminada', 'Cerrar', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  approveSchedule(schedule: PaymentSchedule): void {
    this.confirmSvc
      .confirm({
        title: 'Aprobar Programación',
        message: '¿Está seguro de aprobar esta programación de pago?',
        icon: 'fa-check-circle',
        confirmLabel: 'Aprobar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.adminService.approvePaymentSchedule(schedule.id).subscribe({
            next: () => {
              this.loadSchedules();
              this.snackBar.open('Programación aprobada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al aprobar', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  processSchedule(schedule: PaymentSchedule): void {
    this.confirmSvc
      .confirm({
        title: 'Procesar Programación',
        message:
          '¿Procesar esta programación de pago? Esta acción marcará los pagos como realizados.',
        icon: 'fa-play-circle',
        confirmLabel: 'Procesar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.adminService.processPaymentSchedule(schedule.id).subscribe({
            next: () => {
              this.loadSchedules();
              this.snackBar.open('Programación procesada correctamente', 'Cerrar', {
                duration: 3000,
              });
            },
            error: () => {
              this.snackBar.open('Error al procesar', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  cancelSchedule(schedule: PaymentSchedule): void {
    this.confirmSvc
      .confirm({
        title: 'Cancelar Programación',
        message: '¿Está seguro de cancelar esta programación de pago?',
        icon: 'fa-ban',
        confirmLabel: 'Cancelar',
        isDanger: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.adminService.cancelPaymentSchedule(schedule.id).subscribe({
            next: () => {
              this.loadSchedules();
              this.snackBar.open('Programación cancelada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al cancelar', 'Cerrar', { duration: 3000 });
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
    if (this.schedules.length === 0) {
      this.snackBar.open('No hay programaciones de pago para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.schedules.map((schedule) => ({
      Período: schedule.periodo || '',
      Descripción: schedule.description || '',
      'Fecha Programación': schedule.schedule_date
        ? new Date(schedule.schedule_date).toLocaleDateString('es-PE')
        : '',
      'Monto Total': schedule.total_amount ? `PEN ${Number(schedule.total_amount).toFixed(2)}` : '',
      Estado: this.getStatusLabel(schedule.estado),
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'programacion-pagos',
      sheetName: 'Programación de Pagos',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.schedules.length === 0) {
      this.snackBar.open('No hay programaciones de pago para exportar', 'Cerrar', {
        duration: 3000,
      });
      return;
    }

    const exportData = this.schedules.map((schedule) => ({
      Período: schedule.periodo || '',
      Descripción: schedule.description || '',
      'Fecha Programación': schedule.schedule_date
        ? new Date(schedule.schedule_date).toLocaleDateString('es-PE')
        : '',
      'Monto Total': schedule.total_amount ? `PEN ${Number(schedule.total_amount).toFixed(2)}` : '',
      Estado: this.getStatusLabel(schedule.estado),
    }));

    this.excelService.exportToCSV(exportData, 'programacion-pagos');
  }

  private getStatusLabel(estado: string): string {
    const statusMap: Record<string, string> = {
      PROGRAMADO: 'Programado',
      BORRADOR: 'Borrador',
      APROBADO: 'Aprobado',
      PROCESADO: 'Procesado',
      CANCELADO: 'Cancelado',
    };
    return statusMap[estado] || estado;
  }
}
