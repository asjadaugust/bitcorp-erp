import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  ValeCombustibleService,
  ValeCombustible,
} from '../../core/services/vale-combustible.service';
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
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { EQUIPMENT_TABS } from './equipment-tabs';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-vale-combustible-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroTableComponent,
    FilterBarComponent,
    StatsGridComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Vales de Combustible"
      icon="fa-gas-pump"
      [tabs]="tabs"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <aero-button
          variant="primary"
          iconLeft="fa-plus"
          (clicked)="navigateToCreate()"
          data-testid="btn-nuevo-vale"
          >Nuevo Vale</aero-button
        >
      </app-actions-container>

      <div *ngIf="statItems.length > 0">
        <app-stats-grid [items]="statItems" class="mb-4"></app-stats-grid>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="vales"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="limit"
          (pageChange)="onPageChange($event)"
          [templates]="{
            codigo: codeTemplate,
            equipo: equipoTemplate,
            tipo_combustible: tipoTemplate,
            cantidad_galones: cantidadTemplate,
            monto_total: montoTemplate,
          }"
          (rowClick)="verDetalle($event.id)"
          data-testid="vale-combustible-table"
        >
        </aero-table>
      </app-page-card>

      <ng-template #codeTemplate let-row>
        <span class="code-badge" data-testid="vale-codigo">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #equipoTemplate let-row>
        <div class="equipo-cell">
          <span class="equipo-codigo">{{ row.equipo_codigo || '#' + row.equipo_id }}</span>
          @if (row.equipo_descripcion) {
            <span class="equipo-desc">{{ row.equipo_descripcion }}</span>
          }
        </div>
      </ng-template>

      <ng-template #tipoTemplate let-row>
        <span class="fuel-type-badge fuel-type-{{ row.tipo_combustible | lowercase }}">
          {{ formatTipoCombustible(row.tipo_combustible) }}
        </span>
      </ng-template>

      <ng-template #cantidadTemplate let-row>
        <span>{{ row.cantidad_galones | number: '1.2-2' }} gal</span>
      </ng-template>

      <ng-template #montoTemplate let-row>
        <span *ngIf="row.monto_total">S/ {{ row.monto_total | number: '1.2-2' }}</span>
        <span *ngIf="!row.monto_total" class="text-muted">—</span>
      </ng-template>

      <ng-template #actionsTemplate let-row>
        <div
          class="table-actions"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver detalle"
            [routerLink]="[row.id]"
            [attr.data-testid]="'btn-ver-' + row.id"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'PENDIENTE'"
            variant="ghost"
            size="small"
            iconCenter="fa-pen-to-square"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
            [attr.data-testid]="'btn-editar-' + row.id"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'PENDIENTE'"
            variant="ghost"
            size="small"
            iconCenter="fa-check"
            title="Registrar vale"
            (clicked)="registrar($event, row)"
            [attr.data-testid]="'btn-registrar-' + row.id"
          ></aero-button>
          <aero-button
            *ngIf="row.estado !== 'ANULADO'"
            variant="ghost"
            size="small"
            iconCenter="fa-ban"
            title="Anular"
            (clicked)="anular($event, row)"
            [attr.data-testid]="'btn-anular-' + row.id"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: 0.85em;
        color: var(--primary-900);
      }
      .fuel-type-badge {
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 0.82em;
        font-weight: 600;
        text-transform: uppercase;
      }
      .fuel-type-diesel {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .fuel-type-gasolina_90 {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }
      .fuel-type-gasolina_95 {
        background: var(--semantic-blue-100);
        color: var(--primary-900);
      }
      .fuel-type-glp {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .fuel-type-gnv {
        background: var(--primary-50);
        color: var(--primary-700);
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
      .table-actions {
        display: flex;
        gap: 4px;
      }
      .text-muted {
        color: var(--grey-400);
      }
    `,
  ],
})
export class ValeCombustibleListComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  private svc = inject(ValeCombustibleService);
  private router = inject(Router);
  private confirmSvc = inject(ConfirmService);

  vales: ValeCombustible[] = [];
  loading = false;
  total = 0;
  page = 1;
  limit = 20;

  breadcrumbs: Breadcrumb[] = [
    { label: 'Equipos', url: '/equipment' },
    { label: 'Vales de Combustible' },
  ];

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '110px' },
    { key: 'fecha', label: 'Fecha', type: 'date', width: '110px' },
    { key: 'equipo', label: 'Equipo', type: 'template' },
    { key: 'numero_vale', label: 'N° Vale', type: 'text' },
    { key: 'tipo_combustible', label: 'Tipo', type: 'template', width: '80px' },
    {
      key: 'cantidad_galones',
      label: 'Cantidad',
      type: 'template',
      width: '100px',
      align: 'right',
    },
    { key: 'precio_unitario', label: 'P.U.', type: 'currency', width: '90px' },
    { key: 'proveedor', label: 'Proveedor', type: 'text' },
    { key: 'monto_total', label: 'Monto Total', type: 'template', width: '110px' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      width: '120px',
      badgeConfig: {
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-pending', icon: 'fa-clock' },
        REGISTRADO: {
          label: 'Registrado',
          class: 'status-badge status-completed',
          icon: 'fa-check',
        },
        ANULADO: { label: 'Anulado', class: 'status-badge status-cancelled', icon: 'fa-ban' },
      },
    },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código, vale, proveedor...',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'Registrado', value: 'REGISTRADO' },
        { label: 'Anulado', value: 'ANULADO' },
      ],
    },
    {
      key: 'tipo_combustible',
      label: 'Combustible',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Diesel', value: 'DIESEL' },
        { label: 'Gasolina 90', value: 'GASOLINA_90' },
        { label: 'Gasolina 95', value: 'GASOLINA_95' },
        { label: 'GLP', value: 'GLP' },
        { label: 'GNV', value: 'GNV' },
      ],
    },
  ];

  private activeFilters: Record<string, string> = {};

  get statItems(): StatItem[] {
    if (!this.vales.length) return [];
    const pendientes = this.vales.filter((v) => v.estado === 'PENDIENTE').length;
    const registrados = this.vales.filter((v) => v.estado === 'REGISTRADO').length;
    const totalGalones = this.vales
      .filter((v) => v.estado !== 'ANULADO')
      .reduce((acc, v) => acc + Number(v.cantidad_galones), 0);
    return [
      { label: 'Pendientes', value: pendientes, icon: 'fa-clock', color: 'warning' },
      { label: 'Registrados', value: registrados, icon: 'fa-check-circle', color: 'success' },
      {
        label: 'Total Galones',
        value: `${totalGalones.toFixed(1)} gal`,
        icon: 'fa-gas-pump',
        color: 'info',
      },
    ];
  }

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.svc
      .listar({ ...this.activeFilters, page: this.page as any, limit: this.limit as any })
      .subscribe({
        next: (res) => {
          this.vales = res.data;
          this.total = res.pagination?.total ?? res.data.length;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
  }

  onFilterChange(filters: Record<string, string>) {
    this.activeFilters = filters;
    this.page = 1;
    this.cargar();
  }

  onPageChange(page: number) {
    this.page = page;
    this.cargar();
  }

  navigateToCreate() {
    this.router.navigate(['/equipment/vales-combustible/new']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/equipment/vales-combustible', id]);
  }

  registrar(event: Event, vale: ValeCombustible) {
    event.stopPropagation();
    this.confirmSvc
      .confirm({
        title: 'Registrar Vale',
        message: `¿Desea confirmar el registro del vale ${vale.codigo}?`,
        icon: 'fa-check-circle',
        confirmLabel: 'Registrar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.registrar(vale.id).subscribe(() => this.cargar());
        }
      });
  }

  anular(event: Event, vale: ValeCombustible) {
    event.stopPropagation();
    this.confirmSvc
      .confirm({
        title: 'Anular Vale',
        message: `¿Está seguro de anular el vale ${vale.codigo}? Esta acción no se puede deshacer.`,
        icon: 'fa-circle-exclamation',
        confirmLabel: 'Anular',
        isDanger: true,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.anular(vale.id).subscribe(() => this.cargar());
        }
      });
  }

  formatTipoCombustible(tipo: string): string {
    const map: Record<string, string> = {
      DIESEL: 'Diesel',
      GASOLINA_90: 'G90',
      GASOLINA_95: 'G95',
      GLP: 'GLP',
      GNV: 'GNV',
    };
    return map[tipo] || tipo;
  }
}
