import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  PeriodoInoperatividadService,
  PeriodoInoperatividad,
} from '../../core/services/periodo-inoperatividad.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-periodo-inoperatividad-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroTableComponent,
    FilterBarComponent,
  ],
  template: `
    <!-- Standalone page (when accessed via /equipment/inoperatividad) -->
    @if (!equipoId) {
      <app-page-layout
        title="Períodos de Inoperatividad"
        icon="fa-triangle-exclamation"
        [breadcrumbs]="breadcrumbs"
        [loading]="loading"
      >
        <app-actions-container actions>
          <button type="button" class="btn btn-primary" (click)="irANuevo()">
            <i class="fa-solid fa-plus"></i> Registrar Inoperatividad
          </button>
        </app-actions-container>

        <app-filter-bar
          [config]="filterConfig"
          (filterChange)="onFilterChange($event)"
        ></app-filter-bar>

        <aero-table
          [columns]="columns"
          [data]="periodos"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            equipo_codigo: equipoTemplate,
            estado: estadoTemplate,
            excede: excedeTemplate,
            dias: diasTemplate,
          }"
          (rowClick)="verDetalle($event)"
        ></aero-table>

        <ng-container *ngTemplateOutlet="sharedTemplates"></ng-container>
      </app-page-layout>
    }

    <!-- Embedded inside equipment-detail tab -->
    @if (equipoId) {
      <div class="embedded-header">
        <h4><i class="fa-solid fa-triangle-exclamation"></i> Períodos de Inoperatividad</h4>
        <button type="button" class="btn btn-sm btn-primary" (click)="irANuevo()">
          <i class="fa-solid fa-plus"></i> Registrar
        </button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="periodos"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          equipo_codigo: equipoTemplate,
          estado: estadoTemplate,
          excede: excedeTemplate,
          dias: diasTemplate,
        }"
        (rowClick)="verDetalle($event.id)"
      ></aero-table>
    }

    <!-- Shared templates (declared once, referenced above) -->
    <ng-template #sharedTemplates></ng-template>

    <ng-template #equipoTemplate let-row>
      <div class="equipo-cell">
        <span class="equipo-codigo">{{ row.equipo_codigo || '#' + row.equipo_id }}</span>
        @if (row.equipo_descripcion) {
          <span class="equipo-desc">{{ row.equipo_descripcion }}</span>
        }
      </div>
    </ng-template>

    <ng-template #estadoTemplate let-row>
      <span class="badge" [ngClass]="estadoClass(row.estado)">{{ estadoLabel(row.estado) }}</span>
    </ng-template>

    <ng-template #excedeTemplate let-row>
      @if (row.excede_plazo) {
        <span class="badge badge-danger">
          <i class="fa-solid fa-triangle-exclamation"></i> Excedido
        </span>
      } @else if (row.estado === 'ACTIVO') {
        <span class="badge badge-warning">
          {{ row.dias_restantes }} día{{ row.dias_restantes !== 1 ? 's' : '' }} restante{{
            row.dias_restantes !== 1 ? 's' : ''
          }}
        </span>
      } @else {
        <span class="badge badge-success">Dentro del plazo</span>
      }
    </ng-template>

    <ng-template #diasTemplate let-row>
      <span [class]="diasClass(row)">
        {{ row.dias_inoperativo }} día{{ row.dias_inoperativo !== 1 ? 's' : '' }}
      </span>
    </ng-template>

    <ng-template #actionsTemplate let-row>
      <div class="row-actions">
        @if (row.estado === 'ACTIVO') {
          <button
            class="btn btn-sm btn-success"
            (click)="$event.stopPropagation(); abrirResolver(row)"
          >
            <i class="fa-solid fa-check"></i> Resolver
          </button>
        }
        @if (row.excede_plazo && !row.penalidad_aplicada) {
          <button
            class="btn btn-sm btn-danger"
            (click)="$event.stopPropagation(); abrirPenalidad(row)"
          >
            <i class="fa-solid fa-gavel"></i> Penalizar
          </button>
        }
      </div>
    </ng-template>

    <!-- Resolve Modal -->
    @if (showResolverModal && selectedPeriodo) {
      <div
        class="modal-overlay"
        (click)="cerrarModales()"
        (keydown.enter)="cerrarModales()"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-panel"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h3>Resolver Período de Inoperatividad</h3>
            <button class="btn-close" (click)="cerrarModales()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="info-text">
              Equipo #{{ selectedPeriodo.equipo_id }} — inicio:
              <strong>{{ selectedPeriodo.fecha_inicio | date: 'dd/MM/yyyy' }}</strong>
            </p>
            <div class="form-group">
              <span class="label">Fecha de resolución *</span>
              <input type="date" class="form-control" [(ngModel)]="resolverForm.fecha_fin" />
            </div>
            <div class="form-group">
              <span class="label">Observaciones</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="resolverForm.observaciones_penalidad"
                placeholder="Cómo se resolvió la inoperatividad..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button>
            <button
              class="btn btn-success"
              [disabled]="saving || !resolverForm.fecha_fin"
              (click)="confirmarResolver()"
            >
              <i class="fa-solid fa-check"></i>
              {{ saving ? 'Guardando...' : 'Confirmar Resolución' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Penalty Modal -->
    @if (showPenalidadModal && selectedPeriodo) {
      <div
        class="modal-overlay"
        (click)="cerrarModales()"
        (keydown.enter)="cerrarModales()"
        tabindex="0"
        role="button"
      >
        <div
          class="modal-panel"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="dialog"
        >
          <div class="modal-header">
            <h3>Aplicar Penalidad — Cláusula 7.6</h3>
            <button class="btn-close" (click)="cerrarModales()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="alert alert-danger">
              El equipo #{{ selectedPeriodo.equipo_id }} lleva
              <strong>{{ selectedPeriodo.dias_inoperativo }} días</strong> inoperativo, superando el
              plazo de {{ selectedPeriodo.dias_plazo }} días (Cláusula 7.6).
            </div>
            <div class="form-group">
              <span class="label">Monto de penalidad (S/) *</span>
              <input
                type="number"
                class="form-control"
                [(ngModel)]="penalidadForm.monto_penalidad"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div class="form-group">
              <span class="label">Fundamento / Observaciones</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="penalidadForm.observaciones_penalidad"
                placeholder="Base legal y cálculo de la penalidad..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button>
            <button
              class="btn btn-danger"
              [disabled]="saving || !penalidadForm.monto_penalidad"
              (click)="confirmarPenalidad()"
            >
              <i class="fa-solid fa-gavel"></i> {{ saving ? 'Guardando...' : 'Aplicar Penalidad' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .embedded-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
        h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
      }
      .badge-danger {
        background: #fee2e2;
        color: #dc2626;
      }
      .badge-warning {
        background: #fef9c3;
        color: #ca8a04;
      }
      .badge-success {
        background: #dcfce7;
        color: #16a34a;
      }
      .badge-secondary {
        background: #f1f5f9;
        color: #475569;
      }

      .dias-danger {
        color: #dc2626;
        font-weight: 700;
      }
      .dias-warning {
        color: #ca8a04;
        font-weight: 600;
      }
      .dias-ok {
        color: #475569;
      }

      .equipo-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .equipo-codigo {
        font-family: monospace;
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 4px;
        display: inline-block;
      }
      .equipo-desc {
        font-size: 12px;
        color: #64748b;
      }

      .row-actions {
        display: flex;
        gap: 6px;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-panel {
        background: #fff;
        border-radius: 8px;
        width: 100%;
        max-width: 480px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid #e2e8f0;
      }
      .modal-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
      }
      .btn-close {
        background: none;
        border: none;
        cursor: pointer;
        color: #94a3b8;
        font-size: 18px;
        padding: 4px;
      }
      .modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid #e2e8f0;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .form-group label {
        font-size: 13px;
        font-weight: 600;
        color: #374151;
      }
      .form-control {
        border: 1px solid #d1d5db;
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
      }
      .form-control:focus {
        outline: none;
        border-color: #4f46e5;
        box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
      }

      .alert {
        border-radius: 6px;
        padding: 10px 14px;
        font-size: 13px;
      }
      .alert-danger {
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
      }

      .info-text {
        font-size: 13px;
        color: #475569;
        margin: 0;
      }

      .btn {
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .btn-primary {
        background: #4f46e5;
        color: #fff;
      }
      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .btn-success {
        background: #16a34a;
        color: #fff;
      }
      .btn-danger {
        background: #dc2626;
        color: #fff;
      }
      .btn-sm {
        padding: 4px 10px;
        font-size: 12px;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class PeriodoInoperatividadListComponent implements OnInit {
  @Input() equipoId?: number; // when embedded inside equipment-detail tab

  private service = inject(PeriodoInoperatividadService);
  private router = inject(Router);

  loading = false;
  saving = false;
  periodos: PeriodoInoperatividad[] = [];

  showResolverModal = false;
  showPenalidadModal = false;
  selectedPeriodo: PeriodoInoperatividad | null = null;

  resolverForm = { fecha_fin: '', observaciones_penalidad: '' };
  penalidadForm = { monto_penalidad: 0, observaciones_penalidad: '' };

  breadcrumbs = [{ label: 'Equipos', url: '/equipment' }, { label: 'Inoperatividad' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'RESUELTO', label: 'Resuelto' },
        { value: 'PENALIZADO', label: 'Penalizado' },
      ],
    },
    {
      key: 'excede_plazo',
      label: 'SLA',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'true', label: 'Solo excedidos' },
        { value: 'false', label: 'Dentro del plazo' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'equipo_codigo', label: 'Equipo', type: 'template' },
    { key: 'fecha_inicio', label: 'Inicio', type: 'date' },
    { key: 'fecha_fin', label: 'Fin', type: 'date' },
    { key: 'dias', label: 'Días inop.', type: 'template' },
    { key: 'estado', label: 'Estado', type: 'template' },
    { key: 'excede', label: 'SLA (5 días)', type: 'template' },
  ];

  private filters: Record<string, string> = {};

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.service
      .listar({
        equipo_id: this.equipoId,
        estado: this.filters['estado'] || undefined,
        excede_plazo:
          this.filters['excede_plazo'] !== undefined && this.filters['excede_plazo'] !== ''
            ? this.filters['excede_plazo'] === 'true'
            : undefined,
        limit: 50,
      })
      .subscribe({
        next: (res) => {
          this.periodos = res.data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  onFilterChange(f: Record<string, string>) {
    this.filters = f;
    this.cargar();
  }

  verDetalle(p: PeriodoInoperatividad) {
    this.router.navigate(['/equipment', p.equipo_id]);
  }

  irANuevo() {
    const queryParams: Record<string, string> = {};
    if (this.equipoId) queryParams['equipo_id'] = String(this.equipoId);
    this.router.navigate(['/equipment/inoperatividad/new'], { queryParams });
  }

  abrirResolver(p: PeriodoInoperatividad) {
    this.selectedPeriodo = p;
    this.resolverForm = { fecha_fin: '', observaciones_penalidad: '' };
    this.showResolverModal = true;
  }

  abrirPenalidad(p: PeriodoInoperatividad) {
    this.selectedPeriodo = p;
    this.penalidadForm = { monto_penalidad: 0, observaciones_penalidad: '' };
    this.showPenalidadModal = true;
  }

  cerrarModales() {
    this.showResolverModal = false;
    this.showPenalidadModal = false;
    this.selectedPeriodo = null;
  }

  confirmarResolver() {
    if (!this.selectedPeriodo || !this.resolverForm.fecha_fin) return;
    this.saving = true;
    this.service.resolver(this.selectedPeriodo.id, this.resolverForm).subscribe({
      next: () => {
        this.saving = false;
        this.cerrarModales();
        this.cargar();
      },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.error?.message || 'Error al resolver el período');
      },
    });
  }

  confirmarPenalidad() {
    if (!this.selectedPeriodo || !this.penalidadForm.monto_penalidad) return;
    this.saving = true;
    this.service.aplicarPenalidad(this.selectedPeriodo.id, this.penalidadForm).subscribe({
      next: () => {
        this.saving = false;
        this.cerrarModales();
        this.cargar();
      },
      error: (err) => {
        this.saving = false;
        alert(err?.error?.error?.message || 'Error al aplicar la penalidad');
      },
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'Activo',
      RESUELTO: 'Resuelto',
      PENALIZADO: 'Penalizado',
    };
    return map[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO: 'badge-warning',
      RESUELTO: 'badge-success',
      PENALIZADO: 'badge-danger',
    };
    return map[estado] ?? 'badge-secondary';
  }

  diasClass(row: PeriodoInoperatividad): string {
    if (row.excede_plazo) return 'dias-danger';
    if (row.dias_inoperativo >= row.dias_plazo - 1) return 'dias-warning';
    return 'dias-ok';
  }
}
