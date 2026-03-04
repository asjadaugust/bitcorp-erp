import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  SolicitudEquipoService,
  SolicitudEquipo,
} from '../../core/services/solicitud-equipo.service';
import { ConfirmService } from '../../core/services/confirm.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
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
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { EQUIPMENT_TABS, OPERACIONES_TABS } from './equipment-tabs';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-solicitud-equipo-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    AeroDataGridComponent,
    FilterBarComponent,
    StatsGridComponent,
    PageCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Solicitudes de Equipo"
      icon="fa-file-invoice"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="equipmentTabs"
      [subtabs]="operacionesTabs"
    >
      <app-actions-container actions>
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="navigateToCreate()"
          >Nueva Solicitud</aero-button
        >
      </app-actions-container>

      <div class="stats-container-fade-in" *ngIf="statItems.length > 0">
        <app-stats-grid [items]="statItems" class="mb-4"></app-stats-grid>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-data-grid
          [columns]="columns"
          [data]="solicitudes"
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
            equipo_info: equipoInfoTemplate,
          }"
          (rowClick)="verDetalle($event.id)"
        >
        </aero-data-grid>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #equipoInfoTemplate let-row>
        <div class="equipo-info-cell">
          <span class="equipo-tipo">{{ row.tipo_equipo }}</span>
          @if (row.descripcion) {
            <span class="equipo-desc">{{ row.descripcion | slice: 0 : 60 }}</span>
          }
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div
          class="action-buttons"
          (click)="$event.stopPropagation()"
          (keydown.enter)="$event.stopPropagation()"
          tabindex="0"
          role="toolbar"
        >
          <aero-button
            *ngIf="row.estado === 'BORRADOR'"
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
            title="Enviar para aprobación"
            (clicked)="enviarAprobacion($event, row)"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'ENVIADO'"
            variant="ghost"
            size="small"
            iconCenter="fa-check"
            title="Aprobar"
            (clicked)="aprobar(row)"
          ></aero-button>
          <aero-button
            *ngIf="row.estado === 'ENVIADO'"
            variant="ghost"
            size="small"
            iconCenter="fa-times"
            title="Rechazar"
            (clicked)="rechazar(row)"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
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

      .equipo-info-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .equipo-tipo {
        font-weight: 500;
        color: var(--grey-900);
        font-size: 13px;
      }
      .equipo-desc {
        font-size: 12px;
        color: var(--grey-500);
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .fade-in {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `,
  ],
})
export class SolicitudEquipoListComponent implements OnInit {
  private svc = inject(SolicitudEquipoService);
  private confirmSvc = inject(ConfirmService);
  private router = inject(Router);

  equipmentTabs = EQUIPMENT_TABS;
  operacionesTabs = OPERACIONES_TABS;
  solicitudes: SolicitudEquipo[] = [];
  loading = false;
  filtroEstado = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 1;

  statItems: StatItem[] = [];

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Operaciones', url: '/equipment/operaciones' },
    { label: 'Solicitudes' },
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
        { label: 'Aprobado', value: 'APROBADO' },
        { label: 'Rechazado', value: 'RECHAZADO' },
      ],
    },
    {
      key: 'search',
      label: 'Tipo de Equipo',
      type: 'text',
      placeholder: 'Buscar por tipo de equipo...',
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'codigo', label: 'Codigo', type: 'template', width: '120px', sortable: true },
    { key: 'equipo_info', label: 'Equipo Solicitado', type: 'template' },
    { key: 'cantidad', label: 'Cant.', type: 'text', width: '70px', align: 'center' },
    { key: 'created_at', label: 'F. Solicitud', type: 'date', width: '120px', sortable: true },
    { key: 'fecha_requerida', label: 'F. Requerida', type: 'date', width: '120px', sortable: true },
    { key: 'solicitante', label: 'Solicitante', type: 'text', hidden: true },
    { key: 'proyecto', label: 'Proyecto', type: 'text', hidden: true },
    { key: 'observaciones', label: 'Observaciones', type: 'text', hidden: true },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'badge',
      width: '110px',
      align: 'center',
      badgeConfig: {
        ALTA: { label: 'Alta', class: 'status-badge status-error', icon: 'fa-arrow-up' },
        MEDIA: { label: 'Media', class: 'status-badge status-warning', icon: 'fa-minus' },
        BAJA: { label: 'Baja', class: 'status-badge status-info', icon: 'fa-arrow-down' },
      },
    },
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
        APROBADO: { label: 'Aprobado', class: 'status-badge status-completed', icon: 'fa-check' },
        RECHAZADO: { label: 'Rechazado', class: 'status-badge status-cancelled', icon: 'fa-times' },
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

    this.svc.listar(filters).subscribe({
      next: (res) => {
        this.solicitudes = res.data ?? [];
        this.total = res.pagination?.total ?? 0;
        this.totalPages = res.pagination?.total_pages ?? 1;
        this.calculateStats();
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

  calculateStats() {
    // Generate some stats from the current page/total
    const total = this.total;

    this.statItems = [
      {
        label: 'Total Solicitudes',
        value: total,
        icon: 'fa-file-invoice',
        color: 'primary',
      },
      {
        label: 'Pendientes',
        value: this.solicitudes.filter((s) => s.estado === 'ENVIADO').length,
        icon: 'fa-paper-plane',
        color: 'info',
      },
      {
        label: 'Aprobadas',
        value: this.solicitudes.filter((s) => s.estado === 'APROBADO').length,
        icon: 'fa-check-circle',
        color: 'success',
      },
      {
        label: 'Rechazadas',
        value: this.solicitudes.filter((s) => s.estado === 'RECHAZADO').length,
        icon: 'fa-times-circle',
        color: 'danger',
      },
    ];
  }

  navigateToCreate() {
    this.router.navigate(['/equipment/operaciones/solicitudes/new']);
  }

  verDetalle(id: number) {
    this.router.navigate(['/equipment/operaciones/solicitudes', id]);
  }

  enviarAprobacion(event: Event, s: SolicitudEquipo) {
    event.stopPropagation();
    this.confirmSvc
      .confirm({
        title: 'Enviar Solicitud',
        message: `¿Desea enviar la solicitud ${s.codigo} para aprobación?`,
        icon: 'fa-paper-plane',
        confirmLabel: 'Enviar',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.svc.enviar(s.id).subscribe(() => this.cargar());
        }
      });
  }

  aprobar(s: SolicitudEquipo) {
    this.confirmSvc
      .prompt({
        title: 'Aprobar Solicitud',
        message: `Ingrese observaciones para la aprobación de la solicitud ${s.codigo} (opcional):`,
        icon: 'fa-check-circle',
        confirmLabel: 'Aprobar',
      })
      .subscribe((obs) => {
        if (obs !== null) {
          this.svc.aprobar(s.id, obs || undefined).subscribe({ next: () => this.cargar() });
        }
      });
  }

  rechazar(s: SolicitudEquipo) {
    this.confirmSvc
      .prompt({
        title: 'Rechazar Solicitud',
        message: `Ingrese el motivo de rechazo para la solicitud ${s.codigo}:`,
        icon: 'fa-times-circle',
        confirmLabel: 'Rechazar',
        isDanger: true,
        inputRequired: true,
      })
      .subscribe((obs) => {
        if (obs) {
          this.svc.rechazar(s.id, obs).subscribe({ next: () => this.cargar() });
        }
      });
  }
}
