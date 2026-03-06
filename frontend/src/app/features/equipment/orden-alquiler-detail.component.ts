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
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroButtonComponent, BreadcrumbItem } from '../../core/design-system';

@Component({
  selector: 'app-orden-alquiler-detail',
  standalone: true,
  imports: [
    AeroButtonComponent,
    CommonModule,
    FormsModule,
    RouterModule,
    EntityDetailShellComponent,
  ],
  template: `
    <app-entity-detail-shell
      [header]="header"
      [entity]="orden"
      [loading]="loading"
      [auditInfo]="auditInfo"
      [backUrl]="'/equipment/ordenes-alquiler'"
      [breadcrumbs]="breadcrumbs"
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
                <span class="label">Código</span>
                <p class="mono-value">{{ orden?.codigo }}</p>
              </div>
              <div class="info-item">
                <span class="label">ID Proveedor</span>
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
                <span class="label">Equipo</span>
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
                <span class="label">Proyecto</span>
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
                <span class="label">Solicitud Origen</span>
                <p>
                  <a
                    [routerLink]="[
                      '/equipment/operaciones/solicitudes',
                      orden?.solicitud_equipo_id,
                    ]"
                    class="link-primary"
                  >
                    Ver Solicitud #{{ orden?.solicitud_equipo_id }}
                  </a>
                </p>
              </div>
              <div class="info-item span-full">
                <span class="label">Descripción del Equipo</span>
                <p>{{ orden?.descripcion_equipo }}</p>
              </div>
            </div>
          </section>

          <section class="detail-section">
            <h2>Fechas</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Fecha de Orden</span>
                <p>{{ orden?.fecha_orden | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.fecha_inicio_estimada">
                <span class="label">Inicio Estimado</span>
                <p>{{ orden?.fecha_inicio_estimada | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.fecha_fin_estimada">
                <span class="label">Fin Estimado</span>
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
                <span class="label">Tipo de Cambio</span>
                <p>S/ {{ orden?.tipo_cambio | number: '1.4-4' }}</p>
              </div>
              <div class="info-item" *ngIf="orden?.horas_incluidas">
                <span class="label">Horas Incluidas</span>
                <p class="value-highlight mono-value">
                  {{ orden?.horas_incluidas }} <span class="unit">h</span>
                </p>
              </div>
              <div class="info-item" *ngIf="orden?.penalidad_exceso">
                <span class="label">Penalidad por Hora Excedente</span>
                <p>{{ orden?.moneda }} {{ orden?.penalidad_exceso | number: '1.2-2' }} / h</p>
              </div>
            </div>
          </section>

          @if (orden?.condiciones_especiales || orden?.observaciones) {
            <section class="detail-section">
              <h2>Notas y Condiciones</h2>
              <div class="info-grid">
                <div class="info-item span-full" *ngIf="orden?.condiciones_especiales">
                  <span class="label">Condiciones Especiales</span>
                  <p class="text-italic">{{ orden?.condiciones_especiales }}</p>
                </div>
                <div class="info-item span-full" *ngIf="orden?.observaciones">
                  <span class="label">Observaciones</span>
                  <p class="text-italic">{{ orden?.observaciones }}</p>
                </div>
              </div>
            </section>
          }
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ──────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <aero-button
          *ngIf="orden && ['BORRADOR', 'ENVIADO'].includes(orden.estado)"
          variant="secondary"
          iconLeft="fa-pen-to-square"
          [fullWidth]="true"
          [routerLink]="['/equipment/operaciones/ordenes-alquiler', orden.id, 'edit']"
          >Editar Orden</aero-button
        >

        <aero-button
          *ngIf="orden?.estado === 'BORRADOR'"
          variant="primary"
          iconLeft="fa-paper-plane"
          [fullWidth]="true"
          (clicked)="enviar()"
          >Enviar al Proveedor</aero-button
        >

        <aero-button
          *ngIf="orden?.estado === 'ENVIADO'"
          variant="primary"
          iconLeft="fa-circle-check"
          [fullWidth]="true"
          (clicked)="confirmar()"
          >Confirmar Orden</aero-button
        >

        <aero-button
          *ngIf="orden && ['BORRADOR', 'ENVIADO'].includes(orden.estado)"
          variant="danger"
          iconLeft="fa-ban"
          [fullWidth]="true"
          (clicked)="cancelar()"
          >Cancelar Orden</aero-button
        >
      </ng-container>
    </app-entity-detail-shell>
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
          background: var(--grey-100);
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
          background: var(--semantic-blue-50);
          color: var(--semantic-blue-700);
          border: 1px solid var(--semantic-blue-100);
        }
        &.strip-confirmado {
          background: var(--semantic-green-50);
          color: var(--primary-900);
          border: 1px solid var(--semantic-blue-100);
        }
        &.strip-cancelado {
          background: var(--semantic-red-50);
          color: var(--grey-900);
          border: 1px solid var(--grey-100);
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

      .sidebar-divider {
        border: none;
        border-top: 1px solid var(--grey-100);
        margin: var(--s-16) 0;
      }
    `,
  ],
})
export class OrdenAlquilerDetailComponent implements OnInit {
  private service = inject(OrdenAlquilerService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Órdenes de Alquiler', url: '/equipment/ordenes-alquiler' },
      { label: this.orden?.codigo || 'Detalle' },
    ];
  }

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
    if (!this.orden) return;
    this.confirmSvc
      .prompt({
        title: 'Enviar al Proveedor',
        message: `Email del contacto proveedor para ${this.orden.codigo} (opcional):`,
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((email) => {
        if (email !== null) {
          this.service.enviar(this.orden!.id, email || undefined).subscribe({
            next: (o) => {
              this.orden = o;
              this.updateHeader();
            },
          });
        }
      });
  }

  confirmar() {
    if (!this.orden) return;
    this.confirmSvc
      .prompt({
        title: 'Confirmar Orden',
        message: `¿Quién confirmó la orden ${this.orden.codigo} por parte del proveedor?`,
        icon: 'fa-circle-check',
        confirmLabel: 'Confirmar',
      })
      .subscribe((quien) => {
        if (quien !== null) {
          this.service.confirmar(this.orden!.id, quien || undefined).subscribe({
            next: (o) => {
              this.orden = o;
              this.updateHeader();
            },
          });
        }
      });
  }

  cancelar() {
    if (!this.orden) return;
    this.confirmSvc
      .prompt({
        title: 'Cancelar Orden',
        message: `Motivo de cancelación de la orden ${this.orden.codigo}:`,
        icon: 'fa-ban',
        confirmLabel: 'Cancelar Orden',
        isDanger: true,
        inputRequired: true,
      })
      .subscribe((motivo) => {
        if (motivo) {
          this.service.cancelar(this.orden!.id, motivo).subscribe({
            next: (o) => {
              this.orden = o;
              this.updateHeader();
            },
          });
        }
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
