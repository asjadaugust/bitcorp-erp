import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  ApprovalService,
  SolicitudAprobacionDto,
  AuditoriaItem,
} from '../../core/services/approval.service';
import { AuthService } from '../../core/services/auth.service';
import {
  EntityDetailShellComponent,
  EntityDetailSidebarCardComponent,
  EntityDetailHeader,
  AuditInfo,
} from '../../shared/components/entity-detail';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-approval-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
    ButtonComponent,
    AlertComponent,
  ],
  template: `
    <app-entity-detail-shell
      [loading]="loading()"
      [entity]="solicitud()"
      [header]="header"
      [auditInfo]="auditInfoObj"
    >
      <!-- Main Content -->
      <div entity-main-content>
        <!-- Error Alert -->
        <app-alert
          *ngIf="errorMsg()"
          type="error"
          [message]="errorMsg()"
          [dismissible]="true"
          (dismissed)="errorMsg.set('')"
        ></app-alert>

        <!-- Success Alert -->
        <app-alert
          *ngIf="successMsg()"
          type="success"
          [message]="successMsg()"
          [dismissible]="true"
          [autoDismiss]="true"
          [autoDismissDelay]="3000"
          (dismissed)="successMsg.set('')"
        ></app-alert>

        <!-- Estado Banner -->
        <div
          class="estado-banner"
          [class]="'estado-banner--' + (solicitud()?.estado ?? '').toLowerCase()"
        >
          <i class="fa-solid" [class]="getEstadoIcon(solicitud()?.estado ?? '')"></i>
          <strong>{{ solicitud()?.estado }}</strong>
          <span *ngIf="solicitud()?.fecha_completado">
            &mdash; {{ solicitud()!.fecha_completado | date: 'dd/MM/yyyy HH:mm' }}
          </span>
        </div>

        <!-- Description -->
        <div class="detail-section" *ngIf="solicitud()?.descripcion">
          <label>Descripción</label>
          <p>{{ solicitud()?.descripcion }}</p>
        </div>

        <!-- Entity Link (U4) -->
        <div class="detail-section" *ngIf="entityRoute()">
          <a [routerLink]="entityRoute()" class="entity-link">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            Ver registro original
          </a>
        </div>

        <!-- Approval Chain -->
        <div class="detail-section">
          <label>Cadena de Aprobación</label>
          <div class="chain-visual">
            <div
              *ngFor="let paso of solicitud()?.pasos; let i = index"
              class="chain-node"
              [class.chain-node--done]="paso.estado_paso === 'APROBADO'"
              [class.chain-node--active]="
                paso.paso_numero === solicitud()?.paso_actual && solicitud()?.estado !== 'APROBADO'
              "
              [class.chain-node--rejected]="paso.estado_paso === 'RECHAZADO'"
            >
              <div class="chain-circle">
                <i
                  class="fa-solid"
                  [class.fa-check]="paso.estado_paso === 'APROBADO'"
                  [class.fa-xmark]="paso.estado_paso === 'RECHAZADO'"
                  [class.fa-ellipsis]="paso.estado_paso === 'PENDIENTE'"
                ></i>
              </div>
              <div class="chain-info">
                <span class="chain-step-num">
                  {{ paso.nombre_paso || 'Paso ' + paso.paso_numero }}
                </span>
                <span class="chain-step-role" *ngIf="paso.tipo_aprobador">
                  {{
                    paso.tipo_aprobador === 'ROLE'
                      ? paso.rol
                      : 'Usuario #' + paso.usuario_aprobador_id
                  }}
                </span>
                <span class="chain-state">{{ paso.estado_paso }}</span>
                <span class="chain-date" *ngIf="paso.accion_fecha">
                  {{ formatRelativeTime(paso.accion_fecha) }}
                </span>
                <span class="chain-comment" *ngIf="paso.comentario">"{{ paso.comentario }}"</span>
              </div>
              <div class="chain-connector" *ngIf="i < (solicitud()?.pasos?.length ?? 0) - 1"></div>
            </div>
          </div>
        </div>

        <!-- Action Form -->
        <div class="detail-section action-form" *ngIf="canAct()">
          <label>Acción</label>
          <textarea
            class="form-control"
            placeholder="Comentario (opcional para aprobar, requerido para rechazar)..."
            [(ngModel)]="comentario"
            rows="3"
          ></textarea>
          <div class="action-buttons">
            <app-button
              variant="danger-outline"
              icon="fa-xmark"
              label="Rechazar"
              [loading]="actionLoading"
              (clicked)="reject()"
            ></app-button>
            <app-button
              variant="success"
              icon="fa-check"
              label="Aprobar"
              [loading]="actionLoading"
              (clicked)="approve()"
            ></app-button>
          </div>
        </div>

        <!-- Cancel Action (U5) -->
        <div class="detail-section" *ngIf="canCancel()">
          <app-button
            variant="ghost"
            icon="fa-ban"
            label="Cancelar Solicitud"
            [loading]="cancelLoading"
            (clicked)="cancelRequest()"
          ></app-button>
        </div>
      </div>

      <!-- Sidebar Cards -->
      <app-entity-detail-sidebar-card
        entity-sidebar-after
        title="Información"
        icon="fa-info-circle"
      >
        <div class="info-rows">
          <div class="info-row">
            <span class="info-label">Módulo</span>
            <span class="module-chip module-chip--{{ solicitud()?.module_name }}">
              <i class="fa-solid" [class]="getModuleIcon(solicitud()?.module_name ?? '')"></i>
              {{ getModuleLabel(solicitud()?.module_name ?? '') }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Entity ID</span>
            <span class="info-value">#{{ solicitud()?.entity_id }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Paso actual</span>
            <span class="info-value">
              {{ solicitud()?.paso_actual_info?.nombre_paso || 'Paso ' + solicitud()?.paso_actual }}
            </span>
          </div>
          <div class="info-row" *ngIf="solicitud()?.paso_actual_info?.tipo_aprobador">
            <span class="info-label">Aprobador</span>
            <span class="info-value">
              {{
                solicitud()!.paso_actual_info!.tipo_aprobador === 'ROLE'
                  ? solicitud()!.paso_actual_info!.rol
                  : 'Usuario #' + solicitud()!.paso_actual_info!.usuario_aprobador_id
              }}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Versión plantilla</span>
            <span class="info-value">v{{ solicitud()?.plantilla_version }}</span>
          </div>
        </div>
      </app-entity-detail-sidebar-card>

      <app-entity-detail-sidebar-card
        entity-sidebar-after
        title="Historial de Auditoría"
        icon="fa-history"
      >
        <div *ngIf="auditTrail().length === 0" class="audit-empty">Sin registros</div>
        <div class="audit-timeline">
          <div *ngFor="let entry of auditTrail()" class="audit-entry">
            <div class="audit-dot" [class]="'audit-dot--' + entry.accion.toLowerCase()"></div>
            <div class="audit-content">
              <span class="audit-action">{{ formatAccion(entry.accion) }}</span>
              <span class="audit-time">{{ formatRelativeTime(entry.timestamp) }}</span>
              <span class="audit-comment" *ngIf="entry.comentario">{{ entry.comentario }}</span>
            </div>
          </div>
        </div>
      </app-entity-detail-sidebar-card>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .estado-banner {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        border-radius: var(--radius-md, 8px);
        margin-bottom: 20px;
        font-size: 0.9rem;
      }
      .estado-banner--pendiente {
        background: #fef3c7;
        color: #92400e;
      }
      .estado-banner--en_revision {
        background: #dbeafe;
        color: #1e40af;
      }
      .estado-banner--aprobado {
        background: #d1fae5;
        color: #065f46;
      }
      .estado-banner--rechazado {
        background: #fee2e2;
        color: #991b1b;
      }
      .estado-banner--cancelado {
        background: #f3f4f6;
        color: #374151;
      }

      .detail-section {
        margin-bottom: 24px;

        label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--grey-500, #6b7280);
          margin-bottom: 10px;
        }

        p {
          margin: 0;
          color: var(--grey-700, #374151);
        }
      }

      .entity-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--primary-700, #0057b8);
        text-decoration: none;
        font-size: 0.88rem;
        font-weight: 500;
        padding: 6px 12px;
        border-radius: 6px;
        background: var(--primary-50, #eff6ff);
        transition: background 0.15s ease;
      }
      .entity-link:hover {
        background: var(--primary-100, #dbeafe);
      }

      .chain-visual {
        display: flex;
        flex-direction: column;
        gap: 0;
      }

      .chain-node {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        position: relative;
        padding-bottom: 20px;

        &:last-child {
          padding-bottom: 0;
        }
      }
      .chain-node--done .chain-circle {
        background: #059669;
        border-color: #059669;
        color: white;
      }
      .chain-node--active .chain-circle {
        background: var(--primary-700, #0057b8);
        border-color: var(--primary-700);
        color: white;
      }
      .chain-node--rejected .chain-circle {
        background: #dc2626;
        border-color: #dc2626;
        color: white;
      }

      .chain-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid var(--grey-300, #d1d5db);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        color: var(--grey-400);
        flex-shrink: 0;
        background: white;
        position: relative;
        z-index: 1;
      }

      .chain-connector {
        position: absolute;
        left: 15px;
        top: 32px;
        bottom: 0;
        width: 2px;
        background: var(--grey-200, #e5e7eb);
      }

      .chain-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-top: 5px;
      }

      .chain-step-num {
        font-weight: 600;
        font-size: 0.9rem;
        color: var(--grey-900);
      }
      .chain-step-role {
        font-size: 0.78rem;
        color: var(--primary-600, #2563eb);
        font-weight: 500;
      }
      .chain-state {
        font-size: 0.78rem;
        color: var(--grey-500);
      }
      .chain-date {
        font-size: 0.75rem;
        color: var(--grey-400);
      }
      .chain-comment {
        font-size: 0.8rem;
        color: var(--grey-600);
        font-style: italic;
        margin-top: 2px;
      }

      .action-form {
        background: var(--grey-50, #f9fafb);
        border: 1px solid var(--grey-200, #e5e7eb);
        border-radius: var(--radius-md, 8px);
        padding: 16px;
      }

      .form-control {
        width: 100%;
        border: 1px solid var(--grey-300, #d1d5db);
        border-radius: 6px;
        padding: 10px 12px;
        font-size: 0.9rem;
        resize: vertical;
        font-family: inherit;
        margin-bottom: 12px;
        box-sizing: border-box;

        &:focus {
          outline: none;
          border-color: var(--primary-500, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .action-buttons {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      /* Sidebar */
      .info-rows {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .info-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 0;
        border-bottom: 1px solid var(--grey-100, #f3f4f6);
        font-size: 0.85rem;

        &:last-child {
          border-bottom: none;
        }
      }

      .info-label {
        color: var(--grey-500);
      }
      .info-value {
        font-weight: 500;
        color: var(--grey-900);
      }

      .module-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .module-chip--daily_report {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .module-chip--valorizacion {
        background: #d1fae5;
        color: #065f46;
      }
      .module-chip--solicitud_equipo {
        background: #fef3c7;
        color: #92400e;
      }
      .module-chip--adhoc {
        background: #ede9fe;
        color: #5b21b6;
      }

      .audit-empty {
        font-size: 0.85rem;
        color: var(--grey-400);
        text-align: center;
        padding: 12px 0;
      }
      .audit-timeline {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .audit-entry {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }

      .audit-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
        background: var(--grey-400);
      }
      .audit-dot--created {
        background: #2563eb;
      }
      .audit-dot--step_approved {
        background: #059669;
      }
      .audit-dot--step_rejected {
        background: #dc2626;
      }
      .audit-dot--completed {
        background: #059669;
      }
      .audit-dot--rejected {
        background: #dc2626;
      }
      .audit-dot--cancelled {
        background: #6b7280;
      }
      .audit-dot--rebased {
        background: #7c3aed;
      }

      .audit-content {
        display: flex;
        flex-direction: column;
        gap: 1px;
      }
      .audit-action {
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--grey-700);
      }
      .audit-time {
        font-size: 0.75rem;
        color: var(--grey-400);
      }
      .audit-comment {
        font-size: 0.78rem;
        color: var(--grey-500);
        font-style: italic;
      }
    `,
  ],
})
export class ApprovalDetailComponent implements OnInit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  private approvalSvc = inject(ApprovalService);
  private authService = inject(AuthService);

  loading = signal(true);
  solicitud = signal<SolicitudAprobacionDto | null>(null);
  auditTrail = signal<AuditoriaItem[]>([]);
  errorMsg = signal('');
  successMsg = signal('');
  entityRoute = signal<string | null>(null);

  comentario = '';
  actionLoading = false;
  cancelLoading = false;
  canAct = signal(false);
  canCancel = signal(false);

  get header(): EntityDetailHeader {
    const s = this.solicitud();
    return {
      icon: 'fa-solid fa-check-double',
      title: s?.titulo ?? 'Detalle de Aprobación',
      subtitle: s ? `${this.getModuleLabel(s.module_name)} · Entidad #${s.entity_id}` : '',
      statusLabel: s?.estado ?? '',
      statusClass: this.getEstadoClass(s?.estado ?? ''),
    };
  }

  get auditInfoObj(): AuditInfo {
    const s = this.solicitud();
    return {
      entries: [
        { date: s?.fecha_creacion, label: 'Creado' },
        ...(s?.fecha_completado ? [{ date: s.fecha_completado, label: 'Completado' }] : []),
      ],
    };
  }

  ngOnInit() {
    const id = parseInt(this.route.snapshot.paramMap.get('id') ?? '0');
    this.loadData(id);
  }

  loadData(id: number) {
    this.loading.set(true);
    forkJoin({
      solicitud: this.approvalSvc.getRequest(id),
      audit: this.approvalSvc.getRequestAudit(id),
    }).subscribe({
      next: ({ solicitud, audit }) => {
        this.solicitud.set(solicitud);
        this.auditTrail.set(audit);
        this.computeCanAct(solicitud);
        this.computeCanCancel(solicitud);
        this.computeEntityRoute(solicitud);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private computeCanAct(solicitud: SolicitudAprobacionDto) {
    const isActiveEstado = ['PENDIENTE', 'EN_REVISION'].includes(solicitud.estado);
    const stepInfo = solicitud.paso_actual_info;
    const userRole = this.authService.currentUser?.rol;
    const userId = this.authService.currentUser?.id_usuario;

    const canApprove = stepInfo
      ? (stepInfo.tipo_aprobador === 'ROLE' && stepInfo.rol === userRole) ||
        (stepInfo.tipo_aprobador === 'USER_ID' && stepInfo.usuario_aprobador_id === userId)
      : true; // fallback for adhoc or old data

    this.canAct.set(isActiveEstado && canApprove);
  }

  private computeCanCancel(solicitud: SolicitudAprobacionDto) {
    const userId = this.authService.currentUser?.id_usuario;
    const isOwner = solicitud.usuario_solicitante_id === userId;
    const isCancellable = ['PENDIENTE', 'EN_REVISION'].includes(solicitud.estado);
    this.canCancel.set(isOwner && isCancellable);
  }

  private computeEntityRoute(solicitud: SolicitudAprobacionDto) {
    const routeMap: Record<string, string> = {
      daily_report: '/equipment/daily-reports',
      valorizacion: '/equipment/valuations',
      solicitud_equipo: '/equipment/solicitudes-equipo',
    };
    const base = routeMap[solicitud.module_name];
    this.entityRoute.set(base ? `${base}/${solicitud.entity_id}` : null);
  }

  approve() {
    const s = this.solicitud();
    if (!s) return;
    this.errorMsg.set('');
    this.actionLoading = true;
    this.approvalSvc.approveRequest(s.id, this.comentario || undefined).subscribe({
      next: () => {
        this.actionLoading = false;
        this.comentario = '';
        this.successMsg.set('Solicitud aprobada exitosamente.');
        this.loadData(s.id);
      },
      error: (err) => {
        this.actionLoading = false;
        const msg =
          err?.error?.error?.message || 'Error al aprobar la solicitud. Intente nuevamente.';
        this.errorMsg.set(msg);
      },
    });
  }

  reject() {
    const s = this.solicitud();
    if (!s) return;
    this.errorMsg.set('');

    // B4: Reject validation message
    if (!this.comentario.trim()) {
      this.errorMsg.set('Debe ingresar un comentario para rechazar.');
      return;
    }

    this.actionLoading = true;
    this.approvalSvc.rejectRequest(s.id, this.comentario).subscribe({
      next: () => {
        this.actionLoading = false;
        this.comentario = '';
        this.successMsg.set('Solicitud rechazada.');
        this.loadData(s.id);
      },
      error: (err) => {
        this.actionLoading = false;
        const msg =
          err?.error?.error?.message || 'Error al rechazar la solicitud. Intente nuevamente.';
        this.errorMsg.set(msg);
      },
    });
  }

  cancelRequest() {
    const s = this.solicitud();
    if (!s) return;
    this.errorMsg.set('');
    this.cancelLoading = true;
    this.approvalSvc.cancelRequest(s.id).subscribe({
      next: () => {
        this.cancelLoading = false;
        this.successMsg.set('Solicitud cancelada.');
        this.loadData(s.id);
      },
      error: (err) => {
        this.cancelLoading = false;
        const msg = err?.error?.error?.message || 'Error al cancelar la solicitud.';
        this.errorMsg.set(msg);
      },
    });
  }

  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / 3600000;

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / 60000);
      return mins <= 1 ? 'hace un momento' : `hace ${mins} min`;
    }
    if (diffHours < 24) {
      return `hace ${Math.floor(diffHours)} h`;
    }
    // Absolute for older
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  getEstadoClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'badge-warning',
      EN_REVISION: 'badge-info',
      APROBADO: 'badge-success',
      RECHAZADO: 'badge-danger',
      CANCELADO: 'badge-neutral',
    };
    return map[estado] ?? 'badge-neutral';
  }

  getModuleIcon(module: string): string {
    const icons: Record<string, string> = {
      daily_report: 'fa-file-lines',
      valorizacion: 'fa-calculator',
      solicitud_equipo: 'fa-tractor',
      adhoc: 'fa-bolt',
    };
    return icons[module] ?? 'fa-circle';
  }

  getModuleLabel(module: string): string {
    const labels: Record<string, string> = {
      daily_report: 'Parte Diario',
      valorizacion: 'Valorización',
      solicitud_equipo: 'Solicitud Equipo',
      adhoc: 'Ad-hoc',
    };
    return labels[module] ?? module;
  }

  getEstadoIcon(estado: string): string {
    const icons: Record<string, string> = {
      PENDIENTE: 'fa-clock',
      EN_REVISION: 'fa-magnifying-glass',
      APROBADO: 'fa-check-circle',
      RECHAZADO: 'fa-circle-xmark',
      CANCELADO: 'fa-ban',
    };
    return icons[estado] ?? 'fa-circle';
  }

  formatAccion(accion: string): string {
    const labels: Record<string, string> = {
      CREATED: 'Creado',
      STEP_APPROVED: 'Paso Aprobado',
      STEP_REJECTED: 'Paso Rechazado',
      COMPLETED: 'Completado',
      REJECTED: 'Rechazado',
      REBASED: 'Rebasado',
      CANCELLED: 'Cancelado',
    };
    return labels[accion] ?? accion;
  }
}
