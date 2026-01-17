import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TimesheetService } from '../../core/services/timesheet.service';
import { Timesheet } from '../../core/models/scheduling.model';
import { ExcelExportService } from '../../core/services/excel-export.service';

import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-timesheet-list',
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
      title="Planillas de Tiempo"
      icon="fa-clock"
      [breadcrumbs]="[
        { label: 'Dashboard', url: '/app' },
        { label: 'Operaciones', url: '/operaciones' },
        { label: 'Planillas' },
      ]"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <button class="btn btn-primary" (click)="navigateToGenerate()">
          <i class="fa-solid fa-plus"></i> Generar Planilla
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <!-- Error State -->
      <div *ngIf="error" class="error-message">
        <p>❌ Error: {{ error }}</p>
        <button class="btn btn-secondary" (click)="loadTimesheets()">Reintentar</button>
      </div>

      <!-- Timesheets List -->
      <div *ngIf="!loading && !error" class="timesheets-grid">
        <div
          *ngFor="let timesheet of timesheets"
          class="timesheet-card"
          (click)="viewTimesheet(timesheet.id)"
        >
          <div class="card-header">
            <h3>{{ timesheet.timesheetCode }}</h3>
            <span class="status-badge" [class]="'status-' + timesheet.status">
              {{ getStatusLabel(timesheet.status) }}
            </span>
          </div>
          <div class="card-body">
            <div class="info-row">
              <span class="label">Operador:</span>
              <span class="value">{{ timesheet.operator?.name || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Período:</span>
              <span class="value"
                >{{ formatDate(timesheet.periodStart) }} -
                {{ formatDate(timesheet.periodEnd) }}</span
              >
            </div>
            <div class="info-row">
              <span class="label">Total Horas:</span>
              <span class="value">{{ timesheet.totalHours }} hrs</span>
            </div>
            <div class="info-row">
              <span class="label">Total Días:</span>
              <span class="value">{{ timesheet.totalDays }} días</span>
            </div>
          </div>
          <div class="card-footer">
            <small>Creado: {{ formatDate(timesheet.createdAt) }}</small>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="timesheets.length === 0" class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>No hay planillas</h3>
          <p>Genera tu primera planilla de tiempo desde reportes diarios.</p>
          <button class="btn btn-primary" (click)="navigateToGenerate()">Generar Planilla</button>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .timesheets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 1.5rem;
      }

      .timesheet-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: all 0.3s ease;
        border-left: 4px solid #3182ce;
      }

      .timesheet-card:hover {
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
        text-transform: uppercase;
      }

      .status-draft {
        background: #e2e8f0;
        color: #4a5568;
      }

      .status-submitted {
        background: #bee3f8;
        color: #2c5282;
      }

      .status-approved {
        background: #c6f6d5;
        color: #22543d;
      }

      .status-rejected {
        background: #fed7d7;
        color: #742a2a;
      }

      .status-paid {
        background: #d6bcfa;
        color: #44337a;
      }

      .card-body {
        margin-bottom: 1rem;
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

      .card-footer {
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
      }

      .card-footer small {
        color: #a0aec0;
        font-size: 0.75rem;
      }

      .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 4rem 2rem;
        background: white;
        border-radius: 12px;
      }

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      .empty-state h3 {
        font-size: 1.5rem;
        color: #2d3748;
        margin-bottom: 0.5rem;
      }

      .empty-state p {
        color: #718096;
        margin-bottom: 1.5rem;
      }

      .error-message {
        background: #fed7d7;
        color: #742a2a;
        padding: 1.5rem;
        border-radius: 12px;
        text-align: center;
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
export class TimesheetListComponent implements OnInit {
  private timesheetService = inject(TimesheetService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);

  timesheets: Timesheet[] = [];
  loading = false;
  error: string | null = null;

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Enviado', value: 'submitted' },
        { label: 'Aprobado', value: 'approved' },
        { label: 'Rechazado', value: 'rejected' },
        { label: 'Pagado', value: 'paid' },
      ],
    },
  ];

  currentFilters: any = {};

  ngOnInit() {
    this.loadTimesheets();
  }

  onFilterChange(filters: any) {
    this.currentFilters = filters;
    this.loadTimesheets();
  }

  loadTimesheets() {
    this.loading = true;
    this.error = null;

    this.timesheetService.listTimesheets(this.currentFilters).subscribe({
      next: (response) => {
        this.timesheets = response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading timesheets:', err);
        this.error = 'No se pudieron cargar las planillas';
        this.loading = false;
      },
    });
  }

  navigateToGenerate() {
    this.router.navigate(['/operaciones/timesheets/generate']);
  }

  viewTimesheet(id: number) {
    this.router.navigate(['/operaciones/timesheets', id]);
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      submitted: 'Enviado',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      paid: 'Pagado',
    };
    return labels[status] || status;
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.timesheets.length === 0) {
      alert('No hay planillas para exportar');
      return;
    }

    const exportData = this.timesheets.map((timesheet) => ({
      ID: timesheet.id || '',
      Código: timesheet.timesheetCode || '',
      Operador: timesheet.operator?.full_name || 'N/A',
      Proyecto: timesheet.project?.name || 'N/A',
      'Fecha Inicio': timesheet.periodStart
        ? new Date(timesheet.periodStart).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': timesheet.periodEnd
        ? new Date(timesheet.periodEnd).toLocaleDateString('es-PE')
        : '',
      'Total Horas': timesheet.totalHours || 0,
      'Horas Regulares': timesheet.regularHours || 0,
      'Horas Extra': timesheet.overtimeHours || 0,
      'Total Días': timesheet.totalDays || 0,
      Estado: this.getStatusLabel(timesheet.status || ''),
      Creado: timesheet.createdAt ? new Date(timesheet.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'planillas',
      sheetName: 'Planillas de Tiempo',
    });
  }

  exportToCSV(): void {
    if (this.timesheets.length === 0) {
      alert('No hay planillas para exportar');
      return;
    }

    const exportData = this.timesheets.map((timesheet) => ({
      ID: timesheet.id || '',
      Código: timesheet.timesheetCode || '',
      Operador: timesheet.operator?.full_name || 'N/A',
      Proyecto: timesheet.project?.name || 'N/A',
      'Fecha Inicio': timesheet.periodStart
        ? new Date(timesheet.periodStart).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': timesheet.periodEnd
        ? new Date(timesheet.periodEnd).toLocaleDateString('es-PE')
        : '',
      'Total Horas': timesheet.totalHours || 0,
      'Horas Regulares': timesheet.regularHours || 0,
      'Horas Extra': timesheet.overtimeHours || 0,
      'Total Días': timesheet.totalDays || 0,
      Estado: this.getStatusLabel(timesheet.status || ''),
      Creado: timesheet.createdAt ? new Date(timesheet.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'planillas');
  }
}
