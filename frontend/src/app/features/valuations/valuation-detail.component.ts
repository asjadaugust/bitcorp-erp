import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation, PaymentData } from '../../core/models/valuation.model';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PaymentRecordList, PaymentSummary } from '../../core/models/payment-record.model';

@Component({
  selector: 'app-valuation-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div class="breadcrumb">
          <a routerLink="/equipment/valuations" class="breadcrumb-link"
            >← Volver a Valorizaciones</a
          >
        </div>

        <div *ngIf="loading" class="loading">
          <div class="spinner"></div>
          <p>Cargando detalles de la valorización...</p>
        </div>

        <div *ngIf="!loading && valuation" class="detail-grid">
          <div class="detail-main card">
            <div class="detail-header">
              <div>
                <h1>Valorización {{ valuation.invoice_number || '#' + valuation.id }}</h1>
                <p class="code-badge">{{ valuation.status | uppercase }}</p>
              </div>
            </div>

            <div class="detail-status">
              <span [class]="'status-badge status-' + valuation.status">
                {{
                  valuation.status === 'pending'
                    ? 'Pendiente'
                    : valuation.status === 'under_review'
                      ? 'En Revisión'
                      : valuation.status === 'approved'
                        ? 'Aprobado'
                        : valuation.status === 'rejected'
                          ? 'Rechazado'
                          : valuation.status === 'paid'
                            ? 'Pagado'
                            : valuation.status
                }}
              </span>
            </div>

            <div class="detail-sections">
              <section class="detail-section">
                <h2>Información del Contrato</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Contrato</label>
                    <p>{{ valuation.contract?.code || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Proyecto</label>
                    <p>{{ valuation.contract?.project_name || 'N/A' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Cliente</label>
                    <p>{{ valuation.contract?.client_name || 'N/A' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Detalles Financieros</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Monto Total</label>
                    <p class="highlight">{{ valuation.amount | currency: 'PEN' : 'S/ ' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Factura</label>
                    <p>{{ valuation.invoice_number || 'Pendiente' }}</p>
                  </div>
                  <div class="info-item" *ngIf="valuation.fecha_pago">
                    <label>Fecha de Pago</label>
                    <p>{{ valuation.fecha_pago | date: 'dd/MM/yyyy' }}</p>
                  </div>
                </div>
              </section>

              <section class="detail-section">
                <h2>Periodo</h2>
                <div class="info-grid">
                  <div class="info-item">
                    <label>Fecha Inicio</label>
                    <p>{{ valuation.period_start | date: 'dd/MM/yyyy' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Fecha Fin</label>
                    <p>{{ valuation.period_end | date: 'dd/MM/yyyy' }}</p>
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
                    *ngIf="valuation.status === 'approved' || valuation.status === 'paid'"
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
                              'badge badge-' + paymentService.getPaymentStatusColor(payment.estado)
                            "
                          >
                            {{ paymentService.getPaymentStatusLabel(payment.estado) }}
                          </span>
                        </td>
                        <td>
                          <span
                            *ngIf="payment.conciliado"
                            class="badge badge-success conciliado-badge"
                          >
                            <i class="fa-solid fa-check"></i> Sí
                          </span>
                          <span *ngIf="!payment.conciliado" class="badge badge-warning"> No </span>
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
                    *ngIf="valuation.status === 'approved' || valuation.status === 'paid'"
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
            <!-- Workflow Actions -->
            <div class="card">
              <h3>Acciones de Workflow</h3>
              <div class="workflow-actions">
                <!-- Submit for Review: Only for PENDING state -->
                <button
                  *ngIf="valuation.status === 'pending' && canSubmitForReview()"
                  class="btn btn-primary btn-block"
                  (click)="submitForReview()"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-paper-plane"></i>
                  {{ processingWorkflow ? 'Enviando...' : 'Enviar a Revisión' }}
                </button>

                <!-- Approve: Only for UNDER_REVIEW state, Admin/Director/JefeEquipo only -->
                <button
                  *ngIf="valuation.status === 'under_review' && canApprove()"
                  class="btn btn-success btn-block"
                  (click)="showApproveModal = true"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-check"></i> Aprobar Valorización
                </button>

                <!-- Reject: For any state except PAID, Admin/Director/JefeEquipo only -->
                <button
                  *ngIf="valuation.status !== 'paid' && canReject()"
                  class="btn btn-danger btn-block"
                  (click)="showRejectModal = true"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-times"></i> Rechazar Valorización
                </button>

                <!-- Mark as Paid: Only for APPROVED state, Admin only -->
                <button
                  *ngIf="valuation.status === 'approved' && canMarkAsPaid()"
                  class="btn btn-secondary btn-block"
                  (click)="showMarkPaidModal = true"
                  [disabled]="processingWorkflow"
                >
                  <i class="fa-solid fa-money-bill"></i> Marcar como Pagado
                </button>

                <p class="workflow-hint" *ngIf="getWorkflowHint()">
                  {{ getWorkflowHint() }}
                </p>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card">
              <h3>Acciones Rápidas</h3>
              <div class="quick-actions">
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
                <button
                  class="btn btn-secondary btn-block"
                  (click)="editValuation()"
                  *ngIf="valuation.status === 'pending'"
                >
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
              </div>
            </div>

            <!-- Timeline -->
            <div class="card">
              <h3>Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item" *ngIf="valuation.fecha_pago">
                  <div class="timeline-date">{{ valuation.fecha_pago | date: 'short' }}</div>
                  <div class="timeline-content">Marcado como pagado</div>
                </div>
                <div class="timeline-item" *ngIf="valuation.approved_at">
                  <div class="timeline-date">{{ valuation.approved_at | date: 'short' }}</div>
                  <div class="timeline-content">Aprobado</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ valuation.created_at | date: 'short' }}</div>
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
            <p><strong>Factura:</strong> {{ valuation?.invoice_number || 'N/A' }}</p>
            <p><strong>Monto:</strong> {{ valuation?.amount | currency: 'PEN' : 'S/ ' }}</p>
            <p>
              <strong>Periodo:</strong> {{ valuation?.period_start | date: 'dd/MM/yyyy' }} -
              {{ valuation?.period_end | date: 'dd/MM/yyyy' }}
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
            <select [(ngModel)]="paymentData.metodo_pago" class="form-control" required>
              <option value="">Seleccionar...</option>
              <option value="Transferencia Bancaria">Transferencia Bancaria</option>
              <option value="Cheque">Cheque</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Letra">Letra</option>
              <option value="Otro">Otro</option>
            </select>
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

      .status-paid {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-paid::before {
        background: var(--grey-400);
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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: var(--s-24);
        border-radius: var(--radius-md);
        margin-bottom: var(--s-24);
        box-shadow: var(--shadow-md);
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
        opacity: 0.9;
      }

      .summary-value {
        font-size: 18px;
        font-weight: 600;
      }

      .payment-status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        background: rgba(255, 255, 255, 0.2);
      }

      .progress-bar-container {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: var(--s-8);
      }

      .progress-bar-fill {
        height: 100%;
        background: white;
        border-radius: 4px;
        transition: width 0.3s ease;
      }

      .progress-label {
        font-size: 12px;
        text-align: center;
        opacity: 0.9;
      }

      .text-success {
        color: #4ade80 !important;
      }

      .text-warning {
        color: #fbbf24 !important;
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
  loading = true;
  processingWorkflow = false;

  // Payment-related properties
  payments: PaymentRecordList[] = [];
  paymentSummary: PaymentSummary | null = null;
  paymentCount = 0;
  loadingPayments = false;

  // Modal states
  showApproveModal = false;
  showRejectModal = false;
  showMarkPaidModal = false;

  // Form data
  rejectReason = '';
  paymentData: PaymentData = {
    fecha_pago: new Date().toISOString().split('T')[0],
    metodo_pago: '',
    referencia_pago: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadValuation(id);
    this.loadPayments(id);
    this.loadPaymentSummary(id);
  }

  loadValuation(id: number): void {
    this.loading = true;
    this.valuationService.getById(id).subscribe({
      next: (data) => {
        this.valuation = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
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
    // Any user can submit for review
    return true;
  }

  canApprove(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'].includes(r));
  }

  canReject(): boolean {
    const roles = this.getUserRoles();
    return roles.some((r) => ['ADMIN', 'DIRECTOR', 'JEFE_EQUIPO'].includes(r));
  }

  canMarkAsPaid(): boolean {
    const roles = this.getUserRoles();
    return roles.includes('ADMIN');
  }

  getWorkflowHint(): string | null {
    if (!this.valuation) return null;

    const status = this.valuation.status;

    if (status === 'pending') {
      return 'Envía esta valorización a revisión para que pueda ser aprobada.';
    }
    if (status === 'under_review' && this.canApprove()) {
      return 'Esta valorización está en revisión y puede ser aprobada o rechazada.';
    }
    if (status === 'approved' && this.canMarkAsPaid()) {
      return 'Esta valorización ha sido aprobada y puede ser marcada como pagada.';
    }
    if (status === 'rejected') {
      return 'Esta valorización ha sido rechazada. Revisa las observaciones.';
    }
    if (status === 'paid') {
      return 'Esta valorización ya ha sido pagada.';
    }

    return null;
  }

  // Workflow actions
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
        link.download = `valorizacion-${this.valuation?.invoice_number || this.valuation?.id}.pdf`;
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
}
