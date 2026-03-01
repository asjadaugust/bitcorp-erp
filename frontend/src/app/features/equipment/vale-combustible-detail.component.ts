import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import {
  ValeCombustibleService,
  ValeCombustible,
} from '../../core/services/vale-combustible.service';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
} from '../../shared/components/entity-detail';
import { ConfirmService } from '../../core/services/confirm.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-vale-combustible-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, EntityDetailShellComponent, ButtonComponent],
  template: `
    <app-entity-detail-shell
      [header]="header"
      [entity]="vale"
      [loading]="loading"
      [auditInfo]="auditInfo"
      loadingText="Cargando vale de combustible..."
    >
      <!-- ── ACTIONS ─────────────────────────────────── -->
      <ng-container entity-sidebar-actions>
        <app-button
          *ngIf="vale?.estado === 'PENDIENTE'"
          variant="secondary"
          icon="fa-pen-to-square"
          label="Editar"
          [fullWidth]="true"
          [routerLink]="['edit']"
          data-testid="btn-edit"
        ></app-button>
        <app-button
          *ngIf="vale?.estado === 'PENDIENTE'"
          variant="success"
          icon="fa-check"
          label="Registrar"
          [fullWidth]="true"
          [disabled]="actioning"
          (clicked)="registrar()"
          data-testid="btn-registrar"
        ></app-button>
        <app-button
          *ngIf="vale?.estado !== 'ANULADO'"
          variant="danger"
          icon="fa-ban"
          label="Anular"
          [fullWidth]="true"
          [disabled]="actioning"
          (clicked)="anular()"
          data-testid="btn-anular"
        ></app-button>
      </ng-container>

      <!-- ── MAIN CONTENT ──────────────────────────── -->
      <div entity-main-content class="detail-content" *ngIf="vale">
        <!-- Estado strip -->
        <div
          class="estado-strip"
          [ngClass]="'strip-' + vale.estado.toLowerCase()"
          data-testid="estado-strip"
        >
          <i class="fa-solid" [ngClass]="getStatusIcon(vale.estado)"></i>
          <span>{{ estadoLabel(vale.estado) }}</span>
        </div>

        <!-- Datos del Vale -->
        <section class="detail-section" data-testid="section-datos-vale">
          <h2>Datos del Vale</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Código</span>
              <p class="mono-value" data-testid="vale-codigo">{{ vale.codigo }}</p>
            </div>
            <div class="info-item">
              <span class="label">Número de Vale</span>
              <p data-testid="vale-numero">{{ vale.numero_vale }}</p>
            </div>
            <div class="info-item">
              <span class="label">Fecha</span>
              <p data-testid="vale-fecha">{{ vale.fecha | date: 'dd/MM/yyyy' }}</p>
            </div>
            <div class="info-item">
              <span class="label">Tipo de Combustible</span>
              <p>
                <span
                  class="fuel-badge fuel-{{ vale.tipo_combustible | lowercase }}"
                  data-testid="vale-tipo"
                >
                  {{ formatTipo(vale.tipo_combustible) }}
                </span>
              </p>
            </div>
          </div>
        </section>

        <!-- Consumo y Costos -->
        <section class="detail-section" data-testid="section-consumo">
          <h2>Consumo y Costos</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Cantidad (galones)</span>
              <p data-testid="vale-cantidad">{{ vale.cantidad_galones | number: '1.2-2' }} gal</p>
            </div>
            <div class="info-item">
              <span class="label">Precio Unitario</span>
              <p data-testid="vale-precio">
                <span *ngIf="vale.precio_unitario"
                  >S/ {{ vale.precio_unitario | number: '1.2-2' }}</span
                >
                <span *ngIf="!vale.precio_unitario" class="text-muted">—</span>
              </p>
            </div>
            <div class="info-item highlight-total">
              <span class="label">Monto Total</span>
              <p class="value-large" data-testid="vale-monto-total">
                <span *ngIf="vale.monto_total">S/ {{ vale.monto_total | number: '1.2-2' }}</span>
                <span *ngIf="!vale.monto_total" class="text-muted">—</span>
              </p>
            </div>
            <div class="info-item" *ngIf="vale.proveedor">
              <span class="label">Proveedor / Grifo</span>
              <p data-testid="vale-proveedor">{{ vale.proveedor }}</p>
            </div>
          </div>
        </section>

        <!-- Referencias -->
        <section
          class="detail-section"
          *ngIf="vale.equipo_id || vale.parte_diario_id || vale.proyecto_id"
        >
          <h2>Referencias</h2>
          <div class="info-grid">
            <div class="info-item" *ngIf="vale.equipo_id">
              <span class="label">Equipo</span>
              <p>
                <a
                  [routerLink]="['/equipment', vale.equipo_id]"
                  class="link-primary"
                  data-testid="link-equipo"
                >
                  <i
                    class="fa-solid fa-arrow-up-right-from-square"
                    style="font-size:0.75em;margin-right:4px;"
                  ></i>
                  Equipo #{{ vale.equipo_id }}
                </a>
              </p>
            </div>
            <div class="info-item" *ngIf="vale.parte_diario_id">
              <span class="label">Parte Diario</span>
              <p>
                <a
                  [routerLink]="['/equipment/daily-reports', vale.parte_diario_id]"
                  class="link-primary"
                  data-testid="link-parte-diario"
                >
                  <i
                    class="fa-solid fa-arrow-up-right-from-square"
                    style="font-size:0.75em;margin-right:4px;"
                  ></i>
                  Parte Diario #{{ vale.parte_diario_id }}
                </a>
              </p>
            </div>
            <div class="info-item" *ngIf="vale.proyecto_id">
              <span class="label">Proyecto</span>
              <p>
                <a
                  [routerLink]="['/projects', vale.proyecto_id]"
                  class="link-primary"
                  data-testid="link-proyecto"
                >
                  <i
                    class="fa-solid fa-arrow-up-right-from-square"
                    style="font-size:0.75em;margin-right:4px;"
                  ></i>
                  Proyecto #{{ vale.proyecto_id }}
                </a>
              </p>
            </div>
          </div>
        </section>

        <!-- Observaciones -->
        <section class="detail-section" *ngIf="vale.observaciones">
          <h2>Observaciones</h2>
          <p class="obs-text" data-testid="vale-observaciones">{{ vale.observaciones }}</p>
        </section>

        <!-- Error message -->
        <div *ngIf="errorMsg" class="alert alert-danger" role="alert">
          <i class="fa-solid fa-triangle-exclamation"></i> {{ errorMsg }}
        </div>
      </div>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      .detail-content {
        padding: 0 var(--s-24) var(--s-24);
      }
      .detail-section {
        margin-bottom: 24px;
        border-bottom: 1px solid var(--grey-200);
        padding-bottom: 16px;
      }
      .detail-section:last-child {
        border-bottom: none;
      }
      .detail-section h2 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--grey-700);
        margin-bottom: 12px;
      }
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;
      }
      .info-item label {
        font-size: 0.8rem;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.03em;
        font-weight: 500;
        display: block;
        margin-bottom: 4px;
      }
      .info-item p {
        font-size: 0.95rem;
        color: var(--grey-900);
        margin: 0;
      }
      .mono-value {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: inline-block;
      }
      .value-large {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--primary-900);
      }
      .highlight-total label {
        color: var(--primary-700);
      }
      .text-muted {
        color: var(--grey-400);
      }
      .obs-text {
        color: var(--grey-700);
        line-height: 1.5;
      }
      .link-primary {
        color: var(--primary-700);
        text-decoration: none;
      }
      .link-primary:hover {
        text-decoration: underline;
      }
      .fuel-badge {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.82em;
        font-weight: 600;
      }
      .fuel-diesel {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .fuel-gasolina_90 {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .fuel-gasolina_95 {
        background: var(--semantic-blue-100);
        color: var(--primary-900);
      }
      .fuel-glp {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .fuel-gnv {
        background: var(--primary-50);
        color: var(--primary-700);
      }
      .estado-strip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 16px;
        border-radius: var(--radius-md);
        margin-bottom: 20px;
        font-weight: 500;
        font-size: 0.9rem;
      }
      .strip-pendiente {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .strip-registrado {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .strip-anulado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
    `,
  ],
})
export class ValeCombustibleDetailComponent implements OnInit {
  private svc = inject(ValeCombustibleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);

