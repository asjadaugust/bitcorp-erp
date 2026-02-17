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
  imports: [CommonModule, RouterModule, PageLayoutComponent, StatsGridComponent],
  template: `
    <app-page-layout
      [title]="
        equipment
          ? equipment.codigo_equipo + ' - ' + equipment.marca + ' ' + equipment.modelo
          : 'Detalle de Equipo'
      "
      icon="fa-tractor"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: equipment?.codigo_equipo || 'Detalle' },
      ]"
      [loading]="loading"
      [backUrl]="'/equipment'"
    >
      <div actions>
        <button class="btn btn-primary" (click)="editEquipment()">
          <i class="fa-solid fa-pen"></i> Editar Equipo
        </button>
      </div>

      <div *ngIf="equipment" class="detail-container">
        <!-- Header Stats Cards -->
        <app-stats-grid [items]="statItems" testId="equipment-detail-stats"></app-stats-grid>

        <!-- Main Content Grid -->
        <div class="content-layout">
          <!-- Left Column: Details -->
          <div class="main-column">
            <!-- Tabs Navigation -->
            <div class="tabs-nav">
              <button
                class="tab-btn"
                [class.active]="activeTab === 'general'"
                (click)="activeTab = 'general'"
              >
                <i class="fa-solid fa-info-circle"></i> General
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'maintenance'"
                (click)="activeTab = 'maintenance'"
              >
                <i class="fa-solid fa-wrench"></i> Mantenimiento
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'contracts'"
                (click)="activeTab = 'contracts'"
              >
                <i class="fa-solid fa-file-contract"></i> Contratos
              </button>
              <button
                class="tab-btn"
                [class.active]="activeTab === 'reports'"
                (click)="activeTab = 'reports'"
              >
                <i class="fa-solid fa-clipboard-list"></i> Partes Diarios
              </button>
            </div>

            <!-- Tab Content -->
            <div class="tab-content-area">
              <!-- General Tab -->
              <div *ngIf="activeTab === 'general'" class="tab-pane fade-in">
                <div class="info-group">
                  <h3>Especificaciones Técnicas</h3>
                  <div class="specs-grid">
                    <div class="spec-item">
                      <span class="spec-label">Marca</span>
                      <span class="spec-value">{{ equipment.marca }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Modelo</span>
                      <span class="spec-value">{{ equipment.modelo }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Año</span>
                      <span class="spec-value">{{ equipment.anio_fabricacion || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Serie</span>
                      <span class="spec-value">{{ equipment.numero_serie_equipo || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Placa</span>
                      <span class="spec-value">{{ equipment.placa || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Categoría</span>
                      <span class="spec-value">{{ equipment.categoria || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Maintenance Tab -->
              <div *ngIf="activeTab === 'maintenance'" class="tab-pane fade-in">
                <div class="section-header">
                  <h3>Programaciones de Mantenimiento</h3>
                  <button class="btn btn-sm btn-secondary" (click)="goToMaintenance()">
                    Ver Todo
                  </button>
                </div>

                <div *ngIf="maintenanceSchedules.length > 0; else noMaintenance">
                  <table class="aero-table">
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
                        <td>{{ schedule.maintenanceType }}</td>
                        <td>
                          <span class="badge" [class]="'status-' + schedule.status">
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
                  <div class="empty-state">
                    <i class="fa-solid fa-check-circle"></i>
                    <p>No hay mantenimientos pendientes.</p>
                  </div>
                </ng-template>
              </div>

              <!-- Contracts Tab -->
              <div *ngIf="activeTab === 'contracts'" class="tab-pane fade-in">
                <div class="section-header">
                  <h3>Historial de Contratos</h3>
                  <button class="btn btn-sm btn-primary" (click)="createContract()">
                    <i class="fa-solid fa-plus"></i> Nuevo
                  </button>
                </div>

                <div *ngIf="contracts.length > 0; else noContracts">
                  <table class="aero-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Cliente</th>
                        <th>Vigencia</th>
                        <th>Estado</th>
                        <th>Acción</th>
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
                          <span class="badge" [class]="'status-' + contract.status">
                            {{ contract.status }}
                          </span>
                        </td>
                        <td>
                          <button class="btn-icon" (click)="viewContract(contract.id)">
                            <i class="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ng-template #noContracts>
                  <div class="empty-state">
                    <i class="fa-solid fa-file-contract"></i>
                    <p>No hay contratos asociados.</p>
                  </div>
                </ng-template>
              </div>

              <!-- Reports Tab -->
              <div *ngIf="activeTab === 'reports'" class="tab-pane fade-in">
                <div class="section-header">
                  <h3>Últimos Partes Diarios</h3>
                </div>
                <div *ngIf="dailyReports.length > 0; else noReports">
                  <table class="aero-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Operador</th>
                        <th>Horas</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let report of dailyReports">
                        <td>{{ report.fecha_parte | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ report.operator_name }}</td>
                        <td>
                          {{ report.horometro_final - report.horometro_inicial | number: '1.1-1' }}
                        </td>
                        <td>
                          <span class="badge" [class]="'status-' + report.status">
                            {{ report.status }}
                          </span>
                        </td>
                        <td>
                          <button class="btn-icon" (click)="viewReport(report.id)">
                            <i class="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <ng-template #noReports>
                  <div class="empty-state">
                    <i class="fa-solid fa-clipboard"></i>
                    <p>No hay partes diarios registrados recientemente.</p>
                  </div>
                </ng-template>
              </div>
            </div>
          </div>

          <!-- Right Column: Quick Actions / Summary -->
          <!-- Can be added later for more density -->
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      /* Variables & General */
      :host {
        --primary-color: #3182ce;
        --bg-color: #f7fafc;
        --card-bg: #ffffff;
        --text-main: #2d3748;
        --text-muted: #718096;
        --border-color: #e2e8f0;
      }

      .detail-container {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        animation: fadeIn 0.3s ease-in-out;
      }

      /* Tabs & Content */
      .content-layout {
        background: var(--card-bg);
        border-radius: 16px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        min-height: 400px;
      }

      .tabs-nav {
        display: flex;
        border-bottom: 1px solid var(--border-color);
        background: #f8f9fa;
        padding: 0 1rem;
      }

      .tab-btn {
        padding: 1rem 1.5rem;
        border: none;
        background: none;
        font-weight: 600;
        color: var(--text-muted);
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .tab-btn:hover {
        color: var(--primary-color);
        background: rgba(49, 130, 206, 0.05);
      }

      .tab-btn.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .tab-content-area {
        padding: 2rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .section-header h3 {
        font-size: 1.25rem;
        color: var(--text-main);
        margin: 0;
      }

      /* Specs Grid */
      .specs-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
      }

      .spec-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .spec-label {
        font-size: 0.85rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .spec-value {
        font-size: 1rem;
        font-weight: 500;
        color: var(--text-main);
      }

      /* Tables */
      .aero-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.95rem;
      }

      .aero-table th {
        text-align: left;
        padding: 1rem;
        background: #f7fafc;
        color: var(--text-muted);
        font-weight: 600;
        border-bottom: 1px solid var(--border-color);
      }

      .aero-table td {
        padding: 1rem;
        border-bottom: 1px solid var(--border-color);
        color: var(--text-main);
      }

      .aero-table tr:hover {
        background: #f8f9fa;
      }

      /* Badges & Buttons */
      .badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
      }

      .status-available,
      .status-active {
        background: #c6f6d5;
        color: #22543d;
      }
      .status-maintenance {
        background: #feeebc;
        color: #744210;
      }
      .status-assigned {
        background: #bee3f8;
        color: #2a4365;
      }
      .status-inactive {
        background: #edf2f7;
        color: #4a5568;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        border: none;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        transition: 0.2s;
      }

      .btn-primary {
        background: var(--primary-color);
        color: white;
      }
      .btn-primary:hover {
        opacity: 0.9;
      }

      .btn-outline {
        background: transparent;
        border: 1px solid var(--border-color);
        color: var(--text-main);
      }

      .btn-icon {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 4px;
      }
      .btn-icon:hover {
        background: #edf2f7;
        color: var(--primary-color);
      }

      .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-muted);
      }
      .empty-state i {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        opacity: 0.5;
      }

      .font-mono {
        font-family: monospace;
        font-weight: 600;
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
export class EquipmentDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
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
      AVAILABLE: { color: 'success', icon: 'fa-check-circle' }, // Fallback for various case/lang
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
    // Load daily reports for this equipment
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

    // Load contracts for this equipment
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

    // Load maintenance schedules - FIX: response is array directly, not {data: [...]}
    this.maintenanceService
      .getAll({ equipo_id: id })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (schedules) => {
          // Interceptor already unwraps to array, no need to access .data
          this.maintenanceSchedules = Array.isArray(schedules) ? schedules : [];
          this.checkLoading();
        },
        error: () => this.checkLoading(),
      });
  }

  checkLoading() {
    // Simple verification to turn off loading when at least equipment is loaded
    // and requests are fired.
    this.loading = false;
  }

  editEquipment() {
    if (this.equipment && this.equipment.id) {
      this.router.navigate(['/equipment', this.equipment.id, 'edit']);
    }
  }

  viewReport(id: string) {
    this.router.navigate(['/daily-reports', id]); // Correct global route? Or nested?
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
}
