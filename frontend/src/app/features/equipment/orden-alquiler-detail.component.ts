import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { OrdenAlquilerService, OrdenAlquiler } from '../../core/services/orden-alquiler.service';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  AuditEntry,
  TabConfig,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-orden-alquiler-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EntityDetailShellComponent],
  template: `
    <entity-detail-shell
      [header]="header"
      [entity]="orden"
      [loading]="loading"
      [auditInfo]="auditInfo"
      loadingText="Cargando orden de alquiler..."
    >
      <!-- ── TABS ────────────────────────────────────── -->
      <div entity-header-below class="detail-tabs">
        <button
          *ngFor="let tab of tabs"
          class="tab-link"
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id"
        >
          <i [class]="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── MAIN CONTENT ────────────────────────────── -->
      <div entity-main-content class="detail-content">
        <!-- Tab: Resumen -->
        @if (activeTab === 'general') {
          <!-- Estado strip when not BORRADOR -->
          @if (orden && orden.estado !== 'BORRADOR') {
            <div class="estado-strip" [ngClass]="'strip-' + orden.estado.toLowerCase()">
              <i class="fa-solid" [ngClass]="getStatusIcon(orden.estado)"></i>
              <span>{{ estadoLabel(orden.estado) }}</span>
              <span *ngIf="orden.fecha_envio" class="strip-meta">
                — Enviada el {{ orden.fecha_envio | date: 'dd/MM/yyyy HH:mm' }}
                <span *ngIf="orden.enviado_a"> a {{ orden.enviado_a }}</span>
              </span>
              <span *ngIf="orden.fecha_confirmacion" class="strip-meta">
                — Confirmada el {{ orden.fecha_confirmacion | date: 'dd/MM/yyyy HH:mm' }}
                <span *ngIf="orden.confirmado_por"> por {{ orden.confirmado_por }}</span>
              </span>
              <span *ngIf="orden.motivo_cancelacion" class="strip-meta">
                — {{ orden.motivo_cancelacion }}
              </span>
            </div>
          }

          <section class="detail-section">
            <h2>Equipo y Proveedor</h2>
            <div class="info-grid">
              <div class="info-item">
                <label>Código</label>
                <p class="mono-value">{{ orden?.codigo }}</p>
              </div>
              <div class="info-item">
                <label>ID Proveedor</label>
                <p>
                  <a [routerLink]="['/providers', orden?.proveedor_id]" class="link-primary">
                    <i
                      class="fa-solid fa-arrow-up-right-from-square"
                      style="font-size:0.75em;margin-right:4px;"
                    ></i>
                    Proveedor #{{ orden?.proveedor_id }}
                  </a>
                </p>
              </div>
              <div class="info-item" *ngIf="orden?.equipo_id">
                <label>Equipo</label>
                <p>
                  <a [routerLink]="['/equipment', orden?.equipo_id]" class="link-primary">
                    <i
                      class="fa-solid fa-arrow-up-right-from-square"
                      style="font-size:0.75em;margin-right:4px;"
                    ></i>
                    Equipo #{{ orden?.equipo_id }}
                  </a>
                </p>
              </div>
              <div class="info-item" *ngIf="orden?.proyecto_id">
                <label>Proyecto</label>
                <p>
                  <a [routerLink]="['/projects', orden?.proyecto_id]" class="link-primary">
                    <i
                      class="fa-solid fa-arrow-up-right-from-square"
                      style="font-size:0.75em;margin-right:4px;"
                    ></i>
                    Proyecto #{{ orden?.proyecto_id }}
                  </a>
                </p>
              </div>
              <div class="info-item" *ngIf="orden?.solicitud_equipo_id">
                <label>Solicitud Origen</label>
                <p>
                  <a
                    [routerLink]="['/equipment/solicitudes', orden?.solicitud_equipo_id]"
                    class="link-primary"
                  >
                    Ver Solicitud #{{ orden?.solicitud_equipo_id }}
                  </a>
                </p>
              </div>
              <div class="info-item span-full">
                <label>Descripción del Equipo</label>
                <p>{{ orden?.descripcion_equipo }}</p>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h2>Fechas</h2>
            <div class="info-grid">
              <div class="info-item">
                <label>Fecha de Orden</label>
                <p>{{ orden?.fecha_orden | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.fecha_inicio_estimada">
                <label>Inicio Estimado</label>
                <p>{{ orden?.fecha_inicio_estimada | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.fecha_fin_estimada">
                <label>Fin Estimado</label>
                <p>{{ orden?.fecha_fin_estimada | date: 'dd/MM/yyyy' }}</p>
              </div>
            </div>
          </section>
        }

        <!-- Tab: Condiciones Económicas -->
        @if (activeTab === 'economics') {
          <section class="detail-section tarifa-section">
            <h2>Tarifa Acordada</h2>
            <div class="tarifa-highlight">
              <span class="tarifa-amount"
                >{{ orden?.moneda }} {{ orden?.tarifa_acordada | number: '1.2-2' }}</span
              >
              <span class="tarifa-periodo">/ {{ tipoTarifaLabel(orden?.tipo_tarifa || '') }}</span>
            </div>
            <div class="info-grid">
              <div class="info-item" *ngIf="orden?.tipo_cambio">
                <label>Tipo de Cambio</label>
                <p>S/ {{ orden?.tipo_cambio | number: '1.4-4' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.horas_incluidas">
                <label>Horas Incluidas</label>
                <p class="value-highlight mono-value">
                  {{ orden?.horas_incluidas }} <span class="unit">h</span>
                </p>
              </div>
              <div class="info-item" *ngIf="orden?.penalidad_exceso">
                <label>Penalidad por Hora Excedente</label>
                <p>{{ orden?.moneda }} {{ orden?.penalidad_exceso | number: '1.2-2' }} / h</p>
              </div>
            </div>
          </section>

          @if (orden?.condiciones_especiales || orden?.observaciones) {
            <section class="detail-section">
              <h2>Notas y Condiciones</h2>
              <div class="info-grid">
                <div class="info-item span-full" *ngIf="orden?.condiciones_especiales">
                  <label>Condiciones Especiales</label>
                  <p class="text-italic">{{ orden?.condiciones_especiales }}</p>
                </div>
                <div class="info-item span-full" *ngIf="orden?.observaciones">
                  <label>Observaciones</label>
                  <p class="text-italic">{{ orden?.observaciones }}</p>
                </div>
              </div>
            </section>
          }
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button
          *ngIf="orden && ['BORRADOR', 'ENVIADO'].includes(orden.estado)"
          type="button"
          class="btn btn-secondary btn-block"
          [routerLink]="['/equipment/ordenes-alquiler', orden.id, 'edit']"
        >
          <i class="fa-solid fa-pen-to-square"></i> Editar Orden
        </button>

        <button
          *ngIf="orden?.estado === 'BORRADOR'"
          type="button"
          class="btn btn-primary btn-block"
          (click)="enviar()"
        >
          <i class="fa-solid fa-paper-plane"></i> Enviar al Proveedor
        </button>

        <button
          *ngIf="orden?.estado === 'ENVIADO'"
          type="button"
          class="btn btn-success btn-block"
          (click)="confirmar()"
        >
          <i class="fa-solid fa-circle-check"></i> Confirmar Orden
        </button>

        <button
          *ngIf="orden && ['BORRADOR', 'ENVIADO'].includes(orden.estado)"
          type="button"
          class="btn btn-danger btn-block"
          (click)="cancelar()"
        >
          <i class="fa-solid fa-ban"></i> Cancelar Orden
        </button>

        <div class="sidebar-divider"></div>

        <button
          type="button"
          class="btn btn-ghost btn-block"
          routerLink="/equipment/ordenes-alquiler"
        >
          <i class="fa-solid fa-arrow-left"></i> Volver a la Lista
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: var(--s-24);

        .tab-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--grey-200);
          background: var(--neutral-0);
          color: var(--grey-600);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;

          i {
            opacity: 0.7;
            font-size: 13px;
          }

          &:hover {
            background: var(--grey-50);
            border-color: var(--grey-300);
            color: var(--primary-700);
          }

          &.active {
            background: var(--primary-50);
            border-color: var(--primary-200);
            color: var(--primary-700);
            font-weight: 600;
            i {
              opacity: 1;
            }
          }
        }
      }

      .detail-content {
        display: flex;
        flex-direction: column;
        gap: var(--s-20);
      }

      /* Estado strip (shown when status ≠ BORRADOR) */
      .estado-strip {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 10px 16px;
        border-radius: 10px;
        font-size: 0.85rem;
        font-weight: 600;
        margin-bottom: 4px;

        &.strip-enviado {
          background: #dbeafe;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
        }
        &.strip-confirmado {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }
        &.strip-cancelado {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
      }
      .strip-meta {
        font-weight: 400;
        opacity: 0.85;
      }

      /* Standard detail sections */
      .detail-section {
        background: var(--surface-card);
        border: 1px solid var(--grey-100);
        border-radius: 16px;
        padding: var(--s-24);

        h2 {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--grey-500);
          margin: 0 0 var(--s-20) 0;
          padding-bottom: var(--s-12);
          border-bottom: 1px solid var(--grey-100);
        }
      }

      /* Tarifa highlight */
      .tarifa-section {
        background: linear-gradient(135deg, var(--primary-50) 0%, var(--surface-card) 100%);
      }
      .tarifa-highlight {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: var(--s-20);
        padding-bottom: var(--s-16);
        border-bottom: 1px solid var(--primary-100);
      }
      .tarifa-amount {
        font-size: 2rem;
        font-weight: 800;
        color: var(--primary-700);
        line-height: 1;
      }
      .tarifa-periodo {
        font-size: 1rem;
        color: var(--grey-500);
        font-weight: 500;
      }

      /* Info grid */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 24px 32px;

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;

        &.span-full {
          grid-column: 1 / -1;
        }

        label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--grey-500);
          font-weight: 700;
          margin: 0;
          display: block;
        }

        p {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--grey-900);
          margin: 0;
          line-height: 1.5;
        }

        .value-highlight {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--primary-700);
        }

        .mono-value {
          font-family: var(--font-family-mono, monospace);
          background: var(--grey-100);
          padding: 2px 8px;
          border-radius: 6px;
          display: inline-block;
          color: var(--primary-700);
          font-size: 0.85rem;
        }

        .unit {
          font-size: 0.75em;
          color: var(--grey-500);
          margin-left: 2px;
        }
        .text-italic {
          font-style: italic;
          color: var(--grey-600);
        }
      }

      .link-primary {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 600;
        &:hover {
          text-decoration: underline;
        }
      }

      /* Sidebar buttons */
      .sidebar-divider {
        height: 1px;
        background: var(--grey-100);
        margin: var(--s-16) 0;
      }

      .btn-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        font-weight: 600;
        margin-bottom: 8px;
        border-radius: 10px;

        i {
          width: 20px;
          text-align: center;
          font-size: 1.1em;
        }
      }
    `,
  ],
})
export class OrdenAlquilerDetailComponent implements OnInit {
  private service = inject(OrdenAlquilerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orden: OrdenAlquiler | null = null;
  loading = false;
  activeTab = 'general';

  tabs: TabConfig[] = [
    { id: 'general', label: 'Resumen', icon: 'fa-solid fa-circle-info' },
    { id: 'economics', label: 'Condiciones Económicas', icon: 'fa-solid fa-dollar-sign' },
  ];

  header: EntityDetailHeader = {
    title: 'Orden de Alquiler',
    icon: 'fa-solid fa-file-contract',
    statusLabel: 'Activa',
    statusClass: 'status-active',
  };

  auditInfo: AuditInfo = { entries: [] };

  ngOnInit() {
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);
    this.loading = true;
    this.service.obtener(id).subscribe({
      next: (o) => {
        this.orden = o;
        this.updateHeader();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private updateHeader(): void {
    if (!this.orden) return;
    const statusClasses: Record<string, string> = {
      BORRADOR: 'status-PENDIENTE',
      ENVIADO: 'status-EN_OPERACION',
      CONFIRMADO: 'status-APROBADO',
      CANCELADO: 'status-CANCELADO',
    };
    this.header = {
      icon: 'fa-solid fa-file-contract',
      title: this.orden.codigo,
      subtitle: `${this.orden.descripcion_equipo}`,
      codeBadge: this.orden.codigo,
      statusLabel: this.estadoLabel(this.orden.estado),
      statusClass: statusClasses[this.orden.estado] ?? '',
    };
    const entries: AuditEntry[] = [];
    if (this.orden.created_at)
      entries.push({ label: 'Fecha de creación', date: this.orden.created_at });
    if (this.orden.fecha_envio)
      entries.push({ label: 'Enviada al proveedor', date: this.orden.fecha_envio });
    if (this.orden.fecha_confirmacion)
      entries.push({ label: 'Confirmada', date: this.orden.fecha_confirmacion });
    this.auditInfo = { entries };
  }

  enviar() {
    const email = prompt(`Email del contacto proveedor para ${this.orden?.codigo} (opcional):`);
    if (email === null) return;
    this.service.enviar(this.orden!.id, email || undefined).subscribe({
      next: (o) => {
        this.orden = o;
        this.updateHeader();
      },
    });
  }

  confirmar() {
    const quien = prompt(`¿Quién confirmó la orden ${this.orden?.codigo} por parte del proveedor?`);
    if (quien === null) return;
    this.service.confirmar(this.orden!.id, quien || undefined).subscribe({
      next: (o) => {
        this.orden = o;
        this.updateHeader();
      },
    });
  }

  cancelar() {
    const motivo = prompt(`Motivo de cancelación de la orden ${this.orden?.codigo}:`);
    if (!motivo) return;
    this.service.cancelar(this.orden!.id, motivo).subscribe({
      next: (o) => {
        this.orden = o;
        this.updateHeader();
      },
    });
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado al Proveedor',
      CONFIRMADO: 'Confirmado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  tipoTarifaLabel(tipo: string): string {
    const labels: Record<string, string> = { HORA: 'Hora', DIA: 'Día', MES: 'Mes' };
    return labels[tipo] ?? tipo;
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      BORRADOR: 'fa-pencil',
      ENVIADO: 'fa-paper-plane',
      CONFIRMADO: 'fa-circle-check',
      CANCELADO: 'fa-ban',
    };
    return icons[estado] || 'fa-info-circle';
  }
}
