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
    >
      <div *ngIf="equipment" class="detail-container">
        <!-- Header Stats Cards -->
        <app-stats-grid [items]="statItems" testId="equipment-detail-stats"></app-stats-grid>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- Left Column: Tabs & Details -->
          <div class="content-main card">
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
                <section class="detail-section">
                  <h2>Especificaciones Técnicas</h2>
                  <div class="info-grid">
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
                  <div class="info-grid">
                    <div class="info-item">
                      <label>SOAT</label>
                      <p>
                        <span
                          *ngIf="equipment.fecha_venc_soat"
                          [class]="'doc-status doc-' + getDocExpiry(equipment.fecha_venc_soat)"
                        >
                          {{ equipment.fecha_venc_soat | date: 'dd/MM/yyyy' }}
                          <span class="doc-tag">{{
                            getDocExpiryLabel(equipment.fecha_venc_soat)
                          }}</span>
                        </span>
                        <span *ngIf="!equipment.fecha_venc_soat" class="text-muted"
                          >Sin registro</span
                        >
                      </p>
                    </div>
                    <div class="info-item">
                      <label>Póliza TREC</label>
                      <p>
                        <span
                          *ngIf="equipment.fecha_venc_poliza"
                          [class]="'doc-status doc-' + getDocExpiry(equipment.fecha_venc_poliza)"
                        >
                          {{ equipment.fecha_venc_poliza | date: 'dd/MM/yyyy' }}
                          <span class="doc-tag">{{
                            getDocExpiryLabel(equipment.fecha_venc_poliza)
                          }}</span>
                        </span>
                        <span *ngIf="!equipment.fecha_venc_poliza" class="text-muted"
                          >Sin registro</span
                        >
                      </p>
                    </div>
                    <div class="info-item">
                      <label>CITV</label>
                      <p>
                        <span
                          *ngIf="equipment.fecha_venc_citv"
                          [class]="'doc-status doc-' + getDocExpiry(equipment.fecha_venc_citv)"
                        >
                          {{ equipment.fecha_venc_citv | date: 'dd/MM/yyyy' }}
                          <span class="doc-tag">{{
                            getDocExpiryLabel(equipment.fecha_venc_citv)
                          }}</span>
                        </span>
                        <span *ngIf="!equipment.fecha_venc_citv" class="text-muted"
                          >Sin registro</span
                        >
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <!-- Maintenance Tab -->
              <div *ngIf="activeTab === 'maintenance'" class="tab-pane fade-in">
                <div class="section-header">
                  <h2>Programaciones de Mantenimiento</h2>
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
                          <span
                            class="status-badge"
                            [class]="'status-badge status-' + schedule.status"
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
                  <div class="empty-state">
                    <i class="fa-solid fa-check-circle"></i>
                    <p>No hay mantenimientos pendientes.</p>
                  </div>
                </ng-template>
              </div>

              <!-- Contracts Tab -->
              <div *ngIf="activeTab === 'contracts'" class="tab-pane fade-in">
                <div class="section-header">
                  <h2>Historial de Contratos</h2>
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
                          <span [class]="'status-badge status-' + contract.status">
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
                  <h2>Últimos Partes Diarios</h2>
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
                          <span [class]="'status-badge status-' + report.status">
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

          <!-- Right Column: Quick Actions -->
          <div class="detail-sidebar">
            <div class="card">
              <h3>Acciones</h3>
              <div class="quick-actions">
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  (click)="router.navigate(['/equipment'])"
                >
                  <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
                <button type="button" class="btn btn-primary btn-block" (click)="editEquipment()">
                  <i class="fa-solid fa-pen"></i> Editar
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  (click)="goToMaintenance()"
                >
                  <i class="fa-solid fa-wrench"></i> Ver Mantenimiento
                </button>
                <button
                  type="button"
                  class="btn btn-secondary btn-block"
                  (click)="createContract()"
                >
                  <i class="fa-solid fa-file-contract"></i> Nuevo Contrato
                </button>
              </div>
            </div>

            <div class="card">
              <h3>Información del Sistema</h3>
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
    </app-page-layout>
  `,
  styles: [
    `
      .detail-container {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: var(--s-24);
        align-items: start;

        @media (max-width: 968px) {
          grid-template-columns: 1fr;
        }
      }

      /* Tabs & Content */
      .content-main {
        overflow: hidden;
        min-height: 400px;
        padding: 0;
      }

      .tabs-nav {
        display: flex;
        border-bottom: 1px solid var(--grey-200);
        background: var(--grey-50);
        padding: 0 var(--s-16);
      }

      .tab-btn {
        padding: var(--s-16) var(--s-24);
        border: none;
        background: none;
        font-weight: 600;
        color: var(--grey-500);
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        gap: var(--s-8);
      }

      .tab-btn:hover {
        color: var(--primary-500);
        background: var(--primary-50, rgba(49, 130, 206, 0.05));
      }

      .tab-btn.active {
        color: var(--primary-500);
        border-bottom-color: var(--primary-500);
      }

      .tab-content-area {
        padding: var(--s-24);
      }

      .detail-section {
        margin-bottom: var(--s-32);

        &:last-child {
          margin-bottom: 0;
        }

        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--s-24);

        h2 {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-900);
          margin: 0;
        }
      }

      /* Info Grid */
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--s-24);
      }

      .info-item {
        label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: var(--grey-500);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: var(--s-4);
        }

        p {
          font-size: 16px;
          color: #333;
          margin: 0;
        }
      }

      .text-muted {
        color: var(--grey-500);
        font-style: italic;
      }

      /* Tables */
      .aero-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      .aero-table th {
        text-align: left;
        padding: var(--s-12) var(--s-16);
        background: var(--grey-50);
        color: var(--grey-500);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid var(--grey-200);
      }

      .aero-table td {
        padding: var(--s-12) var(--s-16);
        border-bottom: 1px solid var(--grey-200);
        color: #333;
      }

      .aero-table tr:hover td {
        background: var(--grey-50);
      }

      /* Status Badges */
      .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .status-badge::before {
        content: '';
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .status-DISPONIBLE,
      .status-available,
      .status-active,
      .status-ACTIVO {
        background: var(--semantic-green-50);
        color: var(--semantic-green-700);
      }
      .status-DISPONIBLE::before,
      .status-available::before,
      .status-active::before,
      .status-ACTIVO::before {
        background: var(--semantic-green-500);
      }

      .status-EN_USO,
      .status-assigned {
        background: var(--semantic-blue-50);
        color: var(--semantic-blue-700);
      }
      .status-EN_USO::before,
      .status-assigned::before {
        background: var(--semantic-blue-500);
      }

      .status-MANTENIMIENTO,
      .status-maintenance {
        background: var(--semantic-yellow-50);
        color: var(--semantic-yellow-700);
      }
      .status-MANTENIMIENTO::before,
      .status-maintenance::before {
        background: var(--semantic-yellow-500);
      }

      .status-RETIRADO,
      .status-inactive {
        background: var(--grey-100);
        color: var(--grey-700);
      }
      .status-RETIRADO::before,
      .status-inactive::before {
        background: var(--grey-400);
      }

      /* Buttons */
      .btn-icon {
        background: none;
        border: none;
        color: var(--grey-500);
        cursor: pointer;
        padding: var(--s-8);
        border-radius: var(--radius-sm);
        transition: 0.2s;

        &:hover {
          background: var(--grey-100);
          color: var(--primary-500);
        }
      }

      .empty-state {
        text-align: center;
        padding: var(--s-48) var(--s-24);
        color: var(--grey-500);

        i {
          font-size: 2.5rem;
          margin-bottom: var(--s-16);
          opacity: 0.5;
          display: block;
        }
      }

      .font-mono {
        font-family: monospace;
        font-weight: 600;
      }

      /* Document expiry badges */
      .doc-status {
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
      }

      .doc-tag {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 600;
      }

      .doc-expired {
        color: var(--semantic-red-700);

        .doc-tag {
          background: var(--semantic-red-50);
          color: var(--semantic-red-700);
        }
      }

      .doc-critical {
        color: var(--semantic-red-700);

        .doc-tag {
          background: var(--semantic-red-50);
          color: var(--semantic-red-700);
        }
      }

      .doc-warning {
        color: var(--semantic-yellow-700);

        .doc-tag {
          background: var(--semantic-yellow-50);
          color: var(--semantic-yellow-700);
        }
      }

      .doc-ok {
        color: var(--semantic-green-700);

        .doc-tag {
          background: var(--semantic-green-50);
          color: var(--semantic-green-700);
        }
      }

      /* Sidebar */
      .detail-sidebar {
        display: flex;
        flex-direction: column;
        gap: var(--s-24);

        h3 {
          font-size: 16px;
          font-weight: 600;
          color: var(--primary-900);
          margin-bottom: var(--s-16);
        }
      }

      .quick-actions {
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
      }

      .btn-block {
        width: 100%;
        justify-content: center;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .timeline {
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .timeline-item {
        position: relative;
        padding-left: var(--s-24);

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 6px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary-500);
        }

        &::after {
          content: '';
          position: absolute;
          left: 3px;
          top: 14px;
          width: 2px;
          height: calc(100% + var(--s-16));
          background: var(--grey-200);
        }

        &:last-child::after {
          display: none;
        }
      }

      .timeline-date {
        font-size: 12px;
        color: var(--grey-500);
        margin-bottom: var(--s-4);
      }

      .timeline-content {
        font-size: 14px;
        color: #333;
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

      .fade-in {
        animation: fadeIn 0.2s ease-in-out;
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
