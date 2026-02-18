import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TimesheetService } from '../../core/services/timesheet.service';
import { Timesheet } from '../../core/models/scheduling.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, AeroTableComponent, StatsGridComponent],
  template: `
    <div class="detail-container">
      <div class="container">
        <div *ngIf="loading" class="loading-state">
          <div class="spinner"></div>
          <p>Cargando detalles de la planilla...</p>
        </div>

        <div *ngIf="timesheet && !loading" class="detail-grid">
          <div class="detail-main">
            <!-- Header Card -->
            <div class="card detail-header-card">
              <div class="detail-header">
                <div>
                  <h1>Detalle de Planilla #{{ timesheet.id }}</h1>
                  <p class="text-subtitle">
                    {{ timesheet.fecha_inicio | date: 'dd/MM/yyyy' }} -
                    {{ timesheet.fecha_fin | date: 'dd/MM/yyyy' }}
                  </p>
                </div>
                <div class="detail-status">
                  <span
                    class="status-badge"
                    [class.status-APROBADO]="timesheet.estado === 'APROBADO'"
                    [class.status-PENDIENTE]="
                      timesheet.estado === 'ENVIADO' || timesheet.estado === 'BORRADOR'
                    "
                    [class.status-CANCELADO]="timesheet.estado === 'RECHAZADO'"
                  >
                    {{ timesheet.estado }}
                  </span>
                </div>
              </div>

              <!-- Stats Grid -->
              <app-stats-grid [items]="statItems" testId="timesheet-summary-stats"></app-stats-grid>
            </div>

            <!-- Details Table Card -->
            <div class="card mt-6">
              <div class="detail-section">
                <h2>Detalle Diario</h2>
                <div class="table-container">
                  <aero-table
                    [columns]="columns"
                    [data]="timesheet.details || []"
                    [templates]="{
                      project: projectTemplate,
                      equipment: equipmentTemplate,
                      hours: hoursTemplate,
                    }"
                  >
                  </aero-table>

                  <ng-template #projectTemplate let-row>
                    {{ row.project?.G00007_Nombre || '-' }}
                  </ng-template>

                  <ng-template #equipmentTemplate let-row>
                    {{ row.equipment?.C08001_Nombre || '-' }}
                  </ng-template>

                  <ng-template #hoursTemplate let-row>
                    <strong>{{ row.hours_worked }}</strong>
                  </ng-template>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="detail-sidebar">
            <div class="card">
              <h3 class="sidebar-card-title">Acciones</h3>
              <div class="quick-actions">
                <button
                  *ngIf="timesheet.estado === 'BORRADOR'"
                  class="btn btn-primary btn-block"
                  (click)="submitTimesheet()"
                >
                  <i class="fa-solid fa-paper-plane"></i> Enviar Planilla
                </button>
                <button
                  *ngIf="timesheet.estado === 'ENVIADO'"
                  class="btn btn-primary btn-block"
                  (click)="approveTimesheet()"
                >
                  <i class="fa-solid fa-check"></i> Aprobar Planilla
                </button>
                <button
                  *ngIf="timesheet.estado === 'ENVIADO'"
                  class="btn btn-danger btn-block"
                  (click)="rejectTimesheet()"
                >
                  <i class="fa-solid fa-xmark"></i> Rechazar Planilla
                </button>
                <button class="btn btn-ghost btn-block" routerLink="/operaciones/timesheets">
                  <i class="fa-solid fa-arrow-left"></i> Volver a Lista
                </button>
              </div>
            </div>

            <div class="card" *ngIf="timesheet.notes">
              <h3 class="sidebar-card-title">Observaciones</h3>
              <p class="text-sm text-grey-600">{{ timesheet.notes }}</p>
            </div>
          </div>
        </div>

        <!-- Error State -->
        <div *ngIf="error && !loading" class="empty-state-card mt-6">
          <i class="fa-solid fa-circle-exclamation text-danger"></i>
          <h3>Error</h3>
          <p>{{ error }}</p>
          <button class="btn btn-primary mt-4" routerLink="/operaciones/timesheets">
            Volver a la lista
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @use 'detail-layout' as *;

      .mt-4 {
        margin-top: 1rem;
      }
      .mt-6 {
        margin-top: 1.5rem;
      }
      .text-sm {
        font-size: 0.875rem;
      }
      .text-grey-600 {
        color: var(--grey-600);
      }
      .text-subtitle {
        font-size: 14px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      .detail-header-card {
        padding-bottom: var(--s-24);
      }
    `,
  ],
})
export class TimesheetDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private timesheetService = inject(TimesheetService);

  timesheet: Timesheet | null = null;
  loading = true;
  error = '';
  statItems: StatItem[] = [];

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Operaciones', url: '/operaciones' },
    { label: 'Planillas', url: '/operaciones/timesheets' },
    { label: 'Detalle' },
  ];

  columns: TableColumn[] = [
    { key: 'work_date', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'project', label: 'Proyecto', type: 'template' },
    { key: 'equipment', label: 'Equipo', type: 'template' },
    { key: 'start_time', label: 'Hora Inicio', type: 'text' },
    { key: 'end_time', label: 'Hora Fin', type: 'text' },
    { key: 'hours', label: 'Horas', type: 'template' },
    { key: 'notes', label: 'Notas', type: 'text' },
  ];

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTimesheet(parseInt(id));
    } else {
      this.error = 'ID de planilla no válido';
      this.loading = false;
    }
  }

  loadTimesheet(id: number) {
    this.loading = true;
    this.timesheetService.getTimesheetById(id).subscribe({
      next: (res) => {
        this.timesheet = res;
        this.calculateStatItems();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar la planilla';
        this.loading = false;
        console.error(err);
      },
    });
  }

  calculateStatItems() {
    if (!this.timesheet) return;

    this.statItems = [
      {
        label: 'ID Tareo',
        value: `#${this.timesheet.id}`,
        icon: 'fa-hashtag',
        color: 'primary',
        testId: 'timesheet-id',
      },
      {
        label: 'Total Horas',
        value: `${this.timesheet.totalHoras} hrs`,
        icon: 'fa-clock',
        color: 'info',
        testId: 'total-hours',
      },
      {
        label: 'Días Trabajados',
        value: this.timesheet.totalDiasTrabajados,
        icon: 'fa-calendar-check',
        color: 'success',
        testId: 'total-days',
      },
      {
        label: 'Monto Calculado',
        value: this.formatCurrency(this.timesheet.montoCalculado || 0),
        icon: 'fa-money-bill-wave',
        color: 'warning',
        testId: 'calculated-amount',
      },
    ];
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  submitTimesheet() {
    if (!this.timesheet) return;
    if (!confirm('¿Está seguro de enviar esta planilla para aprobación?')) return;

    this.timesheetService.submitTimesheet(this.timesheet.id).subscribe({
      next: (res) => {
        this.timesheet = res;
        alert('Planilla enviada exitosamente');
      },
      error: (err) => alert('Error al enviar planilla'),
    });
  }

  approveTimesheet() {
    if (!this.timesheet) return;
    if (!confirm('¿Aprobar esta planilla?')) return;

    this.timesheetService.approveTimesheet(this.timesheet.id).subscribe({
      next: (res) => {
        this.timesheet = res;
        alert('Planilla aprobada');
      },
      error: (err) => alert('Error al aprobar planilla'),
    });
  }

  rejectTimesheet() {
    if (!this.timesheet) return;
    const reason = prompt('Ingrese el motivo del rechazo:');
    if (!reason) return;

    this.timesheetService.rejectTimesheet(this.timesheet.id, reason).subscribe({
      next: (res) => {
        this.timesheet = res;
        alert('Planilla rechazada');
      },
      error: (err) => alert('Error al rechazar planilla'),
    });
  }
}
