import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ActaDevolucionService, ActaDevolucion } from '../../core/services/acta-devolucion.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Breadcrumb } from '../../shared/components/page-layout/page-layout.component';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  AuditEntry,
  TabConfig,
} from '../../shared/components/entity-detail';

@Component({
  selector: 'app-acta-devolucion-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EntityDetailShellComponent],
  template: `
    <entity-detail-shell
      [header]="header"
      [entity]="acta"
      [loading]="loading"
      [auditInfo]="auditInfo"
      loadingText="Cargando detalles del acta..."
    >
      <!-- ── TABS NAVIGATION ──────────────────────────────────── -->
      <div entity-header-below class="detail-tabs">
        <button
          *ngFor="let tab of tabConfigs"
          class="tab-link"
          [class.active]="activeTab === tab.id"
          (click)="activeTab = tab.id"
        >
          <i [class]="tab.icon"></i>
          {{ tab.label }}
        </button>
      </div>

      <!-- ── MAIN CONTENT ────────────────────────────────────── -->
      <div entity-main-content class="detail-content">
        <!-- Tab: Resumen -->
        @if (activeTab === 'general') {
          <section class="detail-section">
            <h2>Información del Acta</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Código de Equipo</span>
                <p>
                  <a [routerLink]="['/equipment', acta?.equipo_id]" class="link-primary">
                    <i
                      class="fa-solid fa-arrow-up-right-from-square"
                      style="font-size:0.75em; margin-right:4px;"
                    ></i>
                    {{ acta?.equipo_codigo || '#' + acta?.equipo_id }}
                  </a>
                </p>
              </div>
              <div class="info-item" *ngIf="acta?.contrato_id">
                <span class="label">Contrato Relacionado</span>
                <p>
                  <a
                    [routerLink]="['/equipment/contracts', acta?.contrato_id]"
                    class="link-primary"
                  >
                    <i
                      class="fa-solid fa-file-contract"
                      style="font-size:0.75em; margin-right:4px;"
                    ></i>
                    #{{ acta?.contrato_id }}
                  </a>
                </p>
              </div>
              <div class="info-item">
                <span class="label">Proyecto</span>
                <p class="value-highlight">
                  {{ acta?.proyecto_nombre || '#' + acta?.proyecto_id || 'N/A' }}
                </p>
              </div>
              <div class="info-item">
                <span class="label">Fecha de Devolución</span>
                <p>{{ acta?.fecha_devolucion | date: 'dd/MM/yyyy' }}</p>
              </div>
              <div class="info-item">
                <span class="label">Tipo de Acta</span>
                <p>{{ tipoLabel(acta?.tipo || '') }}</p>
              </div>
            </div>
          </section>
        }

        <!-- Tab: Condición y Uso -->
        @if (activeTab === 'condition') {
          <section class="detail-section">
            <h2>Condición y Uso del Equipo</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Estado del Equipo</span>
                <div>
                  <span
                    class="condition-badge"
                    [ngClass]="condicionClass(acta?.condicion_equipo || '')"
                  >
                    <i class="fa-solid" [ngClass]="condicionIcon(acta?.condicion_equipo || '')"></i>
                    {{ condicionLabel(acta?.condicion_equipo || '') }}
                  </span>
                </div>
              </div>
              <div
                class="info-item"
                *ngIf="
                  acta?.horometro_devolucion !== null && acta?.horometro_devolucion !== undefined
                "
              >
                <span class="label">Horómetro Final</span>
                <p class="value-highlight mono">
                  {{ acta?.horometro_devolucion | number: '1.1-2' }} <span class="unit">h</span>
                </p>
              </div>
              <div
                class="info-item"
                *ngIf="
                  acta?.kilometraje_devolucion !== null &&
                  acta?.kilometraje_devolucion !== undefined
                "
              >
                <span class="label">Kilometraje Final</span>
                <p class="value-highlight mono">
                  {{ acta?.kilometraje_devolucion | number: '1.1-2' }} <span class="unit">km</span>
                </p>
              </div>
            </div>
          </section>
        }

        <!-- Tab: Firmas y Obs -->
        @if (activeTab === 'signatures') {
          <!-- Registrar Firma Panel -->
          <div class="firma-panel card" *ngIf="mostrarFirma && acta?.estado === 'PENDIENTE'">
            <div class="section-header">
              <h3>Registrar Firmas</h3>
            </div>
            <div class="firma-form">
              <div class="form-group">
                <span class="label">ID Usuario que Entrega</span>
                <input type="number" class="form-control" [(ngModel)]="firmaDto.entregado_por" />
              </div>
              <div class="form-group">
                <span class="label">ID Usuario que Recibe</span>
                <input type="number" class="form-control" [(ngModel)]="firmaDto.recibido_por" />
              </div>
              <div class="firma-actions">
                <button class="btn btn-ghost" (click)="mostrarFirma = false">Cancelar</button>
                <button class="btn btn-success" (click)="firmar()">
                  <i class="fa-solid fa-check"></i> Confirmar Firmas
                </button>
              </div>
            </div>
          </div>

          <section class="detail-section">
            <h2>Estado de Firmas</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Entregado por</span>
                <div class="signature-status" [class.signed]="acta?.tiene_firma_entregado">
                  <i
                    class="fa-solid"
                    [class.fa-circle-check]="acta?.tiene_firma_entregado"
                    [class.fa-clock]="!acta?.tiene_firma_entregado"
                  ></i>
                  <div>
                    <p>{{ acta?.tiene_firma_entregado ? 'Firmado' : 'Pendiente' }}</p>
                    <small *ngIf="acta?.entregado_por">Usuario #{{ acta?.entregado_por }}</small>
                  </div>
                </div>
              </div>
              <div class="info-item">
                <span class="label">Recibido por</span>
                <div class="signature-status" [class.signed]="acta?.tiene_firma_recibido">
                  <i
                    class="fa-solid"
                    [class.fa-circle-check]="acta?.tiene_firma_recibido"
                    [class.fa-clock]="!acta?.tiene_firma_recibido"
                  ></i>
                  <div>
                    <p>{{ acta?.tiene_firma_recibido ? 'Firmado' : 'Pendiente' }}</p>
                    <small *ngIf="acta?.recibido_por">Usuario #{{ acta?.recibido_por }}</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          @if (acta?.observaciones || acta?.observaciones_fisicas) {
            <section class="detail-section mt-24">
              <h2>Observaciones</h2>
              <div class="info-grid">
                <div class="info-item" *ngIf="acta?.observaciones">
                  <span class="label">Observaciones Generales</span>
                  <p class="text-italic">{{ acta?.observaciones }}</p>
                </div>
                <div class="info-item" *ngIf="acta?.observaciones_fisicas">
                  <span class="label">Observaciones Físicas</span>
                  <p class="text-italic text-danger-soft">{{ acta?.observaciones_fisicas }}</p>
                </div>
              </div>
            </section>
          }
        }
      </div>

      <!-- ── SIDEBAR ACTIONS ───────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <button
          *ngIf="acta && ['BORRADOR', 'PENDIENTE'].includes(acta.estado)"
          class="btn btn-secondary btn-block"
          [routerLink]="['edit']"
        >
          <i class="fa-solid fa-pen-to-square"></i> Editar Acta
        </button>

        <button
          *ngIf="acta?.estado === 'BORRADOR'"
          class="btn btn-primary btn-block"
          (click)="enviarParaFirma()"
        >
          <i class="fa-solid fa-paper-plane"></i> Enviar para Firma
        </button>

        <button
          *ngIf="acta?.estado === 'PENDIENTE'"
          class="btn btn-success btn-block"
          (click)="mostrarFirma = true; activeTab = 'signatures'"
        >
          <i class="fa-solid fa-pen-nib"></i> Registrar Firma
        </button>

        <button
          *ngIf="acta && !['ANULADO', 'FIRMADO'].includes(acta.estado)"
          class="btn btn-danger btn-block"
          (click)="anular()"
        >
          <i class="fa-solid fa-ban"></i> Anular Acta
        </button>

        <div class="sidebar-divider"></div>

        <button
          type="button"
          class="btn btn-ghost btn-block"
          routerLink="/equipment/actas-devolucion"
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
        gap: var(--s-24);
      }

      .detail-section {
        background: var(--surface-card);
        border: 1px solid var(--grey-100);
        border-radius: 16px;
        padding: var(--s-24);

        h2 {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--grey-500);
          margin: 0 0 var(--s-20) 0;
          padding-bottom: var(--s-12);
          border-bottom: 1px solid var(--grey-100);
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 28px 40px;

        @media (max-width: 768px) {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 6px;

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
          line-height: 1.4;
        }

        .value-highlight {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--primary-700);
        }

        .mono {
          font-family: var(--font-family-mono, monospace);
          .unit {
            font-size: 0.75em;
            color: var(--grey-500);
            margin-left: 2px;
          }
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

      /* Condition badges */
      .condition-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 5px 14px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 700;
        letter-spacing: 0.03em;

        &.badge-bueno {
          background: #d1fae5;
          color: #065f46;
        }
        &.badge-regular {
          background: #fef3c7;
          color: #92400e;
        }
        &.badge-malo {
          background: #fee2e2;
          color: #991b1b;
        }
        &.badge-obs {
          background: #dbeafe;
          color: #1e40af;
        }
      }

      /* Signature status */
      .signature-status {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        color: var(--grey-500);
        font-size: 0.9rem;

        i {
          font-size: 1.2rem;
          margin-top: 2px;
          flex-shrink: 0;
        }

        p {
          margin: 0;
          font-weight: 600;
          color: var(--grey-600);
        }
        small {
          font-size: 0.75rem;
          color: var(--grey-400);
          font-weight: 400;
        }

        &.signed {
          color: var(--semantic-green-600);
          i {
            color: var(--semantic-green-600);
          }
          p {
            color: var(--semantic-green-700);
          }
        }
      }

      /* Firma panel */
      .firma-panel {
        padding: var(--s-24);
        background: var(--primary-50);
        border: 1px solid var(--primary-100);
        border-radius: 16px;

        h3 {
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--primary-700);
          margin: 0 0 var(--s-16) 0;
        }
      }

      .firma-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .firma-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 8px;
      }

      /* Misc */
      .text-italic {
        font-style: italic;
        color: var(--grey-600);
      }
      .text-danger-soft {
        color: #991b1b;
        font-style: italic;
      }
      .mt-24 {
        margin-top: 24px;
      }

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
export class ActaDevolucionDetailComponent implements OnInit {
  private svc = inject(ActaDevolucionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  acta: ActaDevolucion | null = null;
  loading = false;
  mostrarFirma = false;
  firmaDto: { entregado_por?: number; recibido_por?: number } = {};
  activeTab = 'general';

  tabConfigs: TabConfig[] = [
    { id: 'general', label: 'Resumen', icon: 'fa-solid fa-circle-info' },
    { id: 'condition', label: 'Condición y Uso', icon: 'fa-solid fa-gauge' },
    { id: 'signatures', label: 'Firmas y Obs', icon: 'fa-solid fa-file-signature' },
  ];

  header: EntityDetailHeader = {
    title: 'Acta de Devolución',
    icon: 'fa-solid fa-file-signature',
    statusLabel: 'Completada',
    statusClass: 'status-completed',
  };

  auditInfo: AuditInfo = {
    entries: [],
  };

  breadcrumbs: Breadcrumb[] = [
    { label: 'Equipo', url: '/equipment' },
    { label: 'Actas de Devolución', url: '/equipment/actas-devolucion' },
    { label: 'Detalle' },
  ];

  ngOnInit() {
    const id = parseInt(this.route.snapshot.paramMap.get('id')!);
    this.cargar(id);
  }

  cargar(id: number) {
    this.loading = true;
    this.svc.obtener(id).subscribe({
      next: (a) => {
        this.acta = a;
        this.updateHeaderAndAudit();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  private updateHeaderAndAudit(): void {
    if (!this.acta) return;

    this.header = {
      icon: 'fa-solid fa-file-signature',
      title: this.acta.codigo,
      subtitle: this.tipoLabel(this.acta.tipo),
      codeBadge: this.acta.codigo,
      statusLabel: this.acta.estado,
      statusClass: 'status-' + this.acta.estado.toLowerCase(),
    };

    const entries: AuditEntry[] = [];
    if (this.acta.created_at) {
      entries.push({ label: 'Fecha de creación', date: this.acta.created_at });
    }
    if (this.acta.fecha_firma) {
      entries.push({ label: 'Firmado el', date: this.acta.fecha_firma });
    }

    this.auditInfo = { entries };
  }

  enviarParaFirma() {
    if (!this.acta) return;
    this.confirmSvc
      .confirm({
        title: 'Enviar para Firma',
        message: `¿Desea enviar el acta ${this.acta.codigo} para firma?`,
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.enviarParaFirma(this.acta!.id).subscribe({
            next: (a) => {
              this.acta = a;
              this.updateHeaderAndAudit();
            },
          });
        }
      });
  }

  firmar() {
    if (!this.acta) return;
    this.svc.firmar(this.acta.id, this.firmaDto).subscribe({
      next: (a) => {
        this.acta = a;
        this.mostrarFirma = false;
        this.updateHeaderAndAudit();
      },
    });
  }

  anular() {
    if (!this.acta) return;
    const obs = prompt('Motivo de anulación:');
    if (!obs) return;
    this.confirmSvc
      .confirm({
        title: 'Anular Acta',
        message: `¿Está seguro de anular el acta ${this.acta.codigo}? Esta acción no se puede deshacer.`,
        icon: 'fa-ban',
        confirmLabel: 'Anular',
        isDanger: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.anular(this.acta!.id, obs).subscribe({
            next: (a) => {
              this.acta = a;
              this.updateHeaderAndAudit();
            },
          });
        }
      });
  }

  tipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      DEVOLUCION: 'Devolución',
      DESMOBILIZACION: 'Desmovilización',
      TRANSFERENCIA: 'Transferencia',
    };
    return labels[tipo] ?? tipo;
  }

  condicionClass(c: string) {
    return {
      'badge-bueno': c === 'BUENO',
      'badge-regular': c === 'REGULAR',
      'badge-malo': c === 'MALO',
      'badge-obs': c === 'CON_OBSERVACIONES',
    };
  }

  condicionIcon(c: string): string {
    const icons: Record<string, string> = {
      BUENO: 'fa-circle-check',
      REGULAR: 'fa-triangle-exclamation',
      MALO: 'fa-circle-xmark',
      CON_OBSERVACIONES: 'fa-eye',
    };
    return icons[c] ?? 'fa-circle-info';
  }

  condicionLabel(c: string): string {
    const labels: Record<string, string> = {
      BUENO: 'Bueno',
      REGULAR: 'Regular',
      MALO: 'Malo',
      CON_OBSERVACIONES: 'Con Observaciones',
    };
    return labels[c] ?? c;
  }
}