  vale: ValeCombustible | null = null;
  loading = false;
  actioning = false;
  errorMsg = '';

  get header(): EntityDetailHeader {
    return {
      title: this.vale ? `Vale ${this.vale.codigo}` : 'Vale de Combustible',
      subtitle: this.vale
        ? `${this.formatTipo(this.vale.tipo_combustible)} — ${this.vale.fecha}`
        : '',
      icon: 'fa-gas-pump',
      statusLabel: this.vale ? this.estadoLabel(this.vale.estado) : '',
      statusClass: this.vale ? this.getEstadoBadgeClass(this.vale.estado) : '',
    };
  }

  get auditInfo(): AuditInfo | undefined {
    if (!this.vale) return undefined;
    return {
      entries: [
        { label: 'Creado', date: this.vale.created_at },
        { label: 'Actualizado', date: this.vale.updated_at },
      ],
    };
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) this.cargar(Number(id));
  }

  cargar(id: number) {
    this.loading = true;
    this.svc.obtener(id).subscribe({
      next: (vale) => {
        this.vale = vale;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  registrar() {
    if (!this.vale) return;
    this.confirmSvc
      .confirm({
        title: 'Registrar Vale',
        message: `¿Desea confirmar el registro del vale ${this.vale.codigo}?`,
        icon: 'fa-check-circle',
        confirmLabel: 'Registrar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.actioning = true;
          this.svc.registrar(this.vale!.id).subscribe({
            next: (vale) => {
              this.vale = vale;
              this.actioning = false;
            },
            error: (err) => {
              this.actioning = false;
              this.errorMsg = err?.error?.error?.message || 'Error al registrar el vale.';
            },
          });
        }
      });
  }

  anular() {
    if (!this.vale) return;
    this.confirmSvc
      .confirm({
        title: 'Anular Vale',
        message: `¿Está seguro de anular el vale ${this.vale.codigo}? Esta acción no se puede deshacer.`,
        icon: 'fa-circle-exclamation',
        confirmLabel: 'Anular',
        isDanger: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.actioning = true;
          this.svc.anular(this.vale!.id).subscribe({
            next: (vale) => {
              this.vale = vale;
              this.actioning = false;
            },
            error: (err) => {
              this.actioning = false;
              this.errorMsg = err?.error?.error?.message || 'Error al anular el vale.';
            },
          });
        }
      });
  }

  formatTipo(tipo: string): string {
    const map: Record<string, string> = {
      DIESEL: 'Diesel',
      GASOLINA_90: 'Gasolina 90',
      GASOLINA_95: 'Gasolina 95',
      GLP: 'GLP',
      GNV: 'GNV',
    };
    return map[tipo] || tipo;
  }

  getStatusIcon(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'fa-clock',
      REGISTRADO: 'fa-check-circle',
      ANULADO: 'fa-ban',
    };
    return map[estado] || 'fa-circle';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente de Registro',
      REGISTRADO: 'Registrado',
      ANULADO: 'Anulado',
    };
    return map[estado] || estado;
  }

  getEstadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'badge-warning',
      REGISTRADO: 'badge-success',
      ANULADO: 'badge-danger',
    };
    return map[estado] || 'badge-secondary';
  }
}
