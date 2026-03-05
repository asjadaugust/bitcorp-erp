import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../core/services/payment.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  PaymentRecordList,
  PaymentRecordQuery,
  EstadoPago,
  MetodoPago,
} from '../../core/models/payment-record.model';

import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { ExportDropdownComponent } from '../../shared/components/export-dropdown/export-dropdown.component';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [
    CommonModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    PageCardComponent,
    FilterBarComponent,
    ActionsContainerComponent,
    ExportDropdownComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Registro de Pagos"
      icon="fa-money-check-dollar"
      [breadcrumbs]="[{ label: 'Inicio', url: '/app' }, { label: 'Registro de Pagos' }]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-export-dropdown
          data-testid="btn-export-excel"
          (export)="exportToExcel()"
        ></app-export-dropdown>
        <aero-button
          variant="primary"
          iconLeft="fa-plus"
          data-testid="btn-new-payment"
          (clicked)="navigateToCreate()"
          >Nuevo Pago</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [gridId]="'payment-list'"
          [columns]="columns"
          [data]="payments"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [serverSide]="true"
          [totalItems]="totalItems"
          [pageSize]="pageSize"
          (pageChange)="onPageChange($event)"
          (pageSizeChange)="onPageSizeChange($event)"
          (sortChange)="onSort($event)"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            numero_pago: numeroPagoTemplate,
            monto_pagado: montoTemplate,
            conciliado: conciliadoTemplate,
            numero_operacion: operacionTemplate,
          }"
          (rowClick)="viewPayment($event)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom cell templates -->
      <ng-template #numeroPagoTemplate let-row>
        <div class="cell-group">
          <a class="code-link" (click)="$event.stopPropagation(); viewPayment(row)">
            {{ row.numero_pago }}
          </a>
          @if (row.numero_valorizacion) {
            <span class="cell-secondary">Val: {{ row.numero_valorizacion }}</span>
          }
        </div>
      </ng-template>

      <ng-template #montoTemplate let-row>
        <span class="font-mono">
          {{ paymentService.formatCurrency(row.monto_pagado, row.moneda) }}
        </span>
      </ng-template>

      <ng-template #conciliadoTemplate let-row>
        <span
          class="status-badge"
          [class.status-CONFIRMADO]="row.conciliado"
          [class.status-PENDIENTE]="!row.conciliado"
        >
          <i [class]="row.conciliado ? 'fa-solid fa-check-double' : 'fa-solid fa-clock'"></i>
          {{ row.conciliado ? 'Sí' : 'No' }}
        </span>
      </ng-template>

      <ng-template #operacionTemplate let-row>
        @if (row.numero_operacion) {
          <span class="code-text">{{ row.numero_operacion }}</span>
        } @else {
          <span class="text-muted">-</span>
        }
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons" (click)="$event.stopPropagation()">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            [attr.data-testid]="'btn-view-' + row.id"
            (clicked)="viewPayment(row)"
          ></aero-button>
          @if (row.estado !== 'ANULADO') {
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-pen"
              [attr.data-testid]="'btn-edit-' + row.id"
              (clicked)="editPayment(row)"
            ></aero-button>
          }
          @if (row.estado === 'CONFIRMADO' && !row.conciliado) {
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-check-double"
              [attr.data-testid]="'btn-reconcile-' + row.id"
              (clicked)="reconcilePayment(row)"
            ></aero-button>
          }
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .cell-group {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .cell-secondary {
        font-size: 12px;
        color: var(--grey-500);
      }

      .code-link {
        color: var(--primary-500);
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
      }
      .code-link:hover {
        text-decoration: underline;
      }

      .code-text {
        font-family: monospace;
        font-size: 0.85rem;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }

      .text-muted {
        color: var(--grey-400);
      }

      .font-mono {
        font-family: monospace;
        font-weight: 600;
      }

      .action-buttons {
        display: flex;
        gap: var(--s-4);
        justify-content: flex-end;
      }
    `,
  ],
})
export class PaymentListComponent implements OnInit {
  paymentService = inject(PaymentService);
  private router = inject(Router);
  private excelExportService = inject(ExcelExportService);
  private snackBar = inject(MatSnackBar);
  private confirmService = inject(ConfirmService);

  payments: PaymentRecordList[] = [];
  loading = false;
  totalItems = 0;
  pageSize = 50;

  filters: PaymentRecordQuery = {
    page: 1,
    limit: 20,
  };

  filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: Object.values(EstadoPago).map((e) => ({
        label: this.getStatusLabel(e),
        value: e,
      })),
    },
    {
      key: 'metodo_pago',
      label: 'Método de Pago',
      type: 'select',
      options: Object.values(MetodoPago).map((m) => ({
        label: this.getMethodLabel(m),
        value: m,
      })),
    },
    {
      key: 'conciliado',
      label: 'Conciliado',
      type: 'select',
      options: [
        { label: 'Sí', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
    {
      key: 'fecha',
      label: 'Rango de Fechas',
      type: 'dateRange',
    },
    {
      key: 'moneda',
      label: 'Moneda',
      type: 'select',
      options: [
        { label: 'Soles (PEN)', value: 'PEN' },
        { label: 'Dólares (USD)', value: 'USD' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    {
      key: 'numero_pago',
      label: 'N° Pago / Val.',
      type: 'template',
      width: '150px',
      sortable: true,
      filterable: true,
    },
    { key: 'fecha_pago', label: 'Fecha Pago', type: 'date', width: '110px', sortable: true },
    { key: 'monto_pagado', label: 'Monto', type: 'template', width: '120px', sortable: true },
    {
      key: 'moneda',
      label: 'Moneda',
      type: 'badge',
      width: '80px',
      filterable: true,
      badgeConfig: {
        PEN: { label: 'PEN', class: 'status-badge status-info', icon: 'fa-solid fa-coins' },
        USD: {
          label: 'USD',
          class: 'status-badge status-warning',
          icon: 'fa-solid fa-dollar-sign',
        },
      },
    },
    {
      key: 'metodo_pago',
      label: 'Método',
      type: 'badge',
      width: '120px',
      filterable: true,
      badgeConfig: {
        TRANSFERENCIA: { label: 'Transferencia', class: 'status-badge status-info' },
        CHEQUE: { label: 'Cheque', class: 'status-badge status-info' },
        EFECTIVO: { label: 'Efectivo', class: 'status-badge status-info' },
        LETRA: { label: 'Letra', class: 'status-badge status-info' },
        DEPOSITO: { label: 'Depósito', class: 'status-badge status-info' },
        OTROS: { label: 'Otros', class: 'status-badge status-info' },
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '110px',
      filterable: true,
      sortable: true,
      badgeConfig: {
        PENDIENTE: {
          label: 'Pendiente',
          class: 'status-badge status-pending',
          icon: 'fa-clock',
        },
        CONFIRMADO: {
          label: 'Confirmado',
          class: 'status-badge status-completed',
          icon: 'fa-check-circle',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-rejected',
          icon: 'fa-times-circle',
        },
        ANULADO: {
          label: 'Anulado',
          class: 'status-badge status-cancelled',
          icon: 'fa-ban',
        },
      },
    },
    { key: 'conciliado', label: 'Concil.', type: 'template', width: '80px' },
    { key: 'numero_operacion', label: 'N° Operación', type: 'template' },
    { key: 'created_at', label: 'Creado', type: 'date', width: '100px', sortable: true },
    // Legacy hidden columns (304_Administracion.tbl_C04003_CuentaPorPagar)
    { key: 'numero_factura', label: 'N° Factura', hidden: true },
    { key: 'fecha_factura', label: 'Fecha Factura', type: 'date', hidden: true, sortable: true },
    { key: 'fecha_vencimiento', label: 'Fecha Venc.', type: 'date', hidden: true, sortable: true },
    { key: 'moneda', label: 'Moneda', hidden: true },
    { key: 'tipo_cambio', label: 'T/C', type: 'number', format: '1.4-4', hidden: true },
    { key: 'monto_original', label: 'Monto Original', type: 'currency', hidden: true },
    { key: 'monto_pagado', label: 'Monto Pagado', type: 'currency', hidden: true },
    { key: 'saldo', label: 'Saldo', type: 'currency', hidden: true },
    { key: 'numero_operacion', label: 'N° Operación', hidden: true },
    { key: 'banco', label: 'Banco', hidden: true },
    { key: 'forma_pago', label: 'Forma Pago', hidden: true },
    { key: 'centro_costo', label: 'Centro Costo', hidden: true },
    { key: 'proyecto', label: 'Proyecto', hidden: true },
    { key: 'observaciones', label: 'Observaciones', hidden: true },
    { key: 'fecha_registro', label: 'Fecha Registro', type: 'date', hidden: true },
    { key: 'usuario_registro', label: 'Registrado por', hidden: true },
  ];

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.paymentService.getPayments(this.filters).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.totalItems = response.pagination.total;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loading = false;
        this.snackBar.open('Error al cargar los pagos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>) {
    this.filters.estado = (filters['estado'] as EstadoPago) || undefined;
    this.filters.metodo_pago = (filters['metodo_pago'] as MetodoPago) || undefined;
    this.filters.moneda = (filters['moneda'] as string) || undefined;
    this.filters.fecha_desde = (filters['fecha_start'] as string) || undefined;
    this.filters.fecha_hasta = (filters['fecha_end'] as string) || undefined;

    const conciliadoStr = filters['conciliado'] as string;
    this.filters.conciliado =
      conciliadoStr === 'true' ? true : conciliadoStr === 'false' ? false : undefined;

    this.filters.page = 1;
    this.loadPayments();
  }

  onPageChange(page: number) {
    this.filters.page = page;
    this.loadPayments();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.filters.limit = size;
    this.filters.page = 1;
    this.loadPayments();
  }

  onSort(event: { column: string; direction: string | null }): void {
    // Sort handled client-side by the grid
  }

  viewPayment(payment: PaymentRecordList | Record<string, unknown>) {
    const id = (payment as PaymentRecordList).id ?? payment['id'];
    this.router.navigate(['/payments', id]);
  }

  editPayment(payment: PaymentRecordList | Record<string, unknown>) {
    const id = (payment as PaymentRecordList).id ?? payment['id'];
    this.router.navigate(['/payments', id, 'edit']);
  }

  reconcilePayment(payment: PaymentRecordList | Record<string, unknown>) {
    const id = (payment as PaymentRecordList).id ?? payment['id'];
    this.confirmService
      .prompt({
        title: 'Conciliar Pago',
        message: 'Ingrese observaciones de conciliación (opcional):',
        icon: 'fa-check-double',
        confirmLabel: 'Conciliar',
      })
      .subscribe((observaciones) => {
        if (observaciones !== null) {
          const today = new Date().toISOString().split('T')[0];
          this.paymentService
            .reconcilePayment(id as number, {
              fecha_conciliacion: today,
              observaciones: observaciones || undefined,
            })
            .subscribe({
              next: () => {
                this.snackBar.open('Pago conciliado exitosamente', 'Cerrar', { duration: 3000 });
                this.loadPayments();
              },
              error: (error) => {
                console.error('Error reconciling payment:', error);
                this.snackBar.open('Error al conciliar el pago', 'Cerrar', { duration: 3000 });
              },
            });
        }
      });
  }

  navigateToCreate() {
    this.router.navigate(['/payments', 'create']);
  }

  exportToExcel() {
    this.loading = true;
    const exportFilters = { ...this.filters, limit: 1000, page: 1 };

    this.paymentService.getPayments(exportFilters).subscribe({
      next: (response) => {
        const dataToExport = response.data.map((p) => ({
          'N° Pago': p.numero_pago,
          'N° Valorización': p.numero_valorizacion || 'N/A',
          Fecha: this.formatDate(p.fecha_pago),
          Monto: p.monto_pagado,
          Moneda: p.moneda,
          Método: this.paymentService.getPaymentMethodLabel(p.metodo_pago),
          Estado: this.paymentService.getPaymentStatusLabel(p.estado),
          Conciliado: p.conciliado ? 'Sí' : 'No',
          'N° Operación': p.numero_operacion || '-',
        }));

        this.excelExportService.exportToExcel(dataToExport, {
          filename: 'registro_pagos',
          sheetName: 'Pagos',
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error exporting payments:', error);
        this.loading = false;
        this.snackBar.open('Error al exportar los datos', 'Cerrar', { duration: 3000 });
      },
    });
  }

  private formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  }

  private getStatusLabel(status: string): string {
    return this.paymentService.getPaymentStatusLabel(status);
  }

  private getMethodLabel(method: string): string {
    return this.paymentService.getPaymentMethodLabel(method);
  }
}
