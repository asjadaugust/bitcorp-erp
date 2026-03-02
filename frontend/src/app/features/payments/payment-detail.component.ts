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
import { AeroButtonComponent } from '../../core/design-system';
import { ConfirmService } from '../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, EntityDetailShellComponent, AeroButtonComponent],
  template: `
    <app-entity-detail-shell
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
        <aero-button
          *ngIf="payment?.estado !== 'ANULADO'"
          variant="primary"
          iconLeft="fa-pen"
          [fullWidth]="true"
          (clicked)="editPayment()"
          >Editar Pago</aero-button
        >
        <aero-button
          *ngIf="payment?.estado === 'CONFIRMADO' && !payment?.conciliado"
          variant="primary"
          iconLeft="fa-check-double"
          [fullWidth]="true"
          (clicked)="reconcilePayment()"
          >Conciliar Pago</aero-button
        >
        <aero-button
          *ngIf="payment?.estado !== 'ANULADO'"
          variant="danger"
          iconLeft="fa-ban"
          [fullWidth]="true"
          (clicked)="cancelPayment()"
          >Anular Pago</aero-button
        >
        <aero-button
          *ngIf="payment?.valorizacion_id"
          variant="ghost"
          iconLeft="fa-file-invoice"
          [fullWidth]="true"
          (clicked)="viewValuation()"
          >Ver Valorización</aero-button
        >
        <aero-button
          variant="ghost"
          iconLeft="fa-arrow-left"
          [fullWidth]="true"
          routerLink="/payments"
          >Volver a Lista</aero-button
        >
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .amount-section-premium {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .amount-card {
        background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%);
        color: var(--grey-100);
        padding: var(--s-24);
        border-radius: var(--s-8);
        text-align: center;
      }

      .amount-label {
        font-size: var(--type-label-size);
        opacity: 0.9;
        margin-bottom: var(--s-8);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .amount-value {
        font-size: 2.5rem;
        font-weight: bold;
        margin-bottom: var(--s-8);
      }

      .amount-details {
        font-size: var(--type-label-size);
        opacity: 0.9;
      }

      .tabs-header-premium {
        display: flex;
        border-bottom: 2px solid var(--grey-300);
      }

      .tab-link {
        padding: var(--s-12) var(--s-16);
        border: none;
        background: none;
        color: var(--grey-500);
        font-weight: 500;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
      }

      .tab-link:hover {
        color: var(--primary-500);
      }

      .tab-link.active {
        color: var(--primary-500);
        border-bottom-color: var(--primary-500);
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
        margin-bottom: var(--s-24);
      }

      .detail-section h2 {
        font-size: var(--type-h3-size);
        color: var(--grey-900);
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-8);
        border-bottom: 1px solid var(--grey-300);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: var(--s-24);
      }

      .info-item .label {
        display: block;
        font-size: var(--type-label-size);
        color: var(--grey-500);
        margin-bottom: var(--s-4);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-weight: 600;
      }

      .info-item p {
        margin: 0;
        color: var(--grey-900);
        font-size: 1rem;
      }

      .code-text {
        font-family: 'Courier New', monospace;
        background-color: var(--grey-100);
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: 0.9rem;
      }

      .highlight {
        font-weight: 600;
        color: var(--primary-500);
      }

      .observaciones-text {
        background-color: var(--grey-100);
        padding: var(--s-16);
        border-radius: var(--s-4);
        color: var(--grey-600);
        line-height: 1.6;
      }

      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: var(--type-label-size);
        font-weight: 600;
        display: inline-block;
      }

      .badge-success {
        background-color: var(--semantic-blue-100);
        color: var(--primary-900);
      }
      .badge-warning {
        background-color: var(--grey-100);
        color: var(--grey-900);
      }
      .badge-danger {
        background-color: var(--grey-100);
        color: var(--grey-900);
      }
      .badge-secondary {
        background-color: var(--grey-200);
        color: var(--grey-900);
      }
    `,
  ],
})
export class PaymentDetailComponent implements OnInit {
  paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

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
        this.snackBar.open('Error al cargar el pago', 'Cerrar', { duration: 3000 });
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
    this.confirmSvc
      .prompt({
        title: 'Conciliar Pago',
        message: '¿Está seguro de conciliar este pago?',
        icon: 'fa-check-double',
        confirmLabel: 'Conciliar',
        inputLabel: 'Observaciones de conciliación (opcional)',
        inputPlaceholder: 'Ingrese observaciones...',
      })
      .subscribe((observaciones) => {
        if (observaciones !== null) {
          const today = new Date().toISOString().split('T')[0];
          this.paymentService
            .reconcilePayment(this.payment!.id, {
              fecha_conciliacion: today,
              observaciones: observaciones || undefined,
            })
            .subscribe({
              next: () => {
                this.snackBar.open('Pago conciliado exitosamente', 'Cerrar', { duration: 3000 });
                this.loadPayment(this.payment!.id);
              },
              error: (error: unknown) => {
                console.error('Error reconciling payment:', error);
                this.snackBar.open('Error al conciliar el pago', 'Cerrar', { duration: 3000 });
              },
            });
        }
      });
  }

  cancelPayment() {
    if (!this.payment) return;
    this.confirmSvc
      .prompt({
        title: 'Anular Pago',
        message: `¿Está seguro de anular el pago ${this.payment.numero_pago}?`,
        icon: 'fa-ban',
        confirmLabel: 'Anular',
        isDanger: true,
        inputLabel: 'Motivo de anulación',
        inputPlaceholder: 'Ingrese el motivo...',
        inputRequired: true,
      })
      .subscribe((reason) => {
        if (reason) {
          this.paymentService.cancelPayment(this.payment!.id, reason).subscribe({
            next: () => {
              this.snackBar.open('Pago anulado exitosamente', 'Cerrar', { duration: 3000 });
              this.router.navigate(['/payments']);
            },
            error: (error: unknown) => {
              console.error('Error canceling payment:', error);
              this.snackBar.open('Error al anular el pago', 'Cerrar', { duration: 3000 });
            },
          });
        }
      });
  }

  viewValuation() {
    if (this.payment?.valorizacion_id) {
      this.router.navigate(['/equipment/valuations', this.payment.valorizacion_id]);
    }
  }
}
