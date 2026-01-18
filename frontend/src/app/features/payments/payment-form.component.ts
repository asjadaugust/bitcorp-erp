import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { ValuationService } from '../../core/services/valuation.service';
import {
  CreatePaymentRecord,
  UpdatePaymentRecord,
  MetodoPago,
  TipoComprobante,
  EstadoPago,
  PaymentSummary,
} from '../../core/models/payment-record.model';
import { Valuation } from '../../core/models/valuation.model';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="form-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/payments" class="breadcrumb-link"> ← Volver a Registro de Pagos </a>
        </div>

        <div class="page-header">
          <h1>{{ isEditMode ? 'Editar Pago' : 'Registrar Nuevo Pago' }}</h1>
        </div>

        <div class="form-grid">
          <div class="form-main card">
            <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()">
              <!-- Valuation Selection -->
              <section class="form-section">
                <h2>Valorización</h2>
                <div class="form-row">
                  <div class="form-group">
                    <label for="valorizacion">Valorización *</label>
                    <select
                      id="valorizacion"
                      formControlName="valorizacion_id"
                      class="form-control"
                      [class.invalid]="isFieldInvalid('valorizacion_id')"
                      (change)="onValuationChange()"
                      [disabled]="isEditMode"
                    >
                      <option [ngValue]="null">Seleccione una valorización</option>
                      <option *ngFor="let val of valuations" [value]="val.id">
                        {{ val.invoice_number || '#' + val.id }} -
                        {{ paymentService.formatCurrency(val.amount, 'PEN') }}
                        ({{ val.status | uppercase }})
                      </option>
                    </select>
                    <div *ngIf="isFieldInvalid('valorizacion_id')" class="error-message">
                      Debe seleccionar una valorización
                    </div>
                  </div>
                </div>

                <!-- Payment Summary -->
                <div *ngIf="paymentSummary" class="payment-summary">
                  <div class="summary-row">
                    <span>Monto Total Valorización:</span>
                    <strong>{{
                      paymentService.formatCurrency(paymentSummary.monto_total_valorizacion, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Total Pagado:</span>
                    <strong class="text-success">{{
                      paymentService.formatCurrency(paymentSummary.total_pagado, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Saldo Pendiente:</span>
                    <strong class="text-warning">{{
                      paymentService.formatCurrency(paymentSummary.saldo_pendiente, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span>Estado:</span>
                    <span
                      [class]="
                        'badge badge-' +
                        paymentService.getSummaryStatusColor(paymentSummary.estado_pago)
                      "
                    >
                      {{ paymentService.getSummaryStatusLabel(paymentSummary.estado_pago) }}
                    </span>
                  </div>
                </div>
              </section>

              <!-- Payment Details -->
              <section class="form-section">
                <h2>Detalles del Pago</h2>
                <div class="form-row">
                  <div class="form-group">
                    <label for="fecha_pago">Fecha de Pago *</label>
                    <input
                      type="date"
                      id="fecha_pago"
                      formControlName="fecha_pago"
                      class="form-control"
                      [class.invalid]="isFieldInvalid('fecha_pago')"
                    />
                    <div *ngIf="isFieldInvalid('fecha_pago')" class="error-message">
                      Fecha de pago requerida
                    </div>
                  </div>

                  <div class="form-group">
                    <label for="monto_pagado">Monto Pagado *</label>
                    <input
                      type="number"
                      id="monto_pagado"
                      formControlName="monto_pagado"
                      class="form-control"
                      step="0.01"
                      min="0"
                      [class.invalid]="isFieldInvalid('monto_pagado')"
                    />
                    <div *ngIf="isFieldInvalid('monto_pagado')" class="error-message">
                      Monto inválido
                    </div>
                    <div
                      *ngIf="
                        paymentSummary &&
                        paymentForm.value.monto_pagado > paymentSummary.saldo_pendiente
                      "
                      class="warning-message"
                    >
                      ⚠️ El monto excede el saldo pendiente
                    </div>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="moneda">Moneda</label>
                    <select id="moneda" formControlName="moneda" class="form-control">
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                    </select>
                  </div>

                  <div class="form-group" *ngIf="paymentForm.value.moneda === 'USD'">
                    <label for="tipo_cambio">Tipo de Cambio</label>
                    <input
                      type="number"
                      id="tipo_cambio"
                      formControlName="tipo_cambio"
                      class="form-control"
                      step="0.0001"
                      placeholder="Ej: 3.7500"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="metodo_pago">Método de Pago *</label>
                    <select
                      id="metodo_pago"
                      formControlName="metodo_pago"
                      class="form-control"
                      [class.invalid]="isFieldInvalid('metodo_pago')"
                      (change)="onPaymentMethodChange()"
                    >
                      <option [ngValue]="null">Seleccione método</option>
                      <option *ngFor="let metodo of metodoOptions" [value]="metodo">
                        {{ paymentService.getPaymentMethodLabel(metodo) }}
                      </option>
                    </select>
                    <div *ngIf="isFieldInvalid('metodo_pago')" class="error-message">
                      Método de pago requerido
                    </div>
                  </div>

                  <div class="form-group" *ngIf="!isEditMode">
                    <label for="estado">Estado</label>
                    <select id="estado" formControlName="estado" class="form-control">
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="CONFIRMADO">Confirmado</option>
                    </select>
                  </div>
                </div>
              </section>

              <!-- Bank Details (conditional) -->
              <section class="form-section" *ngIf="showBankFields()">
                <h2>Información Bancaria</h2>
                <div class="form-row">
                  <div class="form-group">
                    <label for="banco_origen">Banco Origen</label>
                    <input
                      type="text"
                      id="banco_origen"
                      formControlName="banco_origen"
                      class="form-control"
                      placeholder="Ej: BCP, BBVA, Interbank"
                    />
                  </div>

                  <div class="form-group">
                    <label for="cuenta_origen">Cuenta Origen</label>
                    <input
                      type="text"
                      id="cuenta_origen"
                      formControlName="cuenta_origen"
                      class="form-control"
                      placeholder="Número de cuenta"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="banco_destino">Banco Destino</label>
                    <input
                      type="text"
                      id="banco_destino"
                      formControlName="banco_destino"
                      class="form-control"
                      placeholder="Ej: BCP, BBVA, Interbank"
                    />
                  </div>

                  <div class="form-group">
                    <label for="cuenta_destino">Cuenta Destino</label>
                    <input
                      type="text"
                      id="cuenta_destino"
                      formControlName="cuenta_destino"
                      class="form-control"
                      placeholder="Número de cuenta"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="numero_operacion">Número de Operación</label>
                    <input
                      type="text"
                      id="numero_operacion"
                      formControlName="numero_operacion"
                      class="form-control"
                      placeholder="Número de operación bancaria"
                    />
                  </div>
                </div>
              </section>

              <!-- Check Details (conditional) -->
              <section class="form-section" *ngIf="paymentForm.value.metodo_pago === 'CHEQUE'">
                <h2>Información del Cheque</h2>
                <div class="form-row">
                  <div class="form-group">
                    <label for="numero_cheque">Número de Cheque</label>
                    <input
                      type="text"
                      id="numero_cheque"
                      formControlName="numero_cheque"
                      class="form-control"
                      placeholder="Número de cheque"
                    />
                  </div>

                  <div class="form-group">
                    <label for="banco_origen">Banco Emisor</label>
                    <input
                      type="text"
                      id="banco_origen"
                      formControlName="banco_origen"
                      class="form-control"
                      placeholder="Banco que emite el cheque"
                    />
                  </div>
                </div>
              </section>

              <!-- Receipt Details -->
              <section class="form-section">
                <h2>Comprobante (Opcional)</h2>
                <div class="form-row">
                  <div class="form-group">
                    <label for="comprobante_tipo">Tipo de Comprobante</label>
                    <select
                      id="comprobante_tipo"
                      formControlName="comprobante_tipo"
                      class="form-control"
                    >
                      <option [ngValue]="null">Ninguno</option>
                      <option *ngFor="let tipo of comprobanteOptions" [value]="tipo">
                        {{ tipo }}
                      </option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="comprobante_numero">Número de Comprobante</label>
                    <input
                      type="text"
                      id="comprobante_numero"
                      formControlName="comprobante_numero"
                      class="form-control"
                      placeholder="Ej: F001-12345"
                    />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="comprobante_fecha">Fecha de Comprobante</label>
                    <input
                      type="date"
                      id="comprobante_fecha"
                      formControlName="comprobante_fecha"
                      class="form-control"
                    />
                  </div>

                  <div class="form-group">
                    <label for="referencia_interna">Referencia Interna</label>
                    <input
                      type="text"
                      id="referencia_interna"
                      formControlName="referencia_interna"
                      class="form-control"
                      placeholder="Código interno de referencia"
                    />
                  </div>
                </div>
              </section>

              <!-- Observations -->
              <section class="form-section">
                <h2>Observaciones</h2>
                <div class="form-group">
                  <textarea
                    id="observaciones"
                    formControlName="observaciones"
                    class="form-control"
                    rows="4"
                    placeholder="Notas adicionales sobre el pago..."
                  ></textarea>
                </div>
              </section>

              <!-- Form Actions -->
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="cancel()">
                  <i class="fa-solid fa-times"></i> Cancelar
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="paymentForm.invalid || submitting"
                >
                  <i
                    class="fa-solid"
                    [class.fa-save]="!submitting"
                    [class.fa-spinner]="submitting"
                    [class.fa-spin]="submitting"
                  ></i>
                  {{
                    submitting ? 'Guardando...' : isEditMode ? 'Actualizar Pago' : 'Registrar Pago'
                  }}
                </button>
              </div>
            </form>
          </div>

          <!-- Sidebar -->
          <div class="form-sidebar">
            <div class="card">
              <h3>Información</h3>
              <div class="info-text">
                <p>
                  <strong>Campos Obligatorios:</strong><br />
                  - Valorización<br />
                  - Fecha de pago<br />
                  - Monto pagado<br />
                  - Método de pago
                </p>
                <p class="mt-3">
                  <strong>Nota:</strong> Los pagos se crean con estado PENDIENTE o CONFIRMADO. Los
                  pagos CONFIRMADOS se suman al total pagado de la valorización.
                </p>
                <p class="mt-3">
                  <strong>Conciliación:</strong> Los pagos CONFIRMADOS pueden ser conciliados
                  posteriormente con los extractos bancarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .form-container {
        padding: 2rem 0;
      }

      .page-header {
        margin-bottom: 2rem;
      }

      .page-header h1 {
        margin: 0;
        font-size: 2rem;
        color: #333;
      }

      .breadcrumb {
        margin-bottom: 1.5rem;
      }

      .breadcrumb-link {
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
      }

      @media (max-width: 1024px) {
        .form-grid {
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

      .form-section {
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #e9ecef;
      }

      .form-section:last-child {
        border-bottom: none;
      }

      .form-section h2 {
        font-size: 1.25rem;
        color: #333;
        margin-bottom: 1.5rem;
      }

      .form-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 1rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
      }

      .form-group label {
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #555;
        font-size: 0.9rem;
      }

      .form-control {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
        transition: border-color 0.2s;
      }

      .form-control:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }

      .form-control.invalid {
        border-color: #dc3545;
      }

      .form-control:disabled {
        background-color: #f8f9fa;
        cursor: not-allowed;
      }

      textarea.form-control {
        resize: vertical;
        min-height: 100px;
      }

      .error-message {
        color: #dc3545;
        font-size: 0.875rem;
        margin-top: 0.25rem;
      }

      .warning-message {
        color: #ff6b00;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        font-weight: 500;
      }

      .payment-summary {
        background: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        padding: 1rem;
        margin-top: 1rem;
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #dee2e6;
      }

      .summary-row:last-child {
        border-bottom: none;
      }

      .text-success {
        color: #28a745;
      }

      .text-warning {
        color: #ff6b00;
      }

      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .badge-success {
        background-color: #28a745;
        color: white;
      }
      .badge-warning {
        background-color: #ffc107;
        color: #212529;
      }
      .badge-secondary {
        background-color: #6c757d;
        color: white;
      }

      .form-actions {
        display: flex;
        gap: 1rem;
        justify-content: flex-end;
        padding-top: 2rem;
      }

      .info-text {
        font-size: 0.875rem;
        color: #6c757d;
        line-height: 1.6;
      }

      .info-text p {
        margin-bottom: 0.5rem;
      }

      .mt-3 {
        margin-top: 1rem;
      }

      .fa-spin {
        animation: spin 1s linear infinite;
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
export class PaymentFormComponent implements OnInit {
  paymentService = inject(PaymentService);
  private valuationService = inject(ValuationService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  paymentForm!: FormGroup;
  valuations: Valuation[] = [];
  paymentSummary: PaymentSummary | null = null;
  isEditMode = false;
  paymentId: number | null = null;
  submitting = false;

  metodoOptions = Object.values(MetodoPago);
  comprobanteOptions = Object.values(TipoComprobante);

  ngOnInit() {
    this.initForm();
    this.loadApprovedValuations();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.paymentId = parseInt(id);
      this.loadPaymentData(this.paymentId);
    }
  }

  initForm() {
    this.paymentForm = this.fb.group({
      valorizacion_id: [null, Validators.required],
      fecha_pago: [new Date().toISOString().split('T')[0], Validators.required],
      monto_pagado: [null, [Validators.required, Validators.min(0.01)]],
      moneda: ['PEN'],
      tipo_cambio: [null],
      metodo_pago: [null, Validators.required],
      banco_origen: [null],
      banco_destino: [null],
      cuenta_origen: [null],
      cuenta_destino: [null],
      numero_operacion: [null],
      numero_cheque: [null],
      comprobante_tipo: [null],
      comprobante_numero: [null],
      comprobante_fecha: [null],
      estado: ['CONFIRMADO'],
      observaciones: [null],
      referencia_interna: [null],
    });
  }

  loadApprovedValuations() {
    // Load valuations with APROBADO or PAGADO status
    this.valuationService.getAll({ limit: 100 }).subscribe({
      next: (valuations) => {
        this.valuations = valuations.filter((v) => v.status === 'approved' || v.status === 'paid');
      },
      error: (error) => {
        console.error('Error loading valuations:', error);
      },
    });
  }

  loadPaymentData(id: number) {
    this.paymentService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.paymentForm.patchValue({
          valorizacion_id: payment.valorizacion_id,
          fecha_pago: payment.fecha_pago,
          monto_pagado: payment.monto_pagado,
          moneda: payment.moneda,
          tipo_cambio: payment.tipo_cambio,
          metodo_pago: payment.metodo_pago,
          banco_origen: payment.banco_origen,
          banco_destino: payment.banco_destino,
          cuenta_origen: payment.cuenta_origen,
          cuenta_destino: payment.cuenta_destino,
          numero_operacion: payment.numero_operacion,
          numero_cheque: payment.numero_cheque,
          comprobante_tipo: payment.comprobante_tipo,
          comprobante_numero: payment.comprobante_numero,
          comprobante_fecha: payment.comprobante_fecha,
          observaciones: payment.observaciones,
          referencia_interna: payment.referencia_interna,
        });

        if (payment.valorizacion_id) {
          this.loadPaymentSummary(payment.valorizacion_id);
        }
      },
      error: (error) => {
        console.error('Error loading payment:', error);
        alert('Error al cargar el pago');
        this.router.navigate(['/payments']);
      },
    });
  }

  onValuationChange() {
    const valuationId = this.paymentForm.value.valorizacion_id;
    if (valuationId) {
      this.loadPaymentSummary(valuationId);
    }
  }

  loadPaymentSummary(valuationId: number) {
    this.paymentService.getPaymentSummary(valuationId).subscribe({
      next: (summary) => {
        this.paymentSummary = summary;
        // Auto-fill pending balance if no amount entered
        if (!this.paymentForm.value.monto_pagado && summary.saldo_pendiente > 0) {
          this.paymentForm.patchValue({
            monto_pagado: summary.saldo_pendiente,
          });
        }
      },
      error: (error) => {
        console.error('Error loading payment summary:', error);
      },
    });
  }

  onPaymentMethodChange() {
    const metodo = this.paymentForm.value.metodo_pago;
    // Clear conditional fields when method changes
    if (metodo !== 'CHEQUE') {
      this.paymentForm.patchValue({ numero_cheque: null });
    }
    if (!this.showBankFields()) {
      this.paymentForm.patchValue({
        banco_origen: null,
        banco_destino: null,
        cuenta_origen: null,
        cuenta_destino: null,
        numero_operacion: null,
      });
    }
  }

  showBankFields(): boolean {
    const metodo = this.paymentForm.value.metodo_pago;
    return metodo === 'TRANSFERENCIA' || metodo === 'DEPOSITO';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onSubmit() {
    if (this.paymentForm.invalid) {
      Object.keys(this.paymentForm.controls).forEach((key) => {
        this.paymentForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    const formData = this.paymentForm.value;

    if (this.isEditMode && this.paymentId) {
      // Update existing payment
      const updateData: UpdatePaymentRecord = { ...formData };
      delete (updateData as any).valorizacion_id; // Can't change valuation
      delete (updateData as any).estado; // Can't change status via edit

      this.paymentService.updatePayment(this.paymentId, updateData).subscribe({
        next: () => {
          alert('Pago actualizado exitosamente');
          this.router.navigate(['/payments', this.paymentId]);
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          alert('Error al actualizar el pago');
          this.submitting = false;
        },
      });
    } else {
      // Create new payment
      const createData: CreatePaymentRecord = { ...formData };

      this.paymentService.createPayment(createData).subscribe({
        next: (payment) => {
          alert('Pago registrado exitosamente');
          this.router.navigate(['/payments', payment.id]);
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          alert(error.error?.error?.message || 'Error al registrar el pago');
          this.submitting = false;
        },
      });
    }
  }

  cancel() {
    if (this.isEditMode && this.paymentId) {
      this.router.navigate(['/payments', this.paymentId]);
    } else {
      this.router.navigate(['/payments']);
    }
  }
}
