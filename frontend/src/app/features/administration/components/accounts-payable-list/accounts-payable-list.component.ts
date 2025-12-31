import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdministrationService, AccountsPayable } from '../../services/administration.service';
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
  selector: 'app-accounts-payable-list',
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
      title="Cuentas por Pagar"
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="records.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <button class="btn btn-primary" (click)="createRecord()">
          <i class="fa-solid fa-plus"></i> Nueva Cuenta por Pagar
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="filteredRecords"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
      >
      </aero-table>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button class="btn-icon" (click)="editRecord(row)" title="Editar">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon btn-danger" (click)="deleteRecord(row)" title="Eliminar">
            <i class="fa-solid fa-trash"></i>
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
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class AccountsPayableListComponent implements OnInit {
  private adminService = inject(AdministrationService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);

  records: AccountsPayable[] = [];
  filteredRecords: AccountsPayable[] = [];
  loading = false;
  filters: Record<string, any> = { search: '', status: '' };

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
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'pending', label: 'Pendiente' },
        { value: 'paid', label: 'Pagado' },
        { value: 'cancelled', label: 'Cancelado' },
      ],
    },
    {
      key: 'dueDate',
      label: 'Fecha de Vencimiento',
      type: 'dateRange',
    },
  ];

  columns: TableColumn[] = [
    { key: 'document_number', label: 'N° Documento', type: 'text' },
    { key: 'document_type', label: 'Tipo', type: 'text' },
    { key: 'provider', label: 'Proveedor', type: 'text' },
    { key: 'amount', label: 'Monto', type: 'currency', format: 'PEN' },
    { key: 'due_date', label: 'Vencimiento', type: 'date' },
    {
      key: 'status',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        pending: { label: 'Pendiente', class: 'badge badge-warning' },
        paid: { label: 'Pagado', class: 'badge badge-success' },
        cancelled: { label: 'Cancelado', class: 'badge badge-error' },
        partial: { label: 'Parcial', class: 'badge badge-info' },
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
        this.records = records;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters['search'] = filters['search'] || '';
    this.filters['status'] = filters['status'] || '';
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredRecords = this.records.filter((record) => {
      const matchesSearch =
        !this.filters['search'] ||
        record.document_number?.toLowerCase().includes(this.filters['search'].toLowerCase()) ||
        record.description?.toLowerCase().includes(this.filters['search'].toLowerCase());

      const matchesStatus = !this.filters['status'] || record.status === this.filters['status'];

      // Date range filter
      const dueDateStart = this.filters['dueDate_start'];
      const dueDateEnd = this.filters['dueDate_end'];
      let matchesDateRange = true;

      if (dueDateStart || dueDateEnd) {
        const recordDate = record.due_date ? new Date(record.due_date) : null;
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
    if (confirm(`¿Está seguro de eliminar la cuenta por pagar ${record.document_number}?`)) {
      this.adminService.deleteAccountsPayable(record.id).subscribe({
        next: () => {
          this.loadRecords();
        },
      });
    }
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
      alert('No hay cuentas por pagar para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      'Nro. Documento': record.document_number || '',
      Proveedor: record.provider?.C07001_RazonSocial || '',
      Tipo: record.document_type || '',
      'Fecha Emisión': record.issue_date
        ? new Date(record.issue_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Vencimiento': record.due_date
        ? new Date(record.due_date).toLocaleDateString('es-PE')
        : '',
      Monto: record.amount ? `${record.currency} ${record.amount.toFixed(2)}` : '',
      Moneda: record.currency || '',
      Estado: this.getStatusLabel(record.status),
      Descripción: record.description || '',
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'cuentas-por-pagar',
      sheetName: 'Cuentas por Pagar',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.records.length === 0) {
      alert('No hay cuentas por pagar para exportar');
      return;
    }

    const exportData = this.records.map((record) => ({
      'Nro. Documento': record.document_number || '',
      Proveedor: record.provider?.C07001_RazonSocial || '',
      Tipo: record.document_type || '',
      'Fecha Emisión': record.issue_date
        ? new Date(record.issue_date).toLocaleDateString('es-PE')
        : '',
      'Fecha Vencimiento': record.due_date
        ? new Date(record.due_date).toLocaleDateString('es-PE')
        : '',
      Monto: record.amount ? `${record.currency} ${record.amount.toFixed(2)}` : '',
      Moneda: record.currency || '',
      Estado: this.getStatusLabel(record.status),
      Descripción: record.description || '',
      Creado: record.created_at ? new Date(record.created_at).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'cuentas-por-pagar');
  }

  private getStatusLabel(status: string): string {
    const statusMap: Record<string, string> = {
      pending: 'Pendiente',
      partial: 'Parcial',
      paid: 'Pagada',
      overdue: 'Vencida',
    };
    return statusMap[status] || status;
  }
}
