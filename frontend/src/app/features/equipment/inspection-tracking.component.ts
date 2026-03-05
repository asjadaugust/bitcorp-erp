import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { ChecklistService } from '../../core/services/checklist.service';
import { ObservationItem, ObservationStats } from '../../core/models/checklist.model';
import { EQUIPMENT_TABS } from './equipment-tabs';

@Component({
  selector: 'app-inspection-tracking',
  standalone: true,
  imports: [
    CommonModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroDataGridComponent,
    FilterBarComponent,
    StatsGridComponent,
  ],
  template: `
    <app-page-layout
      title="Observaciones"
      icon="fa-triangle-exclamation"
      [tabs]="tabs"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-stats-grid *ngIf="stats && statItems.length > 0" [items]="statItems"></app-stats-grid>

      <app-page-card [noPadding]="true" *ngIf="items.length > 0 || loading">
        <aero-data-grid
          [gridId]="'inspection-tracking'"
          [columns]="columns"
          [data]="items"
          [loading]="loading"
          [dense]="true"
          [showColumnChooser]="true"
          [templates]="{
            fecha: fechaTpl,
            equipo: equipoTpl,
            item: itemTpl,
            critico: criticoTpl,
            accion: accionTpl,
          }"
        ></aero-data-grid>
      </app-page-card>

      <div class="empty-state" *ngIf="!loading && items.length === 0">
        <i class="fa-solid fa-clipboard-check empty-icon"></i>
        <p class="empty-title">Sin observaciones pendientes</p>
        <p class="empty-sub">No se encontraron ítems no conformes para el período seleccionado.</p>
      </div>

      <!-- Row templates -->
      <ng-template #fechaTpl let-row>
        <span class="fecha-val">{{ formatDate(row.fecha_inspeccion) }}</span>
        <span class="insp-codigo">{{ row.inspeccion_codigo }}</span>
      </ng-template>

      <ng-template #equipoTpl let-row>
        <span class="equipo-codigo">{{ row.equipo_codigo }}</span>
        <span class="equipo-desc">{{ row.equipo_marca }} {{ row.equipo_modelo }}</span>
      </ng-template>

      <ng-template #itemTpl let-row>
        <span class="item-cat">{{ row.categoria }}</span>
        <span class="item-desc">{{ row.item_descripcion }}</span>
        <span class="item-obs" *ngIf="row.observaciones">{{ row.observaciones }}</span>
      </ng-template>

      <ng-template #criticoTpl let-row>
        <span class="critico-badge" *ngIf="row.es_critico">
          <i class="fa-solid fa-circle-exclamation"></i> Crítico
        </span>
        <span class="no-critico" *ngIf="!row.es_critico">—</span>
      </ng-template>

      <ng-template #accionTpl let-row>
        <span class="accion-badge" [ngClass]="accionClass(row.accion_requerida)">
          <i class="fa-solid" [ngClass]="accionIcon(row.accion_requerida)"></i>
          {{ accionLabel(row.accion_requerida) }}
        </span>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      /* Row cell helpers */
      .fecha-val {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-800);
      }
      .insp-codigo {
        display: block;
        font-size: 10px;
        color: var(--grey-500);
        font-family: monospace;
        margin-top: 2px;
      }

      .equipo-codigo {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--primary-700);
        font-family: monospace;
        letter-spacing: 0.03em;
      }
      .equipo-desc {
        display: block;
        font-size: 12px;
        color: var(--grey-600);
        margin-top: 1px;
      }

      .item-cat {
        display: block;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--grey-500);
      }
      .item-desc {
        display: block;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-900);
        margin-top: 1px;
      }
      .item-obs {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        font-size: 11px;
        color: var(--grey-600);
        font-style: italic;
        line-height: 1.4;
        margin-top: 3px;
        max-width: 340px;
      }

      /* Criticality badge */
      .critico-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 600;
        color: var(--semantic-red-600, #dc2626);
        background: var(--semantic-red-50, #fef2f2);
        border: 1px solid var(--semantic-red-200, #fecaca);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        white-space: nowrap;
      }
      .no-critico {
        color: var(--grey-400);
        font-size: 13px;
      }

      /* Action badge */
      .accion-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        font-weight: 600;
        white-space: nowrap;
      }
      .accion-reemplazar,
      .accion-reemplazo {
        background: var(--semantic-red-50, #fef2f2);
        color: var(--semantic-red-700, #b91c1c);
        border: 1px solid var(--semantic-red-200, #fecaca);
      }
      .accion-reparar,
      .accion-mantenimiento {
        background: #fff7ed;
        color: #c2410c;
        border: 1px solid #fed7aa;
      }
      .accion-observar {
        background: #fefce8;
        color: #a16207;
        border: 1px solid #fde68a;
      }
      .accion-ninguna {
        background: var(--grey-100);
        color: var(--grey-500);
        border: 1px solid var(--grey-200);
      }

      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 56px 24px;
      }
      .empty-icon {
        font-size: 48px;
        color: var(--semantic-blue-300, #93c5fd);
        margin-bottom: 16px;
        display: block;
      }
      .empty-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--grey-700);
        margin: 0 0 6px;
      }
      .empty-sub {
        font-size: 13px;
        color: var(--grey-500);
        margin: 0;
      }
    `,
  ],
})
export class InspectionTrackingComponent implements OnInit {
  tabs = EQUIPMENT_TABS;
  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Seguimiento de Observaciones' },
  ];

  private checklistSvc = inject(ChecklistService);

  loading = false;
  items: ObservationItem[] = [];
  stats: ObservationStats | null = null;

  // Internal filter state
  fechaDesde = '';
  fechaHasta = '';
  accionRequerida = '';
  solosCriticos: boolean | undefined = undefined;

  filterConfig: FilterConfig[] = [
    { key: 'fechaDesde', label: 'Desde', type: 'date' },
    { key: 'fechaHasta', label: 'Hasta', type: 'date' },
    {
      key: 'accion',
      label: 'Acción',
      type: 'select',
      placeholder: 'Todas las acciones',
      options: [
        { label: 'Reemplazar', value: 'REEMPLAZAR' },
        { label: 'Reparar', value: 'REPARAR' },
        { label: 'Observar', value: 'OBSERVAR' },
        { label: 'Sin acción', value: 'NINGUNA' },
      ],
    },
    {
      key: 'critico',
      label: 'Criticidad',
      type: 'select',
      placeholder: 'Todas',
      options: [
        { label: 'Solo críticos', value: 'true' },
        { label: 'No críticos', value: 'false' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'fecha', label: 'Fecha / Codigo', type: 'template', sortable: true },
    { key: 'equipo', label: 'Equipo', type: 'template', sortable: true },
    { key: 'item', label: 'Item / Observacion', type: 'template' },
    { key: 'critico', label: 'Criticidad', type: 'template' },
    { key: 'accion', label: 'Accion Requerida', type: 'template' },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'plazo_correccion', label: 'Plazo Correccion', type: 'date', hidden: true },
    { key: 'estado_item', label: 'Estado Item', type: 'text', hidden: true },
  ];

  get statItems(): StatItem[] {
    if (!this.stats || this.stats.total === 0) return [];
    const items: StatItem[] = [
      {
        label: 'Total Observaciones',
        value: this.stats.total,
        icon: 'fa-solid fa-triangle-exclamation',
        color: 'warning',
      },
    ];
    if (this.stats.criticas > 0)
      items.push({
        label: 'Críticas',
        value: this.stats.criticas,
        icon: 'fa-solid fa-circle-exclamation',
        color: 'danger',
      });
    if (this.stats.a_reparar > 0)
      items.push({
        label: 'A Reparar',
        value: this.stats.a_reparar,
        icon: 'fa-solid fa-wrench',
        color: 'warning',
      });
    if (this.stats.a_reemplazar > 0)
      items.push({
        label: 'A Reemplazar',
        value: this.stats.a_reemplazar,
        icon: 'fa-solid fa-rotate',
        color: 'danger',
      });
    return items;
  }

  ngOnInit() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    this.fechaDesde = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    this.fechaHasta = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    this.filterConfig[0].value = this.fechaDesde;
    this.filterConfig[1].value = this.fechaHasta;
    this.loadData();
  }

  onFilterChange(filters: Record<string, unknown>) {
    if (filters['fechaDesde'] !== undefined)
      this.fechaDesde = (filters['fechaDesde'] as string) || '';
    if (filters['fechaHasta'] !== undefined)
      this.fechaHasta = (filters['fechaHasta'] as string) || '';
    if (filters['accion'] !== undefined) this.accionRequerida = (filters['accion'] as string) || '';
    if (filters['critico'] !== undefined) {
      const v = filters['critico'] as string;
      this.solosCriticos = v === 'true' ? true : v === 'false' ? false : undefined;
    }
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.checklistSvc
      .getObservations({
        fechaDesde: this.fechaDesde || undefined,
        fechaHasta: this.fechaHasta || undefined,
        accionRequerida: this.accionRequerida || undefined,
        esCritico: this.solosCriticos,
        limit: 50,
      })
      .subscribe({
        next: (res) => {
          this.items = res.items;
          this.stats = res.stats;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  accionClass(accion: string): string {
    return `accion-${(accion ?? 'ninguna').toLowerCase()}`;
  }

  accionLabel(accion: string): string {
    const map: Record<string, string> = {
      REEMPLAZAR: 'Reemplazar',
      REEMPLAZO: 'Reemplazar',
      REPARAR: 'Reparar',
      MANTENIMIENTO: 'Reparar',
      OBSERVAR: 'Observar',
      NINGUNA: 'Sin acción',
    };
    return map[accion] ?? accion;
  }

  accionIcon(accion: string): string {
    const map: Record<string, string> = {
      REEMPLAZAR: 'fa-rotate',
      REEMPLAZO: 'fa-rotate',
      REPARAR: 'fa-wrench',
      MANTENIMIENTO: 'fa-wrench',
      OBSERVAR: 'fa-eye',
      NINGUNA: 'fa-minus',
    };
    return map[accion] ?? 'fa-minus';
  }

  formatDate(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
