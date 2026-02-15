import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TimesheetService } from '../../core/services/timesheet.service';
import { Timesheet } from '../../core/models/scheduling.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { PageLayoutComponent } from '../../shared/components/page-layout/page-layout.component';
import {
  StatsGridComponent,
  StatItem,
} from '../../shared/components/stats-grid/stats-grid.component';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    StatsGridComponent,
  ],
  template: `
    <app-page-layout
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [title]="'Detalle de Planilla'"
      icon="fa-file-invoice"
    >
      <div class="page-header-actions" actions>
        <div class="header-actions">
          <button class="btn btn-secondary" routerLink="/operaciones/timesheets">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>
          <button
            *ngIf="timesheet?.estado === 'BORRADOR'"
            class="btn btn-primary"
            (click)="submitTimesheet()"
          >
            <i class="fa-solid fa-paper-plane"></i> Enviar
          </button>
          <button
            *ngIf="timesheet?.estado === 'ENVIADO'"
            class="btn btn-success"
            (click)="approveTimesheet()"
          >
            <i class="fa-solid fa-check"></i> Aprobar
          </button>
          <button
            *ngIf="timesheet?.estado === 'ENVIADO'"
            class="btn btn-danger"
            (click)="rejectTimesheet()"
          >
            <i class="fa-solid fa-xmark"></i> Rechazar
          </button>
        </div>
      </div>

      <div *ngIf="timesheet && !loading" class="content-grid">
        <!-- Summary Stats -->
        <div class="stats-section">
          <div class="section-header">
            <h2>Resumen</h2>
            <span class="status-badge" [class]="timesheet?.estado || ''">
              {{ timesheet?.estado }}
            </span>
          </div>
          <app-stats-grid [items]="statItems" testId="timesheet-summary-stats"></app-stats-grid>
        </div>

        <!-- Details Table -->
        <div class="card details-card">
          <h2>Detalle Diario</h2>
          <div class="table-responsive">
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
    </app-page-layout>
  `,
  styles: [
    `
      .container-fluid {
        padding: 2rem;
        max-width: 1200px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
      }
      .header-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .header-content h1 {
        margin: 0;
        font-size: 1.8rem;
        color: #2d3748;
      }
      .header-actions {
        display: flex;
        gap: 1rem;
      }

      .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 600;
      }
      .status-badge.BORRADOR {
        background: #edf2f7;
        color: #4a5568;
      }
      .status-badge.ENVIADO {
        background: #feebc8;
        color: #c05621;
      }
      .status-badge.APROBADO {
        background: #c6f6d5;
        color: #2f855a;
      }
      .status-badge.RECHAZADO {
        background: #fed7d7;
        color: #c53030;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        margin-bottom: 1.5rem;
      }
      .stats-section {
        margin-bottom: 2rem;
      }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      .section-header h2 {
        margin: 0;
        font-size: 1.25rem;
        color: #4a5568;
      }

      .text-center {
        text-align: center;
        color: #718096;
        font-style: italic;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }
      .btn:hover {
        transform: translateY(-1px);
      }
      .btn-primary {
        background: #3182ce;
        color: white;
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }
      .btn-success {
        background: #48bb78;
        color: white;
      }
      .btn-danger {
        background: #f56565;
        color: white;
      }

      .loading-spinner {
        text-align: center;
        padding: 3rem;
        color: #718096;
        font-size: 1.2rem;
      }
      .error-message {
        background: #fed7d7;
        color: #c53030;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
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
