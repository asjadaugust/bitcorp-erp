import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ContractService } from '../../core/services/contract.service';
import { Contract } from '../../core/models/contract.model';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ContractAddendumDialogComponent } from './components/contract-addendum-dialog/contract-addendum-dialog.component';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, MatDialogModule],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles del contrato...</p>
        </div>

        <div *ngIf="!loading && contract" class="detail-grid">
          <!-- Main Column -->
          <div class="detail-main card">
            <!-- Header (Inside Main Card) -->
            <div class="detail-header">
              <div>
                <h1>Contrato {{ contract.code }}</h1>
                <p class="text-subtitle">
                  {{ contract.client_name }}
                </p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-APROBADO]="contract.status === 'ACTIVO'"
                  [class.status-PENDIENTE]="
                    contract.status === 'PENDIENTE' || contract.status === 'BORRADOR'
                  "
                  [class.status-CANCELADO]="
                    contract.status === 'FINALIZADO' || contract.status === 'RESCINDIDO'
                  "
                  [class.status-VENCIDO]="contract.status === 'VENCIDO'"
                >
                  {{ contract.status }}
                </span>
              </div>
            </div>

            <!-- Key Info Grid (Header) -->
            <div class="info-grid four-cols mb-6 border-b border-grey-100 pb-6">
              <div class="info-item">
                <label>Fecha Inicio</label>
                <p>{{ contract.start_date | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <label>Fecha Fin</label>
                <p>{{ contract.end_date | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <label>Monto Total</label>
                <p class="font-medium text-lg">
                  {{ contract.total_amount | currency: 'USD' }}
                </p>
              </div>
              <div class="info-item">
                <label>Tipo</label>
                <p>{{ contract.contract_type || 'Alquiler' }}</p>
              </div>
            </div>

            <div class="detail-sections">
              <!-- Termination Alert Section (if applicable) -->
              <section *ngIf="contract.termination_date" class="detail-section termination-section">
                <div class="alert alert-danger bg-red-50 border border-red-200 rounded-md p-4">
                  <div class="flex items-start">
                    <i class="fa-solid fa-circle-exclamation text-red-600 mt-1 mr-3"></i>
                    <div>
                      <h3 class="text-red-800 font-semibold text-sm">Contrato Rescindido</h3>
                      <p class="text-red-700 text-sm mt-1">
                        Este contrato fue rescindido el
                        {{ contract.termination_date | date: 'longDate' }}.
                      </p>
                      <p *ngIf="contract.termination_reason" class="text-red-700 text-sm mt-1">
                        <strong>Motivo:</strong> {{ contract.termination_reason }}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              <!-- Equipment Info -->
              <section class="detail-section">
                <h2>Equipo Asignado</h2>
                <div class="info-grid four-cols">
                  <div class="info-item">
                    <label>Código</label>
                    <p class="font-medium">
                      <a
                        [routerLink]="['/equipment', contract.equipment_id]"
                        class="text-primary-600 hover:underline"
                      >
                        {{ contract.equipment?.codigo_equipo || '-' }}
                      </a>
                    </p>
                  </div>
                  <div class="info-item">
                    <label>Marca/Modelo</label>
                    <p>{{ contract.equipment?.marca }} {{ contract.equipment?.modelo }}</p>
                  </div>
                  <div class="info-item">
                    <label>Serie</label>
                    <p>{{ contract.equipment?.numero_serie_equipo || '-' }}</p>
                  </div>
                  <div class="info-item">
                    <label>Ubicación</label>
                    <p>{{ contract.location || 'No especificada' }}</p>
                  </div>
                </div>
              </section>

              <!-- Contract Details -->
            </div>

            <!-- Annex A -->
            <div class="detail-section" *ngIf="annexA.length > 0">
              <h2>ANEXO A — Inclusiones de Tarifa</h2>
              <div class="table-container">
                <table class="annex-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Concepto</th>
                      <th>Incluido</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of annexA; let i = index">
                      <td>{{ i + 1 }}</td>
                      <td>{{ item.concepto }}</td>
                      <td>
                        <span [class]="item.incluido ? 'badge-yes' : 'badge-no'">
                          {{ item.incluido ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td>{{ item.observaciones || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Annex B -->
            <div class="detail-section" *ngIf="annexB.length > 0">
              <h2>ANEXO B — Condiciones de Valorización</h2>
              <div class="table-container">
                <table class="annex-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Concepto</th>
                      <th>Incluido</th>
                      <th>Observaciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let item of annexB; let i = index">
                      <td>{{ i + 1 }}</td>
                      <td>{{ item.concepto }}</td>
                      <td>
                        <span [class]="item.incluido ? 'badge-yes' : 'badge-no'">
                          {{ item.incluido ? 'Sí' : 'No' }}
                        </span>
                      </td>
                      <td>{{ item.observaciones || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Property & Jurisdiction -->
            <div
              class="detail-section"
              *ngIf="contract.documento_acredita || contract.jurisdiccion || contract.plazo_texto"
            >
              <h2>Propiedad y Jurisdicción</h2>
              <div class="info-grid three-cols">
                <div class="info-item" *ngIf="contract.documento_acredita">
                  <label>Documento que Acredita</label>
                  <p>{{ contract.documento_acredita }}</p>
                </div>
                <div class="info-item" *ngIf="contract.fecha_acreditada">
                  <label>Fecha Acreditada</label>
                  <p>
                    {{ contract.fecha_acreditada | date: 'dd/MM/yyyy' }}
                  </p>
                </div>
                <div class="info-item" *ngIf="contract.jurisdiccion">
                  <label>Jurisdicción</label>
                  <p>{{ contract.jurisdiccion }}</p>
                </div>
                <div class="info-item" *ngIf="contract.plazo_texto">
                  <label>Plazo</label>
                  <p>{{ contract.plazo_texto }}</p>
                </div>
              </div>
            </div>

            <!-- Special Conditions -->
            <div class="card" *ngIf="contract.condiciones_especiales">
              <div class="detail-section">
                <h2><i class="fa-solid fa-circle-exclamation"></i> Condiciones Especiales</h2>
              </div>
              <div class="text-content">
                <p>{{ contract.condiciones_especiales }}</p>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-sidebar">
            <!-- Quick Actions -->
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button class="btn btn-primary btn-block" (click)="editContract()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button class="btn btn-secondary btn-block" (click)="viewAddendums()">
                  <i class="fa-solid fa-file-signature"></i> Ver Adendas
                </button>
                <button class="btn btn-secondary btn-block" (click)="downloadPDF()">
                  <i class="fa-solid fa-file-pdf"></i> Descargar PDF
                </button>
                <button class="btn btn-ghost btn-block" routerLink="/equipment/contracts">
                  <i class="fa-solid fa-arrow-left"></i> Cancelar
                </button>
                <button class="btn btn-danger btn-block" (click)="deleteContract()">
                  <i class="fa-solid fa-trash"></i> Eliminar
                </button>
              </div>
            </div>

            <!-- Required Docs -->
            <div class="card" *ngIf="requiredDocs.length > 0">
              <h3 class="sidebar-title">Documentos Requeridos</h3>
              <div class="required-docs-list">
                <div class="req-doc-item" *ngFor="let doc of requiredDocs">
                  <div class="req-doc-header">
                    <span class="req-doc-type">{{ translateDocType(doc.tipo_documento) }}</span>
                    <span [class]="'req-doc-badge req-doc-' + doc.estado.toLowerCase()">
                      {{ doc.estado }}
                    </span>
                  </div>
                  <div class="req-doc-meta" *ngIf="doc.fecha_vencimiento">
                    Vence: {{ doc.fecha_vencimiento | date: 'dd/MM/yyyy' }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Validity & Dates -->
            <div class="card">
              <h3 class="sidebar-title">Vigencia</h3>
              <div class="info-list">
                <div class="info-list-item">
                  <label>Fecha Contrato</label>
                  <span>{{ contract.fecha_contrato | date: 'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-list-item">
                  <label>Fecha Inicio</label>
                  <span>{{ contract.fecha_inicio | date: 'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-list-item">
                  <label>Fecha Fin</label>
                  <span>{{ contract.fecha_fin | date: 'dd/MM/yyyy' }}</span>
                </div>
                <div class="info-list-item">
                  <label>Días Restantes</label>
                  <span [class.text-warning]="isExpiring(contract.fecha_fin)">
                    {{ getDaysRemaining(contract.fecha_fin) }} días
                  </span>
                </div>
              </div>
            </div>

            <!-- System Info -->
            <div class="card">
              <h3 class="sidebar-title">Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-date">
                      {{ contract.updated_at | date: 'short' }}
                    </div>
                    <div class="timeline-text">Última actualización</div>
                  </div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <div class="timeline-date">
                      {{ contract.created_at | date: 'short' }}
                    </div>
                    <div class="timeline-text">Contrato creado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !contract" class="empty-state card">
          <i class="fa-solid fa-file-contract"></i>
          <h3>Contrato no encontrado</h3>
          <p>El contrato que buscas no existe o ha sido eliminado.</p>
          <button class="btn btn-primary" routerLink="/equipment/contracts">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <div *ngIf="showDeleteModal" class="modal-overlay" (click)="showDeleteModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>Confirmar Eliminación</h2>
          <button class="btn-icon close-btn" (click)="showDeleteModal = false">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            ¿Estás seguro de que deseas eliminar el contrato
            <strong>{{ contract?.numero_contrato }}</strong
            >?
          </p>
          <div class="alert alert-warning">
            <i class="fa-solid fa-exclamation-triangle"></i>
            Esta acción no se puede deshacer.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="showDeleteModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmDelete()">Eliminar Contrato</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .detail-container {
        min-height: 100vh;
        background: #f5f5f5;
        padding: 1.5rem 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1rem;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 1.5rem;
      }

      @media (max-width: 968px) {
        .detail-grid {
          grid-template-columns: 1fr;
        }
      }

      .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .detail-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .detail-header h1 {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin: 0 0 0.25rem 0;
      }

      .text-subtitle {
        font-size: 1rem;
        color: #6b7280;
        margin: 0;
      }

      .detail-status {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .status-active,
      .status-APROBADO,
      .status-ACTIVO {
        background-color: #d1fae5;
        color: #065f46;
      }

      .status-pending,
      .status-PENDIENTE,
      .status-BORRADOR {
        background-color: #fef3c7;
        color: #92400e;
      }

      .status-cancelled,
      .status-CANCELADO,
      .status-RESCINDIDO,
      .status-FINALIZADO {
        background-color: #fee2e2;
        color: #991b1b;
      }

      .status-expired,
      .status-VENCIDO {
        background-color: #fee2e2;
        color: #991b1b;
      }

      .info-grid {
        display: grid;
        gap: 1.5rem;
        margin-bottom: 1.5rem;
      }

      .info-grid.four-cols {
        grid-template-columns: repeat(4, 1fr);
      }

      .info-grid.three-cols {
        grid-template-columns: repeat(3, 1fr);
      }

      .info-grid.two-cols {
        grid-template-columns: repeat(2, 1fr);
      }

      @media (max-width: 768px) {
        .info-grid.four-cols,
        .info-grid.three-cols,
        .info-grid.two-cols {
          grid-template-columns: 1fr 1fr;
        }
      }

      .info-item label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.25rem;
      }

      .info-item p {
        margin: 0;
        font-size: 1rem;
        color: #111827;
        font-weight: 400;
      }

      .info-item p.font-medium {
        font-weight: 500;
      }

      .info-item p.text-lg {
        font-size: 1.125rem;
      }

      .hover\:underline:hover {
        text-decoration: underline;
      }

      .detail-section {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
      }

      .detail-section:first-child {
        margin-top: 0;
        padding-top: 0;
        border-top: none;
      }

      .detail-section h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
      }

      .table-container {
        overflow-x: auto;
      }

      .annex-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;
      }

      .annex-table th {
        text-align: left;
        padding: 0.75rem 1rem;
        background-color: #f9fafb;
        color: #6b7280;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e5e7eb;
      }

      .annex-table td {
        padding: 0.75rem 1rem;
        border-bottom: 1px solid #e5e7eb;
        color: #111827;
      }

      .badge-yes {
        background-color: #d1fae5;
        color: #065f46;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .badge-no {
        background-color: #f3f4f6;
        color: #6b7280;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 500;
      }

      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .sidebar-card-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
      }

      .sidebar-title {
        font-size: 1rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 1rem 0;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.2s;
        gap: 0.5rem;
      }

      .btn-block {
        width: 100%;
        margin-bottom: 0.5rem;
      }

      .btn-primary {
        background-color: #2563eb;
        color: white;
      }

      .btn-primary:hover {
        background-color: #1d4ed8;
      }

      .btn-secondary {
        background-color: #ffffff;
        border-color: #d1d5db;
        color: #374151;
      }

      .btn-secondary:hover {
        background-color: #f9fafb;
      }

      .btn-danger {
        background-color: #dc2626;
        color: white;
      }

      .btn-danger:hover {
        background-color: #b91c1c;
      }

      .btn-warning {
        background-color: #d97706;
        color: white;
      }

      .btn-warning:hover {
        background-color: #b45309;
      }

      .btn-ghost {
        background-color: transparent;
        color: #6b7280;
      }

      .btn-ghost:hover {
        background-color: #f3f4f6;
        color: #374151;
      }

      /* Utilities */
      .mt-6 {
        margin-top: 1.5rem;
      }
      .mb-6 {
        margin-bottom: 1.5rem;
      }
      .mb-4 {
        margin-bottom: 1rem;
      }
      .border-b {
        border-bottom-width: 1px;
      }
      .border-grey-100 {
        border-color: #f3f4f6;
      }
      .pb-6 {
        padding-bottom: 1.5rem;
      }
      .mr-1 {
        margin-right: 0.25rem;
      }
      .mr-3 {
        margin-right: 0.75rem;
      }
      .text-muted {
        color: #9ca3af;
      }
      .text-primary-600 {
        color: #2563eb;
      }
      .font-semibold {
        font-weight: 600;
      }
      .text-sm {
        font-size: 0.875rem;
      }
      .p-4 {
        padding: 1rem;
      }
      .rounded-md {
        border-radius: 0.375rem;
      }
      .flex {
        display: flex;
      }
      .items-start {
        align-items: flex-start;
      }

      .empty-state-section {
        text-align: center;
        padding: 2rem;
        color: #6b7280;
        background: #f9fafb;
        border-radius: 0.5rem;
      }

      .empty-state-section i {
        font-size: 2rem;
        margin-bottom: 0.75rem;
        color: #d1d5db;
      }

      .text-content {
        max-width: 80ch;
        line-height: 1.6;
        color: #374151;
      }

      /* Required Docs Styles */
      .required-docs-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .req-doc-item {
        padding: 0.75rem;
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        background: white;
      }

      .req-doc-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.25rem;
        gap: 0.5rem;
      }

      .req-doc-type {
        font-weight: 500;
        font-size: 0.875rem;
        color: #374151;
      }

      .req-doc-badge {
        font-size: 0.75rem;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        font-weight: 500;
      }

      .req-doc-vigente,
      .req-doc-active {
        background-color: #d1fae5;
        color: #065f46;
      }

      .req-doc-vencido,
      .req-doc-expired {
        background-color: #fee2e2;
        color: #991b1b;
      }

      .req-doc-por_vencer,
      .req-doc-warning {
        background-color: #fef3c7;
        color: #92400e;
      }

      .req-doc-meta {
        font-size: 0.75rem;
        color: #6b7280;
      }

      /* Info List for Validity */
      .info-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .info-list-item {
        display: flex;
        flex-direction: column;
      }

      .info-list-item label {
        font-size: 0.75rem;
        color: #6b7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.125rem;
      }

      .info-list-item span {
        font-size: 0.875rem;
        color: #111827;
        font-weight: 500;
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: 0.5rem;
        width: 90%;
        max-width: 500px;
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.1),
          0 2px 4px -1px rgba(0, 0, 0, 0.06);
        display: flex;
        flex-direction: column;
      }

      .modal-header {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        margin: 0;
      }

      .modal-body {
        padding: 1.5rem;
      }

      .modal-footer {
        padding: 1rem 1.5rem;
        background-color: #f9fafb;
        border-top: 1px solid #e5e7eb;
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        border-bottom-left-radius: 0.5rem;
        border-bottom-right-radius: 0.5rem;
      }

      .btn-icon {
        background: transparent;
        border: none;
        color: #9ca3af;
        cursor: pointer;
        font-size: 1.25rem;
      }

      .btn-icon:hover {
        color: #6b7280;
      }

      /* Loading State */
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem;
        color: #6b7280;
      }

      .spinner {
        border: 3px solid #e5e7eb;
        border-top: 3px solid #2563eb;
        border-radius: 50%;
        width: 2rem;
        height: 2rem;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      /* Alert Styles */
      .alert {
        padding: 1rem;
        border-radius: 0.375rem;
        margin-bottom: 1rem;
        display: flex;
        gap: 0.75rem;
      }

      .alert-warning {
        background-color: #fffbeb;
        color: #92400e;
        border: 1px solid #fcd34d;
      }

      .alert-danger {
        background-color: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }
    `,
  ],
})
export class ContractDetailComponent implements OnInit {
  private contractService = inject(ContractService);
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private dialog = inject(MatDialog);

  contract: Contract | null = null;
  loading = true;
  showDeleteModal = false;
  annexA: any[] = [];
  annexB: any[] = [];
  requiredDocs: any[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadContract(id);
  }

  loadContract(id: string): void {
    this.loading = true;
    this.contractService.getById(id).subscribe({
      next: (data) => {
        this.contract = data;
        this.loading = false;
        this.loadAnnexes(id);
        this.loadRequiredDocs(id);
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadAnnexes(id: string): void {
    this.contractService.getAnnexes(id, 'A').subscribe({
      next: (items) => (this.annexA = items),
    });
    this.contractService.getAnnexes(id, 'B').subscribe({
      next: (items) => (this.annexB = items),
    });
  }

  loadRequiredDocs(id: string): void {
    this.contractService.getRequiredDocuments(id).subscribe({
      next: (docs) => (this.requiredDocs = docs),
    });
  }

  translateDocType(tipo: string): string {
    const map: Record<string, string> = {
      POLIZA_TREC: 'Póliza TREC',
      SOAT: 'SOAT',
      INSPECCION_TECNICA: 'Inspección Técnica',
      TARJETA_PROPIEDAD: 'Tarjeta de Propiedad',
      LICENCIA_CONDUCIR: 'Licencia de Conducir',
    };
    return map[tipo] || tipo;
  }

  editContract(): void {
    if (this.contract) {
      this.router.navigate(['/equipment/contracts', this.contract.id.toString(), 'edit']);
    }
  }

  confirmDelete(): void {
    if (this.contract) {
      this.contractService.delete(this.contract.id.toString()).subscribe({
        next: () => {
          this.router.navigate(['/equipment/contracts']);
        },
        error: (error) => {
          console.error('Failed to delete contract:', error);
          this.showDeleteModal = false;
        },
      });
    }
  }

  deleteContract(): void {
    this.showDeleteModal = true;
  }

  viewAddendums(): void {
    if (!this.contract) return;

    const dialogRef = this.dialog.open(ContractAddendumDialogComponent, {
      width: '500px',
      data: {
        contractId: this.contract.id.toString(),
        currentEndDate: this.contract.fecha_fin,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && this.contract) {
        this.contractService.createAddendum(this.contract.id.toString(), result).subscribe({
          next: () => {
            this.loadContract(this.contract!.id.toString()); // Reload to show updated end date
            alert('Adenda creada exitosamente');
          },
          error: (err) => console.error('Error creating addendum', err),
        });
      }
    });
  }

  downloadPDF(): void {
    if (!this.contract) return;

    this.contractService.downloadPdf(this.contract.id.toString()).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Contrato-${this.contract?.numero_contrato}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error downloading PDF', err);
        alert('Error al descargar el PDF. Asegúrese de que el backend soporte esta funcionalidad.');
      },
    });
  }

  isExpiring(dateStr: string): boolean {
    if (!dateStr) return false;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  }

  getDaysRemaining(dateStr: string): number {
    if (!dateStr) return 0;
    const endDate = new Date(dateStr);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatusLabel(estado: string): string {
    const labelMap: { [key: string]: string } = {
      BORRADOR: 'Borrador',
      ACTIVO: 'Activo',
      VENCIDO: 'Vencido',
      CANCELADO: 'Cancelado',
    };
    return labelMap[estado] || estado;
  }
}
