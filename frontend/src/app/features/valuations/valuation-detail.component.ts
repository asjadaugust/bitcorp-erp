import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfirmService } from '../../core/services/confirm.service';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation, PaymentData, ValuationSummary } from '../../core/models/valuation.model';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentRecordList, PaymentSummary } from '../../core/models/payment-record.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';
import {
  EntityDetailShellComponent,
  EntityDetailSidebarCardComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-valuation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DropdownComponent,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="valuation"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles de la valorización..."
    >
      <!-- ── BELOW HEADER: deadline timeline ──────────────────── -->
      <!-- ── BELOW HEADER: deadline timeline ──────────────────── -->
      @if (valuation?.deadlines) {
        <div entity-header-below class="deadline-section-compact">
          <div class="deadline-tracker">
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.parcial)"
              [class.active]="
                !isDeadlinePassed(valuation!.deadlines!.parcial) &&
                !isDeadlineMissed(valuation!.deadlines!.parcial, valuation!.estado)
              "
              [class.overdue]="isDeadlineMissed(valuation!.deadlines!.parcial, valuation!.estado)"
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Parcial (Día 5)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.parcial | date: 'dd/MM' }}</div>
            </div>
            <div class="tracker-line"></div>
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.gasto_obra)"
              [class.active]="
                isDeadlinePassed(valuation!.deadlines!.parcial) &&
                !isDeadlinePassed(valuation!.deadlines!.gasto_obra)
              "
              [class.overdue]="
                isDeadlineMissed(valuation!.deadlines!.gasto_obra, valuation!.estado)
              "
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Gasto Obra (Día 10)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.gasto_obra | date: 'dd/MM' }}</div>
            </div>
            <div class="tracker-line"></div>
            <div
              class="tracker-step"
              [class.done]="isDeadlinePassed(valuation!.deadlines!.cierre)"
              [class.active]="
                isDeadlinePassed(valuation!.deadlines!.gasto_obra) &&
                !isDeadlinePassed(valuation!.deadlines!.cierre)
              "
              [class.overdue]="isDeadlineMissed(valuation!.deadlines!.cierre, valuation!.estado)"
            >
              <div class="tracker-dot"></div>
              <div class="tracker-label">Cierre (Día 15)</div>
              <div class="tracker-date">{{ valuation!.deadlines!.cierre | date: 'dd/MM' }}</div>
            </div>
          </div>
          @if (valuation!.deadlines!.alerta_vencimiento) {
            <div class="tracker-alert">
              <i class="fa-solid fa-triangle-exclamation"></i>
              {{ valuation!.deadlines!.alerta_vencimiento }}
            </div>
          }
        </div>
      }

      <!-- ── MAIN CONTENT ─────────────────────────────────────── -->
      <div entity-main-content class="detail-sections">
        <!-- INFORMACIÓN GENERAL -->
        <section class="detail-section">
          <h2>Información General</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Período</label>
              <p>{{ valuation?.periodo }}</p>
            </div>
            <div class="info-item">
              <label>Equipo</label>
              <p>
                <a [routerLink]="['/equipment', valuation?.equipmentId]" class="link-primary">
                  {{ valuation?.codigo_equipo }}
                </a>
              </p>
            </div>
            <div class="info-item">
              <label>Contrato</label>
              <p>
                @if (valuation?.contractId) {
                  <a
                    [routerLink]="['/equipment/contracts', valuation?.contractId]"
                    class="link-primary"
                  >
                    {{ valuation?.contrato_numero || 'Ver Contrato' }}
                  </a>
                } @else {
                  <span>Sin contrato</span>
                }
              </p>
            </div>
            <div class="info-item">
              <label>Cliente</label>
              <p>{{ valuation?.cliente_nombre || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Proveedor</label>
              <p>{{ valuation?.proveedor_nombre || '-' }}</p>
            </div>
            <div class="info-item">
              <label>Tipo de Tarifa</label>
              <p>{{ valuation?.tipoTarifa || '-' }}</p>
            </div>
          </div>
        </section>

        <!-- RESUMEN FINANCIERO -->
        <section class="detail-section">
          <h2>Resumen Financiero</h2>
          <div class="financial-table-container">
            <table class="financial-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th class="text-right">Cantidad</th>
                  <th class="text-right">Tarifa</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <!-- Hours worked -->
                @if (valuationSummary?.horas_trabajadas != null) {
                  <tr class="row-header">
                    <td colspan="4"><strong>Horas Trabajadas</strong></td>
                  </tr>
                  <tr>
                    <td>Horas en operación</td>
                    <td class="text-right">{{ valuationSummary?.horas_trabajadas }}</td>
                    <td class="text-right">{{ valuation?.tarifa | currency: 'USD' }}</td>
                    <td class="text-right">
                      {{ valuationSummary?.monto_horas | currency: 'USD' }}
                    </td>
                  </tr>
                }
                <!-- Stand-by / included hours -->
                @if (
                  valuationSummary?.horas_stand_by != null && valuationSummary!.horas_stand_by! > 0
                ) {
                  <tr>
                    <td>Horas Stand By</td>
                    <td class="text-right">{{ valuationSummary?.horas_stand_by }}</td>
                    <td class="text-right">
                      {{ valuationSummary?.tarifa_stand_by | currency: 'USD' }}
                    </td>
                    <td class="text-right">
                      {{ valuationSummary?.monto_stand_by | currency: 'USD' }}
                    </td>
                  </tr>
                }
                <!-- Penalty -->
                @if (
                  valuationSummary?.penalidad_exceso != null &&
                  valuationSummary!.penalidad_exceso! > 0
                ) {
                  <tr>
                    <td>Penalidad por exceso</td>
                    <td class="text-right">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right text-danger">
                      -{{ valuationSummary?.penalidad_exceso | currency: 'USD' }}
                    </td>
                  </tr>
                }
                <!-- Discounts -->
                @if (valuationSummary?.descuentos != null && valuationSummary!.descuentos! > 0) {
                  <tr>
                    <td>Descuentos (Anexo B)</td>
                    <td class="text-right">-</td>
                    <td class="text-right">-</td>
                    <td class="text-right text-danger">
                      -{{ valuationSummary?.descuentos | currency: 'USD' }}
                    </td>
                  </tr>
                }
                <!-- Subtotal -->
                <tr class="row-total">
                  <td colspan="3"><strong>Subtotal</strong></td>
                  <td class="text-right">
                    <strong>{{ valuationSummary?.subtotal | currency: 'USD' }}</strong>
                  </td>
                </tr>
                <!-- IGV -->
                @if (valuationSummary?.igv != null) {
                  <tr>
                    <td colspan="3">IGV (18%)</td>
                    <td class="text-right">{{ valuationSummary?.igv | currency: 'USD' }}</td>
                  </tr>
                }
                <!-- Total -->
                <tr class="row-grand-total">
                  <td colspan="3"><strong>Total</strong></td>
                  <td class="text-right">
                    <strong>{{ valuationSummary?.total | currency: 'USD' }}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- DETALLES DEL PERÍODO -->
        <section class="detail-section">
          <h2>Detalles del Período</h2>
          <div class="info-grid-2col">
            <div class="info-column">
              <div class="info-item">
                <label>Fecha Inicio</label>
                <p>{{ valuation?.fechaInicio | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <label>Fecha Fin</label>
                <p>{{ valuation?.fechaFin | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <label>Días Trabajados</label>
                <p>{{ valuation?.diasTrabajados || '-' }}</p>
              </div>
              <div class="info-item">
                <label>Horas Totales</label>
                <p>{{ valuation?.horasTotales || '-' }}</p>
              </div>
            </div>
            <div class="info-column">
              <div class="info-item">
                <label>Tarifa Base</label>
                <p class="highlight">{{ valuation?.tarifa | currency: 'USD' }}</p>
              </div>
              <div class="info-item">
                <label>Monto Bruto</label>
                <p>{{ valuation?.montoBruto | currency: 'USD' }}</p>
              </div>
              <div class="info-item">
                <label>Monto Neto</label>
                <p class="highlight">{{ valuation?.montoNeto | currency: 'USD' }}</p>
              </div>
            </div>
          </div>
          @if (valuation?.observaciones) {
            <div class="observaciones-block">
              <label>Observaciones</label>
              <div class="observaciones-text">{{ valuation?.observaciones }}</div>
            </div>
          }
        </section>

        <!-- PAGOS -->
        <section class="detail-section payments-section">
          <div class="section-header">
            <h2>Pagos Registrados</h2>
            @if (valuation?.estado === 'APROBADO' || valuation?.estado === 'PAGADO') {
              <button
                type="button"
                class="btn btn-primary btn-sm"
                (click)="navigateToCreatePayment()"
              >
                <i class="fa-solid fa-plus"></i> Registrar Pago
              </button>
            }
          </div>

          <!-- Payment summary widget -->
          @if (paymentSummary) {
            <div class="payment-summary-widget">
              <div class="summary-row">
                <span class="summary-label">Total Valorización</span>
                <span class="summary-value">{{
                  paymentSummary.totalValorizacion | currency: 'USD'
                }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Total Pagado</span>
                <span class="summary-value text-success">
                  {{ paymentSummary.totalPagado | currency: 'USD' }}
                </span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Saldo Pendiente</span>
                <span
                  class="summary-value"
                  [class.text-warning]="paymentSummary.saldoPendiente > 0"
                >
                  {{ paymentSummary.saldoPendiente | currency: 'USD' }}
                </span>
              </div>
              <div class="progress-bar-container">
                <div
                  class="progress-bar-fill"
                  [style.width.%]="paymentSummary.porcentajePagado"
                ></div>
              </div>
              <p class="progress-label">
                {{ paymentSummary.porcentajePagado | number: '1.0-0' }}% pagado
              </p>
            </div>
          }

          @if (loadingPayments) {
            <div class="loading-payments">
              <div class="spinner-small"></div>
              <span>Cargando pagos...</span>
            </div>
          } @else if (payments.length > 0) {
            <div class="payments-table-container">
              <table class="payments-table">
                <thead>
                  <tr>
                    <th>N° Pago</th>
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Referencia</th>
                    <th class="text-right">Monto</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (payment of payments; track payment.id) {
                    <tr>
                      <td>
                        <a
                          class="payment-link"
                          (click)="viewPayment(payment.id)"
                          style="cursor:pointer"
                        >
                          {{ payment.numero_pago || '#' + payment.id }}
                        </a>
                      </td>
                      <td>{{ payment.fecha_pago | date: 'dd/MM/yyyy' }}</td>
                      <td>{{ payment.metodo_pago }}</td>
                      <td>{{ payment.referencia_pago }}</td>
                      <td class="text-right amount-cell">{{ payment.monto | currency: 'USD' }}</td>
                      <td>
                        <span
                          class="badge"
                          [class.badge-success]="payment.estado === 'APROBADO'"
                          [class.badge-warning]="payment.estado === 'PENDIENTE'"
                          [class.badge-danger]="payment.estado === 'RECHAZADO'"
                          [class.badge-secondary]="payment.estado === 'PAGADO'"
                          >{{ payment.estado }}</span
                        >
                      </td>
                      <td>
                        @if (payment.conciliado) {
                          <span class="conciliado-badge badge badge-success">
                            <i class="fa-solid fa-check"></i> Conciliado
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <div class="empty-state-payments">
              <i class="fa-solid fa-money-bill-wave empty-icon"></i>
              <p class="empty-text">No hay pagos registrados para esta valorización.</p>
              @if (valuation?.estado === 'APROBADO') {
                <button
                  type="button"
                  class="btn btn-primary btn-sm"
                  (click)="navigateToCreatePayment()"
                >
                  <i class="fa-solid fa-plus"></i> Registrar Primer Pago
                </button>
              }
            </div>
          }
        </section>
      </div>

      <!-- ── SIDEBAR: WORKFLOW ACTIONS ─────────────────────────── -->
      <ng-container entity-sidebar-actions>
        @if (valuation) {
          <!-- BORRADOR -->
          @if (valuation.estado === 'BORRADOR') {
            <button
              type="button"
              class="btn btn-primary btn-block"
              (click)="submitDraft()"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-paper-plane"></i>
              {{ processingWorkflow ? 'Procesando...' : 'Marcar como Pendiente' }}
            </button>
            <button type="button" class="btn btn-secondary btn-block" (click)="editValuation()">
              <i class="fa-solid fa-pen"></i> Editar Valorización
            </button>
            <button
              type="button"
              class="btn btn-outline btn-block"
              (click)="recalculate()"
              [disabled]="recalculating"
            >
              <i class="fa-solid fa-calculator"></i>
              {{ recalculating ? 'Recalculando...' : 'Recalcular' }}
            </button>
          }

          <!-- PENDIENTE -->
          @if (valuation.estado === 'PENDIENTE') {
            <button
              type="button"
              class="btn btn-primary btn-block"
              (click)="submitForReview()"
              [disabled]="processingWorkflow || !valuation.conformidadProveedor"
            >
              <i class="fa-solid fa-paper-plane"></i>
              {{ processingWorkflow ? 'Procesando...' : 'Enviar a Revisión' }}
            </button>
          }

          <!-- EN_REVISION -->
          @if (valuation.estado === 'EN_REVISION' && canValidate()) {
            <button
              type="button"
              class="btn btn-success btn-block"
              (click)="confirmValidate()"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-check-double"></i>
              {{ processingWorkflow ? 'Procesando...' : 'Validar' }}
            </button>
          }

          <!-- VALIDADO -->
          @if (valuation.estado === 'VALIDADO' && canApprove()) {
            <button
              type="button"
              class="btn btn-success btn-block"
              (click)="showApproveModal = true"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-circle-check"></i> Aprobar Valorización
            </button>
          }

          <!-- APROBADO + canMarkAsPaid -->
          @if (valuation.estado === 'APROBADO' && canMarkAsPaid()) {
            <button
              type="button"
              class="btn btn-success btn-block"
              (click)="showMarkPaidModal = true"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-money-check-dollar"></i> Marcar como Pagada
            </button>
          }

          <!-- RECHAZADO -->
          @if (valuation.estado === 'RECHAZADO') {
            <button
              type="button"
              class="btn btn-secondary btn-block"
              (click)="confirmReopen()"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-rotate-left"></i>
              {{ processingWorkflow ? 'Procesando...' : 'Reabrir Valorización' }}
            </button>
          }

          <!-- Reject (multi-state) -->
          @if (canRejectCurrentState() && canReject()) {
            <button
              type="button"
              class="btn btn-danger btn-block"
              (click)="showRejectModal = true"
              [disabled]="processingWorkflow"
            >
              <i class="fa-solid fa-ban"></i>
              Rechazar
            </button>
          }

          <!-- Workflow hint -->
          @if (getWorkflowHint()) {
            <p class="workflow-hint">{{ getWorkflowHint() }}</p>
          }

          <hr style="border:none;border-top:1px solid var(--grey-100);margin:var(--s-8) 0" />

          <!-- Common actions -->
          <button type="button" class="btn btn-secondary btn-block" (click)="downloadPDF()">
            <i class="fa-solid fa-file-pdf"></i>
            Descargar PDF
          </button>
          <button type="button" class="btn btn-ghost btn-block" (click)="editValuation()">
            <i class="fa-solid fa-pen-to-square"></i>
            Editar Detalles
          </button>
          <button type="button" class="btn btn-ghost btn-block" routerLink="/equipment/valuations">
            <i class="fa-solid fa-arrow-left-long"></i>
            Volver a Lista
          </button>
          <button type="button" class="btn btn-danger btn-block" (click)="deleteValuation()">
            <i class="fa-solid fa-trash-can"></i>
            Eliminar
          </button>
        }
      </ng-container>

      <!-- ── SIDEBAR: EXTRA CARDS ───────────────────────────────── -->

      <!-- Conformidad del Proveedor -->
      @if (valuation) {
        <entity-detail-sidebar-card entity-sidebar-after title="Conformidad del Proveedor">
          @if (valuation.conformidadProveedor) {
            <div class="conformidad-status conformidad-ok">
              <i class="fa-solid fa-circle-check"></i>
              <div>
                <strong>Conformidad registrada</strong>
                <p>{{ valuation.conformidadProveedor.fecha | date: 'dd/MM/yyyy' }}</p>
                @if (valuation.conformidadProveedor.observaciones) {
                  <p class="conformidad-obs">{{ valuation.conformidadProveedor.observaciones }}</p>
                }
              </div>
            </div>
          } @else {
            <div class="conformidad-status conformidad-pending">
              <i class="fa-solid fa-clock"></i>
              <div>
                <strong>Pendiente de conformidad</strong>
                <p>El proveedor aún no ha dado su conformidad.</p>
              </div>
            </div>
            @if (valuation.estado === 'PENDIENTE') {
              <button
                type="button"
                class="btn btn-secondary btn-block mt-8"
                (click)="showConformidadModal = true"
              >
                <i class="fa-solid fa-signature"></i> Registrar Conformidad
              </button>
            }
          }
        </entity-detail-sidebar-card>
      }

      <!-- Descuentos (Anexo B) -->
      @if (valuation && (valuation.estado === 'BORRADOR' || discountEvents.length > 0)) {
        <entity-detail-sidebar-card entity-sidebar-after title="Descuentos (Anexo B)">
          <p class="section-hint">Eventos de descuento aplicados a la valorización.</p>
          @if (discountEvents.length > 0) {
            <div class="discount-events-list">
              @for (event of discountEvents; track event.id) {
                <div class="discount-event-item">
                  <div class="discount-event-header">
                    <span class="discount-event-type">
                      {{ event.tipo }}
                      @if (event.subtipo) {
                        · {{ event.subtipo }}
                      }
                    </span>
                    <span class="discount-event-date">{{ event.fecha | date: 'dd/MM/yy' }}</span>
                  </div>
                  <div class="discount-event-values">
                    @if (event.aplica_descuento === false && event.subtipo) {
                      <span class="no-discount-badge">Sin descuento</span>
                    } @else if (event.aplica_descuento === true) {
                      @if (event.descuento_calculado_horas) {
                        <span class="calc-badge"
                          >{{ event.descuento_calculado_horas }}h calculado</span
                        >
                      }
                      @if (event.descuento_calculado_dias) {
                        <span class="calc-badge"
                          >{{ event.descuento_calculado_dias }}d calculado</span
                        >
                      }
                    } @else {
                      @if (event.horas_descuento) {
                        <span>{{ event.horas_descuento }}h descuento</span>
                      }
                      @if (event.dias_descuento) {
                        <span>{{ event.dias_descuento }}d descuento</span>
                      }
                    }
                  </div>
                  @if (event.descripcion) {
                    <p class="discount-event-desc">{{ event.descripcion }}</p>
                  }
                  @if (valuation.estado === 'BORRADOR') {
                    <button
                      type="button"
                      class="btn-action btn-action-danger"
                      (click)="removeDiscountEvent(event.id)"
                      title="Eliminar evento"
                    >
                      <i class="fa-solid fa-trash-can"></i>
                    </button>
                  }
                </div>
              }
            </div>
          } @else {
            <p class="empty-docs">Sin descuentos registrados.</p>
          }
          @if (valuation.estado === 'BORRADOR') {
            <button
              type="button"
              class="btn btn-secondary btn-block mt-8"
              (click)="showAddDiscountModal = true"
            >
              <i class="fa-solid fa-plus"></i> Agregar Descuento
            </button>
          }
        </entity-detail-sidebar-card>
      }

      <!-- Documentos de Pago -->
      @if (paymentDocs.length > 0) {
        <entity-detail-sidebar-card entity-sidebar-after title="Documentos de Pago">
          <div class="payment-docs-list">
            @for (doc of paymentDocs; track doc.id) {
              <div class="pay-doc-item">
                <div class="pay-doc-header">
                  <span class="pay-doc-type">{{ translatePayDocType(doc.tipo) }}</span>
                  <span
                    class="pay-doc-badge"
                    [class.pay-doc-pendiente]="doc.estado === 'PENDIENTE'"
                    [class.pay-doc-presentado]="doc.estado === 'PRESENTADO'"
                    [class.pay-doc-aprobado]="doc.estado === 'APROBADO'"
                    [class.pay-doc-rechazado]="doc.estado === 'RECHAZADO'"
                    >{{ doc.estado }}</span
                  >
                </div>
                @if (doc.numero || doc.fecha_vencimiento) {
                  <p class="pay-doc-meta">
                    @if (doc.numero) {
                      {{ doc.numero }}
                    }
                    @if (doc.fecha_vencimiento) {
                      · Vence: {{ doc.fecha_vencimiento | date: 'dd/MM/yy' }}
                    }
                  </p>
                }
              </div>
            }
          </div>
        </entity-detail-sidebar-card>
      }
    </entity-detail-shell>

    <!-- ── MODALS ──────────────────────────────────────────────── -->

    <!-- Approve Modal -->
    @if (showApproveModal) {
      <div class="modal" (click)="showApproveModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar Aprobación</h2>
            <button type="button" class="close" (click)="showApproveModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p>¿Confirmas la aprobación final de esta valorización?</p>
            @if (valuation) {
              <div class="approval-summary">
                <p><strong>Valorización:</strong> {{ valuation.numeroValorizacion }}</p>
                <p><strong>Monto Total:</strong> {{ valuation.montoNeto | currency: 'USD' }}</p>
                <p><strong>Período:</strong> {{ valuation.periodo }}</p>
              </div>
            }
            <p class="alert alert-warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Esta acción es definitiva y pasará la valorización a estado APROBADO.
            </p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showApproveModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success"
              (click)="confirmApprove()"
              [disabled]="processingWorkflow"
            >
              {{ processingWorkflow ? 'Aprobando...' : 'Confirmar Aprobación' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Reject Modal -->
    @if (showRejectModal) {
      <div class="modal" (click)="showRejectModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Rechazar Valorización</h2>
            <button type="button" class="close" (click)="showRejectModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="rejectReason"> Motivo de Rechazo <span class="required">*</span> </label>
              <textarea
                id="rejectReason"
                class="form-control"
                rows="4"
                [(ngModel)]="rejectReason"
                placeholder="Ingrese el motivo del rechazo..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showRejectModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-danger"
              (click)="confirmReject()"
              [disabled]="processingWorkflow || !rejectReason"
            >
              {{ processingWorkflow ? 'Rechazando...' : 'Confirmar Rechazo' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Mark as Paid Modal -->
    @if (showMarkPaidModal) {
      <div class="modal" (click)="showMarkPaidModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Registrar Pago</h2>
            <button type="button" class="close" (click)="showMarkPaidModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Fecha de Pago <span class="required">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="paymentData.fecha_pago" />
            </div>
            <div class="form-group">
              <label>Método de Pago <span class="required">*</span></label>
              <app-dropdown
                [options]="paymentMethodOptions"
                [placeholder]="'Seleccionar método'"
                [(value)]="paymentData.metodo_pago"
              ></app-dropdown>
            </div>
            <div class="form-group">
              <label>Referencia / Número de Operación <span class="required">*</span></label>
              <input
                type="text"
                class="form-control"
                [(ngModel)]="paymentData.referencia_pago"
                placeholder="Ej: TRF-2024-001"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showMarkPaidModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-success"
              (click)="confirmMarkAsPaid()"
              [disabled]="processingWorkflow || !isPaymentDataValid()"
            >
              {{ processingWorkflow ? 'Guardando...' : 'Confirmar Pago' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Add Discount Event Modal -->
    @if (showAddDiscountModal) {
      <div class="modal" (click)="showAddDiscountModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Agregar Evento de Descuento</h2>
            <button type="button" class="close" (click)="showAddDiscountModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Fecha <span class="required">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="newDiscountEvent.fecha" />
            </div>
            <div class="form-group">
              <label>Tipo de Descuento <span class="required">*</span></label>
              <app-dropdown
                [options]="discountTypeOptions"
                [placeholder]="'Seleccionar tipo'"
                [(value)]="newDiscountEvent.tipo"
                (valueChange)="onDiscountTipoChange()"
              ></app-dropdown>
            </div>
            @if (currentSubtipoOptions.length > 0) {
              <div class="form-group">
                <label>Subtipo <span class="required">*</span></label>
                <app-dropdown
                  [options]="currentSubtipoOptions"
                  [placeholder]="'Seleccionar subtipo'"
                  [(value)]="newDiscountEvent.subtipo"
                  (valueChange)="onDiscountSubtipoChange()"
                ></app-dropdown>
                <small class="form-hint"
                  >Define la regla de descuento aplicable (PRD Anexo B)</small
                >
              </div>

              @if (discountRuleBadge) {
                <div class="alert" [ngClass]="discountRuleBadge.cls">
                  <i class="fa-solid" [ngClass]="discountRuleBadge.icon"></i>
                  {{ discountRuleBadge.text }}
                </div>
              }
            }
            @if (showHorasHorometro) {
              <div class="form-group">
                <label>Horas Horómetro (Mecánica) <span class="required">*</span></label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.horas_horometro_mecanica"
                  min="0"
                  step="0.5"
                  placeholder="Horas registradas en horómetro"
                />
                <small class="form-hint">Se calcularán días proporcionales: h / 8</small>
              </div>
            }
            @if (showHorasDescuento) {
              <div class="form-group">
                <label>Horas de Paralización</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.horas_descuento"
                  min="0"
                  step="0.5"
                  (input)="onHorasDescuentoChange()"
                />
                @if (
                  newDiscountEvent.tipo === 'AVERIA' && newDiscountEvent.subtipo === 'ARRENDADOR'
                ) {
                  <small class="form-hint">
                    @if ((newDiscountEvent.horas_descuento || 0) >= 5) {
                      <span class="rule-enforced"
                        ><i class="fa-solid fa-check-circle"></i> ≥5h → 1 día completo
                        aplicado</span
                      >
                    } @else {
                      <span>Regla: &lt;5h proporcional / ≥5h = 1 día completo</span>
                    }
                  </small>
                }
              </div>
            }
            @if (!newDiscountEvent.subtipo) {
              <div class="form-group">
                <label>Días de Descuento (manual)</label>
                <input
                  type="number"
                  class="form-control"
                  [(ngModel)]="newDiscountEvent.dias_descuento"
                  min="0"
                  step="0.5"
                />
              </div>
            }
            <div class="form-group">
              <label>Descripción</label>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="newDiscountEvent.descripcion"
                placeholder="Descripción del evento..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showAddDiscountModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="confirmAddDiscountEvent()"
              [disabled]="!newDiscountEvent.fecha || !newDiscountEvent.tipo"
            >
              Agregar Descuento
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Conformidad Modal -->
    @if (showConformidadModal) {
      <div class="modal" (click)="showConformidadModal = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Registrar Conformidad del Proveedor</h2>
            <button type="button" class="close" (click)="showConformidadModal = false">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="alert alert-info">
              <i class="fa-solid fa-circle-info"></i>
              Registra la fecha en que el proveedor dio su conformidad a esta valorización.
            </p>
            <div class="form-group">
              <label>Fecha de Conformidad <span class="required">*</span></label>
              <input type="date" class="form-control" [(ngModel)]="conformidadData.fecha" />
            </div>
            <div class="form-group">
              <label>Observaciones (opcional)</label>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="conformidadData.observaciones"
                placeholder="Observaciones del proveedor..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="showConformidadModal = false">
              Cancelar
            </button>
            <button
              type="button"
              class="btn btn-primary"
              (click)="confirmConformidad()"
              [disabled]="processingWorkflow || !conformidadData.fecha"
            >
              {{ processingWorkflow ? 'Guardando...' : 'Registrar Conformidad' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .link-primary {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }

      .highlight {
        font-size: 18px;
        font-weight: 600;
        color: var(--primary-600);
      }

      .observaciones-block {
        margin-top: var(--s-16);

        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-700);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-8);
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

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
        margin-top: var(--s-8);
      }

      /* Deadline timeline */
      .deadline-section {
        margin-bottom: var(--s-8);
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

        &::before {
          content: '';
          position: absolute;
          left: 7px;
          top: 20px;
          bottom: -16px;
          width: 2px;
          background: var(--grey-300);
        }

        &:last-child::before {
          display: none;
        }
      }

      /* Deadline Tracker (Compact) */
      .deadline-section-compact {
        background: var(--grey-50);
        padding: 12px 20px;
        border-radius: 8px;
        border-bottom: 4px solid var(--grey-100);
      }

      .deadline-tracker {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .tracker-step {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        position: relative;
        flex: 1;

        .tracker-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          border: 2px solid var(--grey-300);
          z-index: 1;
          transition: all 0.3s ease;
        }

        .tracker-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--grey-500);
          margin-top: 6px;
        }

        .tracker-date {
          font-size: 10px;
          color: var(--grey-400);
          font-family: monospace;
        }

        &.done {
          .tracker-dot {
            background: var(--semantic-green-500);
            border-color: var(--semantic-green-600);
            box-shadow: 0 0 0 4px var(--semantic-green-50);
          }
          .tracker-label {
            color: var(--semantic-green-700);
          }
        }

        &.active {
          .tracker-dot {
            border-color: var(--primary-500);
            box-shadow: 0 0 0 4px var(--primary-50);
          }
          .tracker-label {
            color: var(--primary-600);
          }
        }

        &.overdue {
          .tracker-dot {
            background: var(--semantic-red-500);
            border-color: var(--semantic-red-600);
            box-shadow: 0 0 0 4px var(--semantic-red-50);
          }
          .tracker-label {
            color: var(--semantic-red-700);
          }
        }
      }

      .tracker-line {
        flex: 1;
        height: 2px;
        background: var(--grey-200);
        margin-top: -24px;
      }

      .tracker-alert {
        margin-top: 12px;
        padding: 6px 12px;
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
        justify-content: center;
      }

      /* Info grids */
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

      /* Payments section */
      .payments-section {
        margin-top: var(--s-32);
        padding-top: var(--s-32);
        border-top: 2px solid var(--grey-200);
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
        background: var(--neutral-0, white);
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
      .text-success {
        color: var(--semantic-green-700) !important;
      }
      .text-warning {
        color: var(--semantic-yellow-700) !important;
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

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
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
      .text-right {
        text-align: right;
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

      /* Workflow hint */
      .workflow-hint {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: var(--s-8);
        font-style: italic;
        text-align: center;
      }

      .mt-8 {
        margin-top: var(--s-8);
      }

      /* Conformidad */
      .conformidad-status {
        display: flex;
        align-items: flex-start;
        gap: var(--s-12);
        padding: var(--s-12);
        border-radius: var(--radius-sm);

        i {
          font-size: 20px;
          margin-top: 2px;
        }
        strong {
          display: block;
          margin-bottom: 4px;
        }
        p {
          font-size: 12px;
          margin: 0;
        }
      }

      .conformidad-ok {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .conformidad-pending {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .conformidad-obs {
        font-style: italic;
        margin-top: 4px !important;
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

      .no-discount-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: var(--grey-100);
        color: var(--grey-500);
        font-weight: 600;
      }

      .calc-badge {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: #dbeafe;
        color: #1d4ed8;
        font-weight: 600;
      }

      .discount-event-item .btn-action {
        position: absolute;
        top: 4px;
        right: 4px;
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

      .btn-action-danger {
        color: var(--semantic-red-500);

        &:hover {
          background: var(--semantic-red-50);
        }
      }

      .empty-docs {
        font-size: 13px;
        color: var(--grey-500);
        text-align: center;
        padding: 8px;
      }

      /* Payment docs */
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

      /* Modals */
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

        label {
          display: block;
          margin-bottom: var(--s-8);
          font-weight: 500;
          color: var(--grey-700);
          font-size: 14px;
        }
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
    `,
  ],
})
export class ValuationDetailComponent implements OnInit {
  private valuationService = inject(ValuationService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  paymentService = inject(PaymentService); // public for template access

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
  newDiscountEvent: {
    fecha: string;
    tipo: string;
    subtipo: string;
    horas_descuento: number;
    dias_descuento: number;
    horas_horometro_mecanica: number | null;
    descripcion: string;
  } = {
    fecha: new Date().toISOString().split('T')[0],
    tipo: '',
    subtipo: '',
    horas_descuento: 0,
    dias_descuento: 0,
    horas_horometro_mecanica: null,
    descripcion: '',
  };
  discountTypeOptions: DropdownOption[] = [
    { label: 'Avería', value: 'AVERIA' },
    { label: 'Stand By', value: 'STAND_BY' },
    { label: 'Climático', value: 'CLIMATICO' },
    { label: 'Otro', value: 'OTRO' },
  ];
  discountSubtipoMap: Record<string, DropdownOption[]> = {
    STAND_BY: [
      { label: 'Domingo (sin descuento)', value: 'DOMINGO' },
      { label: 'Feriado (1 día completo)', value: 'FERIADO' },
      { label: 'Falta de frente (sin descuento)', value: 'FALTA_DE_FRENTE' },
    ],
    AVERIA: [
      { label: 'Por arrendador (<5h proporcional, ≥5h día completo)', value: 'ARRENDADOR' },
      { label: 'Por arrendatario (sin descuento)', value: 'ARRENDATARIO' },
      { label: 'Mecánica (proporcional por horómetro)', value: 'MECANICA' },
    ],
    CLIMATICO: [
      { label: 'Total (1 día completo)', value: 'TOTAL' },
      { label: 'Parcial (proporcional)', value: 'PARCIAL' },
    ],
  };

  get currentSubtipoOptions(): DropdownOption[] {
    return this.discountSubtipoMap[this.newDiscountEvent.tipo] || [];
  }

  get showHorasHorometro(): boolean {
    return this.newDiscountEvent.tipo === 'AVERIA' && this.newDiscountEvent.subtipo === 'MECANICA';
  }

  get showHorasDescuento(): boolean {
    const { tipo, subtipo } = this.newDiscountEvent;
    if (
      tipo === 'STAND_BY' &&
      (subtipo === 'FERIADO' || subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')
    )
      return false;
    if (tipo === 'CLIMATICO' && subtipo === 'TOTAL') return false;
    if (tipo === 'AVERIA' && (subtipo === 'ARRENDATARIO' || subtipo === 'MECANICA')) return false;
    return true;
  }

  onDiscountTipoChange(): void {
    this.newDiscountEvent.subtipo = '';
    this.newDiscountEvent.horas_horometro_mecanica = null;
    this.newDiscountEvent.horas_descuento = 0;
    this.newDiscountEvent.dias_descuento = 0;
  }

  onDiscountSubtipoChange(): void {
    const { tipo, subtipo } = this.newDiscountEvent;
    // SIN DESCUENTO subtypes — lock to 0
    const sinDescuento =
      (tipo === 'STAND_BY' && (subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')) ||
      (tipo === 'AVERIA' && subtipo === 'ARRENDATARIO');
    // 1 DÍA COMPLETO subtypes — auto-set to 1
    const unDiaCompleto =
      (tipo === 'STAND_BY' && subtipo === 'FERIADO') ||
      (tipo === 'CLIMATICO' && subtipo === 'TOTAL');

    if (sinDescuento) {
      this.newDiscountEvent.dias_descuento = 0;
      this.newDiscountEvent.horas_descuento = 0;
    } else if (unDiaCompleto) {
      this.newDiscountEvent.dias_descuento = 1;
      this.newDiscountEvent.horas_descuento = 0;
    } else {
      this.newDiscountEvent.dias_descuento = 0;
    }
    this.newDiscountEvent.horas_horometro_mecanica = null;
  }

  onHorasDescuentoChange(): void {
    const { tipo, subtipo, horas_descuento } = this.newDiscountEvent;
    // AVERIA:ARRENDADOR — auto-apply ≥5h = 1 día completo rule
    if (tipo === 'AVERIA' && subtipo === 'ARRENDADOR') {
      if ((horas_descuento || 0) >= 5) {
        this.newDiscountEvent.dias_descuento = 1;
      } else {
        this.newDiscountEvent.dias_descuento = 0;
      }
    }
  }

  get discountRuleBadge(): { text: string; cls: string; icon: string } | null {
    const { tipo, subtipo } = this.newDiscountEvent;
    if (!subtipo) return null;
    const sinDescuento =
      (tipo === 'STAND_BY' && (subtipo === 'DOMINGO' || subtipo === 'FALTA_DE_FRENTE')) ||
      (tipo === 'AVERIA' && subtipo === 'ARRENDATARIO');
    const unDiaCompleto =
      (tipo === 'STAND_BY' && subtipo === 'FERIADO') ||
      (tipo === 'CLIMATICO' && subtipo === 'TOTAL');
    if (sinDescuento)
      return {
        text: 'Sin descuento aplicable — no afecta la valorización',
        cls: 'alert-info',
        icon: 'fa-info-circle',
      };
    if (unDiaCompleto)
      return {
        text: '1 día completo de descuento aplicado automáticamente',
        cls: 'alert-warning',
        icon: 'fa-calendar-day',
      };
    if (tipo === 'AVERIA' && subtipo === 'ARRENDADOR')
      return {
        text: 'Regla: < 5h proporcional / ≥ 5h = 1 día completo',
        cls: 'alert-info',
        icon: 'fa-ruler',
      };
    return null;
  }

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

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-file-invoice-dollar',
      title:
        'Valorización ' + (this.valuation?.numeroValorizacion || '#' + (this.valuation?.id || '')),
      subtitle: this.valuation?.periodo || 'Período no definido',
      statusLabel: this.valuation?.estado || 'BORRADOR',
      statusClass: this.getStatusClass(this.valuation?.estado || 'BORRADOR'),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        { date: this.valuation?.updatedAt, label: 'Última actualización' },
        { date: this.valuation?.createdAt, label: 'Valorización creada' },
      ],
    };
  }

  notFoundConfig: NotFoundConfig = {
    icon: 'fa-solid fa-file-invoice-dollar',
    title: 'Valorización no encontrada',
    message: 'La valorización que buscas no existe o ha sido eliminada.',
    backLabel: 'Volver a la lista',
    backRoute: '/equipment/valuations',
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

  private getUserRoles(): string[] {
    const user = this.authService.currentUser;
    if (user?.roles && Array.isArray(user.roles)) {
      return user.roles;
    }
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

  getStatusClass(estado: string): string {
    switch (estado) {
      case 'APROBADO':
      case 'PAGADO':
        return 'status-APROBADO';
      case 'PENDIENTE':
      case 'EN_REVISION':
      case 'VALIDADO':
        return 'status-PENDIENTE';
      case 'RECHAZADO':
      case 'ELIMINADO':
        return 'status-CANCELADO';
      default:
        return 'status-BORRADOR';
    }
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
    this.confirmSvc
      .confirm({
        title: 'Marcar como Pendiente',
        message: '¿Deseas marcar esta valorización como pendiente para iniciar el proceso?',
        icon: 'fa-circle-question',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.submitDraft(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización marcada como pendiente', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  submitForReview(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Enviar a Revisión',
        message: '¿Deseas enviar esta valorización a revisión?',
        icon: 'fa-paper-plane',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.submitForReview(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización enviada a revisión exitosamente', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al enviar a revisión: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmApprove(): void {
    if (!this.valuation || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.approve(this.valuation.id).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showApproveModal = false;
        this.snackBar.open('Valorización aprobada exitosamente', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open('Error al aprobar: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
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
        this.snackBar.open('Valorización rechazada', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open('Error al rechazar: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
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
        this.snackBar.open('Valorización marcada como pagada exitosamente', 'Cerrar', {
          duration: 3000,
        });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open(
          'Error al marcar como pagado: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  confirmValidate(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Validar Valorización',
        message: '¿Deseas validar esta valorización?',
        icon: 'fa-clipboard-check',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.validate(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización validada exitosamente', 'Cerrar', { duration: 3000 });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al validar: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmReopen(): void {
    if (!this.valuation || this.processingWorkflow) return;
    this.confirmSvc
      .confirm({
        title: 'Reabrir Valorización',
        message: '¿Deseas reabrir esta valorización para corrección? Volverá al estado Borrador.',
        icon: 'fa-rotate-left',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.processingWorkflow = true;
          this.valuationService.reopen(this.valuation!.id).subscribe({
            next: () => {
              this.processingWorkflow = false;
              this.snackBar.open('Valorización reabierta como borrador', 'Cerrar', {
                duration: 3000,
              });
              this.loadValuation(this.valuation!.id);
            },
            error: (err) => {
              this.processingWorkflow = false;
              this.snackBar.open(
                'Error al reabrir: ' + (err.error?.error?.message || err.message),
                'Cerrar',
                { duration: 5000 }
              );
            },
          });
        }
      });
  }

  confirmConformidad(): void {
    if (!this.valuation || !this.conformidadData.fecha || this.processingWorkflow) return;

    this.processingWorkflow = true;
    this.valuationService.registerConformidad(this.valuation.id, this.conformidadData).subscribe({
      next: () => {
        this.processingWorkflow = false;
        this.showConformidadModal = false;
        this.snackBar.open('Conformidad del proveedor registrada', 'Cerrar', { duration: 3000 });
        this.loadValuation(this.valuation!.id);
      },
      error: (err) => {
        this.processingWorkflow = false;
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
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

  recalculate(): void {
    if (!this.valuation || this.recalculating) return;
    this.recalculating = true;
    this.valuationService.recalculate(this.valuation.id).subscribe({
      next: (updated) => {
        this.valuation = updated;
        this.recalculating = false;
        this.loadSummary(this.valuation!.id);
        this.snackBar.open('Valorización recalculada exitosamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        this.recalculating = false;
        this.snackBar.open(
          'Error al recalcular: ' + (err.error?.error?.message || err.message),
          'Cerrar',
          { duration: 5000 }
        );
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
        this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
          duration: 5000,
        });
      },
    });
  }

  removeDiscountEvent(eventId: number): void {
    this.confirmSvc.confirmDelete('este evento de descuento').subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.deleteDiscountEvent(eventId).subscribe({
          next: () => {
            this.loadDiscountEvents(this.valuation!.id);
            this.snackBar.open('Evento eliminado', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            this.snackBar.open('Error: ' + (err.error?.error?.message || err.message), 'Cerrar', {
              duration: 5000,
            });
          },
        });
      }
    });
  }

  private resetDiscountEventForm(): void {
    this.newDiscountEvent = {
      fecha: new Date().toISOString().split('T')[0],
      tipo: '',
      subtipo: '',
      horas_descuento: 0,
      dias_descuento: 0,
      horas_horometro_mecanica: null,
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
        this.snackBar.open('Error al descargar el PDF', 'Cerrar', { duration: 5000 });
      },
    });
  }

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
    this.confirmSvc.confirmDelete(`la valorización ${this.valuation.numeroValorizacion}`).subscribe((confirmed) => {
      if (confirmed) {
        this.valuationService.delete(this.valuation!.id).subscribe({
          next: () => {
            this.router.navigate(['/equipment/valuations']);
            this.snackBar.open('Valorización eliminada', 'Cerrar', { duration: 3000 });
          },
          error: (err) => {
            console.error('Error deleting valuation', err);
            this.snackBar.open(
              'Error al eliminar: ' + (err.error?.error?.message || err.message),
              'Cerrar',
              { duration: 5000 }
            );
          },
        });
      }
    });
  }
}
