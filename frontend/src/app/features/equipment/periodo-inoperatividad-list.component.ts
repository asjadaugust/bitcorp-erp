import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  PeriodoInoperatividadService,
  PeriodoInoperatividad,
} from '../../core/services/periodo-inoperatividad.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-periodo-inoperatividad-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    FilterBarComponent,
    AeroButtonComponent,
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
          <aero-button variant="primary" iconLeft="fa-plus" (clicked)="irANuevo()"
            >Registrar Inoperatividad</aero-button
          >
        </app-actions-container>

        <app-filter-bar
          [config]="filterConfig"
          (filterChange)="onFilterChange($event)"
        ></app-filter-bar>

        <aero-data-grid
          [gridId]="'periodo-inoperatividad-list'"
          [columns]="columns"
          [data]="periodos"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          [templates]="{
            equipo_codigo: equipoTemplate,
            excede: excedeTemplate,
            dias: diasTemplate,
            penalidad: penalidadTemplate,
          }"
          (rowClick)="verDetalle($event)"
        ></aero-data-grid>

        <ng-container *ngTemplateOutlet="sharedTemplates"></ng-container>
      </app-page-layout>
    }

    <!-- Embedded inside equipment-detail tab -->
    @if (equipoId) {
      <div class="embedded-header">
        <h4><i class="fa-solid fa-triangle-exclamation"></i> Períodos de Inoperatividad</h4>
        <aero-button variant="primary" size="small" iconLeft="fa-plus" (clicked)="irANuevo()"
          >Registrar</aero-button
        >
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-data-grid
        [gridId]="'periodo-inoperatividad-list'"
        [columns]="columns"
        [data]="periodos"
        [loading]="loading"
        [dense]="true"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          equipo_codigo: equipoTemplate,
          estado: estadoTemplate,
          excede: excedeTemplate,
          dias: diasTemplate,
        }"
        (rowClick)="verDetalle($event.id)"
      ></aero-data-grid>
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

    <ng-template #penalidadTemplate let-row>
      @if (row.monto_penalidad) {
        <span class="penalidad-monto">S/ {{ row.monto_penalidad | number: '1.2-2' }}</span>
      } @else {
        <span class="text-muted">—</span>
      }
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
      <div
        class="row-actions"
        (click)="$event.stopPropagation()"
        (keydown.enter)="$event.stopPropagation()"
        tabindex="0"
        role="toolbar"
      >
        @if (row.estado === 'ACTIVO') {
          <aero-button
            variant="primary"
            size="small"
            iconLeft="fa-check"
            (clicked)="abrirResolver(row)"
            >Resolver</aero-button
          >
        }
        @if (row.excede_plazo && !row.penalidad_aplicada) {
          <aero-button
            variant="danger"
            size="small"
            iconLeft="fa-gavel"
            (clicked)="abrirPenalidad(row)"
            >Penalizar</aero-button
          >
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
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="cerrarModales()"
            ></aero-button>
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
            <aero-button variant="secondary" (clicked)="cerrarModales()">Cancelar</aero-button>
            <aero-button
              variant="primary"
              iconLeft="fa-check"
              [disabled]="saving || !resolverForm.fecha_fin"
              (clicked)="confirmarResolver()"
              >{{ saving ? 'Guardando...' : 'Confirmar Resolución' }}</aero-button
            >
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
            <aero-button
              variant="ghost"
              size="small"
              iconCenter="fa-xmark"
              (clicked)="cerrarModales()"
            ></aero-button>
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
            <aero-button variant="secondary" (clicked)="cerrarModales()">Cancelar</aero-button>
            <aero-button
              variant="danger"
              iconLeft="fa-gavel"
              [disabled]="saving || !penalidadForm.monto_penalidad"
              (clicked)="confirmarPenalidad()"
              >{{ saving ? 'Guardando...' : 'Aplicar Penalidad' }}</aero-button
            >
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
        border-bottom: 1px solid var(--grey-200);
        h4 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: var(--grey-900);
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
        border-radius: var(--radius-sm);
        font-size: 12px;
        font-weight: 600;
      }
      .badge-danger {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .badge-warning {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .badge-success {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .badge-secondary {
        background: var(--grey-100);
        color: var(--grey-600);
      }

      .dias-danger {
        color: var(--grey-900);
        font-weight: 700;
      }
      .dias-warning {
        color: var(--grey-900);
        font-weight: 600;
      }
      .dias-ok {
        color: var(--grey-600);
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
        color: var(--grey-900);
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        display: inline-block;
      }
      .equipo-desc {
        font-size: 12px;
        color: var(--grey-500);
      }

      .penalidad-monto {
        font-family: monospace;
        font-weight: 600;
        color: var(--semantic-red-500);
      }
      .text-muted {
        color: var(--grey-400);
      }
      .row-actions {
        display: flex;
        gap: 6px;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: color-mix(in srgb, var(--grey-900) 45%, transparent);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-panel {
        background: var(--grey-100);
        border-radius: var(--radius-md);
        width: 100%;
        max-width: 480px;
        box-shadow: var(--shadow-lg);
      }
      .modal-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 20px;
        border-bottom: 1px solid var(--grey-200);
      }
      .modal-header h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 700;
        color: var(--grey-900);
      }
      .modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .modal-footer {
        padding: 16px 20px;
        border-top: 1px solid var(--grey-200);
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
        color: var(--grey-700);
      }
      .form-control {
        border: 1px solid var(--grey-300);
        border-radius: 6px;
        padding: 8px 12px;
        font-size: 14px;
        width: 100%;
        box-sizing: border-box;
      }
      .form-control:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-500) 20%, transparent);
      }

      .alert {
        border-radius: 6px;
        padding: 10px 14px;
        font-size: 13px;
      }
      .alert-danger {
        background: var(--semantic-red-50);
        color: var(--grey-900);
        border: 1px solid var(--semantic-red-200);
      }

      .info-text {
        font-size: 13px;
        color: var(--grey-600);
        margin: 0;
      }
    `,
  ],
})
export class PeriodoInoperatividadListComponent implements OnInit {
  @Input() equipoId?: number; // when embedded inside equipment-detail tab

  private service = inject(PeriodoInoperatividadService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

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

  columns: DataGridColumn[] = [
    { key: 'equipo_codigo', label: 'Equipo', type: 'template', sortable: true },
    { key: 'fecha_inicio', label: 'Inicio', type: 'date', width: '100px', sortable: true },
    { key: 'fecha_fin', label: 'Fin', type: 'date', width: '100px', sortable: true },
    { key: 'dias', label: 'Dias', type: 'template', width: '90px', sortable: true },
    { key: 'motivo', label: 'Motivo', type: 'text' },
    { key: 'penalidad', label: 'Penalidad', type: 'template', width: '110px' },
    { key: 'contrato', label: 'Contrato', type: 'text', hidden: true },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '110px',
      badgeConfig: {
        ACTIVO: { label: 'Activo', class: 'status-badge status-warning', icon: 'fa-clock' },
        RESUELTO: { label: 'Resuelto', class: 'status-badge status-completed', icon: 'fa-check' },
        PENALIZADO: { label: 'Penalizado', class: 'status-badge status-error', icon: 'fa-gavel' },
      },
    },
    { key: 'excede', label: 'SLA (5 días)', type: 'template', width: '130px' },
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
        this.snackBar.open(err?.error?.error?.message || 'Error al resolver el período', 'Cerrar', {
          duration: 5000,
        });
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
        this.snackBar.open(
          err?.error?.error?.message || 'Error al aplicar la penalidad',
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  diasClass(row: PeriodoInoperatividad): string {
    if (row.excede_plazo) return 'dias-danger';
    if (row.dias_inoperativo >= row.dias_plazo - 1) return 'dias-warning';
    return 'dias-ok';
  }
}
