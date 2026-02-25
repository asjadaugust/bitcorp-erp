import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaintenanceScheduleService } from '../../../core/services/maintenance-schedule.service';
import { MaintenanceSchedule } from '../../../core/models/maintenance-schedule.model';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import {
  ExportFormat,
} from '../../../shared/components/export-dropdown/export-dropdown.component';
import { MaintenanceCardComponent } from '../../../shared/components/maintenance-card/maintenance-card.component';

import {
  PageLayoutComponent,
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
    ActionsContainerComponent,
    MaintenanceCardComponent,
  ],
  template: `
    <app-page-layout
      title="Programación de Mantenimiento"
      icon="fa-calendar"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Equipos', url: '/equipment' },
        { label: 'Mantenimiento', url: '/equipment/maintenance' },
        { label: 'Programación' },
      ]"
      [loading]="loading"
    >
      <app-actions-container actions>
        <button type="button" class="btn btn-primary" (click)="createSchedule()">
          <i class="fa-solid fa-plus"></i> Nueva Programación
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <!-- Schedules List -->
      <div class="schedules-container">
        <div *ngIf="schedules.length > 0" class="schedules-grid">
          <app-maintenance-card
            *ngFor="let schedule of schedules"
            [schedule]="schedule"
            (edit)="editSchedule($event)"
            (delete)="deleteSchedule($event)"
            (cardClick)="editSchedule($event.id)"
          ></app-maintenance-card>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading && schedules.length === 0" class="empty-state">
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

      .schedules-container {
        padding: 1rem 0;
      }

      .schedules-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
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
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por descripción o código de equipo...',
    },
    {
      key: 'tipoMantenimiento',
      label: 'Tipo',
      type: 'select',
      options: [
        { label: 'Preventivo', value: 'PREVENTIVO' },
        { label: 'Correctivo', value: 'CORRECTIVO' },
        { label: 'Predictivo', value: 'PREDICTIVO' },
      ],
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Programado', value: 'PROGRAMADO' },
        { label: 'En Proceso', value: 'EN_PROCESO' },
        { label: 'Completado', value: 'COMPLETADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
        { label: 'Pendiente', value: 'PENDIENTE' },
      ],
    },
    {
      key: 'dateRange',
      label: 'Fecha Programada',
      type: 'dateRange',
    },
  ];



  currentFilters: Record<string, unknown> = {};

  ngOnInit() {
    this.loadSchedules();
  }

  onFilterChange(filters: Record<string, unknown>) {
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
      error: (err: unknown) => {
        console.error('Error loading schedules:', err);
        this.error = (err as Record<string, Record<string, string>>).error?.message || 'Error al cargar programaciones';
        this.loading = false;
      },
    });
  }

  createSchedule() {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  editSchedule(id: number | string) {
    this.router.navigate([id, 'edit'], { relativeTo: this.route });
  }

  deleteSchedule(id: number | string) {
    if (confirm('¿Estás seguro de eliminar esta programación?')) {
      this.scheduleService.delete(id).subscribe({
        next: () => this.loadSchedules(),
        error: (err: unknown) => alert('Error al eliminar: ' + (err as Error).message),
      });
    }
  }

  generateTasks() {
    this.loading = true;
    this.scheduleService.generateTasks(30).subscribe({
      next: (res: Record<string, unknown>) => {
        alert(`Se generaron ${(res.data as Record<string, number>).tasksGenerated} tareas nuevas.`);
        this.loading = false;
      },
      error: (err: unknown) => {
        alert('Error al generar tareas: ' + (err as Error).message);
        this.loading = false;
      },
    });
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      PROGRAMADO: 'Programado',
      EN_PROCESO: 'En Proceso',
      COMPLETADO: 'Completado',
      CANCELADO: 'Cancelado',
      PENDIENTE: 'Pendiente',
    };
    return labels[estado] || estado;
  }

  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = {
      PREVENTIVO: 'Preventivo',
      CORRECTIVO: 'Correctivo',
      PREDICTIVO: 'Predictivo',
    };
    return labels[tipo] || tipo;
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
      Equipo: schedule.equipo?.codigo_equipo || '',
      'Tipo Mantenimiento': this.getTipoLabel(schedule.tipoMantenimiento),
      Descripción: schedule.descripcion || '',
      'Fecha Programada': schedule.fechaProgramada
        ? new Date(schedule.fechaProgramada).toLocaleDateString('es-PE')
        : '',
      'Fecha Realizada': schedule.fechaRealizada
        ? new Date(schedule.fechaRealizada).toLocaleDateString('es-PE')
        : '',
      'Costo Estimado': schedule.costoEstimado || '',
      'Costo Real': schedule.costoReal || '',
      Técnico: schedule.tecnicoResponsable || '',
      Estado: this.getEstadoLabel(schedule.estado),
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
      Equipo: schedule.equipo?.codigo_equipo || '',
      'Tipo Mantenimiento': this.getTipoLabel(schedule.tipoMantenimiento),
      Descripción: schedule.descripcion || '',
      'Fecha Programada': schedule.fechaProgramada
        ? new Date(schedule.fechaProgramada).toLocaleDateString('es-PE')
        : '',
      'Fecha Realizada': schedule.fechaRealizada
        ? new Date(schedule.fechaRealizada).toLocaleDateString('es-PE')
        : '',
      'Costo Estimado': schedule.costoEstimado || '',
      'Costo Real': schedule.costoReal || '',
      Técnico: schedule.tecnicoResponsable || '',
      Estado: this.getEstadoLabel(schedule.estado),
      Creado: schedule.createdAt ? new Date(schedule.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'programacion-mantenimiento');
  }
}
