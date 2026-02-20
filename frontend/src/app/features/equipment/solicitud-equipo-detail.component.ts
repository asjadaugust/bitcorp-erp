import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  SolicitudEquipoService,
  SolicitudEquipo,
} from '../../core/services/solicitud-equipo.service';
import {
  EntityDetailShellComponent,
  EntityDetailSidebarCardComponent,
  EntityDetailHeader,
  AuditInfo,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-solicitud-equipo-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="solicitud"
      [header]="header"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles de la solicitud..."
    >
      <!-- MAIN CONTENT -->
      <div entity-main-content class="detail-sections">
        <!-- INFORMACIÓN DEL EQUIPO -->
        <section class="detail-section">
          <h2>Información del Equipo</h2>
          <div class="info-grid">
            <div class="info-item">
              <label>Tipo de Equipo</label>
              <p>{{ solicitud?.tipo_equipo }}</p>
            </div>
            <div class="info-item">
              <label>Cantidad</label>
              <p>{{ solicitud?.cantidad }}</p>
            </div>
            <div class="info-item">
              <label>Fecha Requerida</label>
              <p>{{ solicitud?.fecha_requerida | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <label>Prioridad</label>
              <p>
                <span
                  class="priority-badge"
                  [ngClass]="'priority-' + solicitud?.prioridad?.toLowerCase()"
                >
                  {{ solicitud?.prioridad }}
                </span>
              </p>
            </div>
          </div>
        </section>

        <!-- JUSTIFICACIÓN Y OBSERVACIONES -->
        <section class="detail-section">
          <h2>Justificación y Observaciones</h2>
          <div class="text-content-grid">
            <div class="info-item-full">
              <label>Justificación</label>
              <p class="description-text">{{ solicitud?.justificacion || 'No especificada' }}</p>
            </div>
            <div class="info-item-full" *ngIf="solicitud?.descripcion">
              <label>Descripción Adicional</label>
              <p class="description-text">{{ solicitud?.descripcion }}</p>
            </div>
            <div class="info-item-full" *ngIf="solicitud?.observaciones">
              <label>Observaciones de Revisión</label>
              <div class="observations-box">
                <i class="fa-solid fa-comment-dots"></i>
                <p>{{ solicitud?.observaciones }}</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- SIDEBAR ACTIONS -->
      <ng-container entity-sidebar-actions>
        @if (solicitud) {
          @if (solicitud.estado === 'BORRADOR') {
            <button type="button" class="btn btn-primary btn-block" (click)="enviar()">
              <i class="fa-solid fa-paper-plane"></i> Enviar para Aprobación
            </button>
            <button type="button" class="btn btn-secondary btn-block" [routerLink]="['edit']">
              <i class="fa-solid fa-pen"></i> Editar Solicitud
            </button>
          }

          @if (solicitud.estado === 'ENVIADO') {
            <button type="button" class="btn btn-success btn-block" (click)="aprobar()">
              <i class="fa-solid fa-check"></i> Aprobar Solicitud
            </button>
            <button type="button" class="btn btn-danger btn-block" (click)="rechazar()">
              <i class="fa-solid fa-times"></i> Rechazar Solicitud
            </button>
          }

          <hr class="sidebar-divider" />

          <button type="button" class="btn btn-ghost btn-block" routerLink="/equipment/solicitudes">
            <i class="fa-solid fa-arrow-left"></i> Volver a Lista
          </button>
        }
      </ng-container>

      <!-- SIDEBAR EXTRA CARDS -->
      <entity-detail-sidebar-card entity-sidebar-after title="Estado de Aprobación">
        <div class="status-info-card">
          <div class="status-indicator" [ngClass]="'status-' + solicitud?.estado?.toLowerCase()">
            <i class="fa-solid" [ngClass]="getStatusIcon(solicitud?.estado || '')"></i>
            <span>{{ solicitud?.estado }}</span>
          </div>
          @if (solicitud?.fecha_aprobacion) {
            <div class="approval-meta">
              <p><strong>Aprobado el:</strong></p>
              <p>{{ solicitud?.fecha_aprobacion | date: 'dd/MM/yyyy HH:mm' }}</p>
            </div>
          }
        </div>
      </entity-detail-sidebar-card>
    </entity-detail-shell>
  `,
  styles: [
    `
      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-32);
      }

      .detail-section h2 {
        font-size: 16px;
        font-weight: 700;
        color: var(--grey-900);
        margin-bottom: var(--s-16);
        padding-bottom: var(--s-8);
        border-bottom: 1px solid var(--grey-100);
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--s-4);
      }

      .info-item p {
        font-size: 14px;
        color: var(--grey-900);
        font-weight: 500;
        margin: 0;
      }

      .info-item-full {
        margin-bottom: var(--s-24);
      }

      .info-item-full label {
        display: block;
        font-size: 11px;
        font-weight: 600;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: var(--s-8);
      }

      .description-text {
        font-size: 14px;
        color: var(--grey-700);
        line-height: 1.6;
        background: var(--grey-50);
        padding: var(--s-16);
        border-radius: 8px;
        border: 1px solid var(--grey-100);
      }

      .observations-box {
        display: flex;
        gap: var(--s-12);
        background: var(--semantic-blue-50);
        padding: var(--s-16);
        border-radius: 8px;
        border: 1px solid var(--semantic-blue-100);
        color: var(--semantic-blue-700);
      }

      .observations-box i {
        margin-top: 3px;
      }

      .observations-box p {
        font-size: 14px;
        line-height: 1.5;
        margin: 0;
        font-style: italic;
      }

      .priority-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .priority-alta {
        background: #fef2f2;
        color: #ef4444;
      }
      .priority-media {
        background: #fffbeb;
        color: #f59e0b;
      }
      .priority-baja {
        background: #f0fdf4;
        color: #22c55e;
      }

      .status-info-card {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: var(--s-12);
        border-radius: 8px;
        font-weight: 700;
        font-size: 14px;
        text-transform: uppercase;
      }

      .status-borrador {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .status-enviado {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-aprobado {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-rechazado {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }

      .approval-meta p {
        margin: 0;
        font-size: 13px;
        color: var(--grey-600);
      }

      .sidebar-divider {
        border: none;
        border-top: 1px solid var(--grey-100);
        margin: var(--s-16) 0;
      }

      .btn-block {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--s-8);
        padding: var(--s-12);
        border-radius: 8px;
        font-weight: 600;
        margin-bottom: var(--s-8);
        transition: all 0.2s;
      }

      .btn-ghost {
        background: transparent;
        color: var(--grey-600);
        border: 1px solid transparent;
      }

      .btn-ghost:hover {
        background: var(--grey-50);
        color: var(--primary-600);
      }
    `,
  ],
})
export class SolicitudEquipoDetailComponent implements OnInit {
  private service = inject(SolicitudEquipoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  solicitud: SolicitudEquipo | null = null;
  loading = false;

  header: EntityDetailHeader = {
    title: 'Solicitud de Equipo',
    icon: 'fa-solid fa-file-invoice',
    statusLabel: 'Pendiente',
    statusClass: 'status-pending',
  };

  auditInfo: AuditInfo = {
    entries: [],
  };

  ngOnInit() {
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);
    this.cargar(id);
  }

  cargar(id: number) {
    this.loading = true;
    this.service.obtener(id).subscribe({
      next: (s) => {
        this.solicitud = s;
        this.updateHeader(s);
        this.updateAudit(s);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private updateHeader(s: SolicitudEquipo) {
    this.header = {
      icon: 'fa-solid fa-file-invoice',
      title: s.codigo,
      subtitle: `Solicitud para ${s.tipo_equipo}`,
      statusLabel: s.estado,
      statusClass: `status-badge status-${s.estado.toLowerCase()}`,
    };
  }

  private updateAudit(s: SolicitudEquipo) {
    this.auditInfo = {
      entries: [
        { label: 'Fecha de creación', date: s.created_at },
        { label: 'Última actualización', date: s.updated_at },
        { label: 'Fecha requerida', date: s.fecha_requerida },
      ],
    };
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      BORRADOR: 'fa-pencil',
      ENVIADO: 'fa-paper-plane',
      APROBADO: 'fa-check',
      RECHAZADO: 'fa-times',
    };
    return icons[estado] || 'fa-info-circle';
  }

  enviar() {
    if (!this.solicitud) return;
    if (!confirm(`¿Enviar la solicitud ${this.solicitud.codigo} para aprobación?`)) return;
    this.service.enviar(this.solicitud.id).subscribe({
      next: (s) => {
        this.solicitud = s;
        this.updateHeader(s);
      },
    });
  }

  aprobar() {
    if (!this.solicitud) return;
    const obs = prompt('Observaciones (opcional):');
    if (obs === null) return;
    this.service.aprobar(this.solicitud.id, obs || undefined).subscribe({
      next: (s) => {
        this.solicitud = s;
        this.updateHeader(s);
      },
    });
  }

  rechazar() {
    if (!this.solicitud) return;
    const obs = prompt('Motivo de rechazo:');
    if (!obs) return;
    this.service.rechazar(this.solicitud.id, obs).subscribe({
      next: (s) => {
        this.solicitud = s;
        this.updateHeader(s);
      },
    });
  }
}
