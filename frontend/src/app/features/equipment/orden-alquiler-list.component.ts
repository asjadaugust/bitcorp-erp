import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrdenAlquilerService, OrdenAlquiler } from '../../core/services/orden-alquiler.service';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  PageLayoutComponent,
  TabItem,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-orden-alquiler-list',
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
    <app-page-layout
      title="Órdenes de Alquiler"
      icon="fa-file-contract"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <button type="button" class="btn btn-primary" routerLink="new">
          <i class="fa-solid fa-plus"></i> Nueva Orden
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="ordenes"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [serverSide]="true"
        [totalItems]="total"
        [pageSize]="limit"
        (pageChange)="onPageChange($event)"
        [templates]="{
          codigo: codeTemplate,
          proveedor: proveedorTemplate,
          estado: estadoTemplate,
          tarifa: tarifaTemplate,
        }"
        (rowClick)="verDetalle($event.id)"
      >
      </aero-table>

      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #proveedorTemplate let-row>
        <span class="proveedor-cell">
          {{ row.proveedor_nombre || '#' + row.proveedor_id }}
        </span>
      </ng-template>

      <ng-template #estadoTemplate let-row>
        <span class="status-badge" [ngClass]="'status-' + row.estado.toLowerCase()">
          <i class="fa-solid" [ngClass]="getStatusIcon(row.estado)"></i>
          {{ estadoLabel(row.estado) }}
        </span>
      </ng-template>

      <ng-template #tarifaTemplate let-row>
        <span class="tarifa-cell">
          {{ row.moneda }} {{ row.tarifa_acordada | number: '1.2-2' }} /
          {{ tipoTarifaLabel(row.tipo_tarifa) }}
        </span>
      </ng-template>

      <ng-template #actionsTemplate let-row>
        <div class="action-buttons" (click)="$event.stopPropagation()">
          <button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            class="btn-icon"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            *ngIf="row.estado === 'BORRADOR'"
            class="btn-icon text-info"
            title="Enviar al proveedor"
            (click)="abrirModalEnviar(row)"
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
          <button
            *ngIf="row.estado === 'ENVIADO'"
            class="btn-icon text-success"
            title="Confirmar orden"
            (click)="abrirModalConfirmar(row)"
          >
            <i class="fa-solid fa-check"></i>
          </button>
          <button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            class="btn-icon text-danger"
            title="Cancelar"
            (click)="abrirModalCancelar(row)"
          >
            <i class="fa-solid fa-ban"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>

    <!-- Modal: Enviar al proveedor -->
    @if (showEnviarModal && modalOrden) {
      <div class="modal-overlay" (click)="cerrarModales()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-paper-plane"></i> Enviar Orden al Proveedor</h3>
            <button class="btn-close" (click)="cerrarModales()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong> →
              {{ modalOrden.proveedor_nombre || 'Proveedor #' + modalOrden.proveedor_id }}
            </p>
            <div class="form-group">
              <label
                >Email de contacto del proveedor <span class="optional">(opcional)</span></label
              >
              <input
                type="email"
                class="form-control"
                [(ngModel)]="modalEmail"
                placeholder="proveedor@empresa.com"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button>
            <button class="btn btn-info" [disabled]="saving" (click)="confirmarEnviar()">
              <i class="fa-solid fa-paper-plane"></i> {{ saving ? 'Enviando...' : 'Enviar' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: Confirmar orden -->
    @if (showConfirmarModal && modalOrden) {
      <div class="modal-overlay" (click)="cerrarModales()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-check-circle"></i> Confirmar Orden</h3>
            <button class="btn-close" (click)="cerrarModales()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong>
            </p>
            <div class="form-group">
              <label
                >¿Quién confirmó por parte del proveedor?
                <span class="optional">(opcional)</span></label
              >
              <input
                type="text"
                class="form-control"
                [(ngModel)]="modalConfirmadoPor"
                placeholder="Nombre del contacto"
              />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button>
            <button class="btn btn-success" [disabled]="saving" (click)="confirmarConfirmar()">
              <i class="fa-solid fa-check"></i> {{ saving ? 'Procesando...' : 'Confirmar Orden' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal: Cancelar orden -->
    @if (showCancelarModal && modalOrden) {
      <div class="modal-overlay" (click)="cerrarModales()">
        <div class="modal-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-ban"></i> Cancelar Orden</h3>
            <button class="btn-close" (click)="cerrarModales()">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong>
            </p>
            <div class="form-group">
              <label>Motivo de cancelación *</label>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="modalMotivo"
                placeholder="Indique el motivo..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cerrarModales()">Cancelar</button>
            <button
              class="btn btn-danger"
              [disabled]="saving || !modalMotivo.trim()"
              (click)="confirmarCancelar()"
            >
              <i class="fa-solid fa-ban"></i>
              {{ saving ? 'Cancelando...' : 'Confirmar Cancelación' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        font-size: 12px;
        background: var(--grey-100);
        padding: 2px 8px;
        border-radius: 4px;
        font-weight: 600;
        color: var(--primary-700);
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-borrador {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .status-enviado {
        background: #dbeafe;
        color: #1d4ed8;
      }
      .status-confirmado {
        background: #dcfce7;
        color: #15803d;
      }
      .status-cancelado {
        background: #fee2e2;
        color: #b91c1c;
      }

      .proveedor-cell {
        font-size: 13px;
        color: var(--grey-800);
        font-weight: 500;
      }

      .tarifa-cell {
        font-weight: 600;
        color: var(--grey-800);
        font-size: 13px;
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: all 0.2s;
        border-radius: 4px;
      }

      .btn-icon:hover {
        background: var(--grey-100);
        color: var(--primary-500);
      }

      .btn-icon.text-info {
        color: #3b82f6;
      }
      .btn-icon.text-info:hover {
        background: #eff6ff;
        color: #1d4ed8;
      }

      .btn-icon.text-success {
        color: #22c55e;
      }
      .btn-icon.text-success:hover {
        background: #f0fdf4;
        color: #15803d;
      }

      .btn-icon.text-danger {
        color: #ef4444;
      }
      .btn-icon.text-danger:hover {
        background: #fef2f2;
        color: #b91c1c;
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
        h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
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
      .modal-desc {
        font-size: 14px;
        color: #475569;
        margin: 0;
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
      .optional {
        font-weight: 400;
        color: #9ca3af;
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
      .btn-secondary {
        background: #f1f5f9;
        color: #475569;
      }
      .btn-info {
        background: #3b82f6;
        color: #fff;
      }
      .btn-success {
        background: #16a34a;
        color: #fff;
      }
      .btn-danger {
        background: #dc2626;
        color: #fff;
      }
      .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class OrdenAlquilerListComponent implements OnInit {
  private service = inject(OrdenAlquilerService);
  private router = inject(Router);

  ordenes: OrdenAlquiler[] = [];
  loading = false;
  filtroEstado = '';
  page = 1;
  limit = 20;
  total = 0;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Órdenes de Alquiler' },
  ];

  tabs: TabItem[] = [
    { label: 'Dashboard', route: '/equipment/dashboard', icon: 'fa-chart-line' },
    { label: 'Equipos', route: '/equipment', icon: 'fa-list' },
    { label: 'Solicitudes', route: '/equipment/solicitudes', icon: 'fa-file-invoice' },
    { label: 'Órdenes', route: '/equipment/ordenes-alquiler', icon: 'fa-file-contract' },
    { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
    { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
    { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-contract' },
    { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
    { label: 'Devoluciones', route: '/equipment/actas-devolucion', icon: 'fa-file-signature' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Enviado', value: 'ENVIADO' },
        { label: 'Confirmado', value: 'CONFIRMADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '130px' },
    { key: 'descripcion_equipo', label: 'Equipo', type: 'text' },
    { key: 'proveedor_nombre', label: 'Proveedor', type: 'template' },
    { key: 'fecha_orden', label: 'Fecha Orden', type: 'date', width: '140px' },
    { key: 'tarifa', label: 'Tarifa', type: 'template', width: '180px' },
    { key: 'estado', label: 'Estado', type: 'template', width: '140px', align: 'center' },
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    const filters: any = { page: this.page, limit: this.limit };
    if (this.filtroEstado) filters.estado = this.filtroEstado;

    this.service.listar(filters).subscribe({
      next: (res) => {
        this.ordenes = res.data ?? [];
        this.total = (res as any).total ?? res.pagination?.total ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>) {
    this.filtroEstado = filters['estado'] || '';
    this.page = 1;
    this.cargar();
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargar();
  }

  verDetalle(id: number) {
    this.router.navigate(['/equipment/ordenes-alquiler', id]);
  }

  // Modal state
  saving = false;
  modalOrden: OrdenAlquiler | null = null;
  showEnviarModal = false;
  showConfirmarModal = false;
  showCancelarModal = false;
  modalEmail = '';
  modalConfirmadoPor = '';
  modalMotivo = '';

  cerrarModales() {
    this.showEnviarModal = false;
    this.showConfirmarModal = false;
    this.showCancelarModal = false;
    this.modalOrden = null;
    this.modalEmail = '';
    this.modalConfirmadoPor = '';
    this.modalMotivo = '';
  }

  abrirModalEnviar(o: OrdenAlquiler) {
    this.modalOrden = o;
    this.modalEmail = '';
    this.showEnviarModal = true;
  }

  abrirModalConfirmar(o: OrdenAlquiler) {
    this.modalOrden = o;
    this.modalConfirmadoPor = '';
    this.showConfirmarModal = true;
  }

  abrirModalCancelar(o: OrdenAlquiler) {
    this.modalOrden = o;
    this.modalMotivo = '';
    this.showCancelarModal = true;
  }

  confirmarEnviar() {
    if (!this.modalOrden) return;
    this.saving = true;
    this.service.enviar(this.modalOrden.id, this.modalEmail || undefined).subscribe({
      next: () => {
        this.saving = false;
        this.cerrarModales();
        this.cargar();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  confirmarConfirmar() {
    if (!this.modalOrden) return;
    this.saving = true;
    this.service.confirmar(this.modalOrden.id, this.modalConfirmadoPor || undefined).subscribe({
      next: () => {
        this.saving = false;
        this.cerrarModales();
        this.cargar();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  confirmarCancelar() {
    if (!this.modalOrden || !this.modalMotivo.trim()) return;
    this.saving = true;
    this.service.cancelar(this.modalOrden.id, this.modalMotivo).subscribe({
      next: () => {
        this.saving = false;
        this.cerrarModales();
        this.cargar();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  estadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      BORRADOR: 'Borrador',
      ENVIADO: 'Enviado',
      CONFIRMADO: 'Confirmado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] ?? estado;
  }

  tipoTarifaLabel(tipo: string): string {
    const labels: Record<string, string> = {
      HORA: 'Hora',
      DIA: 'Día',
      MES: 'Mes',
    };
    return labels[tipo] ?? tipo;
  }

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      BORRADOR: 'fa-pencil',
      ENVIADO: 'fa-paper-plane',
      CONFIRMADO: 'fa-check-circle',
      CANCELADO: 'fa-ban',
    };
    return icons[estado] || 'fa-info-circle';
  }
}
