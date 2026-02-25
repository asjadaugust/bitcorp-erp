import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { AdministrationService, PaymentSchedule } from '../../services/administration.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../../../shared/components/page-layout/page-layout.component';
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

@Component({
  selector: 'app-payment-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Programación de Pagos"
      icon="fa-calendar-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="schedules.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <button class="btn btn-primary" (click)="createSchedule()">
          <i class="fa-solid fa-plus"></i> Nueva Programación
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredSchedules"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
      >
      </aero-table>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="viewSchedule(row)" title="Ver Detalles">
            <i class="fa-solid fa-eye"></i>
          </button>

          <!-- Draft status actions -->
          <button
            class="btn-icon btn-success"
            (click)="approveSchedule(row)"
            title="Aprobar"
            *ngIf="row.estado === 'BORRADOR'"
          >
            <i class="fa-solid fa-check"></i>
          </button>
          <button
            class="btn-icon"
            (click)="editSchedule(row)"
            title="Editar"
            *ngIf="row.estado === 'BORRADOR'"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            class="btn-icon btn-danger"
            (click)="deleteSchedule(row)"
            title="Eliminar"
            *ngIf="row.estado === 'BORRADOR'"
          >
            <i class="fa-solid fa-trash"></i>
          </button>

          <!-- Approved status actions -->
          <button
            class="btn-icon btn-primary"
            (click)="processSchedule(row)"
            title="Procesar"
            *ngIf="row.estado === 'APROBADO'"
          >
            <i class="fa-solid fa-play"></i>
          </button>

          <!-- Cancel button (for draft and approved) -->
          <button
            class="btn-icon btn-warning"
            (click)="cancelSchedule(row)"
            title="Cancelar"
            *ngIf="row.estado === 'BORRADOR' || row.estado === 'APROBADO'"
          >
            <i class="fa-solid fa-ban"></i>
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

      .btn-icon.btn-danger:hover {
        background: var(--error-100);
        color: var(--error-600);
        border-radius: var(--s-4);
      }

      .btn-icon.btn-success:hover {
        background: var(--success-100);
        color: var(--success-600);
        border-radius: var(--s-4);
      }

      .btn-icon.btn-primary:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .btn-icon.btn-warning:hover {
        background: var(--warning-100);
        color: var(--warning-700);
        border-radius: var(--s-4);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class PaymentScheduleListComponent implements OnInit {
  private adminService: AdministrationService = inject(AdministrationService);
  private router: Router = inject(Router);
  private excelService: ExcelExportService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  loading = false;
  schedules: PaymentSchedule[] = [];
  filteredSchedules: PaymentSchedule[] = [];
  filters: Record<string, string> = { search: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
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
        { value: 'BORRADOR', label: 'Borrador' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'PROCESADO', label: 'Procesado' },
        { value: 'CANCELADO', label: 'Cancelado' },
      ],
    },
    {
      key: 'scheduleDate',
      label: 'Fecha de Programación',
      type: 'dateRange',
    },
  ];

  columns: TableColumn[] = [
    { key: 'schedule_date', label: 'Fecha Programación', type: 'date' },
    { key: 'payment_date', label: 'Fecha Pago', type: 'date' },
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'total_amount', label: 'Monto Total', type: 'currency', format: 'PEN' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'badge badge-secondary' },
        APROBADO: { label: 'Aprobado', class: 'badge badge-info' },
        PROCESADO: { label: 'Procesado', class: 'badge badge-success' },
        CANCELADO: { label: 'Cancelado', class: 'badge badge-error' },
      },
    },
  ];

  ngOnInit() {
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;
    this.adminService.getPaymentSchedules().subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters['search'] = (filters['search'] as string) || '';
    this.filters['estado'] = (filters['estado'] as string) || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredSchedules = this.schedules.filter((schedule) => {
      const matchesSearch =
        !this.filters['search'] ||
        schedule.description?.toLowerCase().includes(this.filters['search'].toLowerCase());

      const matchesStatus = !this.filters['estado'] || schedule.estado === this.filters['estado'];

      // Date range filter
      const scheduleDateStart = this.filters['scheduleDate_start'];
      const scheduleDateEnd = this.filters['scheduleDate_end'];
      let matchesDateRange = true;

      if (scheduleDateStart || scheduleDateEnd) {
        const recordDate = schedule.schedule_date ? new Date(schedule.schedule_date) : null;
        if (recordDate) {
          if (scheduleDateStart) {
            matchesDateRange = matchesDateRange && recordDate >= new Date(scheduleDateStart);
          }
          if (scheduleDateEnd) {
            matchesDateRange = matchesDateRange && recordDate <= new Date(scheduleDateEnd);
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
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
          error: (_err) => {
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
            error: (err: unknown) => {
              const errObj = err as any;
              const msg = errObj['error']?.['error'] || 'No se pudo aprobar';
              this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 3000 });
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
            error: (err: unknown) => {
              const errObj = err as any;
              const msg = errObj['error']?.['error'] || 'No se pudo procesar';
              this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 3000 });
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
            error: (err: unknown) => {
              const errObj = err as any;
              const msg = errObj['error']?.['error'] || 'No se pudo cancelar';
              this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 3000 });
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
      Descripción: schedule.description || '',
      'Fecha Programación': schedule.schedule_date
        ? new Date(schedule.schedule_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Pago': schedule.payment_date
        ? new Date(schedule.payment_date).toLocaleDateString('es-PE')
        : '',
      'Monto Total': schedule.total_amount
        ? `${schedule.currency} ${schedule.total_amount.toFixed(2)}`
        : '',
      Moneda: schedule.currency || '',
      Estado: this.getStatusLabel(schedule.estado),
      Creado: schedule.created_at ? new Date(schedule.created_at).toLocaleDateString('es-PE') : '',
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
      Descripción: schedule.description || '',
      'Fecha Programación': schedule.schedule_date
        ? new Date(schedule.schedule_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Pago': schedule.payment_date
        ? new Date(schedule.payment_date).toLocaleDateString('es-PE')
        : '',
      'Monto Total': schedule.total_amount
        ? `${schedule.currency} ${schedule.total_amount.toFixed(2)}`
        : '',
      Moneda: schedule.currency || '',
      Estado: this.getStatusLabel(schedule.estado),
      Creado: schedule.created_at ? new Date(schedule.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'programacion-pagos');
  }

  private getStatusLabel(estado: string): string {
    const statusMap: Record<string, string> = {
      BORRADOR: 'Borrador',
      APROBADO: 'Aprobado',
      PROCESADO: 'Procesado',
      CANCELADO: 'Cancelado',
    };
    return statusMap[estado] || estado;
  }
}
