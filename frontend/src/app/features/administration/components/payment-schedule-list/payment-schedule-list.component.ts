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
import { PageCardComponent } from '../../../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

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
    PageCardComponent,
    ButtonComponent,
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

        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Programación"
          (clicked)="createSchedule()"
        ></app-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="filteredSchedules"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
        >
        </aero-table>
      </app-page-card>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <app-button
            variant="ghost"
            icon="fa-eye"
            size="sm"
            (clicked)="viewSchedule(row)"
          ></app-button>

          <!-- Draft status actions -->
          <ng-container *ngIf="row.estado === 'BORRADOR' || row.estado === 'PROGRAMADO'">
            <app-button
              variant="ghost"
              icon="fa-check"
              size="sm"
              (clicked)="approveSchedule(row)"
            ></app-button>
            <app-button
              variant="ghost"
              icon="fa-pen"
              size="sm"
              (clicked)="editSchedule(row)"
            ></app-button>
            <app-button
              variant="ghost"
              icon="fa-trash"
              size="sm"
              (clicked)="deleteSchedule(row)"
            ></app-button>
          </ng-container>

          <!-- Approved status actions -->
          <app-button
            *ngIf="row.estado === 'APROBADO'"
            variant="ghost"
            icon="fa-play"
            size="sm"
            (clicked)="processSchedule(row)"
          ></app-button>

          <!-- Cancel button (for draft/programado and approved) -->
          <app-button
            *ngIf="
              row.estado === 'BORRADOR' || row.estado === 'PROGRAMADO' || row.estado === 'APROBADO'
            "
            variant="ghost"
            icon="fa-ban"
            size="sm"
            (clicked)="cancelSchedule(row)"
          ></app-button>
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
        { value: 'PROGRAMADO', label: 'Programado' },
        { value: 'BORRADOR', label: 'Borrador' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'PROCESADO', label: 'Procesado' },
        { value: 'CANCELADO', label: 'Cancelado' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'periodo', label: 'Período', type: 'text' },
    { key: 'schedule_date', label: 'Fecha Programación', type: 'date' },
    { key: 'description', label: 'Descripción', type: 'text' },
    { key: 'total_amount', label: 'Monto Total', type: 'currency', format: 'PEN' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
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
        schedule.description?.toLowerCase().includes(this.filters['search'].toLowerCase()) ||
        schedule.periodo?.toLowerCase().includes(this.filters['search'].toLowerCase());

      const matchesStatus = !this.filters['estado'] || schedule.estado === this.filters['estado'];

      return matchesSearch && matchesStatus;
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
