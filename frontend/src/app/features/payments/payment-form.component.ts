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
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import { PaymentService } from '../../core/services/payment.service';
import { ValuationService } from '../../core/services/valuation.service';
import {
  CreatePaymentRecord,
  UpdatePaymentRecord,
  MetodoPago,
  TipoComprobante,
  PaymentSummary,
} from '../../core/models/payment-record.model';
import { Valuation } from '../../core/models/valuation.model';
import { FormContainerComponent } from '../../shared/components/form-container/form-container.component';
import { FormSectionComponent } from '../../shared/components/form-section/form-section.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroBadgeComponent } from '../../core/design-system';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DropdownComponent,
    FormContainerComponent,
    FormSectionComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-form-container
      [icon]="isEditMode ? 'fa-pen' : 'fa-money-bill-transfer'"
      [title]="isEditMode ? 'Editar Pago' : 'Registrar Nuevo Pago'"
      [subtitle]="isEditMode ? 'Actualizar información del pago' : 'Completar datos del nuevo pago'"
      [submitLabel]="isEditMode ? 'Actualizar Pago' : 'Registrar Pago'"
      submitIcon="fa-save"
      [loading]="submitting"
      loadingText="Guardando..."
      [disableSubmit]="paymentForm.invalid || submitting"
      backUrl="/payments"
      (submitted)="onSubmit()"
      (cancelled)="cancel()"
    >
      <form [formGroup]="paymentForm">
        <app-form-section title="Valorización" icon="fa-file-invoice-dollar" [columns]="1">
          <div class="form-group">
            <label for="valorizacion">Valorización *</label>
            <app-dropdown
              formControlName="valorizacion_id"
              [options]="valuationOptions"
              [placeholder]="'Seleccione una valorización'"
              [searchable]="true"
              [error]="isFieldInvalid('valorizacion_id')"
              (ngModelChange)="onValuationChange()"
              [disabled]="isEditMode"
            ></app-dropdown>
            <div *ngIf="isFieldInvalid('valorizacion_id')" class="error-msg">
              Debe seleccionar una valorización
            </div>
          </div>

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
              <aero-badge [variant]="getSummaryBadgeVariant(paymentSummary.estado_pago)">
                {{ paymentService.getSummaryStatusLabel(paymentSummary.estado_pago) }}
              </aero-badge>
            </div>
          </div>
        </app-form-section>

        <app-form-section title="Detalles del Pago" icon="fa-money-bill-transfer" [columns]="2">
          <div class="form-group">
            <label for="fecha_pago">Fecha de Pago *</label>
            <input
              type="date"
              id="fecha_pago"
              formControlName="fecha_pago"
              class="form-control"
              [class.invalid]="isFieldInvalid('fecha_pago')"
            />
            <div *ngIf="isFieldInvalid('fecha_pago')" class="error-msg">
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
            <div *ngIf="isFieldInvalid('monto_pagado')" class="error-msg">Monto inválido</div>
            <div
              *ngIf="
                paymentSummary && paymentForm.value.monto_pagado > paymentSummary.saldo_pendiente
              "
              class="warning-message"
            >
              El monto excede el saldo pendiente
            </div>
          </div>
          <div class="form-group">
            <label for="moneda">Moneda</label>
            <app-dropdown formControlName="moneda" [options]="currencyOptions"></app-dropdown>
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
          <div class="form-group">
            <label for="metodo_pago">Método de Pago *</label>
            <app-dropdown
              formControlName="metodo_pago"
              [options]="metodoDropdownOptions"
              [placeholder]="'Seleccione método'"
              [error]="isFieldInvalid('metodo_pago')"
              (ngModelChange)="onPaymentMethodChange()"
            ></app-dropdown>
            <div *ngIf="isFieldInvalid('metodo_pago')" class="error-msg">
              Método de pago requerido
            </div>
          </div>
          <div class="form-group" *ngIf="!isEditMode">
            <label for="estado">Estado</label>
            <app-dropdown formControlName="estado" [options]="statusDropdownOptions"></app-dropdown>
          </div>
        </app-form-section>

        <app-form-section
          *ngIf="showBankFields()"
          title="Información Bancaria"
          icon="fa-building-columns"
          [columns]="2"
        >
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
        </app-form-section>

        <app-form-section
          *ngIf="paymentForm.value.metodo_pago === 'CHEQUE'"
          title="Información del Cheque"
          icon="fa-money-check"
          [columns]="2"
        >
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
            <label for="banco_origen_cheque">Banco Emisor</label>
            <input
              type="text"
              id="banco_origen_cheque"
              formControlName="banco_origen"
              class="form-control"
              placeholder="Banco que emite el cheque"
            />
          </div>
        </app-form-section>

        <app-form-section title="Comprobante (Opcional)" icon="fa-receipt" [columns]="2">
          <div class="form-group">
            <label for="comprobante_tipo">Tipo de Comprobante</label>
            <app-dropdown
              formControlName="comprobante_tipo"
              [options]="comprobanteDropdownOptions"
              [placeholder]="'Ninguno'"
            ></app-dropdown>
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
        </app-form-section>

        <app-form-section title="Observaciones" icon="fa-clipboard" [columns]="1">
          <div class="form-group">
            <textarea
              id="observaciones"
              formControlName="observaciones"
              class="form-control"
              rows="4"
              placeholder="Notas adicionales sobre el pago..."
            ></textarea>
          </div>
        </app-form-section>
      </form>
    </app-form-container>
  `,
  styles: [
    `
      @use 'form-layout';

      .payment-summary {
        background: var(--grey-50);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        padding: var(--s-16);
        margin-top: var(--s-16);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        padding: var(--s-8) 0;
        border-bottom: 1px solid var(--grey-200);
        font-size: 0.9rem;
        color: var(--grey-700);
      }

      .summary-row:last-child {
        border-bottom: none;
      }

      .text-success {
        color: var(--semantic-blue-500);
      }

      .text-warning {
        color: var(--accent-500);
      }

      .warning-message {
        color: var(--accent-500);
        font-size: 0.875rem;
        margin-top: 4px;
        font-weight: 500;
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
  private snackBar = inject(MatSnackBar);

  paymentForm!: FormGroup;
  valuations: Valuation[] = [];
  paymentSummary: PaymentSummary | null = null;
  isEditMode = false;
  paymentId: number | null = null;
  submitting = false;

  metodoOptions = Object.values(MetodoPago);
  comprobanteOptions = Object.values(TipoComprobante);

  valuationOptions: DropdownOption[] = [];
  currencyOptions: DropdownOption[] = [
    { label: 'Soles (PEN)', value: 'PEN' },
    { label: 'Dólares (USD)', value: 'USD' },
  ];
  statusDropdownOptions: DropdownOption[] = [
    { label: 'Pendiente', value: 'PENDIENTE' },
    { label: 'Confirmado', value: 'CONFIRMADO' },
  ];

  get metodoDropdownOptions(): DropdownOption[] {
    return this.metodoOptions.map((m) => ({
      label: this.paymentService.getPaymentMethodLabel(m),
      value: m,
    }));
  }

  get comprobanteDropdownOptions(): DropdownOption[] {
    return this.comprobanteOptions.map((tipo) => ({
      label: tipo,
      value: tipo,
    }));
  }

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
        this.valuations = valuations.filter(
          (v) => v.estado === 'APROBADO' || v.estado === 'PAGADO'
        );
        this.valuationOptions = this.valuations.map((val) => ({
          label: `${val.numeroValorizacion || '#' + val.id} - ${this.paymentService.formatCurrency(val.totalValorizado || 0, 'PEN')} (${val.estado})`,
          value: val.id,
        }));
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
        this.snackBar.open('Error al cargar el pago', 'Cerrar', { duration: 3000 });
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
      const {
        valorizacion_id: _vid,
        estado: _est,
        ...updateData
      } = formData as Record<string, unknown>;
      const updatePayload: UpdatePaymentRecord = updateData as UpdatePaymentRecord;

      this.paymentService.updatePayment(this.paymentId, updatePayload).subscribe({
        next: () => {
          this.snackBar.open('Pago actualizado exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/payments', this.paymentId]);
        },
        error: (error) => {
          console.error('Error updating payment:', error);
          this.snackBar.open('Error al actualizar el pago', 'Cerrar', { duration: 3000 });
          this.submitting = false;
        },
      });
    } else {
      // Create new payment
      const createData: CreatePaymentRecord = { ...formData };

      this.paymentService.createPayment(createData).subscribe({
        next: (payment) => {
          this.snackBar.open('Pago registrado exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/payments', payment.id]);
        },
        error: (error) => {
          console.error('Error creating payment:', error);
          this.snackBar.open(
            error.error?.error?.message || 'Error al registrar el pago',
            'Cerrar',
            { duration: 3000 }
          );
          this.submitting = false;
        },
      });
    }
  }

  getSummaryBadgeVariant(status: string): string {
    const map: Record<string, string> = {
      SIN_PAGOS: 'neutral',
      PAGO_PARCIAL: 'warning',
      PAGO_COMPLETO: 'info',
    };
    return map[status] || 'neutral';
  }

  cancel() {
    if (this.isEditMode && this.paymentId) {
      this.router.navigate(['/payments', this.paymentId]);
    } else {
      this.router.navigate(['/payments']);
    }
  }
}
