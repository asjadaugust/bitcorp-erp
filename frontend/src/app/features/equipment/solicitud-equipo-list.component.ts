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
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-solicitud-equipo-list',
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
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Solicitudes de Equipo"
      icon="fa-file-invoice"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <app-actions-container actions>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Solicitud"
          (clicked)="navigateToCreate()"
        ></app-button>
      </app-actions-container>

      <div class="stats-container-fade-in" *ngIf="statItems.length > 0">
        <app-stats-grid [items]="statItems" class="mb-4"></app-stats-grid>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
        <aero-table
          [columns]="columns"
          [data]="solicitudes"
          [loading]="loading"
          [actionsTemplate]="actionsTemplate"
          [serverSide]="true"
          [totalItems]="total"
          [pageSize]="limit"
          (pageChange)="onPageChange($event)"
          [templates]="{
            codigo: codeTemplate,
            estado: estadoTemplate,
            prioridad: prioridadTemplate,
          }"
          (rowClick)="verDetalle($event.id)"
        >
        </aero-table>
      </app-page-card>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #estadoTemplate let-row>
        <span class="status-badge" [ngClass]="'status-' + row.estado.toLowerCase()">
          <i class="fa-solid" [ngClass]="getStatusIcon(row.estado)"></i>
          {{ row.estado }}
        </span>
      </ng-template>

      <ng-template #prioridadTemplate let-row>
        <span class="priority-badge" [ngClass]="'priority-' + row.prioridad.toLowerCase()">
          {{ row.prioridad }}
        </span>
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
          <button
            *ngIf="row.estado === 'BORRADOR'"
            class="btn-icon"
            title="Editar"
            [routerLink]="[row.id, 'edit']"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            *ngIf="row.estado === 'BORRADOR'"
            class="btn-icon text-success"
            title="Enviar para aprobación"
            (click)="enviarAprobacion($event, row)"
          >
            <i class="fa-solid fa-paper-plane"></i>
          </button>
          <button
            *ngIf="row.estado === 'ENVIADO'"
            class="btn-icon text-success"
            title="Aprobar"
            (click)="aprobar(row)"
          >
            <i class="fa-solid fa-check"></i>
          </button>
          <button
            *ngIf="row.estado === 'ENVIADO'"
            class="btn-icon text-danger"
            title="Rechazar"
            (click)="rechazar(row)"
          >
            <i class="fa-solid fa-times"></i>
          </button>
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
      .status-aprobado {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-rechazado {
        background: var(--semantic-red-50);
        color: var(--semantic-red-700);
      }

      .priority-badge {
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 700;
      }

      .priority-alta {
        background: #fef2f2;
        color: #ef4444;
      }
      .priority-media {
        background: #fffbeb;
        color: #f59e0b;
      }
      .priority-baja {
        background: #f0fdf4;
        color: #22c55e;
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

      .btn-icon.text-success:hover {
        background: var(--semantic-green-50);
        color: var(--semantic-green-600);
      }

      .btn-icon.text-danger:hover {
        background: var(--semantic-red-50);
        color: var(--semantic-red-600);
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

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template', width: '120px' },
    { key: 'tipo_equipo', label: 'Tipo de Equipo', type: 'text' },
    { key: 'cantidad', label: 'Cant.', type: 'text', width: '80px', align: 'center' },
    { key: 'fecha_requerida', label: 'F. Requerida', type: 'date', width: '150px' },
    { key: 'prioridad', label: 'Prioridad', type: 'template', width: '120px', align: 'center' },
    { key: 'estado', label: 'Estado', type: 'template', width: '150px', align: 'center' },
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

  getStatusIcon(estado: string): string {
    const icons: Record<string, string> = {
      BORRADOR: 'fa-pencil',
      ENVIADO: 'fa-paper-plane',
      APROBADO: 'fa-check',
      RECHAZADO: 'fa-times',
    };
    return icons[estado] || 'fa-info-circle';
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
