import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceScheduleService } from '../../../core/services/maintenance-schedule.service';
import { MaintenanceSchedule } from '../../../core/models/maintenance-schedule.model';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../shared/components/export-dropdown/export-dropdown.component';

import {
  PageLayoutComponent,
  TabItem,
} from '../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../shared/components/filter-bar/filter-bar.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-maintenance-schedule-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Programación de Mantenimiento"
      icon="fa-calendar-days"
      [breadcrumbs]="[
        { label: 'Dashboard', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: 'Mantenimiento', url: '/equipment/maintenance' },
        { label: 'Programación' },
      ]"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="schedules.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <button type="button" class="btn btn-secondary" (click)="generateTasks()">
          <i class="fa-solid fa-sync"></i> Generar Tareas
        </button>
        <button type="button" class="btn btn-primary" (click)="createSchedule()">
          <i class="fa-solid fa-plus"></i> Nueva Programación
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <p>❌ Error: {{ error }}</p>
        <button type="button" class="btn btn-secondary" (click)="loadSchedules()">
          Reintentar
        </button>
      </div>

      <!-- Schedules List -->
      <div class="schedules-container">
        <div *ngIf="schedules.length > 0" class="schedules-grid">
          <div *ngFor="let schedule of schedules" class="schedule-card">
            <div class="card-header">
              <h3>{{ schedule.equipment?.code || 'Equipo #' + schedule.equipmentId }}</h3>
              <span class="status-badge" [class]="'status-' + schedule.status">
                {{ getStatusLabel(schedule.status) }}
              </span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="label">Tipo:</span>
                <span class="value">{{ getTypeLabel(schedule.maintenanceType) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Intervalo:</span>
                <span class="value">{{ schedule.intervalValue }} {{ schedule.intervalType }}</span>
              </div>
              <div class="info-row">
                <span class="label">Próximo Vencimiento:</span>
                <span class="value" [class.text-danger]="isOverdue(schedule)">
                  {{ getNextDue(schedule) }}
                </span>
              </div>
            </div>
            <div class="card-actions">
              <button
                type="button"
                class="btn btn-outline-primary"
                (click)="editSchedule(schedule.id)"
              >
                Editar
              </button>
              <button
                type="button"
                class="btn btn-outline-danger"
                (click)="deleteSchedule(schedule.id)"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && !error && schedules.length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No hay programaciones</h3>
          <p>Crea una nueva programación de mantenimiento para tus equipos.</p>
          <button type="button" class="btn btn-primary" (click)="createSchedule()">
            Nueva Programación
          </button>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .schedules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .schedule-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
        border-top: 4px solid #3182ce;
      }

      .schedule-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;
      }

      .card-header h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #2d3748;
        margin: 0;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
      }

      .status-active {
        background: #c6f6d5;
        color: #22543d;
      }
      .status-inactive {
        background: #e2e8f0;
        color: #4a5568;
      }
      .status-completed {
        background: #bee3f8;
        color: #2c5282;
      }

      .info-row {
        display: flex;
        justify-content: space-between;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f7fafc;
      }

      .info-row .label {
        font-weight: 500;
        color: #718096;
        font-size: 0.875rem;
      }

      .info-row .value {
        font-weight: 600;
        color: #2d3748;
        font-size: 0.875rem;
      }

      .text-danger {
        color: #e53e3e !important;
      }

      .card-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
      }

      .error-message {
        background: #fed7d7;
        color: #742a2a;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
        margin-bottom: 1rem;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem;
        background: white;
        border-radius: 12px;
      }
      .empty-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      .actions-container {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }
    `,
  ],
})
export class MaintenanceScheduleListComponent implements OnInit {
  private scheduleService = inject(MaintenanceScheduleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private excelService = inject(ExcelExportService);

  schedules: MaintenanceSchedule[] = [];
  loading = false;
  error: string | null = null;

  filterConfig: FilterConfig[] = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Activo', value: 'active' },
        { label: 'Inactivo', value: 'inactive' },
        { label: 'Completado', value: 'completed' },
      ],
    },
  ];

  tabs: TabItem[] = [
    { label: 'Lista de Equipos', route: '/equipment', icon: 'fa-list' },
    { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
    { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
    {
      label: 'Programación',
      route: '/equipment/maintenance/schedule',
      icon: 'fa-calendar',
      animate: false,
    },
    { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-contract' },
    { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  ];

  currentFilters: any = {};

  ngOnInit() {
    this.loadSchedules();
  }

  onFilterChange(filters: any) {
    this.currentFilters = filters;
    this.loadSchedules();
  }

  loadSchedules() {
    this.loading = true;
    this.error = '';
    this.scheduleService.getAll(this.currentFilters).subscribe({
      next: (schedules: MaintenanceSchedule[]) => {
        console.log('Received schedules:', schedules);
        // Response is already unwrapped by interceptor to just the array
        this.schedules = Array.isArray(schedules) ? schedules : [];
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading schedules:', err);
        this.error = err.error?.message || 'Error al cargar programaciones';
        this.loading = false;
      },
    });
  }

  createSchedule() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  editSchedule(id: any) {
    this.router.navigate([id, 'edit'], { relativeTo: this.route });
  }

  deleteSchedule(id: any) {
    if (confirm('¿Estás seguro de eliminar esta programación?')) {
      this.scheduleService.delete(id).subscribe({
        next: () => this.loadSchedules(),
        error: (err: any) => alert('Error al eliminar: ' + err.message),
      });
    }
  }

  generateTasks() {
    this.loading = true;
    this.scheduleService.generateTasks(30).subscribe({
      next: (res: any) => {
        alert(`Se generaron ${res.data.tasksGenerated} tareas nuevas.`);
        this.loading = false;
      },
      error: (err: any) => {
        alert('Error al generar tareas: ' + err.message);
        this.loading = false;
      },
    });
  }

  getNextDue(schedule: MaintenanceSchedule): string {
    if (schedule.intervalType === 'hours') {
      return `${schedule.nextDueHours} hrs`;
    }
    return schedule.nextDueDate ? new Date(schedule.nextDueDate).toLocaleDateString() : 'N/A';
  }

  isOverdue(schedule: MaintenanceSchedule): boolean {
    // Simple check, ideally compare with current date/hours
    if (schedule.intervalType === 'date' && schedule.nextDueDate) {
      return new Date(schedule.nextDueDate) < new Date();
    }
    return false;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'ACTIVO',
      inactive: 'INACTIVO',
      completed: 'COMPLETADO',
    };
    return labels[status] || status.toUpperCase();
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      preventive: 'Preventivo',
      corrective: 'Correctivo',
      predictive: 'Predictivo',
    };
    return labels[type] || type;
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.schedules.length === 0) {
      alert('No hay programaciones de mantenimiento para exportar');
      return;
    }

    const exportData = this.schedules.map((schedule) => ({
      ID: schedule.id || '',
      'Tipo Equipo': schedule.equipment?.name || '',
      'Tipo Mantenimiento': this.getTypeLabel(schedule.maintenanceType),
      Descripción: schedule.description || '',
      Intervalo: `${schedule.intervalValue} ${schedule.intervalType}`,
      'Último Mantenimiento': schedule.lastCompletedDate
        ? new Date(schedule.lastCompletedDate).toLocaleDateString('es-PE')
        : '',
      'Próximo Mantenimiento': schedule.nextDueDate
        ? new Date(schedule.nextDueDate).toLocaleDateString('es-PE')
        : '',
      Estado: this.getStatusLabel(schedule.status),
      Creado: schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'programacion-mantenimiento',
      sheetName: 'Prog. Mantenimiento',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.schedules.length === 0) {
      alert('No hay programaciones de mantenimiento para exportar');
      return;
    }

    const exportData = this.schedules.map((schedule) => ({
      ID: schedule.id || '',
      'Tipo Equipo': schedule.equipment?.name || '',
      'Tipo Mantenimiento': this.getTypeLabel(schedule.maintenanceType),
      Descripción: schedule.description || '',
      Intervalo: `${schedule.intervalValue} ${schedule.intervalType}`,
      'Último Mantenimiento': schedule.lastCompletedDate
        ? new Date(schedule.lastCompletedDate).toLocaleDateString('es-PE')
        : '',
      'Próximo Mantenimiento': schedule.nextDueDate
        ? new Date(schedule.nextDueDate).toLocaleDateString('es-PE')
        : '',
      Estado: this.getStatusLabel(schedule.status),
      Creado: schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'programacion-mantenimiento');
  }
}
