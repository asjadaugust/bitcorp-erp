import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { EquipmentService } from '../../../core/services/equipment.service';
import { Equipment } from '../../../core/models/equipment.model';
import { DailyReportService } from '../../../core/services/daily-report.service';
import { ContractService } from '../../../core/services/contract.service';
import { MaintenanceScheduleService } from '../../../core/services/maintenance-schedule.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  EntityDetailShellComponent,
  EntityDetailHeader,
  AuditInfo,
  NotFoundConfig,
  TabConfig,
} from '../../../shared/components/entity-detail';
import {
  SolicitudEquipoService,
  SolicitudEquipo,
} from '../../../core/services/solicitud-equipo.service';
import { ValeCombustibleService } from '../../../core/services/vale-combustible.service';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../../core/design-system/data-grid/aero-data-grid.component';
import { PeriodoInoperatividadListComponent } from '../periodo-inoperatividad-list.component';
import { AeroTabsComponent } from '../../../shared/components/aero-tabs/aero-tabs.component';
import {
  AeroButtonComponent,
  AeroBadgeComponent,
  BreadcrumbItem,
} from '../../../core/design-system';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityDetailShellComponent,
    AeroDataGridComponent,
    PeriodoInoperatividadListComponent,
    AeroTabsComponent,
    AeroButtonComponent,
    AeroBadgeComponent,
  ],
  template: `
    <app-entity-detail-shell
      [loading]="loading"
      [entity]="equipment"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      [backUrl]="'/equipment'"
      [breadcrumbs]="breadcrumbs"
      loadingText="Cargando detalles del equipo..."
    >
      <div entity-header-below>
        <app-aero-tabs
          [tabs]="tabConfigs"
          [activeTabId]="activeTab"
          (tabChange)="activeTab = $event.id || 'general'"
        ></app-aero-tabs>
      </div>

      <div entity-main-content class="detail-sections">
        @if (equipment) {
          @if (activeTab === 'general') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Resumen Principal</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Estado Actual</span>
                  <div class="value-with-icon" [ngClass]="getStatusClass(equipment?.estado ?? '')">
                    <i [class]="getStatusIcon(equipment?.estado ?? '')"></i>
                    <span class="value">{{ equipment?.estado }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <span class="label">Tipo de Equipo</span>
                  <p class="value">
                    {{ equipment?.tipo_equipo_nombre || equipment?.categoria || '-' }}
                  </p>
                </div>
                <div class="info-item">
                  <span class="label">Categoría PRD</span>
                  <div class="value">
                    @if (equipment?.categoria_prd) {
                      <span
                        class="cat-badge"
                        [class]="getCategoriaPrdClass(equipment!.categoria_prd!)"
                      >
                        {{ getCategoriaPrdLabel(equipment!.categoria_prd!) }}
                      </span>
                    } @else {
                      <span>-</span>
                    }
                  </div>
                </div>
                <div class="info-item">
                  <span class="label">Propiedad</span>
                  <div class="value">
                    <aero-badge
                      [variant]="
                        equipment?.es_propio || equipment?.tipo_proveedor === 'PROPIO'
                          ? 'success'
                          : 'info'
                      "
                    >
                      {{
                        equipment?.es_propio || equipment?.tipo_proveedor === 'PROPIO'
                          ? 'Propio'
                          : 'Tercero'
                      }}
                    </aero-badge>
                  </div>
                </div>
              </div>
            </div>

            <div class="detail-section card mt-24">
              <div class="section-header">
                <h3>Especificaciones Técnicas</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Marca / Modelo</span>
                  <p class="value">{{ equipment?.marca || '' }} {{ equipment?.modelo || '' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Número de Serie</span>
                  <p class="value">{{ equipment?.numero_serie_equipo || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Número de Chasis</span>
                  <p class="value">{{ equipment?.numero_chasis || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Serie Motor</span>
                  <p class="value">{{ equipment?.numero_serie_motor || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Año de Fabricación</span>
                  <p class="value">{{ equipment?.anio_fabricacion || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Placa / Código Externo</span>
                  <p class="value">{{ equipment?.placa || equipment?.codigo_externo || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Tipo de Medición</span>
                  <p class="value highlight project-link">
                    {{ equipment?.tipo_medicion || equipment?.medidor_uso || '-' }}
                  </p>
                </div>
                <div class="info-item">
                  <span class="label">Tipo de Motor</span>
                  <p class="value">{{ equipment?.tipo_motor || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Potencia Neta</span>
                  <p class="value">
                    {{ equipment?.net_power ? equipment?.net_power + ' HP' : '-' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="detail-section card mt-24">
              <div class="section-header">
                <h3>Asignación Actual</h3>
              </div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Proyecto / Ubicación</span>
                  <p class="value highlight project-link">
                    {{ equipment?.proyecto_nombre || 'Sin Asignar' }}
                  </p>
                </div>
                <div class="info-item">
                  <span class="label">Fecha de Asignación</span>
                  <p class="value">
                    {{
                      equipment?.fecha_asignacion
                        ? (equipment?.fecha_asignacion | date: 'dd/MM/yyyy')
                        : '-'
                    }}
                  </p>
                </div>
                <div class="info-item">
                  <span class="label">Operador Asignado</span>
                  <p class="value">{{ equipment?.operador_nombre || '-' }}</p>
                </div>
                <div class="info-item">
                  <span class="label">Horómetro / Kilometraje Actual</span>
                  <p class="value highlight project-link">
                    {{ equipment?.horometro_actual || equipment?.kilometraje_actual || '0.0' }}
                  </p>
                </div>
              </div>
            </div>
          }
          @if (activeTab === 'maintenance') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Historial de Mantenimiento</h3>
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="scheduleMaintenance()"
                  >Programar</aero-button
                >
              </div>

              <aero-data-grid
                [gridId]="'equipment-detail'"
                [columns]="maintenanceColumns"
                [data]="maintenanceHistory"
                [loading]="false"
                [dense]="true"
                emptyMessage="No hay registros de mantenimiento para este equipo."
              ></aero-data-grid>
            </div>
          }
          @if (activeTab === 'contracts') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Contratos Asociados</h3>
              </div>

              <aero-data-grid
                [gridId]="'equipment-detail-contracts'"
                [columns]="contractColumns"
                [data]="contracts"
                [loading]="false"
                [dense]="true"
                [templates]="{ numero_contrato: contractCodeTemplate }"
                emptyMessage="No hay contratos asociados a este equipo."
                (rowClick)="router.navigate(['/equipment/operaciones/contratos', $event.id])"
              ></aero-data-grid>

              <ng-template #contractCodeTemplate let-row>
                <a
                  [routerLink]="['/equipment/operaciones/contratos', row.id]"
                  class="link-primary"
                  (click)="$event.stopPropagation()"
                >
                  {{ row.numero_contrato || '#' + row.id }}
                </a>
              </ng-template>
            </div>
          }
          @if (activeTab === 'reports') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Partes Diarios Recientes</h3>
              </div>

              <aero-data-grid
                [gridId]="'equipment-detail-reports'"
                [columns]="reportColumns"
                [data]="dailyReports"
                [loading]="false"
                [dense]="true"
                [templates]="{ codigo: reportCodeTemplate }"
                emptyMessage="No se han registrado partes diarios para este equipo recientemente."
                (rowClick)="router.navigate(['/daily-reports', $event.id])"
              ></aero-data-grid>

              <ng-template #reportCodeTemplate let-row>
                <span class="code-badge">{{ row.codigo || row.id }}</span>
              </ng-template>
            </div>
          }
          @if (activeTab === 'solicitudes') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Solicitudes de Equipo</h3>
              </div>

              <aero-data-grid
                [gridId]="'equipment-detail-solicitudes'"
                [columns]="solicitudColumns"
                [data]="solicitudes"
                [loading]="false"
                [dense]="true"
                [templates]="{ codigo: solicitudCodeTemplate }"
                emptyMessage="No hay solicitudes pendientes para este tipo de equipo."
              ></aero-data-grid>

              <ng-template #solicitudCodeTemplate let-row>
                <span class="code-badge">{{ row.codigo || row.id }}</span>
              </ng-template>
            </div>
          }
          @if (activeTab === 'inoperatividad' && equipment) {
            <div class="detail-section card" style="padding: 0;">
              <app-periodo-inoperatividad-list
                [equipoId]="equipment.id"
              ></app-periodo-inoperatividad-list>
            </div>
          }
          @if (activeTab === 'combustible' && equipment) {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Vales de Combustible</h3>
                <aero-button
                  variant="primary"
                  size="small"
                  iconLeft="fa-plus"
                  (clicked)="
                    router.navigate(['/equipment/vales-combustible/new'], {
                      queryParams: { equipo_id: equipment.id },
                    })
                  "
                  >Nuevo Vale</aero-button
                >
              </div>
              <aero-data-grid
                [gridId]="'equipment-detail-fuel'"
                [columns]="fuelColumns"
                [data]="fuelVouchers"
                [loading]="loadingFuel"
                [dense]="true"
                [templates]="{ codigo: fuelCodeTemplate }"
                emptyMessage="No hay vales de combustible para este equipo."
                (rowClick)="router.navigate(['/equipment/vales-combustible', $event.id])"
              ></aero-data-grid>
              <ng-template #fuelCodeTemplate let-row>
                <a
                  [routerLink]="['/equipment/vales-combustible', row.id]"
                  class="link-primary"
                  (click)="$event.stopPropagation()"
                >
                  {{ row.codigo || '#' + row.id }}
                </a>
              </ng-template>
            </div>
          }
        }
      </div>

      <ng-container entity-sidebar-actions>
        <aero-button
          variant="secondary"
          iconLeft="fa-pen-to-square"
          [fullWidth]="true"
          (clicked)="editEquipment()"
          >Editar Equipo</aero-button
        >
        <aero-button
          variant="primary"
          iconLeft="fa-location-dot"
          [fullWidth]="true"
          (clicked)="assignToProject()"
          >Asignar a Proyecto</aero-button
        >
        <aero-button
          variant="secondary"
          iconLeft="fa-screwdriver-wrench"
          [fullWidth]="true"
          (clicked)="scheduleMaintenance()"
          >Programar Mantenimiento</aero-button
        >
        <aero-button
          variant="secondary"
          iconLeft="fa-triangle-exclamation"
          [fullWidth]="true"
          (clicked)="registrarInoperatividad()"
          >Registrar Inoperatividad</aero-button
        >
        <aero-button
          variant="secondary"
          iconLeft="fa-clock-rotate-left"
          [fullWidth]="true"
          (clicked)="viewHistory()"
          >Ver Historial</aero-button
        >
        <hr class="sidebar-divider" />
        <aero-button
          variant="danger"
          iconLeft="fa-trash"
          [fullWidth]="true"
          (clicked)="deleteEquipment()"
          >Eliminar Equipo</aero-button
        >
      </ng-container>
    </app-entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .sidebar-divider {
        border: none;
        border-top: 1px solid var(--grey-100);
        margin: var(--s-16) 0;
      }

      .detail-sections {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .detail-section {
        padding: var(--s-24);
        border-radius: 16px;

        h3 {
          font-size: 0.75rem;
          margin: 0;
          color: var(--grey-600);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--s-20);

        h3 {
          font-size: 0.75rem;
          margin: 0;
          color: var(--grey-600);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 24px 40px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 8px;

        label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--grey-500);
          font-weight: 700;
          margin-bottom: 4px;
          display: block;
        }

        .value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--grey-900);
          margin: 0;
          line-height: 1.4;

          &.highlight {
            color: var(--primary-700);
            font-weight: 700;
            font-size: 1.05rem;
          }
        }

        .value-with-icon {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 0.95rem;

          i {
            font-size: 0.9rem;
          }
        }

        &.status-APROBADO {
          .value,
          .value-with-icon {
            color: var(--primary-900);
          }
        }
        &.status-PENDIENTE {
          .value,
          .value-with-icon {
            color: var(--semantic-orange-600);
          }
        }
      }

      .link-primary {
        color: var(--primary-600);
        text-decoration: none;
        font-weight: 600;
        &:hover {
          text-decoration: underline;
        }
      }

      .code-badge {
        background: var(--grey-50);
        border: 1px solid var(--grey-200);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: var(--font-family-mono);
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-700);
      }

      .cat-badge {
        display: inline-block;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 10px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .badge-cat-maquinaria {
        background: var(--semantic-yellow-50);
        color: var(--grey-900);
      }
      .badge-cat-pesado {
        background: var(--semantic-red-50);
        color: var(--grey-900);
      }
      .badge-cat-liviano {
        background: var(--primary-50);
        color: var(--primary-700);
      }
      .badge-cat-menor {
        background: var(--semantic-green-50);
        color: var(--primary-900);
      }

      .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      .mt-24 {
        margin-top: 24px;
      }
    `,
  ],
})
export class EquipmentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router);
  private equipmentService = inject(EquipmentService);
  private dailyReportService = inject(DailyReportService);
  private contractService = inject(ContractService);
  private maintenanceService = inject(MaintenanceScheduleService);
  private solicitudService = inject(SolicitudEquipoService);
  private valeCombustibleService = inject(ValeCombustibleService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  loading = true;
  get breadcrumbs(): BreadcrumbItem[] {
    return [
      { label: 'Equipos', url: '/equipment' },
      { label: this.equipment?.codigo_equipo || 'Detalle' },
    ];
  }

  equipment: Equipment | null = null;
  activeTab = 'general';
  dailyReports: Record<string, unknown>[] = [];
  contracts: Record<string, unknown>[] = [];
  maintenanceHistory: Record<string, unknown>[] = [];
  solicitudes: SolicitudEquipo[] = [];
  fuelVouchers: Record<string, unknown>[] = [];
  loadingFuel = false;

  tabConfigs: TabConfig[] = [
    { id: 'general', label: 'General', icon: 'fa-solid fa-circle-info' },
    { id: 'maintenance', label: 'Mantenimiento', icon: 'fa-solid fa-screwdriver-wrench' },
    { id: 'contracts', label: 'Contratos', icon: 'fa-solid fa-file-contract' },
    { id: 'reports', label: 'Partes Diarios', icon: 'fa-solid fa-clipboard-list' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'fa-solid fa-file-invoice' },
    { id: 'inoperatividad', label: 'Inoperatividad', icon: 'fa-solid fa-triangle-exclamation' },
    { id: 'combustible', label: 'Combustible', icon: 'fa-solid fa-gas-pump' },
  ];

  maintenanceColumns: DataGridColumn[] = [
    { key: 'fechaProgramada', label: 'Fecha Prog.', type: 'date' },
    { key: 'tipoMantenimiento', label: 'Tipo', type: 'text' },
    { key: 'descripcion', label: 'Descripción', type: 'text' },
    { key: 'tecnicoResponsable', label: 'Técnico', type: 'text' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PROGRAMADO: {
          label: 'Programado',
          class: 'status-badge status-PENDIENTE',
          icon: 'fa-clock',
        },
        EN_PROCESO: {
          label: 'En Proceso',
          class: 'status-badge status-EN_OPERACION',
          icon: 'fa-wrench',
        },
        COMPLETADO: {
          label: 'Completado',
          class: 'status-badge status-APROBADO',
          icon: 'fa-check',
        },
        CANCELADO: { label: 'Cancelado', class: 'status-badge status-CANCELADO', icon: 'fa-xmark' },
      },
    },
  ];

  contractColumns: DataGridColumn[] = [
    { key: 'numero_contrato', label: 'N° Contrato', type: 'template' },
    { key: 'proveedor_razon_social', label: 'Proveedor', type: 'text' },
    { key: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
    { key: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
    { key: 'tarifa', label: 'Tarifa', type: 'currency' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        ACTIVO: { label: 'Activo', class: 'status-badge status-APROBADO', icon: 'fa-check' },
        VENCIDO: { label: 'Vencido', class: 'status-badge status-CANCELADO', icon: 'fa-clock' },
        FINALIZADO: {
          label: 'Finalizado',
          class: 'status-badge status-CANCELADO',
          icon: 'fa-check',
        },
        BORRADOR: { label: 'Borrador', class: 'status-badge status-PENDIENTE' },
      },
    },
  ];

  reportColumns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template' },
    { key: 'fecha_parte', label: 'Fecha', type: 'date' },
    { key: 'proyecto_nombre', label: 'Proyecto', type: 'text' },
    { key: 'horometro_inicial', label: 'H. Inicial', type: 'text' },
    { key: 'horometro_final', label: 'H. Final', type: 'text' },
    { key: 'horas_trabajadas', label: 'Horas', type: 'text' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-PENDIENTE' },
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-PENDIENTE', icon: 'fa-clock' },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-APROBADO', icon: 'fa-check' },
        RECHAZADO: { label: 'Rechazado', class: 'status-badge status-CANCELADO', icon: 'fa-xmark' },
      },
    },
  ];

  solicitudColumns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template' },
    { key: 'fecha_requerida', label: 'Fecha Req.', type: 'date' },
    { key: 'tipo_equipo', label: 'Tipo de Equipo', type: 'text' },
    { key: 'cantidad', label: 'Cant.', type: 'text' },
    {
      key: 'prioridad',
      label: 'Prioridad',
      type: 'badge',
      badgeConfig: {
        BAJA: { label: 'Baja', class: 'status-badge status-PENDIENTE' },
        MEDIA: { label: 'Media', class: 'status-badge status-EN_OPERACION' },
        ALTA: { label: 'Alta', class: 'status-badge status-CANCELADO' },
      },
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: { label: 'Borrador', class: 'status-badge status-PENDIENTE' },
        ENVIADO: {
          label: 'Enviado',
          class: 'status-badge status-EN_OPERACION',
          icon: 'fa-paper-plane',
        },
        APROBADO: { label: 'Aprobado', class: 'status-badge status-APROBADO', icon: 'fa-check' },
        RECHAZADO: { label: 'Rechazado', class: 'status-badge status-CANCELADO', icon: 'fa-xmark' },
      },
    },
  ];

  fuelColumns: DataGridColumn[] = [
    { key: 'codigo', label: 'Código', type: 'template' },
    { key: 'fecha', label: 'Fecha', type: 'date' },
    { key: 'tipo_combustible', label: 'Tipo', type: 'text' },
    { key: 'cantidad_galones', label: 'Galones', type: 'text' },
    { key: 'monto_total', label: 'Monto', type: 'currency' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PENDIENTE: { label: 'Pendiente', class: 'status-badge status-PENDIENTE', icon: 'fa-clock' },
        REGISTRADO: {
          label: 'Registrado',
          class: 'status-badge status-APROBADO',
          icon: 'fa-check',
        },
        ANULADO: { label: 'Anulado', class: 'status-badge status-CANCELADO', icon: 'fa-xmark' },
      },
    },
  ];

  get header(): EntityDetailHeader {
    return {
      icon: 'fa-solid fa-truck-monster',
      title: this.equipment?.codigo_equipo || 'Detalle de Equipo',
      codeBadge: this.equipment?.placa || '',
      subtitle: `${this.equipment?.marca || ''} ${this.equipment?.modelo || ''}`,
      statusLabel: this.equipment?.estado || 'Desconocido',
      statusClass: this.getStatusClass(this.equipment?.estado || ''),
    };
  }

  get auditInfo(): AuditInfo {
    return {
      entries: [
        {
          label: 'Creado por',
          date: this.equipment?.created_at,
        },
        {
          label: 'Última actualización',
          date: this.equipment?.updated_at,
        },
      ],
    };
  }

  get notFoundConfig(): NotFoundConfig {
    return {
      icon: 'fa-solid fa-search',
      title: 'Equipo no encontrado',
      message: 'El equipo que está buscando no existe o ha sido eliminado.',
      backLabel: 'Volver a equipos',
      backRoute: '/equipment',
    };
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadEquipmentDetail(id);
      }
    });

    // Check query params for active tab (e.g., ?tab=inoperatividad)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['tab']) {
        this.activeTab = params['tab'];
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEquipmentDetail(id: string): void {
    this.loading = true;
    this.equipmentService.getById(id).subscribe({
      next: (equipment) => {
        this.equipment = equipment;
        this.loading = false;
        this.loadRelatedData(id);
      },
      error: () => {
        this.loading = false;
        this.equipment = null;
      },
    });
  }

  loadRelatedData(id: string): void {
    this.dailyReportService.getAll({ equipo_id: id }).subscribe((data: unknown) => {
      const d = data as Record<string, unknown>;
      this.dailyReports = Array.isArray(d) ? d : (d['data'] as Record<string, unknown>[]) || [];
    });
    this.contractService.getAll({ equipmentId: id }).subscribe((data: unknown) => {
      const d = data as Record<string, unknown>;
      this.contracts = Array.isArray(d) ? d : (d['data'] as Record<string, unknown>[]) || [];
    });
    this.maintenanceService.getAll({ equipoId: id }).subscribe((data: unknown) => {
      const d = data as Record<string, unknown>;
      this.maintenanceHistory = Array.isArray(d)
        ? d
        : (d['data'] as Record<string, unknown>[]) || [];
    });
    this.solicitudService.listar({ estado: 'APROBADO' }).subscribe((data) => {
      this.solicitudes = data.data || [];
    });
    this.loadingFuel = true;
    this.valeCombustibleService.listar({ equipo_id: Number(id), limit: 50 }).subscribe({
      next: (data) => {
        this.fuelVouchers = (data.data || []) as unknown as Record<string, unknown>[];
        this.loadingFuel = false;
      },
      error: () => {
        this.loadingFuel = false;
      },
    });
  }

  editEquipment(): void {
    if (this.equipment) {
      this.router.navigate(['/equipment', this.equipment.id, 'edit']);
    }
  }

  assignToProject(): void {
    this.snackBar.open('Asignar a Proyecto — Próximamente', 'Cerrar', { duration: 3000 });
  }

  scheduleMaintenance(): void {
    this.snackBar.open('Programar Mantenimiento — Próximamente', 'Cerrar', { duration: 3000 });
  }

  viewHistory(): void {
    this.snackBar.open('Ver Historial — Próximamente', 'Cerrar', { duration: 3000 });
  }

  deleteEquipment(): void {
    if (!this.equipment) return;
    this.confirmSvc
      .confirmDelete(`el equipo ${this.equipment.codigo_equipo}`)
      .subscribe((confirmed) => {
        if (confirmed) {
          this.confirmDelete();
        }
      });
  }

  confirmDelete(): void {
    if (this.equipment) {
      this.equipmentService.delete(this.equipment.id).subscribe({
        next: () => {
          this.router.navigate(['/equipment']);
        },
        error: (error) => {
          console.error('Failed to delete equipment:', error);
        },
      });
    }
  }

  registrarInoperatividad(): void {
    if (this.equipment) {
      this.router.navigate(['/equipment/inoperatividad/new'], {
        queryParams: { equipo_id: this.equipment.id },
      });
    }
  }

  getCategoriaPrdLabel(cat: string): string {
    const labels: Record<string, string> = {
      MAQUINARIA_PESADA: 'Maquinaria Pesada',
      VEHICULOS_PESADOS: 'Vehículos Pesados',
      VEHICULOS_LIVIANOS: 'Vehículos Livianos',
      EQUIPOS_MENORES: 'Equipos Menores',
    };
    return labels[cat] ?? cat;
  }

  getCategoriaPrdClass(cat: string): string {
    const classes: Record<string, string> = {
      MAQUINARIA_PESADA: 'badge-cat-maquinaria',
      VEHICULOS_PESADOS: 'badge-cat-pesado',
      VEHICULOS_LIVIANOS: 'badge-cat-liviano',
      EQUIPOS_MENORES: 'badge-cat-menor',
    };
    return classes[cat] ?? '';
  }

  getStatusClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'DISPONIBLE':
        return 'status-APROBADO';
      case 'EN_USO':
      case 'MANTENIMIENTO':
        return 'status-PENDIENTE';
      case 'RETIRADO':
        return 'status-CANCELADO';
      default:
        return 'status-BORRADOR';
    }
  }

  getStatusIcon(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'DISPONIBLE':
        return 'fa-solid fa-check-circle';
      case 'EN_USO':
        return 'fa-solid fa-truck-moving';
      case 'MANTENIMIENTO':
        return 'fa-solid fa-wrench';
      case 'RETIRADO':
        return 'fa-solid fa-ban';
      default:
        return 'fa-solid fa-circle-info';
    }
  }
}
