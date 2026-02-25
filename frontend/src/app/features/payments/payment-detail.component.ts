import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentRecordDetail } from '../../core/models/payment-record.model';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityDetailShellComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="payment"
      [header]="header"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles del pago..."
    >
      <!-- ── BELOW HEADER: amount section ────────────────────── -->
      <div entity-header-below class="amount-section-premium">
        <div class="amount-card">
          <div class="amount-label">Monto Pagado</div>
          <div class="amount-value">
            {{
              paymentService.formatCurrency(payment?.monto_pagado || 0, payment?.moneda || 'PEN')
            }}
          </div>
          @if (payment?.tipo_cambio && payment?.moneda === 'USD') {
            <div class="amount-details">
              Tipo de Cambio: S/ {{ payment?.tipo_cambio }} <br />
              Equivalente: S/
              {{ ((payment?.monto_pagado || 0) * (payment?.tipo_cambio || 0)).toFixed(2) }}
            </div>
          }
        </div>

        <div class="tabs-header-premium">
          <button
            class="tab-link"
            [class.active]="activeTab === 'general'"
            (click)="activeTab = 'general'"
          >
            General
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'bank'"
            (click)="activeTab = 'bank'"
          >
            Banco
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'receipt'"
            (click)="activeTab = 'receipt'"
          >
            Comprobante
          </button>
          <button
            class="tab-link"
            [class.active]="activeTab === 'audit'"
            (click)="activeTab = 'audit'"
          >
            Auditoría
          </button>
        </div>
      </div>

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="tab-content">
        <!-- GENERAL TAB -->
        @if (activeTab === 'general') {
          <section class="detail-section">
            <h2>Información General</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Número de Pago</span>
                <p>{{ payment?.numero_pago }}</p>
              </div>
              <div class="info-item">
                <span class="label">Fecha de Pago</span>
                <p>{{ payment?.fecha_pago | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <span class="label">Método de Pago</span>
                <p>
                  <span class="badge badge-secondary">
                    {{ paymentService.getPaymentMethodLabel(payment?.metodo_pago || '') }}
                  </span>
                </p>
              </div>
              <div class="info-item">
                <span class="label">Estado</span>
                <p>
                  <span
                    [class]="
                      'badge badge-' + paymentService.getPaymentStatusColor(payment?.estado || '')
                    "
                  >
                    {{ paymentService.getPaymentStatusLabel(payment?.estado || '') }}
                  </span>
                </p>
              </div>
              <div class="info-item">
                <span class="label">Moneda</span>
                <p>
                  {{
                    payment?.moneda === 'PEN'
                      ? 'Soles (PEN)'
                      : payment?.moneda === 'USD'
                        ? 'Dólares (USD)'
                        : payment?.moneda
                  }}
                </p>
              </div>
              <div class="info-item" *ngIf="payment?.referencia_interna">
                <span class="label">Referencia Interna</span>
                <p>{{ payment?.referencia_interna }}</p>
              </div>
            </div>
          </section>

          @if (payment?.observaciones) {
            <section class="detail-section">
              <h2>Observaciones</h2>
              <p class="observaciones-text">{{ payment?.observaciones }}</p>
            </section>
          }
        }

        <!-- BANK DETAILS TAB -->
        @if (activeTab === 'bank') {
          <section class="detail-section">
            <h2>Información Bancaria</h2>
            <div class="info-grid">
              <div class="info-item" *ngIf="payment?.banco_origen">
                <span class="label">Banco Origen</span>
                <p>{{ payment?.banco_origen }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.cuenta_origen">
                <span class="label">Cuenta Origen</span>
                <p class="code-text">{{ payment?.cuenta_origen }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.banco_destino">
                <span class="label">Banco Destino</span>
                <p>{{ payment?.banco_destino }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.cuenta_destino">
                <span class="label">Cuenta Destino</span>
                <p class="code-text">{{ payment?.cuenta_destino }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.numero_operacion">
                <span class="label">Número de Operación</span>
                <p class="code-text highlight">{{ payment?.numero_operacion }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.numero_cheque">
                <span class="label">Número de Cheque</span>
                <p class="code-text">{{ payment?.numero_cheque }}</p>
              </div>
            </div>
          </section>

          @if (payment?.conciliado) {
            <section class="detail-section">
              <h2>Conciliación</h2>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Estado</span>
                  <p>
                    <span class="badge badge-success">
                      <i class="fa-solid fa-check-double"></i> Conciliado
                    </span>
                  </p>
                </div>
                <div class="info-item" *ngIf="payment?.fecha_conciliacion">
                  <span class="label">Fecha</span>
                  <p>{{ payment?.fecha_conciliacion | date: 'dd/MM/yyyy HH:mm' }}</p>
                </div>
              </div>
            </section>
          }
        }

        <!-- RECEIPT TAB -->
        @if (activeTab === 'receipt') {
          <section class="detail-section">
            <h2>Comprobante</h2>
            <div class="info-grid">
              <div class="info-item" *ngIf="payment?.comprobante_tipo">
                <span class="label">Tipo</span>
                <p>{{ payment?.comprobante_tipo }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.comprobante_numero">
                <span class="label">Número</span>
                <p class="code-text highlight">{{ payment?.comprobante_numero }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.comprobante_fecha">
                <span class="label">Fecha</span>
                <p>{{ payment?.comprobante_fecha | date: 'dd/MM/yyyy' }}</p>
              </div>
            </div>
          </section>
        }

        <!-- AUDIT TAB -->
        @if (activeTab === 'audit') {
          <section class="detail-section">
            <h2>Auditoría</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Registrado Por</span>
                <p>{{ payment?.registrado_por_nombre || '-' }}</p>
              </div>
              <div class="info-item">
                <span class="label">Fecha Registro</span>
                <p>{{ payment?.fecha_registro | date: 'dd/MM/yyyy HH:mm' }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.aprobado_por_nombre">
                <span class="label">Aprobado Por</span>
                <p>{{ payment?.aprobado_por_nombre }}</p>
              </div>
              <div class="info-item" *ngIf="payment?.fecha_aprobacion">
                <span class="label">Fecha Aprobación</span>
                <p>{{ payment?.fecha_aprobacion | date: 'dd/MM/yyyy HH:mm' }}</p>
              </div>
            </div>
          </section>
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button
          *ngIf="payment?.estado !== 'ANULADO'"
          class="btn btn-primary btn-block"
          (click)="editPayment()"
        >
          <i class="fa-solid fa-pen"></i> Editar Pago
        </button>
        <button
          *ngIf="payment?.estado === 'CONFIRMADO' && !payment?.conciliado"
          class="btn btn-success btn-block"
          (click)="reconcilePayment()"
        >
          <i class="fa-solid fa-check-double"></i> Conciliar Pago
        </button>
        <button
          *ngIf="payment?.estado !== 'ANULADO'"
          class="btn btn-danger btn-block"
          (click)="cancelPayment()"
        >
          <i class="fa-solid fa-ban"></i> Anular Pago
        </button>
        <button
          class="btn btn-ghost btn-block"
          (click)="viewValuation()"
          *ngIf="payment?.valorizacion_id"
        >
          <i class="fa-solid fa-file-invoice"></i> Ver Valorización
        </button>
        <button class="btn btn-ghost btn-block" routerLink="/payments">
          <i class="fa-solid fa-arrow-left"></i> Volver a Lista
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      .detail-container {
        padding: 2rem 0;
      }

      .breadcrumb {
        margin-bottom: 1.5rem;
      }

      .breadcrumb-link {
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
      }

      .breadcrumb-link:hover {
        text-decoration: underline;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
      }

      @media (max-width: 1024px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;
      }

      .detail-header h1 {
        margin: 0 0 0.5rem 0;
        font-size: 2rem;
        color: #333;
      }

      .detail-subtitle {
        margin: 0;
        color: #6c757d;
        font-size: 1rem;
      }

      .amount-section {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 2rem;
        border-radius: 8px;
        margin-bottom: 2rem;
        text-align: center;
      }

      .amount-label {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .amount-value {
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .amount-details {
        font-size: 0.875rem;
        opacity: 0.9;
      }

      .tabs {
        display: flex;
        border-bottom: 2px solid #e9ecef;
        margin-bottom: 1.5rem;
      }

      .tab {
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        color: #6c757d;
        font-weight: 500;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
      }

      .tab:hover {
        color: #007bff;
      }

      .tab.active {
        color: #007bff;
        border-bottom-color: #007bff;
      }

      .tab-content {
        animation: fadeIn 0.3s;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .detail-section {
        margin-bottom: 2rem;
      }

      .detail-section h2 {
        font-size: 1.25rem;
        color: #333;
        margin-bottom: 1rem;
        padding-bottom: 0.5rem;
        border-bottom: 1px solid #e9ecef;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .info-item label {
        display: block;
        font-size: 0.75rem;
        color: #6c757d;
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .info-item p {
        margin: 0;
        color: #333;
        font-size: 1rem;
      }

      .code-text {
        font-family: 'Courier New', monospace;
        background-color: #f8f9fa;
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        font-size: 0.9rem;
      }

      .highlight {
        font-weight: 600;
        color: #007bff;
      }

      .observaciones-text {
        background-color: #f8f9fa;
        padding: 1rem;
        border-radius: 4px;
        color: #495057;
        line-height: 1.6;
      }

      .badge {
        padding: 0.35rem 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
        display: inline-block;
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
      .badge-secondary {
        background-color: #6c757d;
        color: white;
      }

      .ml-2 {
        margin-left: 0.5rem;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #6c757d;
      }

      .text-muted {
        color: #6c757d;
      }

      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn-block {
        width: 100%;
      }

      .info-list-item {
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
      }

      .info-list-item:last-child {
        border-bottom: none;
      }

      .info-list-item label {
        font-size: 0.75rem;
        color: #6c757d;
        margin-bottom: 0.25rem;
        display: block;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .info-list-item p {
        margin: 0;
        color: #333;
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
export class PaymentDetailComponent implements OnInit {
  paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  payment: PaymentRecordDetail | null = null;
  loading = false;
  activeTab = 'general';

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-money-bill-transfer',
      title: this.payment?.numero_pago || 'Pago',
      subtitle: this.payment?.numero_valorizacion
        ? `Valorización: ${this.payment.numero_valorizacion}`
        : 'Registro de Pago',
      statusLabel: this.paymentService.getPaymentStatusLabel(this.payment?.estado || ''),
      statusClass: `badge-${this.paymentService.getPaymentStatusColor(this.payment?.estado || '')}`,
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.payment?.updated_at, label: 'Última actualización' },
        { date: this.payment?.fecha_registro, label: 'Pago registrado' },
      ],
    };
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPayment(parseInt(id));
    }
  }

  loadPayment(id: number) {
    this.loading = true;
    this.paymentService.getPaymentById(id).subscribe({
      next: (payment: PaymentRecordDetail) => {
        this.payment = payment;
        this.loading = false;
      },
      error: (error: unknown) => {
        console.error('Error loading payment:', error);
        this.loading = false;
        alert('Error al cargar el pago');
        this.router.navigate(['/payments']);
      },
    });
  }

  editPayment() {
    if (this.payment) {
      this.router.navigate(['/payments', this.payment.id, 'edit']);
    }
  }

  reconcilePayment() {
    if (!this.payment) return;

    const observaciones = prompt('Observaciones de conciliación (opcional):');
    if (observaciones !== null) {
      const today = new Date().toISOString().split('T')[0];
      this.paymentService
        .reconcilePayment(this.payment.id, {
          fecha_conciliacion: today,
          observaciones: observaciones || undefined,
        })
        .subscribe({
          next: () => {
            alert('Pago conciliado exitosamente');
            this.loadPayment(this.payment!.id);
          },
          error: (error: unknown) => {
            console.error('Error reconciling payment:', error);
            alert('Error al conciliar el pago');
          },
        });
    }
  }

  cancelPayment() {
    if (!this.payment) return;

    const reason = prompt('Motivo de anulación:');
    if (reason) {
      if (confirm(`¿Está seguro de anular el pago ${this.payment.numero_pago}?`)) {
        this.paymentService.cancelPayment(this.payment.id, reason).subscribe({
          next: () => {
            alert('Pago anulado exitosamente');
            this.router.navigate(['/payments']);
          },
          error: (error: unknown) => {
            console.error('Error canceling payment:', error);
            alert('Error al anular el pago');
          },
        });
      }
    }
  }

  viewValuation() {
    if (this.payment?.valorizacion_id) {
      this.router.navigate(['/equipment/valuations', this.payment.valorizacion_id]);
    }
  }
}
