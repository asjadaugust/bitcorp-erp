import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import {
  ApprovalService,
  SolicitudAprobacionDto,
  SolicitudAdhocDto,
  DashboardStatsDto,
} from '../../core/services/approval.service';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AeroBadgeComponent } from '../../core/design-system/badge/aero-badge.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { AeroTabsComponent } from '../../shared/components/aero-tabs/aero-tabs.component';
import { forkJoin } from 'rxjs';

type DashboardTab = 'recibidos' | 'enviados';

@Component({
  selector: 'app-approval-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    PageCardComponent,
    StatsGridComponent,
    ButtonComponent,
    AeroBadgeComponent,
    ActionsContainerComponent,
    AeroTabsComponent,
  ],
  template: `
    <app-page-layout
      title="Centro de Aprobaciones"
      icon="fa-check-double"
      [breadcrumbs]="[{ label: 'Aprobaciones' }]"
      [loading]="loading()"
    >
      <app-actions-container actions>
        <app-button
          variant="secondary"
          icon="fa-list-check"
          label="Plantillas"
          (clicked)="router.navigate(['/approvals/templates'])"
        ></app-button>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Solicitud Ad-hoc"
          (clicked)="router.navigate(['/approvals/adhoc/new'])"
        ></app-button>
      </app-actions-container>

      <!-- Stats Grid -->
      <app-stats-grid [items]="statItems" class="mb-4"></app-stats-grid>

      <!-- Tabs -->
      <app-page-card [noPadding]="false">
        <div class="approval-tabs-header">
          <button
            class="tab-btn"
            [class.active]="activeTab === 'recibidos'"
            (click)="switchTab('recibidos')"
          >
            <i class="fa-solid fa-inbox"></i>
            Recibidos
            <span class="tab-badge" *ngIf="recibidos().length > 0">{{ recibidos().length }}</span>
          </button>
          <button
            class="tab-btn"
            [class.active]="activeTab === 'enviados'"
            (click)="switchTab('enviados')"
          >
            <i class="fa-solid fa-paper-plane"></i>
            Enviados
          </button>
        </div>

        <!-- Recibidos Tab -->
        <div *ngIf="activeTab === 'recibidos'">
          <div *ngIf="recibidos().length === 0 && !loading()" class="empty-state">
            <i class="fa-regular fa-circle-check empty-icon"></i>
            <p class="empty-title">Todo al día</p>
            <p class="empty-desc">No tienes solicitudes pendientes de aprobación</p>
          </div>

          <div class="approval-cards" *ngIf="recibidos().length > 0">
            <div
              *ngFor="let item of recibidos()"
              class="approval-card"
              [class.approval-card--urgent]="isUrgent(item)"
            >
              <div class="approval-card__header">
                <span class="module-badge" [class]="'module-badge--' + item.module_name">
                  <i class="fa-solid" [class]="getModuleIcon(item.module_name)"></i>
                  {{ getModuleLabel(item.module_name) }}
                </span>
                <span class="step-progress"> Paso {{ item.paso_actual }} </span>
              </div>

              <div class="approval-card__body">
                <h3 class="approval-title">{{ item.titulo }}</h3>
                <p class="approval-meta" *ngIf="item.descripcion">{{ item.descripcion }}</p>
                <p class="approval-date">
                  <i class="fa-regular fa-clock"></i>
                  {{ item.fecha_creacion | date: 'dd MMM yyyy, HH:mm' }}
                </p>
              </div>

              <div class="approval-card__actions">
                <app-button
                  variant="ghost"
                  icon="fa-eye"
                  label="Ver detalle"
                  (clicked)="viewDetail(item.id)"
                ></app-button>
                <app-button
                  variant="danger-outline"
                  icon="fa-xmark"
                  label="Rechazar"
                  (clicked)="promptReject(item)"
                ></app-button>
                <app-button
                  variant="success"
                  icon="fa-check"
                  label="Aprobar"
                  (clicked)="promptApprove(item)"
                ></app-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Enviados Tab -->
        <div *ngIf="activeTab === 'enviados'">
          <div *ngIf="enviados().length === 0 && !loading()" class="empty-state">
            <i class="fa-regular fa-paper-plane empty-icon"></i>
            <p class="empty-title">Sin solicitudes enviadas</p>
            <p class="empty-desc">Las solicitudes que envíes aparecerán aquí</p>
          </div>

          <div class="approval-cards" *ngIf="enviados().length > 0">
            <div *ngFor="let item of enviados()" class="approval-card">
              <div class="approval-card__header">
                <span class="module-badge" [class]="'module-badge--' + item.module_name">
                  <i class="fa-solid" [class]="getModuleIcon(item.module_name)"></i>
                  {{ getModuleLabel(item.module_name) }}
                </span>
                <span class="estado-badge" [class]="'estado--' + item.estado.toLowerCase()">
                  <i class="fa-solid" [class]="getEstadoIcon(item.estado)"></i>
                  {{ item.estado }}
                </span>
              </div>

              <div class="approval-card__body">
                <h3 class="approval-title">{{ item.titulo }}</h3>

                <!-- Progress chain -->
                <div class="approval-chain" *ngIf="item.pasos && item.pasos.length > 0">
                  <div
                    *ngFor="let paso of item.pasos"
                    class="chain-step"
                    [class.chain-step--done]="paso.estado_paso === 'APROBADO'"
                    [class.chain-step--active]="
                      paso.paso_numero === item.paso_actual && item.estado !== 'APROBADO'
                    "
                    [class.chain-step--rejected]="paso.estado_paso === 'RECHAZADO'"
                  >
                    <i
                      class="fa-solid"
                      [class.fa-check-circle]="paso.estado_paso === 'APROBADO'"
                      [class.fa-circle-xmark]="paso.estado_paso === 'RECHAZADO'"
                      [class.fa-circle-dot]="
                        paso.paso_numero === item.paso_actual && item.estado !== 'APROBADO'
                      "
                      [class.fa-circle]="
                        paso.estado_paso === 'PENDIENTE' && paso.paso_numero !== item.paso_actual
                      "
                    ></i>
                    <span>Paso {{ paso.paso_numero }}</span>
                  </div>
                </div>

                <p class="approval-date">
                  <i class="fa-regular fa-clock"></i>
                  {{ item.fecha_creacion | date: 'dd MMM yyyy, HH:mm' }}
                </p>
              </div>

              <div class="approval-card__actions">
                <app-button
                  variant="ghost"
                  icon="fa-eye"
                  label="Ver detalle"
                  (clicked)="viewDetail(item.id)"
                ></app-button>
              </div>
            </div>
          </div>
        </div>
      </app-page-card>
    </app-page-layout>

    <!-- Approve/Reject Comment Modal -->
    <div class="modal-overlay" *ngIf="showCommentModal" (click)="closeModal()">
      <div class="modal-box" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <i
            class="fa-solid"
            [class.fa-check-circle]="modalAction === 'approve'"
            [class.fa-circle-xmark]="modalAction === 'reject'"
          ></i>
          <h3>{{ modalAction === 'approve' ? 'Confirmar Aprobación' : 'Rechazar Solicitud' }}</h3>
        </div>
        <p class="modal-subtitle">{{ selectedItem?.titulo }}</p>
        <textarea
          class="modal-comment"
          placeholder="{{
            modalAction === 'reject'
              ? 'Motivo del rechazo (requerido)...'
              : 'Comentario opcional...'
          }}"
          [(ngModel)]="modalComment"
          rows="3"
        ></textarea>
        <div class="modal-actions">
          <app-button variant="ghost" label="Cancelar" (clicked)="closeModal()"></app-button>
          <app-button
            [variant]="modalAction === 'approve' ? 'success' : 'danger'"
            [icon]="modalAction === 'approve' ? 'fa-check' : 'fa-xmark'"
            [label]="modalAction === 'approve' ? 'Aprobar' : 'Rechazar'"
            [loading]="actionLoading"
            (clicked)="confirmAction()"
          ></app-button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ── Tab Header ─────────────────────────────────────────── */
      .approval-tabs-header {
        display: flex;
        gap: var(--s-4, 4px);
        border-bottom: 2px solid var(--grey-200, #e5e7eb);
        margin: 0 0 var(--s-24, 24px);
      }

      .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border: none;
        background: none;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        color: var(--grey-600, #6b7280);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.15s ease;

        &:hover {
          color: var(--primary-700, #0057b8);
          background: var(--grey-50, #f9fafb);
        }

        &.active {
          color: var(--primary-700, #0057b8);
          border-bottom-color: var(--primary-700, #0057b8);
          font-weight: 600;
        }
      }

      .tab-badge {
        background: var(--primary-700, #0057b8);
        color: white;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 0.75rem;
        font-weight: 700;
      }

      /* ── Approval Cards ──────────────────────────────────────── */
      .approval-cards {
        display: flex;
        flex-direction: column;
        gap: var(--s-12, 12px);
      }

      .approval-card {
        border: 1px solid var(--grey-200, #e5e7eb);
        border-radius: var(--radius-md, 8px);
        padding: var(--s-16, 16px);
        background: var(--white, #fff);
        transition:
          box-shadow 0.15s ease,
          border-color 0.15s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-color: var(--grey-300, #d1d5db);
        }

        &--urgent {
          border-left: 4px solid var(--warning-500, #f59e0b);
        }
      }

      .approval-card__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }

      .approval-card__body {
        margin-bottom: 12px;
      }

      .approval-card__actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        padding-top: 12px;
        border-top: 1px solid var(--grey-100, #f3f4f6);
      }

      .approval-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--grey-900, #111827);
        margin: 0 0 4px;
      }

      .approval-meta {
        font-size: 0.85rem;
        color: var(--grey-500, #6b7280);
        margin: 0 0 6px;
      }

      .approval-date {
        font-size: 0.8rem;
        color: var(--grey-400, #9ca3af);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      /* ── Module Badges ───────────────────────────────────────── */
      .module-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 4px;
        font-size: 0.78rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.03em;

        &--daily_report {
          background: #dbeafe;
          color: #1d4ed8;
        }
        &--valorizacion {
          background: #d1fae5;
          color: #065f46;
        }
        &--solicitud_equipo {
          background: #fef3c7;
          color: #92400e;
        }
        &--adhoc {
          background: #ede9fe;
          color: #5b21b6;
        }
      }

      /* ── Estado Badges ───────────────────────────────────────── */
      .estado-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 0.78rem;
        font-weight: 600;

        &.estado--pendiente {
          background: #fef3c7;
          color: #92400e;
        }
        &.estado--en_revision {
          background: #dbeafe;
          color: #1e40af;
        }
        &.estado--aprobado {
          background: #d1fae5;
          color: #065f46;
        }
        &.estado--rechazado {
          background: #fee2e2;
          color: #991b1b;
        }
        &.estado--cancelado {
          background: #f3f4f6;
          color: #374151;
        }
      }

      .step-progress {
        font-size: 0.78rem;
        color: var(--grey-500);
        font-weight: 500;
      }

      /* ── Approval Chain (Enviados) ───────────────────────────── */
      .approval-chain {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 8px 0;
        flex-wrap: wrap;
      }

      .chain-step {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 0.78rem;
        color: var(--grey-400);

        & + .chain-step::before {
          content: '→';
          color: var(--grey-300);
          margin-right: 4px;
        }

        &--done {
          color: #059669;
        }
        &--active {
          color: #2563eb;
          font-weight: 600;
        }
        &--rejected {
          color: #dc2626;
        }
      }

      /* ── Empty State ─────────────────────────────────────────── */
      .empty-state {
        text-align: center;
        padding: var(--s-48, 48px) var(--s-24, 24px);
        color: var(--grey-400, #9ca3af);
      }

      .empty-icon {
        font-size: 3rem;
        display: block;
        margin-bottom: 12px;
        color: var(--grey-300, #d1d5db);
      }

      .empty-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--grey-600, #4b5563);
        margin: 0 0 6px;
      }

      .empty-desc {
        font-size: 0.9rem;
        margin: 0;
      }

      /* ── Modal ───────────────────────────────────────────────── */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(2px);
      }

      .modal-box {
        background: white;
        border-radius: var(--radius-lg, 12px);
        padding: var(--s-32, 32px);
        width: min(480px, 90vw);
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }

      .modal-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .fa-check-circle {
          color: #059669;
          font-size: 1.2rem;
        }
        .fa-circle-xmark {
          color: #dc2626;
          font-size: 1.2rem;
        }
      }

      .modal-subtitle {
        font-size: 0.9rem;
        color: var(--grey-500);
        margin: 0 0 16px;
      }

      .modal-comment {
        width: 100%;
        border: 1px solid var(--grey-300, #d1d5db);
        border-radius: var(--radius-md, 6px);
        padding: 10px 12px;
        font-size: 0.9rem;
        resize: vertical;
        font-family: inherit;
        margin-bottom: 16px;
        box-sizing: border-box;
        transition: border-color 0.15s ease;

        &:focus {
          outline: none;
          border-color: var(--primary-500, #3b82f6);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .modal-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    `,
  ],
})
export class ApprovalDashboardComponent implements OnInit {
  router = inject(Router);
  private approvalSvc = inject(ApprovalService);

