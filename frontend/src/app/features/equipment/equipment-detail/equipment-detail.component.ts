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
import {
  AeroTableComponent,
  TableColumn,
} from '../../../core/design-system/table/aero-table.component';
import { AeroBadgeComponent } from '../../../core/design-system/badge/aero-badge.component';
import { PeriodoInoperatividadListComponent } from '../periodo-inoperatividad-list.component';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EntityDetailShellComponent,
    AeroTableComponent,
    AeroBadgeComponent,
    PeriodoInoperatividadListComponent,
  ],
  template: `
    <entity-detail-shell
      [loading]="loading"
      [entity]="equipment"
      [header]="header"
      [auditInfo]="auditInfo"
      [notFound]="notFoundConfig"
      loadingText="Cargando detalles del equipo..."
    >
      <div entity-header-below>
        <!-- Standard Tab Navigation -->
        <div class="detail-tabs">
          <button
            *ngFor="let tab of tabConfigs"
            class="tab-link"
            [class.active]="activeTab === tab.id"
            (click)="activeTab = tab.id"
          >
            <i [class]="tab.icon"></i>
            {{ tab.label }}
          </button>
        </div>
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
                  <label>Estado Actual</label>
                  <div class="value-with-icon" [ngClass]="getStatusClass(equipment?.estado ?? '')">
                    <i [class]="getStatusIcon(equipment?.estado ?? '')"></i>
                    <span class="value">{{ equipment?.estado }}</span>
                  </div>
                </div>
                <div class="info-item">
                  <label>Tipo de Equipo</label>
                  <p class="value">
                    {{ equipment?.tipo_equipo_nombre || equipment?.categoria || '-' }}
                  </p>
                </div>
                <div class="info-item">
                  <label>Categoría PRD</label>
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
                  <label>Propiedad</label>
                  <div class="value">
                    <span
                      class="badge"
                      [ngClass]="
                        equipment?.es_propio || equipment?.tipo_proveedor === 'PROPIO'
                          ? 'badge-propio'
                          : 'badge-tercero'
                      "
                    >
                      {{
                        equipment?.es_propio || equipment?.tipo_proveedor === 'PROPIO'
                          ? 'Propio'
                          : 'Tercero'
                      }}
                    </span>
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
                  <label>Marca / Modelo</label>
                  <p class="value">{{ equipment?.marca || '' }} {{ equipment?.modelo || '' }}</p>
                </div>
                <div class="info-item">
                  <label>Número de Serie</label>
                  <p class="value">{{ equipment?.numero_serie_equipo || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Número de Chasis</label>
                  <p class="value">{{ equipment?.numero_chasis || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Serie Motor</label>
                  <p class="value">{{ equipment?.numero_serie_motor || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Año de Fabricación</label>
                  <p class="value">{{ equipment?.anio_fabricacion || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Placa / Código Externo</label>
                  <p class="value">{{ equipment?.placa || equipment?.codigo_externo || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Tipo de Medición</label>
                  <p class="value highlight project-link">
                    {{ equipment?.tipo_medicion || equipment?.medidor_uso || '-' }}
                  </p>
                </div>
                <div class="info-item">
                  <label>Tipo de Motor</label>
                  <p class="value">{{ equipment?.tipo_motor || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Potencia Neta</label>
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
                  <label>Proyecto / Ubicación</label>
                  <p class="value highlight project-link">
                    {{ equipment?.proyecto_nombre || 'Sin Asignar' }}
                  </p>
                </div>
                <div class="info-item">
                  <label>Fecha de Asignación</label>
                  <p class="value">
                    {{
                      equipment?.fecha_asignacion
                        ? (equipment?.fecha_asignacion | date: 'dd/MM/yyyy')
                        : '-'
                    }}
                  </p>
                </div>
                <div class="info-item">
                  <label>Operador Asignado</label>
                  <p class="value">{{ equipment?.operador_nombre || '-' }}</p>
                </div>
                <div class="info-item">
                  <label>Horómetro / Kilometraje Actual</label>
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
                <button class="btn btn-primary btn-sm" (click)="scheduleMaintenance()">
                  <i class="fa-solid fa-plus"></i> Programar
                </button>
              </div>

              <aero-table
                [columns]="maintenanceColumns"
                [data]="maintenanceHistory"
                [loading]="false"
                emptyMessage="No hay registros de mantenimiento para este equipo."
              ></aero-table>
            </div>
          }
          @if (activeTab === 'contracts') {
            <div class="detail-section card">
              <div class="section-header">
                <h3>Contratos Asociados</h3>
              </div>

              <aero-table
                [columns]="contractColumns"
                [data]="contracts"
                [loading]="false"
                [templates]="{ numero_contrato: contractCodeTemplate }"
                emptyMessage="No hay contratos asociados a este equipo."
                (rowClick)="router.navigate(['/equipment/contracts', $event.id])"
              ></aero-table>

              <ng-template #contractCodeTemplate let-row>
                <a
                  [routerLink]="['/equipment/contracts', row.id]"
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

              <aero-table
                [columns]="reportColumns"
                [data]="dailyReports"
                [loading]="false"
                [templates]="{ codigo: reportCodeTemplate }"
                emptyMessage="No se han registrado partes diarios para este equipo recientemente."
                (rowClick)="router.navigate(['/daily-reports', $event.id])"
              ></aero-table>

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

              <aero-table
                [columns]="solicitudColumns"
                [data]="solicitudes"
                [loading]="false"
                [templates]="{ codigo: solicitudCodeTemplate }"
                emptyMessage="No hay solicitudes pendientes para este tipo de equipo."
              ></aero-table>

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
        }
      </div>

      <ng-container entity-sidebar-actions>
        <button class="btn btn-secondary btn-block" (click)="editEquipment()">
          <i class="fa-solid fa-pen-to-square"></i> Editar Equipo
        </button>

        <button class="btn btn-primary btn-block" (click)="assignToProject()">
          <i class="fa-solid fa-location-dot"></i> Asignar a Proyecto
        </button>

        <button class="btn btn-secondary btn-block" (click)="scheduleMaintenance()">
          <i class="fa-solid fa-screwdriver-wrench"></i> Programar Mantenimiento
        </button>

        <button class="btn btn-warning btn-block" (click)="registrarInoperatividad()">
          <i class="fa-solid fa-triangle-exclamation"></i> Registrar Inoperatividad
        </button>

        <button class="btn btn-secondary btn-block" (click)="viewHistory()">
          <i class="fa-solid fa-clock-rotate-left"></i> Ver Historial
        </button>

        <div class="sidebar-divider"></div>

        <button class="btn btn-danger btn-block" (click)="deleteEquipment()">
          <i class="fa-solid fa-trash"></i> Eliminar Equipo
        </button>

        <div class="sidebar-divider"></div>

        <button class="btn btn-ghost btn-block" routerLink="/equipment">
          <i class="fa-solid fa-arrow-left"></i> Volver a Lista
        </button>
      </ng-container>
    </entity-detail-shell>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .detail-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: var(--s-24);

        .tab-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid var(--grey-200);
          background: var(--neutral-0);
          color: var(--grey-600);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 13px;

          i {
            opacity: 0.7;
            font-size: 13px;
          }

          &:hover {
            background: var(--grey-50);
            border-color: var(--grey-300);
            color: var(--primary-700);
          }

          &.active {
            background: var(--primary-50);
            border-color: var(--primary-200);
            color: var(--primary-700);
            font-weight: 600;
            i {
              opacity: 1;
            }
          }
        }
      }

      .sidebar-divider {
        height: 1px;
        background: var(--grey-100);
        margin: var(--s-16) 0;
      }

      .btn-block {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        font-weight: 600;
        margin-bottom: 8px;
        border-radius: 10px;

        i {
          width: 20px;
          text-align: center;
          font-size: 1.1em;
        }
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

        .btn-sm {
          padding: 6px 14px;
          font-size: 0.8rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
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
            color: var(--semantic-green-600);
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

      .badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
      }
      .badge-propio {
        background: #e8f5e9;
        color: #2e7d32;
      }
      .badge-tercero {
        background: #e3f2fd;
        color: #1565c0;
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
        background: #fef3c7;
        color: #92400e;
      }
      .badge-cat-pesado {
        background: #fee2e2;
        color: #991b1b;
      }
      .badge-cat-liviano {
        background: #dbeafe;
        color: #1e40af;
      }
      .badge-cat-menor {
        background: #d1fae5;
        color: #065f46;
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
  private confirmSvc = inject(ConfirmService);
  private destroy$ = new Subject<void>();

  loading = true;
  equipment: Equipment | null = null;
  activeTab = 'general';
  dailyReports: any[] = [];
  contracts: any[] = [];
  maintenanceHistory: any[] = [];
  solicitudes: SolicitudEquipo[] = [];

  tabConfigs: TabConfig[] = [
    { id: 'general', label: 'General', icon: 'fa-solid fa-circle-info' },
    { id: 'maintenance', label: 'Mantenimiento', icon: 'fa-solid fa-screwdriver-wrench' },
    { id: 'contracts', label: 'Contratos', icon: 'fa-solid fa-file-contract' },
    { id: 'reports', label: 'Partes Diarios', icon: 'fa-solid fa-clipboard-list' },
    { id: 'solicitudes', label: 'Solicitudes', icon: 'fa-solid fa-file-invoice' },
    { id: 'inoperatividad', label: 'Inoperatividad', icon: 'fa-solid fa-triangle-exclamation' },
  ];

  maintenanceColumns: TableColumn[] = [
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

  contractColumns: TableColumn[] = [
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

  reportColumns: TableColumn[] = [
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

  solicitudColumns: TableColumn[] = [
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
    this.dailyReportService.getAll({ equipo_id: id }).subscribe((data: any) => {
      this.dailyReports = Array.isArray(data) ? data : data.data || [];
    });
    this.contractService.getAll({ equipmentId: id }).subscribe((data: any) => {
      this.contracts = Array.isArray(data) ? data : data.data || [];
    });
    this.maintenanceService.getAll({ equipoId: id }).subscribe((data: any) => {
      this.maintenanceHistory = Array.isArray(data) ? data : data.data || [];
    });
    this.solicitudService.listar({ estado: 'APROBADO' }).subscribe((data) => {
      // For now, we filter locally if the API doesn't support equipo_id yet,
      // but ideally the backend should handle this filtering.
      this.solicitudes = data.data || [];
    });
  }

  editEquipment(): void {
    if (this.equipment) {
      this.router.navigate(['/equipment', this.equipment.id, 'edit']);
    }
  }

  assignToProject(): void {
    alert('Asignar a Proyecto - ¡Próximamente!');
  }

  scheduleMaintenance(): void {
    alert('Programar Mantenimiento - ¡Próximamente!');
  }

  viewHistory(): void {
    alert('Ver Historial - ¡Próximamente!');
  }

  deleteEquipment(): void {
    if (!this.equipment) return;
    this.confirmSvc.confirmDelete(`el equipo ${this.equipment.codigo_equipo}`).subscribe((confirmed) => {
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
