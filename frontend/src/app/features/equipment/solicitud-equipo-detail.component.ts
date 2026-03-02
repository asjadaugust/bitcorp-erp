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
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-solicitud-equipo-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    EntityDetailShellComponent,
    EntityDetailSidebarCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-entity-detail-shell
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
              <span class="label">Tipo de Equipo</span>
              <p>{{ solicitud?.tipo_equipo }}</p>
            </div>
            <div class="info-item">
              <span class="label">Cantidad</span>
              <p>{{ solicitud?.cantidad }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha Requerida</span>
              <p>{{ solicitud?.fecha_requerida | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Prioridad</span>
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
              <span class="label">Justificación</span>
              <p class="description-text">{{ solicitud?.justificacion || 'No especificada' }}</p>
            </div>
            <div class="info-item-full" *ngIf="solicitud?.descripcion">
              <span class="label">Descripción Adicional</span>
              <p class="description-text">{{ solicitud?.descripcion }}</p>
            </div>
            <div class="info-item-full" *ngIf="solicitud?.observaciones">
              <span class="label">Observaciones de Revisión</span>
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
            <aero-button
              variant="primary"
              iconLeft="fa-paper-plane"
              [fullWidth]="true"
              (clicked)="enviar()"
              >Enviar para Aprobación</aero-button
            >
            <aero-button
              variant="secondary"
              iconLeft="fa-pen"
              [fullWidth]="true"
              [routerLink]="['edit']"
              >Editar Solicitud</aero-button
            >
          }

          @if (solicitud.estado === 'APROBADO') {
            <aero-button
              variant="primary"
              iconLeft="fa-balance-scale"
              [fullWidth]="true"
              [routerLink]="['comparacion']"
              >Cuadro Comparativo</aero-button
            >
          }

          @if (solicitud.estado === 'ENVIADO') {
            <aero-button
              variant="primary"
              iconLeft="fa-check"
              [fullWidth]="true"
              (clicked)="aprobar()"
              >Aprobar Solicitud</aero-button
            >
            <aero-button
              variant="danger"
              iconLeft="fa-times"
              [fullWidth]="true"
              (clicked)="rechazar()"
              >Rechazar Solicitud</aero-button
            >
          }

          <hr class="sidebar-divider" />

          <aero-button
            variant="ghost"
            iconLeft="fa-arrow-left"
            [fullWidth]="true"
            routerLink="/equipment/solicitudes"
            >Volver a Lista</aero-button
          >
        }
      </ng-container>

      <!-- SIDEBAR EXTRA CARDS -->
      <app-entity-detail-sidebar-card entity-sidebar-after title="Estado de Aprobación">
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
      </app-entity-detail-sidebar-card>
    </app-entity-detail-shell>
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
        background: var(--semantic-red-50);
        color: var(--accent-500);
      }
      .priority-media {
        background: var(--semantic-yellow-50);
        color: var(--accent-500);
      }
      .priority-baja {
        background: var(--semantic-green-50);
        color: var(--semantic-blue-500);
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
        color: var(--primary-900);
      }
      .status-rechazado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
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
  private svc = inject(SolicitudEquipoService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

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
    this.svc.obtener(id).subscribe({
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
    this.enviarAprobacion();
  }

  enviarAprobacion() {
    if (!this.solicitud) return;
    this.confirmSvc
      .confirm({
        title: 'Enviar Solicitud',
        message: `¿Desea enviar la solicitud ${this.solicitud.codigo} para aprobación?`,
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.enviar(this.solicitud!.id).subscribe({
            next: (s: SolicitudEquipo) => {
              this.solicitud = s;
              this.updateHeader(s);
            },
          });
        }
      });
  }

  aprobar() {
    if (!this.solicitud) return;
    this.confirmSvc
      .prompt({
        title: 'Aprobar Solicitud',
        message: `Ingrese observaciones para la aprobación de la solicitud ${this.solicitud.codigo} (opcional):`,
        icon: 'fa-check-circle',
        confirmLabel: 'Aprobar',
      })
      .subscribe((obs) => {
        if (obs !== null) {
          this.svc.aprobar(this.solicitud!.id, obs || undefined).subscribe({
            next: (s: SolicitudEquipo) => {
              this.solicitud = s;
              this.updateHeader(s);
            },
          });
        }
      });
  }

  rechazar() {
    if (!this.solicitud) return;
    this.confirmSvc
      .prompt({
        title: 'Rechazar Solicitud',
        message: `Ingrese el motivo de rechazo para la solicitud ${this.solicitud.codigo}:`,
        icon: 'fa-times-circle',
        confirmLabel: 'Rechazar',
        isDanger: true,
        inputRequired: true,
      })
      .subscribe((obs) => {
        if (obs) {
          this.svc.rechazar(this.solicitud!.id, obs).subscribe({
            next: (s: SolicitudEquipo) => {
              this.solicitud = s;
              this.updateHeader(s);
            },
          });
        }
      });
  }
}
