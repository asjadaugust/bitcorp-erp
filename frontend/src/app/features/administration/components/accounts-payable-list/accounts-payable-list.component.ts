import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConfirmService } from '../../../../core/services/confirm.service';
import { AdministrationService, AccountsPayable } from '../../services/administration.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../../core/design-system/table/aero-table.component';
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
  selector: 'app-accounts-payable-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Cuentas por Pagar"
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="records.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createRecord()"
          >Nueva Cuenta por Pagar</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="filteredRecords"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [templates]="{ mora: moraTemplate }"
        >
        </aero-table>
      </app-page-card>

      <ng-template #moraTemplate let-row>
        <span *ngIf="getDaysOverdue(row) > 0" class="mora-badge overdue">
          <i class="fa-solid fa-triangle-exclamation"></i>
          {{ getDaysOverdue(row) }}d
        </span>
        <span *ngIf="getDaysOverdue(row) === 0 && isNearDue(row)" class="mora-badge near">
          <i class="fa-solid fa-clock"></i> Hoy
        </span>
        <span
          *ngIf="getDaysOverdue(row) < 0 && getDaysOverdue(row) >= -7"
          class="mora-badge warning"
        >
          {{ -getDaysOverdue(row) }}d
        </span>
      </ng-template>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            iconCenter="fa-pen"
            size="small"
            (clicked)="editRecord(row)"
          ></aero-button>
          <aero-button
            variant="ghost"
            iconCenter="fa-trash"
            size="small"
            (clicked)="deleteRecord(row)"
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

      .mora-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }
      .mora-badge.overdue {
        background: var(--error-100);
        color: var(--error-600);
      }
      .mora-badge.near {
        background: var(--warning-100);
        color: var(--warning-700);
      }
      .mora-badge.warning {
        background: var(--warning-50, var(--warning-100));
        color: var(--warning-600, var(--warning-700));
      }
    `,
  ],
})
export class AccountsPayableListComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  tabs = ADMINISTRACION_TABS;
  records: AccountsPayable[] = [];
  filteredRecords: AccountsPayable[] = [];
  loading = false;
  filters: Record<string, string> = { search: '', estado: '' };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Administración', url: '/administracion' },
    { label: 'Cuentas por Pagar' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por número de documento...',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'PENDIENTE', label: 'Pendiente' },
        { value: 'PARCIAL', label: 'Parcial' },
        { value: 'PAGADO', label: 'Pagado' },
        { value: 'ANULADO', label: 'Anulado' },
      ],
    },
    {
      key: 'dueDate',
      label: 'Fecha de Vencimiento',
      type: 'dateRange',
    },
  ];

  columns: TableColumn[] = [
    { key: 'numero_factura', label: 'N° Documento', type: 'text' },
    { key: 'proveedor_razon_social', label: 'Proveedor', type: 'text' },
    { key: 'monto_total', label: 'Monto', type: 'currency', format: 'PEN' },
    { key: 'fecha_vencimiento', label: 'Vencimiento', type: 'date' },
    { key: 'mora', label: 'Mora', type: 'template' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PENDIENTE: { label: 'Pendiente', class: 'badge status-PENDIENTE' },
        PARCIAL: { label: 'Parcial', class: 'badge status-in_progress' },
        PAGADO: { label: 'Pagado', class: 'badge status-PAGADO' },
        ANULADO: { label: 'Anulado', class: 'badge status-CANCELADO' },
      },
    },
  ];

  ngOnInit() {
    this.loadRecords();
  }

  loadRecords() {
    this.loading = true;
    this.adminService.getAccountsPayable().subscribe({
      next: (records) => {
        this.records = records.map((r) => ({
          ...r,
          proveedor_razon_social: r.provider?.razonSocial || r.provider?.nombreComercial || 'N/A',
        }));
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
    this.filteredRecords = this.records.filter((record) => {
      const matchesSearch =
        !this.filters['search'] ||
        record.numero_factura?.toLowerCase().includes(this.filters['search'].toLowerCase()) ||
        record.observaciones?.toLowerCase().includes(this.filters['search'].toLowerCase());

      const matchesStatus = !this.filters['estado'] || record.estado === this.filters['estado'];

      const dueDateStart = this.filters['dueDate_start'];
      const dueDateEnd = this.filters['dueDate_end'];
      let matchesDateRange = true;

      if (dueDateStart || dueDateEnd) {
        const recordDate = record.fecha_vencimiento ? new Date(record.fecha_vencimiento) : null;
        if (recordDate) {
          if (dueDateStart) {
            matchesDateRange = matchesDateRange && recordDate >= new Date(dueDateStart);
          }
          if (dueDateEnd) {
            matchesDateRange = matchesDateRange && recordDate <= new Date(dueDateEnd);
          }
        } else {
          matchesDateRange = false;
        }
      }

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }

  createRecord(): void {
    this.router.navigate(['/administracion/accounts-payable/new']);
  }

  editRecord(record: AccountsPayable): void {
    this.router.navigate(['/administracion/accounts-payable', record.id, 'edit']);
  }

  deleteRecord(record: AccountsPayable): void {
    this.confirmSvc
      .confirmDelete(`la cuenta por pagar ${record.numero_factura}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.adminService.deleteAccountsPayable(record.id).subscribe({
            next: () => {
              this.loadRecords();
              this.snackBar.open('Cuenta por pagar eliminada', 'Cerrar', { duration: 3000 });
            },
            error: () => {
              this.snackBar.open('Error al eliminar', 'Cerrar', { duration: 3000 });
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
    if (this.records.length === 0) {
      this.snackBar.open('No hay cuentas por pagar para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.records.map((record) => ({
      'Nro. Documento': record.numero_factura || '',
      Proveedor: record.provider?.razonSocial || '',
      'Fecha Emisión': record.fecha_emision
        ? new Date(record.fecha_emision).toLocaleDateString('es-PE')
        : '',
      'Fecha Vencimiento': record.fecha_vencimiento
        ? new Date(record.fecha_vencimiento).toLocaleDateString('es-PE')
        : '',
      Monto: record.monto_total ? `${record.moneda} ${record.monto_total.toFixed(2)}` : '',
      Moneda: record.moneda || '',
      Estado: this.getStatusLabel(record.estado),
      Descripción: record.observaciones || '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'cuentas-por-pagar',
      sheetName: 'Cuentas por Pagar',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.records.length === 0) {
      this.snackBar.open('No hay cuentas por pagar para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.records.map((record) => ({
      'Nro. Documento': record.numero_factura || '',
      Proveedor: record.provider?.razonSocial || '',
      'Fecha Emisión': record.fecha_emision
        ? new Date(record.fecha_emision).toLocaleDateString('es-PE')
        : '',
      'Fecha Vencimiento': record.fecha_vencimiento
        ? new Date(record.fecha_vencimiento).toLocaleDateString('es-PE')
        : '',
      Monto: record.monto_total ? `${record.moneda} ${record.monto_total.toFixed(2)}` : '',
      Moneda: record.moneda || '',
      Estado: this.getStatusLabel(record.estado),
      Descripción: record.observaciones || '',
    }));

    this.excelService.exportToCSV(exportData, 'cuentas-por-pagar');
  }

  getDaysOverdue(row: AccountsPayable): number {
    if (!row.fecha_vencimiento || row.estado === 'PAGADO' || row.estado === 'ANULADO') return -999;
    const due = new Date(row.fecha_vencimiento);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  }

  isNearDue(row: AccountsPayable): boolean {
    if (!row.fecha_vencimiento) return false;
    const due = new Date(row.fecha_vencimiento);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return due.getTime() === today.getTime();
  }

  private getStatusLabel(estado: string): string {
    const statusMap: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      PARCIAL: 'Parcial',
      PAGADO: 'Pagado',
      ANULADO: 'Anulado',
    };
    return statusMap[estado] || estado;
  }
}
