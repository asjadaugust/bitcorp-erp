import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  PaymentRecordList,
  PaymentRecordQuery,
  EstadoPago,
  MetodoPago,
} from '../../core/models/payment-record.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent, ButtonComponent],
  template: `
    <div class="list-container">
      <div class="container">
        <div class="page-header">
          <h1>Registro de Pagos</h1>
          <button
            class="btn btn-primary"
            data-testid="btn-new-payment"
            (click)="navigateToCreate()"
          >
            <i class="fa-solid fa-plus"></i> Nuevo Pago
          </button>
        </div>

        <!-- Filters -->
        <div class="card filters-card">
          <div class="filters-grid">
            <div class="filter-item">
              <span class="label">Estado</span>
              <app-dropdown
                [(ngModel)]="filters.estado"
                [options]="statusOptions"
                (ngModelChange)="applyFilters()"
                [placeholder]="'Todos'"
              ></app-dropdown>
            </div>

            <div class="filter-item">
              <span class="label">Método de Pago</span>
              <app-dropdown
                [(ngModel)]="filters.metodo_pago"
                [options]="paymentMethodOptions"
                (ngModelChange)="applyFilters()"
                [placeholder]="'Todos'"
              ></app-dropdown>
            </div>

            <div class="filter-item">
              <span class="label">Conciliado</span>
              <app-dropdown
                [(ngModel)]="filters.conciliado"
                [options]="reconciledOptions"
                (ngModelChange)="applyFilters()"
                [placeholder]="'Todos'"
              ></app-dropdown>
            </div>

            <div class="filter-item">
              <span class="label">Fecha Desde</span>
              <input
                type="date"
                [(ngModel)]="filters.fecha_desde"
                (change)="applyFilters()"
                class="form-control"
              />
            </div>

            <div class="filter-item">
              <span class="label">Fecha Hasta</span>
              <input
                type="date"
                [(ngModel)]="filters.fecha_hasta"
                (change)="applyFilters()"
                class="form-control"
              />
            </div>

            <div class="filter-item">
              <span class="label">Moneda</span>
              <app-dropdown
                [(ngModel)]="filters.moneda"
                [options]="currencyDropdownOptions"
                (ngModelChange)="applyFilters()"
                [placeholder]="'Todas'"
              ></app-dropdown>
            </div>
          </div>

          <div class="filter-actions">
            <app-button
              variant="ghost"
              size="sm"
              label="Limpiar Filtros"
              icon="fa-times"
              (onClick)="clearFilters()"
            ></app-button>
            <app-button
              variant="success"
              size="sm"
              label="Exportar"
              icon="fa-file-excel"
              data-testid="btn-export-excel"
              (onClick)="exportToExcel()"
            ></app-button>
          </div>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading" class="loading" data-testid="loading-indicator">
          <div class="spinner"></div>
          <p>Cargando pagos...</p>
        </div>

        <!-- Payments Table -->
        <div *ngIf="!loading" class="card table-card">
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>N° Pago</th>
                  <th>N° Valorización</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Conciliado</th>
                  <th>N° Operación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  *ngFor="let payment of payments"
                  [attr.data-testid]="'payment-row-' + payment.id"
                >
                  <td>
                    <a [routerLink]="['/payments', payment.id]" class="link-primary">
                      {{ payment.numero_pago }}
                    </a>
                  </td>
                  <td>
                    <span *ngIf="payment.numero_valorizacion">
                      {{ payment.numero_valorizacion }}
                    </span>
                    <span *ngIf="!payment.numero_valorizacion" class="text-muted"> N/A </span>
                  </td>
                  <td>{{ payment.fecha_pago | date: 'dd/MM/yyyy' }}</td>
                  <td class="text-right">
                    <strong>
                      {{ paymentService.formatCurrency(payment.monto_pagado, payment.moneda) }}
                    </strong>
                  </td>
                  <td>
                    <span class="badge badge-secondary">
                      {{ paymentService.getPaymentMethodLabel(payment.metodo_pago) }}
                    </span>
                  </td>
                  <td>
                    <span
                      [class]="
                        'status-badge status-' +
                        paymentService.getPaymentStatusColor(payment.estado)
                      "
                    >
                      <i
                        [class]="
                          payment.estado === 'PENDIENTE'
                            ? 'fa-solid fa-clock'
                            : payment.estado === 'PAGADO'
                              ? 'fa-solid fa-check-circle'
                              : payment.estado === 'ANULADO'
                                ? 'fa-solid fa-ban'
                                : 'fa-solid fa-circle'
                        "
                      ></i>
                      {{ paymentService.getPaymentStatusLabel(payment.estado) }}
                    </span>
                  </td>
                  <td>
                    <span *ngIf="payment.conciliado" class="status-badge status-completed">
                      <i class="fa-solid fa-check-double"></i> Sí
                    </span>
                    <span *ngIf="!payment.conciliado" class="status-badge status-pending">
                      <i class="fa-solid fa-clock"></i> No
                    </span>
                  </td>
                  <td>
                    <span *ngIf="payment.numero_operacion" class="code-text">
                      {{ payment.numero_operacion }}
                    </span>
                    <span *ngIf="!payment.numero_operacion" class="text-muted"> - </span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        class="btn btn-sm btn-primary"
                        [attr.data-testid]="'btn-view-' + payment.id"
                        (click)="viewPayment(payment.id)"
                        title="Ver Detalle"
                      >
                        <i class="fa-solid fa-eye"></i>
                      </button>
                      <button
                        *ngIf="payment.estado !== 'ANULADO'"
                        class="btn btn-sm btn-secondary"
                        [attr.data-testid]="'btn-edit-' + payment.id"
                        (click)="editPayment(payment.id)"
                        title="Editar"
                      >
                        <i class="fa-solid fa-pen"></i>
                      </button>
                      <button
                        *ngIf="payment.estado === 'CONFIRMADO' && !payment.conciliado"
                        class="btn btn-sm btn-success"
                        [attr.data-testid]="'btn-reconcile-' + payment.id"
                        (click)="reconcilePayment(payment.id)"
                        title="Conciliar"
                      >
                        <i class="fa-solid fa-check-double"></i>
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="payments.length === 0" data-testid="empty-state">
                  <td colspan="9" class="text-center text-muted">
                    <p>No se encontraron pagos con los filtros aplicados</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div *ngIf="pagination" class="pagination-container">
            <div class="pagination-info">
              Mostrando {{ (pagination.page - 1) * pagination.limit + 1 }} a
              {{ Math.min(pagination.page * pagination.limit, pagination.total) }}
              de {{ pagination.total }} registros
            </div>
            <div class="pagination-controls">
              <button
                class="btn btn-sm btn-secondary"
                (click)="goToPage(pagination.page - 1)"
                [disabled]="pagination.page === 1"
              >
                <i class="fa-solid fa-chevron-left"></i> Anterior
              </button>
              <span class="page-indicator">
                Página {{ pagination.page }} de {{ pagination.total_pages }}
              </span>
              <button
                class="btn btn-sm btn-secondary"
                (click)="goToPage(pagination.page + 1)"
                [disabled]="pagination.page === pagination.total_pages"
              >
                Siguiente <i class="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .list-container {
        padding: 2rem 0;
      }

      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }

      .page-header h1 {
        margin: 0;
        font-size: 2rem;
        color: #333;
      }

      .filters-card {
        margin-bottom: 1.5rem;
        padding: 1.5rem;
      }
      .table-card {
        padding: 0;
      }

      .table-responsive {
        overflow-x: auto;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }

      .data-table thead {
        background-color: #f8f9fa;
        border-bottom: 2px solid #dee2e6;
      }

      .data-table th {
        padding: 1rem;
        text-align: left;
        font-weight: 600;
        color: #495057;
        font-size: 0.875rem;
        text-transform: uppercase;
      }

      .data-table td {
        padding: 1rem;
        border-bottom: 1px solid #dee2e6;
      }

      .data-table tbody tr:hover {
        background-color: #f8f9fa;
      }

      .action-buttons {
        display: flex;
        gap: 0.5rem;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
      }

      .badge-primary {
        background-color: #007bff;
        color: white;
      }
      .badge-secondary {
        background-color: #6c757d;
        color: white;
      }
      .badge-success {
        background-color: #28a745;
        color: white;
      }
      .badge-warning {
        background-color: #ffc107;
        color: #212529;
      }
      .badge-danger {
        background-color: #dc3545;
        color: white;
      }

      .link-primary {
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
      }

      .link-primary:hover {
        text-decoration: underline;
      }

      .text-right {
        text-align: right;
      }

      .text-muted {
        color: #6c757d;
      }

      .code-text {
        font-family: 'Courier New', monospace;
        font-size: 0.85rem;
        background-color: #f8f9fa;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
      }

      .pagination-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-top: 1px solid #dee2e6;
      }

      .pagination-info {
        color: #6c757d;
        font-size: 0.875rem;
      }

      .pagination-controls {
        display: flex;
        gap: 1rem;
        align-items: center;
      }

      .page-indicator {
        font-weight: 500;
      }

      .loading {
        text-align: center;
        padding: 3rem;
      }

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class PaymentListComponent implements OnInit {
  paymentService = inject(PaymentService);
  private router = inject(Router);
  private excelExportService = inject(ExcelExportService);

  payments: PaymentRecordList[] = [];
  loading = false;
  Math = Math;

  filters: PaymentRecordQuery = {
    page: 1,
    limit: 20,
  };

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  } | null = null;

  // Filter options
  estadoOptions = Object.values(EstadoPago);
  metodoOptions = Object.values(MetodoPago);

  get statusOptions(): DropdownOption[] {
    const options = this.estadoOptions.map((estado) => ({
      label: this.paymentService.getPaymentStatusLabel(estado),
      value: estado,
    }));
    return [{ label: 'Todos', value: undefined }, ...options];
  }

  get paymentMethodOptions(): DropdownOption[] {
    const options = this.metodoOptions.map((metodo) => ({
      label: this.paymentService.getPaymentMethodLabel(metodo),
      value: metodo,
    }));
    return [{ label: 'Todos', value: undefined }, ...options];
  }

  reconciledOptions: DropdownOption[] = [
    { label: 'Todos', value: undefined },
    { label: 'Sí', value: true },
    { label: 'No', value: false },
  ];

  currencyDropdownOptions: DropdownOption[] = [
    { label: 'Todas', value: undefined },
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading = true;
    this.paymentService.getPayments(this.filters).subscribe({
      next: (response) => {
        this.payments = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loading = false;
        alert('Error al cargar los pagos');
      },
    });
  }

  applyFilters() {
    this.filters.page = 1; // Reset to first page
    this.loadPayments();
  }

  clearFilters() {
    this.filters = {
      page: 1,
      limit: 20,
    };
    this.loadPayments();
  }

  goToPage(page: number) {
    if (page >= 1 && this.pagination && page <= this.pagination.total_pages) {
      this.filters.page = page;
      this.loadPayments();
    }
  }

  viewPayment(id: number) {
    this.router.navigate(['/payments', id]);
  }

  editPayment(id: number) {
    this.router.navigate(['/payments', id, 'edit']);
  }

  reconcilePayment(id: number) {
    const observaciones = prompt('Observaciones de conciliación (opcional):');
    if (observaciones !== null) {
      const today = new Date().toISOString().split('T')[0];
      this.paymentService
        .reconcilePayment(id, {
          fecha_conciliacion: today,
          observaciones: observaciones || undefined,
        })
        .subscribe({
          next: () => {
            alert('Pago conciliado exitosamente');
            this.loadPayments();
          },
          error: (error) => {
            console.error('Error reconciling payment:', error);
            alert('Error al conciliar el pago');
          },
        });
    }
  }

  navigateToCreate() {
    this.router.navigate(['/payments', 'create']);
  }

  exportToExcel() {
    this.loading = true;
    // Fetch with current filters but higher limit for export
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
        alert('Error al exportar los datos');
      },
    });
  }

  private formatDate(dateStr: string | Date | null | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  }
}