  loading = signal(true);
  recibidos = signal<SolicitudAprobacionDto[]>([]);
  enviados = signal<SolicitudAprobacionDto[]>([]);
  stats = signal<DashboardStatsDto | null>(null);

  activeTab: DashboardTab = 'recibidos';

  showCommentModal = false;
  modalAction: 'approve' | 'reject' = 'approve';
  modalComment = '';
  selectedItem: SolicitudAprobacionDto | null = null;
  actionLoading = false;

  get statItems(): StatItem[] {
    const s = this.stats();
    return [
      {
        label: 'Pendientes de mi aprobación',
        value: s?.pendientes_recibidos ?? 0,
        icon: 'fa-inbox',
        color: s && s.pendientes_recibidos > 0 ? 'warning' : 'info',
      },
      {
        label: 'Mis solicitudes en curso',
        value: s?.pendientes_enviados ?? 0,
        icon: 'fa-paper-plane',
        color: 'primary',
      },
      {
        label: 'Aprobados hoy',
        value: s?.aprobados_hoy ?? 0,
        icon: 'fa-check-circle',
        color: 'success',
      },
      {
        label: 'Rechazados hoy',
        value: s?.rechazados_hoy ?? 0,
        icon: 'fa-circle-xmark',
        color: s && s.rechazados_hoy > 0 ? 'danger' : 'info',
      },
    ];
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    forkJoin({
      recibidos: this.approvalSvc.getDashboardRecibidos(),
      enviados: this.approvalSvc.getDashboardEnviados(),
      stats: this.approvalSvc.getDashboardStats(),
    }).subscribe({
      next: ({ recibidos, enviados, stats }) => {
        this.recibidos.set(recibidos);
        this.enviados.set(enviados);
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  switchTab(tab: DashboardTab) {
    this.activeTab = tab;
  }

  viewDetail(id: number) {
    this.router.navigate(['/approvals/requests', id]);
  }

  promptApprove(item: SolicitudAprobacionDto) {
    this.selectedItem = item;
    this.modalAction = 'approve';
    this.modalComment = '';
    this.showCommentModal = true;
  }

  promptReject(item: SolicitudAprobacionDto) {
    this.selectedItem = item;
    this.modalAction = 'reject';
    this.modalComment = '';
    this.showCommentModal = true;
  }

  closeModal() {
    this.showCommentModal = false;
    this.selectedItem = null;
    this.modalComment = '';
  }

  confirmAction() {
    if (!this.selectedItem) return;
    if (this.modalAction === 'reject' && !this.modalComment.trim()) return;

    this.actionLoading = true;
    const obs =
      this.modalAction === 'approve'
        ? this.approvalSvc.approveRequest(this.selectedItem.id, this.modalComment || undefined)
        : this.approvalSvc.rejectRequest(this.selectedItem.id, this.modalComment);

    obs.subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeModal();
        this.loadData();
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  isUrgent(item: SolicitudAprobacionDto): boolean {
    const created = new Date(item.fecha_creacion);
    const hours = (Date.now() - created.getTime()) / 3600000;
    return hours > 24;
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
}
