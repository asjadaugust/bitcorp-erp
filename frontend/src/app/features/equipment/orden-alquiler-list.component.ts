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
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

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
    PageCardComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Órdenes de Alquiler"
      icon="fa-file-contract"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Orden"
          (clicked)="navigateToCreate()"
        ></app-button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
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
      </app-page-card>

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
        <div
          class="action-buttons"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <app-button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            variant="icon"
            size="sm"
            icon="fa-pen"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          ></app-button>
          <app-button
            *ngIf="row.estado === 'BORRADOR'"
            variant="icon"
            size="sm"
            icon="fa-paper-plane"
            title="Enviar al proveedor"
            (clicked)="abrirModalEnviar(row)"
          ></app-button>
          <app-button
            *ngIf="row.estado === 'ENVIADO'"
            variant="icon"
            size="sm"
            icon="fa-check"
            title="Confirmar orden"
            (clicked)="abrirModalConfirmar(row)"
          ></app-button>
          <app-button
            *ngIf="['BORRADOR', 'ENVIADO'].includes(row.estado)"
            variant="icon"
            size="sm"
            icon="fa-ban"
            title="Cancelar"
            (clicked)="abrirModalCancelar(row)"
          ></app-button>
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
          <app-button
            variant="icon"
            icon="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></app-button>
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
            <app-button
              variant="secondary"
              label="Cancelar"
              (clicked)="cerrarModales()"
            ></app-button>
            <app-button
              variant="primary"
              icon="fa-paper-plane"
              [label]="saving ? 'Enviando...' : 'Enviar'"
              [disabled]="saving"
              (clicked)="confirmarEnviar()"
            ></app-button>
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
          <app-button
            variant="icon"
            icon="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></app-button>
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
            <app-button
              variant="secondary"
              label="Cancelar"
              (clicked)="cerrarModales()"
            ></app-button>
            <app-button
              variant="success"
              icon="fa-check"
              [label]="saving ? 'Procesando...' : 'Confirmar Orden'"
              [disabled]="saving"
              (clicked)="confirmarConfirmar()"
            ></app-button>
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
          <app-button
            variant="icon"
            icon="fa-xmark"
            class="modal-close-btn"
            (clicked)="cerrarModales()"
          ></app-button>
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
            <app-button
              variant="secondary"
              label="Cancelar"
              (clicked)="cerrarModales()"
            ></app-button>
            <app-button
              variant="danger"
              icon="fa-ban"
              [label]="saving ? 'Cancelando...' : 'Confirmar Cancelación'"
              [disabled]="saving || !modalMotivo.trim()"
              (clicked)="confirmarCancelar()"
            ></app-button>
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
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-confirmado {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .status-cancelado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
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
