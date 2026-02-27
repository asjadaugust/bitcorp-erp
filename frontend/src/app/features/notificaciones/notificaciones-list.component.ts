import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notificacion } from '../../core/services/notification.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-notificaciones-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    FilterBarComponent,
    StatsGridComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Centro de Notificaciones"
      icon="fa-bell"
      [breadcrumbs]="breadcrumbs"
      [loading]="false"
    >
      <!-- Acciones -->
      <app-actions-container actions>
        <app-button
          variant="outline"
          label="Marcar todo como leído"
          icon="fa-check-double"
          [disabled]="svc.totalNoLeidas() === 0"
          data-testid="btn-marcar-todas-leidas"
          (clicked)="marcarTodasLeidas()"
        ></app-button>
      </app-actions-container>

      <!-- Estadísticas -->
      <app-stats-grid [items]="statItems()" class="mb-4"></app-stats-grid>

      <!-- Filtros -->
      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFiltroChange($event)"
      ></app-filter-bar>

      <!-- Lista vacía -->
      <div
        *ngIf="notificacionesFiltradas().length === 0"
        class="empty-center"
        data-testid="empty-state"
      >
        <i class="fa-regular fa-bell-slash fa-2x"></i>
        <p>No hay notificaciones{{ filtroActivo ? ' con ese filtro' : '' }}</p>
      </div>

      <!-- Lista de notificaciones -->
      <div class="notif-lista" data-testid="notification-list">
        <div
          *ngFor="let n of notificacionesFiltradas()"
          class="notif-card"
          [class.no-leida]="!n.leido"
          [attr.data-testid]="'notif-card-' + n.id"
        >
          <!-- Icono tipo -->
          <div class="notif-icono" [ngClass]="'icono-' + n.tipo.toLowerCase()">
            <i class="fa-solid" [ngClass]="getIcono(n.tipo)"></i>
          </div>

          <!-- Contenido principal -->
          <div class="notif-contenido">
            <div class="notif-header-row">
              <span class="notif-titulo" [attr.data-testid]="'notif-titulo-' + n.id">
                {{ n.titulo }}
              </span>
              <span class="notif-tipo-badge" [ngClass]="'badge-tipo-' + n.tipo.toLowerCase()">
                {{ tipoLabel(n.tipo) }}
              </span>
            </div>
            <p class="notif-mensaje" [attr.data-testid]="'notif-mensaje-' + n.id">
              {{ n.mensaje }}
            </p>
            <div class="notif-meta">
              <span class="notif-fecha">
                <i class="fa-regular fa-clock"></i>
                {{ n.created_at | date: 'dd/MM/yyyy HH:mm' }}
              </span>
              <a
                *ngIf="n.url"
                [routerLink]="n.url"
                class="notif-enlace"
                (click)="marcarLeida(n)"
                [attr.data-testid]="'notif-enlace-' + n.id"
              >
                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75em;"></i>
                Ver detalle
              </a>
            </div>
          </div>

          <!-- Acciones -->
          <div class="notif-acciones">
            <app-button
              *ngIf="!n.leido"
              variant="icon"
              size="sm"
              icon="fa-check"
              title="Marcar como leída"
              [attr.data-testid]="'btn-marcar-leida-' + n.id"
              (clicked)="marcarLeida(n)"
            ></app-button>
            <app-button
              variant="icon"
              size="sm"
              icon="fa-trash"
              title="Eliminar"
              [attr.data-testid]="'btn-eliminar-' + n.id"
              (clicked)="eliminar(n.id)"
            ></app-button>
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .notif-lista {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 var(--s-24) var(--s-24);
      }

      .notif-card {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md);
        padding: 16px;
        transition: box-shadow 0.15s;
      }
      .notif-card:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
      .notif-card.no-leida {
        border-left: 4px solid var(--primary-600);
        background: var(--semantic-blue-100);
      }

      .notif-icono {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 16px;
      }
      .icono-warning {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-700);
      }
      .icono-error {
        background: var(--semantic-red-100);
        color: var(--semantic-red-500);
      }
      .icono-success {
        background: var(--semantic-green-100);
        color: var(--semantic-green-500);
      }
      .icono-info {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }
      .icono-approval_required {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }
      .icono-approval_completed {
        background: var(--semantic-green-100);
        color: var(--semantic-green-500);
      }
      .icono-contract_expiry {
        background: var(--semantic-red-100);
        color: var(--semantic-red-500);
      }
      .icono-maintenance_due {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-700);
      }
      .icono-schedule_assignment {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-500);
      }
      .icono-system {
        background: var(--grey-100);
        color: var(--grey-600);
      }

      .notif-contenido {
        flex: 1;
        min-width: 0;
      }
      .notif-header-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
        flex-wrap: wrap;
      }
      .notif-titulo {
        font-weight: 600;
        font-size: 0.95rem;
        color: var(--grey-900);
      }
      .notif-tipo-badge {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 2px 7px;
        border-radius: var(--radius-sm);
        text-transform: uppercase;
      }
      .badge-tipo-warning {
        background: var(--semantic-yellow-100);
        color: var(--semantic-yellow-900);
      }
      .badge-tipo-error {
        background: var(--semantic-red-100);
        color: var(--semantic-red-900);
      }
      .badge-tipo-success {
        background: var(--semantic-green-100);
        color: var(--semantic-green-900);
      }
      .badge-tipo-info {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-900);
      }
      .badge-tipo-approval_required {
        background: var(--semantic-blue-100);
        color: var(--semantic-blue-900);
      }
      .badge-tipo-approval_completed {
        background: var(--semantic-green-100);
        color: var(--semantic-green-900);
      }
      .badge-tipo-contract_expiry,
      .badge-tipo-maintenance_due,
      .badge-tipo-schedule_assignment,
      .badge-tipo-system {
        background: var(--grey-100);
        color: var(--grey-600);
      }
      .notif-mensaje {
        margin: 0 0 8px;
        font-size: 0.875rem;
        color: var(--grey-700);
        line-height: 1.5;
      }
      .notif-meta {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .notif-fecha {
        font-size: 0.78rem;
        color: var(--grey-400);
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .notif-enlace {
        font-size: 0.78rem;
        color: var(--primary-700);
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .notif-enlace:hover {
        text-decoration: underline;
      }

      .notif-acciones {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex-shrink: 0;
      }
      .empty-center {
        text-align: center;
        padding: 48px 24px;
        color: var(--grey-500);
      }
      .empty-center i {
        display: block;
        margin-bottom: 12px;
        color: var(--grey-400);
      }
      .empty-center p {
        font-size: 0.95rem;
        margin: 0;
      }

      .mb-4 {
        margin-bottom: 16px;
      }
    `,
  ],
})
export class NotificacionesListComponent implements OnInit {
  svc = inject(NotificationService);

  breadcrumbs: Breadcrumb[] = [{ label: 'Notificaciones' }];

  filterConfig: FilterConfig[] = [
    {
      key: 'tipo',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'Advertencia', value: 'warning' },
        { label: 'Error', value: 'error' },
        { label: 'Éxito', value: 'success' },
        { label: 'Información', value: 'info' },
        { label: 'Aprobación requerida', value: 'approval_required' },
        { label: 'Aprobación completada', value: 'approval_completed' },
        { label: 'Vencimiento contrato', value: 'CONTRACT_EXPIRY' },
        { label: 'Mantenimiento', value: 'MAINTENANCE_DUE' },
        { label: 'Sistema', value: 'SYSTEM' },
      ],
    },
    {
      key: 'leido',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Todos', value: '' },
        { label: 'No leídas', value: 'false' },
        { label: 'Leídas', value: 'true' },
      ],
    },
  ];

  // Filtros como señal para reactividad
  tipoFiltro = signal<string>('');
  estadoFiltro = signal<string>('');

  // Notificaciones filtradas calculadas automáticamente
  notificacionesFiltradas = computed(() => {
    const todas = this.svc.notificaciones();
    const tipo = this.tipoFiltro();
    const estado = this.estadoFiltro();

    let lista = [...todas];
    if (tipo) {
      lista = lista.filter((n) => n.tipo === tipo);
    }
    if (estado !== '') {
      const soloLeidas = estado === 'true';
      lista = lista.filter((n) => n.leido === soloLeidas);
    }
    return lista;
  });

  // Estadísticas calculadas automáticamente
  statItems = computed<StatItem[]>(() => {
    const todas = this.svc.notificaciones();
    // Usamos el total real del servicio para "No leídas"
    const noLeidasTotal = this.svc.totalNoLeidas();

    // Para alertas y aprobaciones, aproximamos con lo que tenemos cargado
    // (O idealmente el backend debería devolver estos conteos también)
    const advertencias = todas.filter(
      (n) => n.tipo === 'warning' || n.tipo === 'CONTRACT_EXPIRY' || n.tipo === 'MAINTENANCE_DUE'
    ).length;
    const aprobaciones = todas.filter((n) => n.tipo === 'approval_required').length;

    return [
      { label: 'No leídas', value: noLeidasTotal, icon: 'fa-bell', color: 'warning' },
      { label: 'Alertas', value: advertencias, icon: 'fa-triangle-exclamation', color: 'danger' },
      { label: 'Aprobaciones', value: aprobaciones, icon: 'fa-clock', color: 'info' },
      { label: 'Total', value: todas.length, icon: 'fa-list', color: 'info' },
    ];
  });

  get filtroActivo() {
    return this.tipoFiltro() !== '' || this.estadoFiltro() !== '';
  }

  ngOnInit() {
    this.svc.obtenerNotificaciones();
  }

  onFiltroChange(filtros: Record<string, string>) {
    if (filtros['tipo'] !== undefined) this.tipoFiltro.set(filtros['tipo']);
    if (filtros['leido'] !== undefined) this.estadoFiltro.set(filtros['leido']);
  }

  marcarLeida(n: Notificacion) {
    if (!n.leido) {
      this.svc.marcarLeida(n.id).subscribe();
    }
  }

  marcarTodasLeidas() {
    this.svc.marcarTodasLeidas().subscribe();
  }

  eliminar(id: number) {
    this.svc.eliminar(id).subscribe();
  }

  getIcono(tipo: string): string {
    const mapa: Record<string, string> = {
      warning: 'fa-triangle-exclamation',
      error: 'fa-circle-xmark',
      success: 'fa-circle-check',
      info: 'fa-circle-info',
      approval_required: 'fa-clock',
      approval_completed: 'fa-check-circle',
      CONTRACT_EXPIRY: 'fa-file-contract',
      MAINTENANCE_DUE: 'fa-screwdriver-wrench',
      SCHEDULE_ASSIGNMENT: 'fa-calendar-check',
      SYSTEM: 'fa-gear',
    };
    return mapa[tipo] ?? 'fa-bell';
  }

  tipoLabel(tipo: string): string {
    const mapa: Record<string, string> = {
      warning: 'Advertencia',
      error: 'Error',
      success: 'Éxito',
      info: 'Info',
      approval_required: 'Aprobación',
      approval_completed: 'Aprobado',
      CONTRACT_EXPIRY: 'Contrato',
      MAINTENANCE_DUE: 'Mantenimiento',
      SCHEDULE_ASSIGNMENT: 'Asignación',
      SYSTEM: 'Sistema',
    };
    return mapa[tipo] ?? tipo;
  }
}
