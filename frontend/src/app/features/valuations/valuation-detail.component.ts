import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation, PaymentData, ValuationSummary } from '../../core/models/valuation.model';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentRecordList, PaymentSummary } from '../../core/models/payment-record.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-valuation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DropdownComponent],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles de la valorización...</p>
        </div>

        <div *ngIf="!loading && valuation" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Valorización {{ valuation.numeroValorizacion || '#' + valuation.id }}</h1>
                <p class="text-subtitle">
                  {{ valuation.cliente_nombre }} - {{ valuation.codigo_equipo }}
                </p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-BORRADOR]="valuation.estado === 'BORRADOR'"
                  [class.status-PENDIENTE]="
                    valuation.estado === 'PENDIENTE' ||
                    valuation.estado === 'EN_REVISION' ||
                    valuation.estado === 'VALIDADO'
                  "
                  [class.status-APROBADO]="
                    valuation.estado === 'APROBADO' || valuation.estado === 'PAGADO'
                  "
                  [class.status-CANCELADO]="
                    valuation.estado === 'RECHAZADO' || valuation.estado === 'ELIMINADO'
                  "
                >
                  {{ getEstadoLabel(valuation.estado) }}
                </span>
              </div>
            </div>

            <!-- Deadline Timeline -->
            <div class="deadline-section" *ngIf="valuation.deadlines">
              <h3 class="deadline-title">
                <i class="fa-solid fa-calendar-check"></i> Plazos de Entrega (CORP-GEM-P-002)
              </h3>
              <div class="deadline-timeline">
                <div
                  class="deadline-item"
                  [class.done]="isDeadlinePassed(valuation.deadlines.parcial)"
                  [class.overdue]="isDeadlineMissed(valuation.deadlines.parcial, valuation.estado)"
                >
                  <div class="deadline-dot"></div>
                  <div class="deadline-info">
                    <span class="deadline-label">Día 5 - Valorización Parcial</span>
                    <span class="deadline-date">{{
                      valuation.deadlines.parcial | date: 'dd/MM/yyyy'
                    }}</span>
                  </div>
                </div>
                <div
                  class="deadline-item"
                  [class.done]="isDeadlinePassed(valuation.deadlines.gasto_obra)"
                  [class.overdue]="
                    isDeadlineMissed(valuation.deadlines.gasto_obra, valuation.estado)
                  "
                >
                  <div class="deadline-dot"></div>
                  <div class="deadline-info">
                    <span class="deadline-label">Día 7 - Informe Gastos / Adelantos</span>
                    <span class="deadline-date">{{
                      valuation.deadlines.gasto_obra | date: 'dd/MM/yyyy'
                    }}</span>
                  </div>
                </div>
                <div
                  class="deadline-item"
                  [class.done]="isDeadlinePassed(valuation.deadlines.final)"
                  [class.overdue]="isDeadlineMissed(valuation.deadlines.final, valuation.estado)"
                >
                  <div class="deadline-dot"></div>
                  <div class="deadline-info">
                    <span class="deadline-label">Día 10 - Valorización Final</span>
                    <span class="deadline-date">{{
                      valuation.deadlines.final | date: 'dd/MM/yyyy'
                    }}</span>
                  </div>
                </div>
              </div>
              <div class="deadline-alert" *ngIf="valuation.deadlines.is_overdue">
                <i class="fa-solid fa-triangle-exclamation"></i>
                Esta valorización ha superado el plazo de entrega
              </div>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información del Contrato</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Contrato</label>
                    <p>{{ valuation.contrato?.codigo || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proyecto</label>
                    <p>{{ valuation.contrato?.nombre_proyecto || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <!-- Equipo y Proveedor (from PDF summary) -->
              <section class="detail-section" *ngIf="valuationSummary">
                <h2>Equipo y Proveedor</h2>
                <div class="info-grid info-grid-2col">
                  <div class="info-column">
                    <div class="info-item">
                      <label>Codigo Equipo</label>
                      <p>{{ valuationSummary.equipo.codigo_equipo || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Equipo</label>
                      <p>{{ valuationSummary.equipo.nombre || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Placa</label>
                      <p>{{ valuationSummary.equipo.placa || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Marca</label>
                      <p>{{ valuationSummary.equipo.marca || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Modelo</label>
                      <p>{{ valuationSummary.equipo.modelo || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Tipo Medidor</label>
                      <p>{{ valuationSummary.equipo.tipo_medidor || 'N/A' }}</p>
                    </div>
                  </div>
                  <div class="info-column">
                    <div class="info-item">
                      <label>RUC</label>
                      <p>{{ valuationSummary.proveedor.ruc || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Razon Social</label>
                      <p>{{ valuationSummary.proveedor.razon_social || 'N/A' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Direccion</label>
                      <p>{{ valuationSummary.proveedor.direccion || 'N/A' }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Datos del Contrato Detallado (from PDF summary) -->
              <section class="detail-section" *ngIf="valuationSummary">
                <h2>Datos del Contrato (Detallado)</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>N° Contrato</label>
                    <p>{{ valuationSummary.contrato.numero_contrato || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tipo Documento</label>
                    <p>{{ valuationSummary.contrato.tipo_documento || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Modalidad</label>
                    <p>{{ valuationSummary.contrato.modalidad || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tipo Tarifa</label>
                    <p>{{ valuationSummary.contrato.tipo_tarifa || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tarifa</label>
                    <p>{{ valuationSummary.contrato.tarifa | number: '1.2-2' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Moneda</label>
                    <p>{{ valuationSummary.contrato.moneda || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Tipo Cambio</label>
                    <p>{{ valuationSummary.valorizacion.tipo_cambio | number: '1.2-4' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Minimo Por</label>
                    <p>{{ valuationSummary.contrato.minimo_por || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Cantidad Minima</label>
                    <p>{{ valuationSummary.contrato.cantidad_minima }}</p>
                  </div>
                </div>
              </section>

              <!-- Resumen Financiero (from PDF summary) -->
              <section class="detail-section" *ngIf="valuationSummary">
                <h2>Resumen Financiero</h2>
                <div class="financial-table-container">
                  <table class="financial-table">
                    <thead>
                      <tr>
                        <th>Descripcion</th>
                        <th class="text-right">Cantidad</th>
                        <th>Unid</th>
                        <th class="text-right">P.U.</th>
                        <th class="text-right">Importe</th>
                      </tr>
                    </thead>
                    <tbody>
                      <!-- VALORIZACIÓN -->
                      <tr class="row-header">
                        <td colspan="5"><strong>VALORIZACION</strong></td>
                      </tr>
                      <tr>
                        <td>Cantidad a Valorizar</td>
                        <td class="text-right">
                          {{ valuationSummary.financiero.cantidad | number: '1.2-2' }}
                        </td>
                        <td>{{ valuationSummary.financiero.unidad_medida }}</td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.precio_unitario | number: '1.2-2' }}
                        </td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.valorizacion_bruta | number: '1.2-2' }}
                        </td>
                      </tr>

                      <tr>
                        <td>Horas en Exceso</td>
                        <td></td>
                        <td></td>
                        <td class="text-right"></td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.cargos_adicionales | number: '1.2-2' }}
                        </td>
                      </tr>

                      <!-- DESCUENTOS -->
                      <tr class="row-header">
                        <td colspan="5"><strong>DESCUENTOS</strong></td>
                      </tr>
                      <tr>
                        <td>Combustible</td>
                        <td class="text-right">
                          {{ valuationSummary.financiero.cantidad_combustible | number: '1.2-2' }}
                        </td>
                        <td>gln</td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.precio_combustible | number: '1.2-2' }}
                        </td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.importe_combustible | number: '1.2-2' }}
                        </td>
                      </tr>
                      <tr>
                        <td>Manipuleo de Combustible</td>
                        <td class="text-right">
                          {{ valuationSummary.financiero.cantidad_combustible | number: '1.2-2' }}
                        </td>
                        <td>gln</td>
                        <td class="text-right">
                          S/
                          {{
                            valuationSummary.financiero.precio_manipuleo_combustible
                              | number: '1.2-2'
                          }}
                        </td>
                        <td class="text-right">
                          S/
                          {{
                            valuationSummary.financiero.importe_manipuleo_combustible
                              | number: '1.2-2'
                          }}
                        </td>
                      </tr>
                      <tr>
                        <td>Gastos en Obra</td>
                        <td class="text-right"></td>
                        <td></td>
                        <td class="text-right"></td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.importe_gasto_obra | number: '1.2-2' }}
                        </td>
                      </tr>
                      <tr>
                        <td>Amortizacion por Adelantos</td>
                        <td class="text-right"></td>
                        <td></td>
                        <td class="text-right"></td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.importe_adelanto | number: '1.2-2' }}
                        </td>
                      </tr>
                      <tr>
                        <td>Exceso de Combustible</td>
                        <td class="text-right"></td>
                        <td></td>
                        <td class="text-right"></td>
                        <td class="text-right">
                          S/
                          {{
                            valuationSummary.financiero.importe_exceso_combustible | number: '1.2-2'
                          }}
                        </td>
                      </tr>

                      <!-- NETA -->
                      <tr class="row-total">
                        <td><strong>VALORIZACION NETA</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="text-right">
                          <strong
                            >S/
                            {{
                              valuationSummary.financiero.valorizacion_neta | number: '1.2-2'
                            }}</strong
                          >
                        </td>
                      </tr>
                      <tr>
                        <td>I.G.V. 18%</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="text-right">
                          S/ {{ valuationSummary.financiero.igv | number: '1.2-2' }}
                        </td>
                      </tr>
                      <tr class="row-total row-grand-total">
                        <td><strong>NETO A FACTURAR</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td class="text-right">
                          <strong
                            >S/
                            {{
                              valuationSummary.financiero.neto_facturar | number: '1.2-2'
                            }}</strong
                          >
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section class="detail-section">
                <h2>Detalles Financieros</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Monto Total</label>
                    <p class="highlight">
                      {{ valuation.totalValorizado | currency: 'PEN' : 'S/ ' }}
                    </p>
                  </div>
                  <div class="info-item">
                    <label>N° Valorización</label>
                    <p>{{ valuation.numeroValorizacion || 'Pendiente' }}</p>
                  </div>
                  <div class="info-item" *ngIf="valuation.aprobadoEn">
                    <label>Fecha Aprobación</label>
                    <p>{{ valuation.aprobadoEn | date: 'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Periodo</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Periodo</label>
                    <p>{{ valuation.periodo }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Inicio</label>
                    <p>{{ valuation.fechaInicio | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin</label>
                    <p>{{ valuation.fechaFin | date: 'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section" *ngIf="valuation.observaciones">
                <h2>Observaciones</h2>
                <p class="observaciones-text">{{ valuation.observaciones }}</p>
              </section>

              <!-- Payments Section -->
              <section class="detail-section payments-section">
                <div class="section-header">
                  <h2>Pagos ({{ paymentCount }})</h2>
                  <button
                    *ngIf="valuation.estado === 'APROBADO' || valuation.estado === 'PAGADO'"
                    class="btn btn-primary"
                    (click)="navigateToCreatePayment()"
                  >
                    <i class="fa-solid fa-plus"></i> Registrar Pago
                  </button>
                </div>

                <!-- Payment Summary Widget -->
                <div *ngIf="paymentSummary" class="payment-summary-widget">
                  <div class="summary-row">
                    <span class="summary-label">Total Valorización:</span>
                    <strong class="summary-value">{{
                      paymentService.formatCurrency(paymentSummary.monto_total_valorizacion, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Total Pagado:</span>
                    <strong class="summary-value text-success">{{
                      paymentService.formatCurrency(paymentSummary.total_pagado, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Saldo Pendiente:</span>
                    <strong class="summary-value text-warning">{{
                      paymentService.formatCurrency(paymentSummary.saldo_pendiente, 'PEN')
                    }}</strong>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Estado:</span>
                    <span
                      [class]="
                        'payment-status-badge status-' +
                        paymentService.getSummaryStatusColor(paymentSummary.estado_pago)
                      "
                    >
                      {{ paymentService.getSummaryStatusLabel(paymentSummary.estado_pago) }}
                    </span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="progress-bar-container">
                    <div
                      class="progress-bar-fill"
                      [style.width.%]="
                        (paymentSummary.total_pagado / paymentSummary.monto_total_valorizacion) *
                        100
                      "
                    ></div>
                  </div>
                  <div class="progress-label">
                    {{
                      (
                        (paymentSummary.total_pagado / paymentSummary.monto_total_valorizacion) *
                        100
                      ).toFixed(1)
                    }}% pagado
                  </div>
                </div>

                <!-- Loading State -->
                <div *ngIf="loadingPayments" class="loading-payments">
                  <div class="spinner-small"></div>
                  <p>Cargando pagos...</p>
                </div>

                <!-- Payments Table -->
                <div
                  *ngIf="!loadingPayments && payments.length > 0"
                  class="payments-table-container"
                >
                  <table class="payments-table">
                    <thead>
                      <tr>
                        <th>N° Pago</th>
                        <th>Fecha</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Conciliado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let payment of payments">
                        <td>
                          <a [routerLink]="['/payments', payment.id_pago]" class="payment-link">
                            {{ payment.numero_pago }}
                          </a>
                        </td>
                        <td>{{ payment.fecha_pago | date: 'dd/MM/yyyy' }}</td>
                        <td class="amount-cell">
                          {{ paymentService.formatCurrency(payment.monto_pagado, payment.moneda) }}
                        </td>
                        <td>
                          <span class="badge badge-secondary">{{
                            paymentService.getPaymentMethodLabel(payment.metodo_pago)
                          }}</span>
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
                          <button
                            class="btn-action btn-action-primary"
                            (click)="viewPayment(payment.id_pago)"
                            title="Ver detalles"
                          >
                            <i class="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Empty State -->
                <div *ngIf="!loadingPayments && payments.length === 0" class="empty-state-payments">
                  <i class="fa-solid fa-money-bill-wave empty-icon"></i>
                  <p class="empty-text">No hay pagos registrados para esta valorización</p>
                  <button
                    *ngIf="valuation.estado === 'APROBADO' || valuation.estado === 'PAGADO'"
                    class="btn btn-primary"
                    (click)="navigateToCreatePayment()"
                  >
                    <i class="fa-solid fa-plus"></i> Registrar Primer Pago
                  </button>
                </div>
              </section>
            </div>
          </div>

          <div class="detail-sidebar">
            <!-- Combined Actions Card -->
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="workflow-actions">
                <!-- Submit Draft: BORRADOR → PENDIENTE -->
                <button
                  *ngIf="valuation.estado === 'BORRADOR'"
                  class="btn btn-primary btn-block"
                  (click)="submitDraft()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-arrow-right"></i>
                  {{ processingWorkflow ? 'Enviando...' : 'Marcar como Pendiente' }}
                </button>

                <!-- Submit for Review: PENDIENTE → EN_REVISION (requires conformidad) -->
                <button
                  *ngIf="valuation.estado === 'PENDIENTE'"
                  class="btn btn-primary btn-block"
                  (click)="submitReview()"
                  [disabled]="processingWorkflow || !conformidadFile"
                >
                  <i class="fa-solid fa-file-signature"></i>
                  {{ processingWorkflow ? 'Enviando...' : 'Enviar a Revisión' }}
                </button>

                <!-- Approve: EN_REVISION → APROBADO -->
                <button
                  *ngIf="
                    valuation.estado === 'EN_REVISION' &&
                    (userRole === 'admin' || userRole === 'approver')
                  "
                  class="btn btn-success btn-block"
                  (click)="approveValuation()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-check"></i> Aprobar Valorización
                </button>

                <!-- Validate: VALIDADO (intermediate step if used) -->
                <button
                  *ngIf="
                    valuation.estado === 'VALIDADO' &&
                    (userRole === 'admin' || userRole === 'approver')
                  "
                  class="btn btn-success btn-block"
                  (click)="approveValuation()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-check-double"></i>
                  {{ processingWorkflow ? 'Procesando...' : 'Autorizar Pago' }}
                </button>

                <!-- Reject: Any active state → RECHAZADO -->
                <button
                  *ngIf="
                    (valuation.estado === 'PENDIENTE' ||
                      valuation.estado === 'EN_REVISION' ||
                      valuation.estado === 'VALIDADO') &&
                    (userRole === 'admin' || userRole === 'approver')
                  "
                  class="btn btn-danger btn-block"
                  (click)="rejectValuation()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-xmark"></i>
                  {{ processingWorkflow ? 'Rechazando...' : 'Rechazar' }}
                </button>

                <!-- Reopen: RECHAZADO → BORRADOR -->
                <button
                  *ngIf="valuation.estado === 'RECHAZADO'"
                  class="btn btn-secondary btn-block"
                  (click)="confirmReopen()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-rotate-left"></i>
                  {{ processingWorkflow ? 'Reabriendo...' : 'Reabrir para Corrección' }}
                </button>

                <!-- Mark as Paid: APROBADO → PAGADO -->
                <button
                  *ngIf="valuation.estado === 'APROBADO' && canMarkAsPaid()"
                  class="btn btn-secondary btn-block"
                  (click)="showMarkPaidModal = true"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-money-bill"></i> Marcar como Pagado
                </button>

                <p class="workflow-hint" *ngIf="getWorkflowHint()">
                  {{ getWorkflowHint() }}
                </p>

                <!-- Print / Download -->
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>

                <!-- Edit (Draft or Pending) -->
                <button
                  class="btn btn-secondary btn-block"
                  (click)="editValuation()"
                  *ngIf="valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE'"
                >
                  <i class="fa-solid fa-pen"></i> Editar
                </button>

                <!-- Cancel / Delete (Draft only) -->
                <button
                  *ngIf="valuation.estado === 'BORRADOR'"
                  class="btn btn-danger btn-block"
                  (click)="deleteValuation()"
                >
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>

                <!-- Navigation (Back) -->
                <button
                  type="button"
                  class="btn btn-ghost btn-block mt-2"
                  routerLink="/equipment/valuations"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
              </div>
            </div>

            <!-- Provider Conformity Card -->
            <div class="card">
              <h3>Conformidad del Proveedor</h3>
              <div *ngIf="valuation.conformidadProveedor" class="conformidad-status conformidad-ok">
                <i class="fa-solid fa-check-circle"></i>
                <div>
                  <strong>Conformidad Registrada</strong>
                  <p *ngIf="valuation.conformidadFecha">
                    {{ valuation.conformidadFecha | date: 'dd/MM/yyyy' }}
                  </p>
                  <p *ngIf="valuation.conformidadObservaciones" class="conformidad-obs">
                    {{ valuation.conformidadObservaciones }}
                  </p>
                </div>
              </div>
              <div
                *ngIf="!valuation.conformidadProveedor"
                class="conformidad-status conformidad-pending"
              >
                <i class="fa-solid fa-clock"></i>
                <div>
                  <strong>Pendiente de Conformidad</strong>
                  <p>Se requiere antes de enviar a revisión</p>
                </div>
              </div>
              <button
                *ngIf="
                  !valuation.conformidadProveedor &&
                  (valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE')
                "
                class="btn btn-primary btn-block"
                style="margin-top: 12px"
                (click)="showConformidadModal = true"
                [disabled]="processingWorkflow"
              >
                <i class="fa-solid fa-handshake"></i> Registrar Conformidad
              </button>
            </div>

            <!-- Quick Actions -->
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button
                  *ngIf="valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE'"
                  class="btn btn-primary btn-block"
                  (click)="recalculate()"
                  [disabled]="recalculating"
                >
                  <i class="fa-solid fa-calculator"></i>
                  {{ recalculating ? 'Recalculando...' : 'Recalcular' }}
                </button>
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
                <button
                  class="btn btn-secondary btn-block"
                  (click)="editValuation()"
                  *ngIf="valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE'"
                >
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
              </div>
            </div>

            <!-- Discount Events (Anexo B) -->
            <div
              class="card"
              *ngIf="valuation.estado === 'BORRADOR' || valuation.estado === 'PENDIENTE'"
            >
              <h3>Eventos de Descuento</h3>
              <p class="section-hint">
                Averías, stand-by o clima que reducen el mínimo contractual.
              </p>
              <div class="discount-events-list">
                <div class="discount-event-item" *ngFor="let evt of discountEvents">
                  <div class="discount-event-header">
                    <span class="discount-event-type">{{ evt.tipo }}</span>
                    <span class="discount-event-date">{{ evt.fecha | date: 'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="discount-event-values">
                    <span *ngIf="evt.horas_descuento > 0">{{ evt.horas_descuento }}h desc.</span>
                    <span *ngIf="evt.dias_descuento > 0">{{ evt.dias_descuento }}d desc.</span>
                  </div>
                  <div class="discount-event-desc" *ngIf="evt.descripcion">
                    {{ evt.descripcion }}
                  </div>
                  <button
                    class="btn-action btn-action-danger"
                    (click)="removeDiscountEvent(evt.id)"
                    title="Eliminar"
                  >
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <div *ngIf="discountEvents.length === 0" class="empty-docs">
                  No hay eventos de descuento
                </div>
              </div>
              <button
                class="btn btn-secondary btn-block"
                style="margin-top: 12px"
                (click)="showAddDiscountModal = true"
              >
                <i class="fa-solid fa-plus"></i> Agregar Evento
              </button>
            </div>

            <!-- Payment Documents (Cláusula 6.1) -->
            <div
              class="card"
              *ngIf="valuation.estado === 'APROBADO' || valuation.estado === 'PAGADO'"
            >
              <h3>Documentos de Pago</h3>
              <div class="payment-docs-list">
                <div class="pay-doc-item" *ngFor="let doc of paymentDocs">
                  <div class="pay-doc-header">
                    <span class="pay-doc-type">{{ translatePayDocType(doc.tipo_documento) }}</span>
                    <span [class]="'pay-doc-badge pay-doc-' + doc.estado?.toLowerCase()">
                      {{ doc.estado }}
                    </span>
                  </div>
                  <div class="pay-doc-meta" *ngIf="doc.numero">N° {{ doc.numero }}</div>
                </div>
                <div *ngIf="paymentDocs.length === 0" class="empty-docs">
                  No hay documentos registrados
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item" *ngIf="valuation.aprobadoEn">
                  <div class="timeline-date">{{ valuation.aprobadoEn | date: 'short' }}</div>
                  <div class="timeline-content">Aprobado</div>
                </div>

                <div class="timeline-item" *ngIf="valuation.validadoEn">
                  <div class="timeline-date">{{ valuation.validadoEn | date: 'short' }}</div>
                  <div class="timeline-content">Validado</div>
                </div>

                <div class="timeline-item" *ngIf="valuation.conformidadFecha">
                  <div class="timeline-date">{{ valuation.conformidadFecha | date: 'short' }}</div>
                  <div class="timeline-content">Conformidad del Proveedor</div>
                </div>

                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.updatedAt | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.createdAt | date: 'short' }}</div>
                  <div class="timeline-content">Valorización creada</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !valuation" class="empty-state card">
          <h3>Valorización no encontrada</h3>
          <p>La valorización que buscas no existe o ha sido eliminada.</p>
          <button class="btn btn-primary" routerLink="/equipment/valuations">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>

    <!-- Approve Confirmation Modal -->
    <div *ngIf="showApproveModal" class="modal" (click)="showApproveModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Aprobación</h2>
          <button class="close" (click)="showApproveModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>¿Estás seguro de que deseas aprobar esta valorización?</p>
          <div class="approval-summary">
            <p><strong>N° Valorización:</strong> {{ valuation?.numeroValorizacion || 'N/A' }}</p>
            <p>
              <strong>Total:</strong> {{ valuation?.totalValorizado | currency: 'PEN' : 'S/ ' }}
            </p>
            <p>
              <strong>Periodo:</strong> {{ valuation?.fechaInicio | date: 'dd/MM/yyyy' }} -
              {{ valuation?.fechaFin | date: 'dd/MM/yyyy' }}
            </p>
          </div>
          <p class="alert alert-info">
            Una vez aprobada, la valorización podrá ser marcada como pagada.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showApproveModal = false">Cancelar</button>
          <button
            class="btn btn-success"
            (click)="confirmApprove()"
            [disabled]="processingWorkflow"
          >
            {{ processingWorkflow ? 'Procesando...' : 'Aprobar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reject Modal with Reason -->
    <div *ngIf="showRejectModal" class="modal" (click)="showRejectModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Rechazar Valorización</h2>
          <button class="close" (click)="showRejectModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Indica el motivo del rechazo:</p>
          <div class="form-group">
            <label>Razón del Rechazo <span class="required">*</span></label>
            <textarea
              [(ngModel)]="rejectReason"
              class="form-control"
              rows="4"
              placeholder="Ej: Datos incorrectos en reporte de combustible..."
              required
            ></textarea>
            <p class="form-hint" *ngIf="!rejectReason">Este campo es obligatorio</p>
          </div>
          <p class="alert alert-warning">
            El motivo del rechazo será registrado en las observaciones.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showRejectModal = false">Cancelar</button>
          <button
            class="btn btn-danger"
            (click)="confirmReject()"
            [disabled]="!rejectReason || processingWorkflow"
          >
            {{ processingWorkflow ? 'Procesando...' : 'Rechazar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Mark as Paid Modal -->
    <div *ngIf="showMarkPaidModal" class="modal" (click)="showMarkPaidModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Marcar como Pagado</h2>
          <button class="close" (click)="showMarkPaidModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Registra los detalles del pago:</p>
          <div class="form-group">
            <label>Fecha de Pago <span class="required">*</span></label>
            <input type="date" [(ngModel)]="paymentData.fecha_pago" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Método de Pago <span class="required">*</span></label>
            <app-dropdown
              [(ngModel)]="paymentData.metodo_pago"
              [options]="paymentMethodOptions"
              [placeholder]="'Seleccionar...'"
              [required]="true"
            ></app-dropdown>
          </div>
          <div class="form-group">
            <label>Referencia de Pago <span class="required">*</span></label>
            <input
              type="text"
              [(ngModel)]="paymentData.referencia_pago"
              class="form-control"
              placeholder="Ej: TRF-2026-001 o CHEQUE-12345"
              required
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showMarkPaidModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="confirmMarkAsPaid()"
            [disabled]="!isPaymentDataValid() || processingWorkflow"
          >
            {{ processingWorkflow ? 'Procesando...' : 'Marcar como Pagado' }}
          </button>
        </div>
      </div>
    </div>
    <!-- Add Discount Event Modal -->
    <div *ngIf="showAddDiscountModal" class="modal" (click)="showAddDiscountModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Agregar Evento de Descuento</h2>
          <button class="close" (click)="showAddDiscountModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Fecha <span class="required">*</span></label>
            <input type="date" [(ngModel)]="newDiscountEvent.fecha" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Tipo <span class="required">*</span></label>
            <app-dropdown
              [(ngModel)]="newDiscountEvent.tipo"
              [options]="discountTypeOptions"
              [placeholder]="'Seleccionar tipo...'"
              [required]="true"
            ></app-dropdown>
          </div>
          <div class="form-group">
            <label>Horas Descuento</label>
            <input
              type="number"
              [(ngModel)]="newDiscountEvent.horas_descuento"
              class="form-control"
              step="0.5"
              min="0"
            />
          </div>
          <div class="form-group">
            <label>Días Descuento</label>
            <input
              type="number"
              [(ngModel)]="newDiscountEvent.dias_descuento"
              class="form-control"
              step="0.5"
              min="0"
            />
          </div>
          <div class="form-group">
            <label>Descripción</label>
            <textarea
              [(ngModel)]="newDiscountEvent.descripcion"
              class="form-control"
              rows="2"
              placeholder="Descripción opcional..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showAddDiscountModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="confirmAddDiscountEvent()"
            [disabled]="!newDiscountEvent.fecha || !newDiscountEvent.tipo"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>

    <!-- Conformidad Modal -->
    <div *ngIf="showConformidadModal" class="modal" (click)="showConformidadModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Registrar Conformidad del Proveedor</h2>
          <button class="close" (click)="showConformidadModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p>Registra la conformidad del proveedor para esta valorización.</p>
          <div class="form-group">
            <label>Fecha de Conformidad <span class="required">*</span></label>
            <input type="date" [(ngModel)]="conformidadData.fecha" class="form-control" required />
          </div>
          <div class="form-group">
            <label>Observaciones</label>
            <textarea
              [(ngModel)]="conformidadData.observaciones"
              class="form-control"
              rows="3"
              placeholder="Observaciones opcionales..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showConformidadModal = false">Cancelar</button>
          <button
            class="btn btn-primary"
            (click)="confirmConformidad()"
            [disabled]="!conformidadData.fecha || processingWorkflow"
          >
            {{ processingWorkflow ? 'Procesando...' : 'Registrar Conformidad' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: var(--s-24) 0;
      }

      .breadcrumb {
        margin-bottom: var(--s-24);
      }

      .breadcrumb-link {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: var(--s-24);

        @media (max-width: 968px) {
          grid-template-columns: 1fr;
        }
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--s-24);
        padding-bottom: var(--s-24);
        border-bottom: 2px solid #e0e0e0;

        h1 {
          font-size: 28px;
          color: var(--primary-900);
          margin-bottom: var(--s-4);
        }

        .code-badge {
          font-family: monospace;
          background: var(--grey-100);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 14px;
          color: var(--grey-700);
          font-weight: 600;
          display: inline-block;
        }
      }

      .detail-status {
        margin-bottom: var(--s-24);
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
      }

      .detail-section {
        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item {
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-4);
        }

        p {
          font-size: 16px;
          color: #333;
          margin: 0;

          &.highlight {
            font-size: 20px;
            font-weight: 600;
            color: var(--primary-500);
          }
        }
      }

      .observaciones-text {
        padding: var(--s-16);
        background: var(--grey-50);
        border-left: 3px solid var(--primary-500);
        border-radius: var(--radius-sm);
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.6;
      }

      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .workflow-actions,
      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .workflow-hint {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: var(--s-8);
        font-style: italic;
      }

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

      .btn-block {
        width: 100%;
        justify-content: center;
      }

      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover:not(:disabled) {
        background: var(--primary-800);
      }

      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-700);
      }
      .btn-secondary:hover:not(:disabled) {
        background: var(--grey-300);
      }

      .btn-success {
        background: var(--semantic-green-500);
        color: white;
      }
      .btn-success:hover:not(:disabled) {
        background: var(--semantic-green-700);
      }

      .btn-danger {
        background: var(--semantic-red-500);
        color: white;
      }
      .btn-danger:hover:not(:disabled) {
        background: var(--semantic-red-700);
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .timeline {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .timeline-item {
        position: relative;
        padding-left: var(--s-24);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary-500);
        }

        &::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 14px;
          width: 2px;
          height: calc(100% + var(--s-16));
          background: #e0e0e0;
        }

        &:last-child::after {
          display: none;
        }
      }

      .timeline-date {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-4);
      }

      .timeline-content {
        font-size: 14px;
        color: #333;
      }

      /* Payment Documents */
      .payment-docs-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pay-doc-item {
        padding: 8px;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
      }

      .pay-doc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .pay-doc-type {
        font-size: 13px;
        font-weight: 500;
      }

      .pay-doc-badge {
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 10px;
        font-weight: 500;
      }

      .pay-doc-pendiente {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }

      .pay-doc-presentado {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }

      .pay-doc-aprobado {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }

      .pay-doc-rechazado {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }

      .pay-doc-meta {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      .empty-docs {
        font-size: 13px;
        color: var(--grey-500);
        text-align: center;
        padding: 8px;
      }

      /* Status Badges */
      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-pending {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-pending::before {
        background: var(--semantic-yellow-500);
      }

      .status-under_review {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-under_review::before {
        background: var(--semantic-blue-500);
      }

      .status-approved {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-approved::before {
        background: var(--semantic-green-500);
      }

      .status-rejected {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-rejected::before {
        background: var(--semantic-red-500);
      }

      .status-BORRADOR {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .status-BORRADOR::before {
        background: var(--grey-400);
      }

      .status-PENDIENTE {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-PENDIENTE::before {
        background: var(--semantic-yellow-500);
      }

      .status-EN_REVISION {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-EN_REVISION::before {
        background: var(--semantic-blue-500);
      }

      .status-VALIDADO {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .status-VALIDADO::before {
        background: #4caf50;
      }

      .status-APROBADO {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-APROBADO::before {
        background: var(--semantic-green-500);
      }

      .status-RECHAZADO {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }
      .status-RECHAZADO::before {
        background: var(--semantic-red-500);
      }

      .status-PAGADO {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-PAGADO::before {
        background: var(--grey-400);
      }

      .status-paid {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-paid::before {
        background: var(--grey-400);
      }

      /* Conformidad card */
      .conformidad-status {
        display: flex;
        align-items: flex-start;
        gap: var(--s-12);
        padding: var(--s-12);
        border-radius: var(--radius-sm);
      }

      .conformidad-ok {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }

      .conformidad-ok i {
        font-size: 20px;
        margin-top: 2px;
      }

      .conformidad-pending {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }

      .conformidad-pending i {
        font-size: 20px;
        margin-top: 2px;
      }

      .conformidad-status strong {
        display: block;
        margin-bottom: 4px;
      }

      .conformidad-status p {
        font-size: 12px;
        margin: 0;
      }

      .conformidad-obs {
        font-style: italic;
        margin-top: 4px !important;
      }

      /* Modal */
      .modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        padding: 0;
        border-radius: var(--radius-md);
        width: 90%;
        max-width: 500px;
        box-shadow: var(--shadow-lg);
      }

      .modal-header {
        padding: var(--s-16) var(--s-24);
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
          margin: 0;
          font-size: 18px;
        }

        .close {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: var(--grey-500);
        }
      }

      .modal-body {
        padding: var(--s-24);

        p {
          margin-bottom: var(--s-16);

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .modal-footer {
        padding: var(--s-16) var(--s-24);
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: var(--s-8);
      }

      .approval-summary {
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: var(--radius-sm);
        margin: var(--s-16) 0;

        p {
          margin-bottom: var(--s-8);
          font-size: 14px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .form-group {
        margin-bottom: var(--s-16);

        &:last-child {
          margin-bottom: 0;
        }
      }

      .form-group label {
        display: block;
        margin-bottom: var(--s-8);
        font-weight: 500;
        color: var(--grey-700);
        font-size: 14px;
      }

      .required {
        color: var(--semantic-red-500);
      }

      .form-control {
        width: 100%;
        padding: var(--s-8) var(--s-12);
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
        font-size: 14px;
      }

      .form-hint {
        margin-top: var(--s-4);
        font-size: 12px;
        color: var(--grey-500);
      }

      .alert {
        padding: var(--s-12);
        border-radius: var(--radius-sm);
        font-size: 14px;
        margin-top: var(--s-16);
      }

      .alert-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        border: 1px solid var(--semantic-yellow-200);
      }

      .alert-info {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
        border: 1px solid var(--semantic-blue-200);
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48);
      }

      .spinner {
        border: 3px solid var(--grey-200);
        border-top: 3px solid var(--primary-500);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin-bottom: var(--s-16);
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* Payments Section Styles */
      .payments-section {
        margin-top: var(--s-32);
        padding-top: var(--s-32);
        border-top: 2px solid #e0e0e0;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);

        h2 {
          margin: 0;
        }
      }

      .payment-summary-widget {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        padding: var(--s-24);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-24);
      }

      .summary-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-12);

        &:last-of-type {
          margin-bottom: var(--s-16);
        }
      }

      .summary-label {
        font-size: 14px;
        color: var(--grey-600);
      }

      .summary-value {
        font-size: 18px;
        font-weight: 600;
        color: var(--grey-900);
      }

      .payment-status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: var(--grey-100);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--s-8);
      }

      .progress-bar-fill {
        height: 100%;
        background: var(--primary-500);
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-label {
        font-size: 12px;
        text-align: center;
        color: var(--grey-600);
      }

      .text-success {
        color: var(--semantic-green-700) !important;
      }

      .text-warning {
        color: var(--semantic-yellow-700) !important;
      }

      /* Two-column info grid */
      .info-grid-2col {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--s-24);

        @media (max-width: 600px) {
          grid-template-columns: 1fr;
        }
      }

      .info-column {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      /* Financial summary table */
      .financial-table-container {
        overflow-x: auto;
      }

      .financial-table {
        width: 100%;
        border-collapse: collapse;

        th {
          background: var(--grey-50);
          padding: var(--s-12) var(--s-16);
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--grey-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--grey-200);
        }

        td {
          padding: var(--s-8) var(--s-16);
          border-bottom: 1px solid var(--grey-100);
          font-size: 14px;
          color: var(--grey-900);
        }

        .text-right {
          text-align: right;
          font-family: monospace;
        }

        .row-header td {
          background: var(--grey-50);
          padding-top: var(--s-12);
          padding-bottom: var(--s-8);
          border-bottom: 1px solid var(--grey-200);
        }

        .row-total td {
          border-top: 2px solid var(--grey-300);
          padding-top: var(--s-12);
        }

        .row-grand-total td {
          background: var(--grey-50);
          border-top: 2px solid var(--grey-400);
          font-size: 15px;
        }
      }

      .loading-payments {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        padding: var(--s-24);
        color: var(--grey-500);
      }

      .spinner-small {
        border: 2px solid var(--grey-200);
        border-top: 2px solid var(--primary-500);
        border-radius: 50%;
        width: 20px;
        height: 20px;
        animation: spin 1s linear infinite;
      }

      .payments-table-container {
        overflow-x: auto;
        margin-top: var(--s-16);
      }

      .payments-table {
        width: 100%;
        border-collapse: collapse;
        background: white;

        th {
          background: var(--grey-50);
          padding: var(--s-12) var(--s-16);
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: var(--grey-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid var(--grey-200);
        }

        td {
          padding: var(--s-12) var(--s-16);
          border-bottom: 1px solid var(--grey-100);
          font-size: 14px;
          color: #333;
        }

        tbody tr:hover {
          background: var(--grey-50);
        }
      }

      .payment-link {
        color: var(--primary-500);
        text-decoration: none;
        font-weight: 500;
        font-family: monospace;

        &:hover {
          text-decoration: underline;
        }
      }

      .amount-cell {
        font-weight: 600;
        font-family: monospace;
      }

      .badge {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 500;
        display: inline-block;
        white-space: nowrap;
      }

      .badge-secondary {
        background: var(--grey-100);
        color: var(--grey-700);
      }

      .badge-success {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }

      .badge-warning {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }

      .badge-danger {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }

      .conciliado-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .btn-action {
        background: none;
        border: none;
        cursor: pointer;
        padding: var(--s-4) var(--s-8);
        border-radius: var(--radius-sm);
        transition: background 0.2s ease;
        font-size: 14px;

        &:hover {
          background: var(--grey-100);
        }
      }

      .btn-action-primary {
        color: var(--primary-500);

        &:hover {
          background: var(--primary-50);
        }
      }

      /* Discount events */
      .section-hint {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-12);
      }

      .discount-events-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .discount-event-item {
        padding: 8px;
        border: 1px solid var(--grey-200);
        border-radius: 6px;
        position: relative;
      }

      .discount-event-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;
      }

      .discount-event-type {
        font-size: 13px;
        font-weight: 500;
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .discount-event-date {
        font-size: 12px;
        color: var(--grey-500);
      }

      .discount-event-values {
        font-size: 12px;
        color: var(--grey-700);
        display: flex;
        gap: 8px;
      }

      .discount-event-desc {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
        font-style: italic;
      }

      .discount-event-item .btn-action {
        position: absolute;
        top: 4px;
        right: 4px;
      }

      .btn-action-danger {
        color: var(--semantic-red-500);

        &:hover {
          background: var(--semantic-red-50);
        }
      }

      .empty-state-payments {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--s-48) var(--s-24);
        text-align: center;
        background: var(--grey-50);
        border-radius: var(--radius-md);
      }

      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        margin-bottom: var(--s-16);
      }

      .empty-text {
        font-size: 14px;
        color: var(--grey-500);
        margin-bottom: var(--s-16);
      }

      /* Deadline Timeline */
      .deadline-section {
        margin-bottom: var(--s-24);
        padding: var(--s-16);
        background: var(--grey-50);
        border-radius: var(--s-8);
        border: 1px solid var(--grey-200);
      }

      .deadline-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: var(--s-16);
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .deadline-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-left: 8px;
      }

      .deadline-item {
        display: flex;
        align-items: center;
        gap: 12px;
        position: relative;
        padding-left: 20px;
      }

      .deadline-item::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 20px;
        bottom: -16px;
        width: 2px;
        background: var(--grey-300);
      }

      .deadline-item:last-child::before {
        display: none;
      }

      .deadline-dot {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: var(--grey-300);
        position: absolute;
        left: 0;
        flex-shrink: 0;
      }

      .deadline-item.done .deadline-dot {
        background: var(--semantic-green-500);
      }

      .deadline-item.overdue .deadline-dot {
        background: var(--semantic-red-500);
      }

      .deadline-info {
        display: flex;
        justify-content: space-between;
        flex: 1;
      }

      .deadline-label {
        font-size: 13px;
        color: var(--grey-700);
        font-weight: 500;
      }

      .deadline-date {
        font-size: 13px;
        color: var(--grey-500);
        font-family: monospace;
      }

      .deadline-item.overdue .deadline-label {
        color: var(--semantic-red-700);
        font-weight: 600;
      }

      .deadline-alert {
        margin-top: var(--s-12);
        padding: 8px 12px;
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
      }
    `,
  ],
})
export class ValuationDetailComponent implements OnInit {
  private valuationService = inject(ValuationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  paymentService = inject(PaymentService); // Made public for template access

  valuation: Valuation | null = null;
  valuationSummary: ValuationSummary | null = null;
  loading = true;
  processingWorkflow = false;

  // Payment-related properties
  payments: PaymentRecordList[] = [];
  paymentSummary: PaymentSummary | null = null;
  paymentDocs: any[] = [];
  paymentCount = 0;
  loadingPayments = false;

  // Recalculate & discount events
  recalculating = false;
  discountEvents: any[] = [];
  showAddDiscountModal = false;
  newDiscountEvent = {
    fecha: new Date().toISOString().split('T')[0],
    tipo: '',
    horas_descuento: 0,
    dias_descuento: 0,
    descripcion: '',
  };
  discountTypeOptions: DropdownOption[] = [
    { label: 'Avería', value: 'AVERIA' },
    { label: 'Stand By', value: 'STAND_BY' },
    { label: 'Climático', value: 'CLIMATICO' },
    { label: 'Otro', value: 'OTRO' },
  ];

  // Modal states
  showApproveModal = false;
  showRejectModal = false;
  showMarkPaidModal = false;
  showConformidadModal = false;

  // Form data
  rejectReason = '';
  conformidadData = {
    fecha: new Date().toISOString().split('T')[0],
    observaciones: '',
  };

  paymentMethodOptions: DropdownOption[] = [
    { label: 'Transferencia Bancaria', value: 'Transferencia Bancaria' },
    { label: 'Cheque', value: 'Cheque' },
    { label: 'Efectivo', value: 'Efectivo' },
    { label: 'Letra', value: 'Letra' },
    { label: 'Otro', value: 'Otro' },
  ];

  paymentData: PaymentData = {
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: '',
    referencia_pago: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadValuation(id);
    this.loadSummary(id);
    this.loadPayments(id);
    this.loadPaymentSummary(id);
    this.loadDiscountEvents(id);
  }

  loadValuation(id: number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (data) => {
        this.valuation = data;
        this.loading = false;
        this.loadPaymentDocs(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadPaymentDocs(id: number): void {
    this.valuationService.getPaymentDocuments(id).subscribe({
      next: (docs) => (this.paymentDocs = docs),
    });
  }

  translatePayDocType(tipo: string): string {
    const map: Record<string, string> = {
      FACTURA: 'Factura',
      POLIZA_TREC: 'Póliza TREC',
      ESSALUD: 'ESSALUD',
      SCTR: 'SCTR',
    };
    return map[tipo] || tipo;
  }

  loadSummary(id: number): void {
    this.valuationService.getSummary(id).subscribe({
      next: (data) => {
        this.valuationSummary = data;
      },
      error: (error) => {
        console.error('Error loading valuation summary:', error);
      },
    });
  }

  loadPayments(valuationId: number): void {
    this.loadingPayments = true;
    this.paymentService.getPaymentsByValuation(valuationId).subscribe({
      next: (payments) => {
        this.payments = payments;
        this.paymentCount = payments.length;
        this.loadingPayments = false;
      },
      error: (error) => {
        console.error('Error loading payments:', error);
        this.loadingPayments = false;
      },
    });
  }

  loadPaymentSummary(valuationId: number): void {
    this.paymentService.getPaymentSummary(valuationId).subscribe({
      next: (summary) => {
        this.paymentSummary = summary;
      },
      error: (error) => {
        console.error('Error loading payment summary:', error);
      },
    });
  }

  // Permission checks based on user role
  private getUserRoles(): string[] {
    const user = this.authService.currentUser;
    // Return roles array (normalized by AuthService)
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles;
    }
    // Fallback: if single rol exists, return as array
    if (user?.rol) {
      return [user.rol];
    }
    return [];
  }

  canSubmitForReview(): boolean {
    return true;
  }

  canValidate(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'RESIDENTE', 'ADMINISTRADOR_PROYECTO'].includes(r));
  }

  canApprove(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'DIRECTOR'].includes(r));
  }

  canReject(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) =>
      ['ADMIN', 'DIRECTOR', 'RESIDENTE', 'ADMINISTRADOR_PROYECTO'].includes(r)
    );
  }

  canRejectCurrentState(): boolean {
    if (!this.valuation) return false;
    return ['PENDIENTE', 'EN_REVISION', 'VALIDADO', 'APROBADO'].includes(this.valuation.estado);
  }

  canMarkAsPaid(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('ADMIN');
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En Revisión',
      VALIDADO: 'Validado',
      APROBADO: 'Aprobado',
      RECHAZADO: 'Rechazado',
      PAGADO: 'Pagado',
      ELIMINADO: 'Eliminado',
    };
    return labels[estado] || estado;
  }

  getWorkflowHint(): string | null {
    if (!this.valuation) return null;

    const status = this.valuation.estado;

    if (status === 'BORRADOR') {
      return 'Completa los datos y marca como pendiente para iniciar el proceso.';
    }
    if (status === 'PENDIENTE') {
      if (!this.valuation.conformidadProveedor) {
        return 'Registra la conformidad del proveedor antes de enviar a revisión.';
      }
      return 'Envía esta valorización a revisión.';
    }
    if (status === 'EN_REVISION') {
      return 'Esta valorización está en revisión y puede ser validada o rechazada.';
    }
    if (status === 'VALIDADO') {
      return 'Validada por Control OC. Pendiente de aprobación final.';
    }
    if (status === 'APROBADO' && this.canMarkAsPaid()) {
      return 'Aprobada. Puede ser marcada como pagada.';
    }
    if (status === 'RECHAZADO') {
      return 'Rechazada. Puede ser reabierta para corrección.';
    }
    if (status === 'PAGADO') {
      return 'Esta valorización ya ha sido pagada.';
    }

    return null;
  }

  // Workflow actions
  submitDraft(): void {
    if (!this.valuation || this.processingWorkflow) return;
    if (!confirm('¿Deseas marcar esta valorización como pendiente?')) return;

    this.processingWorkflow = true;
    this.valuationService.submitDraft(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        alert('Valorización marcada como pendiente');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  submitForReview(): void {
    if (!this.valuation || this.processingWorkflow) return;

    if (!confirm('¿Deseas enviar esta valorización a revisión?')) return;

    this.processingWorkflow = true;
    this.valuationService.submitForReview(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        alert('Valorización enviada a revisión exitosamente');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al enviar a revisión: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmApprove(): void {
    if (!this.valuation || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.approve(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showApproveModal = false;
        alert('Valorización aprobada exitosamente');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al aprobar: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmReject(): void {
    if (!this.valuation || !this.rejectReason || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.reject(this.valuation.id, this.rejectReason).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showRejectModal = false;
        this.rejectReason = '';
        alert('Valorización rechazada');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al rechazar: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmMarkAsPaid(): void {
    if (!this.valuation || !this.isPaymentDataValid() || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.markAsPaid(this.valuation.id, this.paymentData).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showMarkPaidModal = false;
        this.resetPaymentData();
        alert('Valorización marcada como pagada exitosamente');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al marcar como pagado: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmValidate(): void {
    if (!this.valuation || this.processingWorkflow) return;
    if (!confirm('¿Deseas validar esta valorización?')) return;

    this.processingWorkflow = true;
    this.valuationService.validate(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        alert('Valorización validada exitosamente');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al validar: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmReopen(): void {
    if (!this.valuation || this.processingWorkflow) return;
    if (!confirm('¿Deseas reabrir esta valorización para corrección?')) return;

    this.processingWorkflow = true;
    this.valuationService.reopen(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        alert('Valorización reabierta como borrador');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error al reabrir: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  confirmConformidad(): void {
    if (!this.valuation || !this.conformidadData.fecha || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.registerConformidad(this.valuation.id, this.conformidadData).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showConformidadModal = false;
        alert('Conformidad del proveedor registrada');
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        alert('Error: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  isPaymentDataValid(): boolean {
    return !!(
      this.paymentData.fecha_pago &&
      this.paymentData.metodo_pago &&
      this.paymentData.referencia_pago
    );
  }

  resetPaymentData(): void {
    this.paymentData = {
      fecha_pago: new Date().toISOString().split('T')[0],
      metodo_pago: '',
      referencia_pago: '',
    };
  }

  // ─── Recalculate & Discount Events ───

  recalculate(): void {
    if (!this.valuation || this.recalculating) return;
    this.recalculating = true;
    this.valuationService.recalculate(this.valuation.id).subscribe({
      next: (updated) => {
        this.valuation = updated;
        this.recalculating = false;
        this.loadSummary(this.valuation!.id);
        alert('Valorización recalculada exitosamente');
      },
      error: (err) => {
        this.recalculating = false;
        alert('Error al recalcular: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  loadDiscountEvents(valuationId: number): void {
    this.valuationService.getDiscountEvents(valuationId).subscribe({
      next: (events) => (this.discountEvents = events),
    });
  }

  confirmAddDiscountEvent(): void {
    if (!this.valuation || !this.newDiscountEvent.fecha || !this.newDiscountEvent.tipo) return;
    this.valuationService.createDiscountEvent(this.valuation.id, this.newDiscountEvent).subscribe({
      next: () => {
        this.showAddDiscountModal = false;
        this.resetDiscountEventForm();
        this.loadDiscountEvents(this.valuation!.id);
      },
      error: (err) => {
        alert('Error: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  removeDiscountEvent(eventId: number): void {
    if (!confirm('¿Eliminar este evento de descuento?')) return;
    this.valuationService.deleteDiscountEvent(eventId).subscribe({
      next: () => this.loadDiscountEvents(this.valuation!.id),
      error: (err) => {
        alert('Error: ' + (err.error?.error?.message || err.message));
      },
    });
  }

  private resetDiscountEventForm(): void {
    this.newDiscountEvent = {
      fecha: new Date().toISOString().split('T')[0],
      tipo: '',
      horas_descuento: 0,
      dias_descuento: 0,
      descripcion: '',
    };
  }

  editValuation(): void {
    if (this.valuation) {
      this.router.navigate(['/equipment/valuations', this.valuation.id, 'edit']);
    }
  }

  downloadPDF(): void {
    if (!this.valuation) return;

    this.valuationService.downloadPdf(this.valuation.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `valorizacion-${this.valuation?.numeroValorizacion || this.valuation?.id}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        alert('Error al descargar el PDF');
      },
    });
  }

  // Payment navigation methods
  navigateToCreatePayment(): void {
    if (this.valuation) {
      this.router.navigate(['/payments/create'], {
        queryParams: { valorizacion_id: this.valuation.id },
      });
    }
  }

  viewPayment(paymentId: number): void {
    this.router.navigate(['/payments', paymentId]);
  }

  isDeadlinePassed(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date() > new Date(dateStr);
  }

  isDeadlineMissed(dateStr: string, estado: string): boolean {
    if (!dateStr) return false;
    return this.isDeadlinePassed(dateStr) && ['BORRADOR', 'PENDIENTE'].includes(estado);
  }
  deleteValuation(): void {
    if (!this.valuation) return;
    if (confirm('¿Está seguro de eliminar esta valorización?')) {
      this.valuationService.delete(this.valuation.id).subscribe({
        next: () => {
          this.router.navigate(['/equipment/valuations']);
        },
        error: (err) => {
          console.error('Error deleting valuation', err);
          alert('Error al eliminar la valorización: ' + (err.error?.error?.message || err.message));
        },
      });
    }
  }
}
