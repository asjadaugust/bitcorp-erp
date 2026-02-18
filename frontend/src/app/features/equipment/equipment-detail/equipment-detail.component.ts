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
import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StatsGridComponent],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles del equipo...</p>
        </div>

        <div *ngIf="!loading && equipment" class="detail-grid">
          <div class="detail-main card">
            <!-- Header (Inside Main Card) -->
            <div class="detail-header">
              <div>
                <h1>{{ equipment.codigo_equipo }}</h1>
                <p class="text-subtitle">{{ equipment.marca }} {{ equipment.modelo }}</p>
              </div>
              <div class="detail-status">
                <span
                  class="status-badge"
                  [class.status-APROBADO]="
                    equipment.estado === 'DISPONIBLE' || equipment.estado === 'AVAILABLE'
                  "
                  [class.status-PENDIENTE]="
                    equipment.estado === 'EN_USO' ||
                    equipment.estado === 'IN_USE' ||
                    equipment.estado === 'MANTENIMIENTO' ||
                    equipment.estado === 'MAINTENANCE'
                  "
                  [class.status-CANCELADO]="
                    equipment.estado === 'RETIRADO' || equipment.estado === 'RETIRED'
                  "
                >
                  {{ equipment.estado }}
                </span>
              </div>
            </div>

            <!-- Stats Grid -->
            <app-stats-grid [items]="statItems" testId="equipment-detail-stats"></app-stats-grid>

            <!-- Tabs Navigation -->
            <div class="tabs-header mt-6">
              <button
                class="tab-btn"
                [class.active]="activeTab === 'general'"
                (click)="activeTab = 'general'"
              >
                General
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'maintenance'"
                (click)="activeTab = 'maintenance'"
              >
                Mantenimiento
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'contracts'"
                (click)="activeTab = 'contracts'"
              >
                Contratos
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'reports'"
                (click)="activeTab = 'reports'"
              >
                Partes Diarios
              </button>
            </div>

            <!-- Tab Content Area -->
            <div class="detail-sections mt-6">
              <!-- General Tab -->
              <div *ngIf="activeTab === 'general'">
                <section class="detail-section">
                  <h2>Especificaciones Técnicas</h2>
                  <div class="info-grid four-cols">
                    <div class="info-item">
                      <label>Marca</label>
                      <p>{{ equipment.marca }}</p>
                    </div>
                    <div class="info-item">
                      <label>Modelo</label>
                      <p>{{ equipment.modelo }}</p>
                    </div>
                    <div class="info-item">
                      <label>Año</label>
                      <p>{{ equipment.anio_fabricacion || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Serie</label>
                      <p>{{ equipment.numero_serie_equipo || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Placa</label>
                      <p>{{ equipment.placa || '-' }}</p>
                    </div>
                    <div class="info-item">
                      <label>Categoría</label>
                      <p>{{ equipment.categoria || '-' }}</p>
                    </div>
                  </div>
                </section>

                <!-- Document Expiry Dates -->
                <section class="detail-section">
                  <h2>Documentos y Vencimientos</h2>
                  <div class="info-grid three-cols">
                    <div class="info-item">
                      <label>SOAT</label>
                      <div class="doc-status-item">
                        <p *ngIf="equipment.fecha_venc_soat">
                          {{ equipment.fecha_venc_soat | date: 'dd/MM/yyyy' }}
                        </p>
                        <span
                          *ngIf="equipment.fecha_venc_soat"
                          [class]="'doc-tag doc-' + getDocExpiry(equipment.fecha_venc_soat)"
                        >
                          {{ getDocExpiryLabel(equipment.fecha_venc_soat) }}
                        </span>
                        <p *ngIf="!equipment.fecha_venc_soat" class="text-muted">Sin registro</p>
                      </div>
                    </div>
                    <div class="info-item">
                      <label>Póliza TREC</label>
                      <div class="doc-status-item">
                        <p *ngIf="equipment.fecha_venc_poliza">
                          {{ equipment.fecha_venc_poliza | date: 'dd/MM/yyyy' }}
                        </p>
                        <span
                          *ngIf="equipment.fecha_venc_poliza"
                          [class]="'doc-tag doc-' + getDocExpiry(equipment.fecha_venc_poliza)"
                        >
                          {{ getDocExpiryLabel(equipment.fecha_venc_poliza) }}
                        </span>
                        <p *ngIf="!equipment.fecha_venc_poliza" class="text-muted">Sin registro</p>
                      </div>
                    </div>
                    <div class="info-item">
                      <label>CITV</label>
                      <div class="doc-status-item">
                        <p *ngIf="equipment.fecha_venc_citv">
                          {{ equipment.fecha_venc_citv | date: 'dd/MM/yyyy' }}
                        </p>
                        <span
                          *ngIf="equipment.fecha_venc_citv"
                          [class]="'doc-tag doc-' + getDocExpiry(equipment.fecha_venc_citv)"
                        >
                          {{ getDocExpiryLabel(equipment.fecha_venc_citv) }}
                        </span>
                        <p *ngIf="!equipment.fecha_venc_citv" class="text-muted">Sin registro</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Maintenance Tab -->
              <div *ngIf="activeTab === 'maintenance'">
                <section class="detail-section">
                  <div class="section-header flex justify-between items-center mb-4">
                    <h2>Programaciones de Mantenimiento</h2>
                    <button class="btn btn-sm btn-secondary" (click)="goToMaintenance()">
                      Ver Todo
                    </button>
                  </div>
                  <div
                    *ngIf="maintenanceSchedules.length > 0; else noMaintenance"
                    class="table-container"
                  >
                    <table class="annex-table">
                      <thead>
                        <tr>
                          <th>Tipo</th>
                          <th>Estado</th>
                          <th>Intervalo</th>
                          <th>Próximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let schedule of maintenanceSchedules">
                          <td class="font-medium">{{ schedule.maintenanceType }}</td>
                          <td>
                            <span
                              class="status-badge status-sm"
                              [class.status-APROBADO]="schedule.status === 'COMPLETO'"
                              [class.status-PENDIENTE]="schedule.status === 'PENDIENTE'"
                            >
                              {{ schedule.status }}
                            </span>
                          </td>
                          <td>{{ schedule.intervalValue }} {{ schedule.intervalType }}</td>
                          <td>{{ schedule.nextDueHours || schedule.nextDueDate }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ng-template #noMaintenance>
                    <div class="empty-state-section">
                      <i class="fa-solid fa-check-circle"></i>
                      <p>No hay mantenimientos pendientes.</p>
                    </div>
                  </ng-template>
                </section>
              </div>

              <!-- Contracts Tab -->
              <div *ngIf="activeTab === 'contracts'">
                <section class="detail-section">
                  <div class="section-header flex justify-between items-center mb-4">
                    <h2>Historial de Contratos</h2>
                    <button class="btn btn-sm btn-primary" (click)="createContract()">
                      <i class="fa-solid fa-plus"></i> Nuevo
                    </button>
                  </div>

                  <div *ngIf="contracts.length > 0; else noContracts" class="table-container">
                    <table class="annex-table">
                      <thead>
                        <tr>
                          <th>Código</th>
                          <th>Cliente</th>
                          <th>Vigencia</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let contract of contracts">
                          <td class="font-mono">{{ contract.code }}</td>
                          <td>{{ contract.client_name }}</td>
                          <td>
                            {{ contract.start_date | date: 'shortDate' }} -
                            {{ contract.end_date | date: 'shortDate' }}
                          </td>
                          <td>
                            <span
                              class="status-badge status-sm"
                              [class.status-APROBADO]="contract.status === 'ACTIVO'"
                              [class.status-CANCELADO]="contract.status === 'FINALIZADO'"
                            >
                              {{ contract.status }}
                            </span>
                          </td>
                          <td class="text-right">
                            <button class="btn btn-icon" (click)="viewContract(contract.id)">
                              <i class="fa-solid fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ng-template #noContracts>
                    <div class="empty-state-section">
                      <i class="fa-solid fa-file-contract"></i>
                      <p>No hay contratos asociados.</p>
                    </div>
                  </ng-template>
                </section>
              </div>

              <!-- Reports Tab -->
              <div *ngIf="activeTab === 'reports'">
                <section class="detail-section">
                  <h2>Últimos Partes Diarios</h2>
                  <div *ngIf="dailyReports.length > 0; else noReports" class="table-container">
                    <table class="annex-table">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Operador</th>
                          <th>Horas</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr *ngFor="let report of dailyReports">
                          <td>{{ report.fecha_parte | date: 'dd/MM/yyyy' }}</td>
                          <td>{{ report.operator_name }}</td>
                          <td class="font-medium">
                            {{
                              report.horometro_final - report.horometro_inicial | number: '1.1-1'
                            }}h
                          </td>
                          <td>
                            <span
                              class="status-badge status-sm"
                              [class.status-APROBADO]="report.status === 'APROBADO'"
                              [class.status-PENDIENTE]="report.status === 'PENDIENTE'"
                            >
                              {{ report.status }}
                            </span>
                          </td>
                          <td class="text-right">
                            <button class="btn btn-icon" (click)="viewReport(report.id)">
                              <i class="fa-solid fa-eye"></i>
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <ng-template #noReports>
                    <div class="empty-state-section">
                      <i class="fa-solid fa-clipboard"></i>
                      <p>No hay partes diarios registrados recientemente.</p>
                    </div>
                  </ng-template>
                </section>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button class="btn btn-primary btn-block" (click)="editEquipment()">
                  <i class="fa-solid fa-pen"></i> Editar Equipo
                </button>
                <button class="btn btn-ghost btn-block" (click)="navigateTo('/equipment')">
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
              </div>
            </div>

            <div class="card">
              <h3 class="sidebar-card-title">Información del Sistema</h3>
              <div class="timeline">
                <div class="timeline-item">
                  <div class="timeline-date">{{ equipment.updated_at | date: 'short' }}</div>
                  <div class="timeline-content">Última actualización</div>
                </div>
                <div class="timeline-item">
                  <div class="timeline-date">{{ equipment.created_at | date: 'short' }}</div>
                  <div class="timeline-content">Equipo registrado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      /* Equipment specific custom styles */
      .text-subtitle {
        font-size: 16px;
        color: var(--grey-600);
        margin-top: -4px;
      }

      .tabs-header {
        display: flex;
        gap: var(--s-24);
        border-bottom: 2px solid var(--grey-100);
      }

      .tab-btn {
        padding: var(--s-12) var(--s-4);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-500);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: var(--primary-600);
        }

        &.active {
          color: var(--primary-600);
          border-bottom-color: var(--primary-600);
        }
      }

      .doc-status-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
      }

      .doc-tag {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
      }

      .doc-expired {
        background: #fee2e2;
        color: #991b1b;
      }

      .doc-critical {
        background: #ffedd5;
        color: #9a3412;
      }

      .doc-warning {
        background: #fef9c3;
        color: #854d0e;
      }

      .doc-ok {
        background: #dcfce7;
        color: #166534;
      }

      .mt-6 {
        margin-top: 1.5rem;
      }
      .flex {
        display: flex;
      }
      .justify-between {
        justify-content: space-between;
      }
      .items-center {
        align-items: center;
      }
      .font-medium {
        font-weight: 500;
      }
      .text-right {
        text-align: right;
      }

      .empty-state-section {
        text-align: center;
        padding: var(--s-32);
        color: var(--grey-500);
        background: var(--grey-50);
        border-radius: var(--radius-md);

        i {
          font-size: 32px;
          margin-bottom: var(--s-12);
          color: var(--grey-300);
        }

        p {
          margin: 0;
          font-size: 14px;
        }
      }

      .mb-4 {
        margin-bottom: 1rem;
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
  private destroy$ = new Subject<void>();

  equipment: Equipment | null = null;
  dailyReports: any[] = [];
  contracts: any[] = [];
  maintenanceSchedules: any[] = [];
  loading = true;
  activeTab = 'general';
  statItems: StatItem[] = [];

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadData(id);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(id: number) {
    this.loading = true;
    this.equipmentService
      .getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.equipment = data;
          this.calculateStatItems();
          this.loadRelatedData(id);
        },
        error: (err) => {
          console.error('Error loading equipment', err);
          this.router.navigate(['/equipment']);
          this.loading = false;
        },
      });
  }

  calculateStatItems() {
    if (!this.equipment) return;

    const statusMap: Record<
      string,
      { color: 'success' | 'warning' | 'danger' | 'info' | 'primary'; icon: string }
    > = {
      DISPONIBLE: { color: 'success', icon: 'fa-check-circle' },
      EN_USO: { color: 'primary', icon: 'fa-person-digging' },
      MANTENIMIENTO: { color: 'warning', icon: 'fa-wrench' },
      RETIRADO: { color: 'danger', icon: 'fa-ban' },
      AVAILABLE: { color: 'success', icon: 'fa-check-circle' },
      IN_USE: { color: 'primary', icon: 'fa-person-digging' },
      MAINTENANCE: { color: 'warning', icon: 'fa-wrench' },
      RETIRED: { color: 'danger', icon: 'fa-ban' },
    };

    const statusStyle = statusMap[this.equipment.estado?.toUpperCase()] || {
      color: 'info',
      icon: 'fa-info-circle',
    };

    this.statItems = [
      {
        label: 'Estado Actual',
        value: this.equipment.estado || 'Unknown',
        icon: statusStyle.icon,
        color: statusStyle.color,
        testId: 'equipment-status',
      },
      {
        label: 'Tipo Medidor',
        value: this.equipment.medidor_uso || 'N/A',
        icon: 'fa-clock',
        color: 'info',
        testId: 'meter-type',
      },
      {
        label: 'Categoría',
        value: this.equipment.categoria || 'No asignado',
        icon: 'fa-tractor',
        color: 'primary',
        testId: 'equipment-category',
      },
      {
        label: 'Proveedor',
        value: this.equipment.proveedor_nombre || 'N/A',
        icon: 'fa-handshake',
        color: 'warning',
        testId: 'equipment-provider',
      },
    ];
  }

  loadRelatedData(id: number) {
    this.dailyReportService
      .getAll({ equipo_id: id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reports) => {
          this.dailyReports = reports;
          this.checkLoading();
        },
        error: () => this.checkLoading(),
      });

    this.contractService
      .getAll({ equipmentId: id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts) => {
          this.contracts = contracts;
          this.checkLoading();
        },
        error: () => this.checkLoading(),
      });

    this.maintenanceService
      .getAll({ equipo_id: id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules) => {
          this.maintenanceSchedules = Array.isArray(schedules) ? schedules : [];
          this.checkLoading();
        },
        error: () => this.checkLoading(),
      });
  }

  checkLoading() {
    this.loading = false;
  }

  editEquipment() {
    if (this.equipment && this.equipment.id) {
      this.router.navigate(['/equipment', this.equipment.id, 'edit']);
    }
  }

  viewReport(id: string) {
    this.router.navigate(['/daily-reports', id]);
  }

  viewContract(id: string) {
    this.router.navigate(['/equipment/contracts', id]);
  }

  createContract() {
    this.router.navigate(['/equipment/contracts/new'], {
      queryParams: { equipmentId: this.equipment?.id },
    });
  }

  goToMaintenance() {
    this.router.navigate(['/equipment/maintenance'], {
      queryParams: { equipo_id: this.equipment?.id },
    });
  }

  getDocExpiry(dateStr: string): string {
    if (!dateStr) return 'none';
    const expDate = new Date(dateStr);
    const today = new Date();
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 0) return 'expired';
    if (days <= 7) return 'critical';
    if (days <= 30) return 'warning';
    return 'ok';
  }

  getDocExpiryLabel(dateStr: string): string {
    const status = this.getDocExpiry(dateStr);
    if (status === 'expired') return 'Vencido';
    if (status === 'critical') return 'Critico';
    if (status === 'warning') return 'Por vencer';
    return 'Vigente';
  }
}
