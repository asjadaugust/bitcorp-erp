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

@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, PageLayoutComponent],
  template: `
    <app-page-layout
      [title]="
        equipment
          ? equipment.code + ' - ' + equipment.brand + ' ' + equipment.model
          : 'Detalle de Equipo'
      "
      icon="fa-tractor"
      [breadcrumbs]="[
        { label: 'Dashboard', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: equipment?.code || 'Detalle' },
      ]"
      [loading]="loading"
    >
      <div actions>
        <button class="btn btn-primary" (click)="editEquipment()">
          <i class="fa-solid fa-pen"></i> Editar Equipo
        </button>
      </div>

      <div *ngIf="equipment" class="detail-container">
        <!-- Header Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon status-icon">
              <i class="fa-solid fa-circle-info"></i>
            </div>
            <div class="stat-info">
              <span class="label">Estado Actual</span>
              <span class="value badge" [class]="'status-' + equipment.status?.toLowerCase()">
                {{ equipment.status }}
              </span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon hour-icon">
              <i class="fa-solid fa-clock"></i>
            </div>
            <div class="stat-info">
              <span class="label">Tipo Medidor</span>
              <span class="value">{{ equipment.meter_type || 'N/A' }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon project-icon">
              <i class="fa-solid fa-building"></i>
            </div>
            <div class="stat-info">
              <span class="label">Categoría</span>
              <span class="value">{{ equipment.category || 'No asignado' }}</span>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon provider-icon">
              <i class="fa-solid fa-handshake"></i>
            </div>
            <div class="stat-info">
              <span class="label">Proveedor</span>
              <span class="value">{{ equipment.provider_name || 'N/A' }}</span>
            </div>
          </div>
        </div>

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
                      <span class="spec-value">{{ equipment.brand }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Modelo</span>
                      <span class="spec-value">{{ equipment.model }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Año</span>
                      <span class="spec-value">{{ equipment.manufacture_year || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Serie</span>
                      <span class="spec-value">{{ equipment.serial_number || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Placa</span>
                      <span class="spec-value">{{ equipment.plate_number || '-' }}</span>
                    </div>
                    <div class="spec-item">
                      <span class="spec-label">Categoría</span>
                      <span class="spec-value">{{ equipment.category || '-' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Maintenance Tab -->
              <div *ngIf="activeTab === 'maintenance'" class="tab-pane fade-in">
                <div class="section-header">
                  <h3>Programaciones de Mantenimiento</h3>
                  <button class="btn btn-sm btn-outline" (click)="goToMaintenance()">
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
                        <td>{{ report.report_date | date: 'dd/MM/yyyy' }}</td>
                        <td>{{ report.operator_name }}</td>
                        <td>
                          {{ report.hourmeter_end - report.hourmeter_start | number: '1.1-1' }}
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

      /* Stats Grid */
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem;
      }

      .stat-card {
        background: var(--card-bg);
        padding: 1.5rem;
        border-radius: 12px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: center;
        gap: 1rem;
        transition: transform 0.2s;
      }

      .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
      }

      .status-icon {
        background: #e6fffa;
        color: #38b2ac;
      }
      .hour-icon {
        background: #ebf8ff;
        color: #4299e1;
      }
      .project-icon {
        background: #faf5ff;
        color: #9f7aea;
      }
      .provider-icon {
        background: #fffaf0;
        color: #ed8936;
      }

      .stat-info {
        display: flex;
        flex-direction: column;
      }

      .stat-info .label {
        font-size: 0.875rem;
        color: var(--text-muted);
        font-weight: 500;
      }

      .stat-info .value {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-main);
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
          this.loadRelatedData(id);
        },
        error: (err) => {
          console.error('Error loading equipment', err);
          this.router.navigate(['/equipment']);
          this.loading = false;
        },
      });
  }

  loadRelatedData(id: number) {
    // Load daily reports for this equipment
    this.dailyReportService
      .getAll({ equipment_id: id })
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
      .getAll({ equipment_id: id })
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
      queryParams: { equipment_id: this.equipment?.id },
    });
  }
}
