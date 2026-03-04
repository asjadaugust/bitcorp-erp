import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrdenAlquilerService, OrdenAlquiler } from '../../core/services/orden-alquiler.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { EQUIPMENT_TABS, OPERACIONES_TABS } from './equipment-tabs';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-orden-alquiler-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    FilterBarComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Órdenes de Alquiler"
      icon="fa-file-contract"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="equipmentTabs"
      [subtabs]="operacionesTabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nueva Orden</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="ordenes"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [actionsTemplate]="actionsTemplate"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="limit"
          (pageChange)="onPageChange($event)"
          [templates]="{
            codigo: codeTemplate,
            proveedor: proveedorTemplate,
            tarifa: tarifaTemplate,
          }"
          (rowClick)="verDetalle($event.id)"
        >
        </aero-data-grid>
      </app-page-card>

      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #proveedorTemplate let-row>
        <span class="proveedor-cell">
          {{ row.proveedor_nombre || '#' + row.proveedor_id }}
        </span>
      </ng-template>

      <ng-template #tarifaTemplate let-row>
        <span class="tarifa-cell">
          {{ row.moneda }} {{ row.tarifa_acordada | number: '1.2-2' }} /
          {{ tipoTarifaLabel(row.tipo_tarifa) }}
        </span>
      </ng-template>

      <ng-template #actionsTemplate let-row>
        <div
          class="action-buttons"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <aero-button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'BORRADOR'"
            variant="ghost"
            size="small"
            iconCenter="fa-paper-plane"
            title="Enviar al proveedor"
            (clicked)="abrirModalEnviar(row)"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'ENVIADO'"
            variant="ghost"
            size="small"
            iconCenter="fa-check"
            title="Confirmar orden"
            (clicked)="abrirModalConfirmar(row)"
          ></aero-button>
          <aero-button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            variant="ghost"
            size="small"
            iconCenter="fa-ban"
            title="Cancelar"
            (clicked)="abrirModalCancelar(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>

    <!-- Modal: Enviar al proveedor -->
    @if (showEnviarModal && modalOrden) {
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
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></aero-button>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong> →
              {{ modalOrden.proveedor_nombre || 'Proveedor #' + modalOrden.proveedor_id }}
            </p>
            <div class="form-group">
              <span class="label"
                >Email de contacto del proveedor <span class="optional">(opcional)</span></span
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
            <aero-button variant="secondary" (clicked)="cerrarModales()">Cancelar</aero-button>
            <aero-button
              variant="primary"
              iconLeft="fa-paper-plane"
              [disabled]="saving"
              (clicked)="confirmarEnviar()"
              >{{ saving ? 'Enviando...' : 'Enviar' }}</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Modal: Confirmar orden -->
    @if (showConfirmarModal && modalOrden) {
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
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></aero-button>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong>
            </p>
            <div class="form-group">
              <span class="label"
                >¿Quién confirmó por parte del proveedor?
                <span class="optional">(opcional)</span></span
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
            <aero-button variant="secondary" (clicked)="cerrarModales()">Cancelar</aero-button>
            <aero-button
              variant="primary"
              iconLeft="fa-check"
              [disabled]="saving"
              (clicked)="confirmarConfirmar()"
              >{{ saving ? 'Procesando...' : 'Confirmar Orden' }}</aero-button
            >
          </div>
        </div>
      </div>
    }

    <!-- Modal: Cancelar orden -->
    @if (showCancelarModal && modalOrden) {
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
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></aero-button>
          <div class="modal-body">
            <p class="modal-desc">
              Orden <strong>{{ modalOrden.codigo }}</strong>
            </p>
            <div class="form-group">
              <span class="label">Motivo de cancelación *</span>
              <textarea
                class="form-control"
                rows="3"
                [(ngModel)]="modalMotivo"
                placeholder="Indique el motivo..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <aero-button variant="secondary" (clicked)="cerrarModales()">Cancelar</aero-button>
            <aero-button
              variant="danger"
              iconLeft="fa-ban"
              [disabled]="saving || !modalMotivo.trim()"
              (clicked)="confirmarCancelar()"
              >{{ saving ? 'Cancelando...' : 'Confirmar Cancelación' }}</aero-button
            >
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

      .proveedor-cell {
        font-size: 13px;
        color: var(--grey-900);
        font-weight: 500;
      }

      .tarifa-cell {
        font-weight: 600;
        color: var(--grey-900);
        font-size: 13px;
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
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
        box-shadow: var(
          --shadow-lg,
          0 20px 60px color-mix(in srgb, var(--grey-900) 20%, transparent)
        );
        position: relative;
      }
      .modal-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
      }
      .modal-body {
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .modal-desc {
        font-size: 14px;
        color: var(--grey-600);
        margin: 0;
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
      .optional {
        font-weight: 400;
        color: var(--grey-400);
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
    `,
  ],
})
export class OrdenAlquilerListComponent implements OnInit {
  private service = inject(OrdenAlquilerService);
  private router = inject(Router);

  equipmentTabs = EQUIPMENT_TABS;
  operacionesTabs = OPERACIONES_TABS;
  ordenes: OrdenAlquiler[] = [];
  loading = false;
  filtroEstado = '';
  page = 1;
  limit = 20;
  total = 0;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Operaciones', url: '/equipment/operaciones' },
    { label: 'Órdenes de Alquiler' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código, equipo, proveedor...',
    },
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

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Codigo', type: 'template', width: '120px', sortable: true },
    { key: 'descripcion_equipo', label: 'Equipo', type: 'text', sortable: true },
    { key: 'proveedor', label: 'Proveedor', type: 'template', sortable: true },
    { key: 'fecha_orden', label: 'F. Orden', type: 'date', width: '110px', sortable: true },
    {
      key: 'fecha_inicio_estimada',
      label: 'F. Entrega',
      type: 'date',
      width: '110px',
      sortable: true,
    },
    { key: 'tarifa', label: 'Tarifa', type: 'template', width: '160px' },
    { key: 'moneda', label: 'Moneda', type: 'text', hidden: true },
    { key: 'plazo_dias', label: 'Plazo (dias)', type: 'number', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '130px',
      align: 'center',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-draft', icon: 'fa-pencil' },
        ENVIADO: {
          label: 'Enviado',
          class: 'status-badge status-in-progress',
          icon: 'fa-paper-plane',
        },
        CONFIRMADO: {
          label: 'Confirmado',
          class: 'status-badge status-completed',
          icon: 'fa-check-circle',
        },
        CANCELADO: { label: 'Cancelado', class: 'status-badge status-cancelled', icon: 'fa-ban' },
      },
    },
  ];

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    const filters: Record<string, string | number> = { page: this.page, limit: this.limit };
    if (this.filtroEstado) filters['estado'] = this.filtroEstado;

    this.service.listar(filters).subscribe({
      next: (res) => {
        this.ordenes = res.data ?? [];
        this.total = ((res as any)['total'] as number) ?? res.pagination?.total ?? 0;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>) {
    this.filtroEstado = (filters['estado'] as string) || '';
    this.page = 1;
    this.cargar();
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargar();
  }

  navigateToCreate() {
    this.router.navigate(['/equipment/operaciones/ordenes-alquiler/new']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/equipment/operaciones/ordenes-alquiler', id]);
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

  tipoTarifaLabel(tipo: string): string {
    const labels: Record<string, string> = {
      HORA: 'Hora',
      DIA: 'Día',
      MES: 'Mes',
    };
    return labels[tipo] ?? tipo;
  }
}
