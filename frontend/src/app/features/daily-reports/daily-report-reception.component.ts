import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  DailyReportService,
  EquipmentReceptionStatus,
} from '../../core/services/daily-report.service';
import {
  PageLayoutComponent,
  Breadcrumb,
} from '../../shared/components/page-layout/page-layout.component';
import { PageCardComponent } from '../../shared/components/page-card/page-card.component';
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import {
  DropdownComponent,
  DropdownOption,
} from '../../shared/components/dropdown/dropdown.component';

interface MatrixDate {
  iso: string;
  dayLabel: string; // "Lun 03", "Mar 04", etc.
  dayOfWeek: string; // "L", "M", "X", "J", "V", "S"
}

@Component({
  selector: 'app-daily-report-reception',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PageLayoutComponent,
    PageCardComponent,
    AeroTableComponent,
    DropdownComponent,
  ],
  template: `
    <app-page-layout
      title="Recepción de Partes Diarios"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <!-- Filters -->
      <div class="filters-row" actions>
        <div class="filter-group">
          <label class="filter-label">Desde</label>
          <input
            type="date"
            class="aero-date-input"
            [(ngModel)]="fechaDesde"
            (change)="loadData()"
            data-testid="filter-fecha-desde"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Hasta</label>
          <input
            type="date"
            class="aero-date-input"
            [(ngModel)]="fechaHasta"
            (change)="loadData()"
            data-testid="filter-fecha-hasta"
          />
        </div>
        <div class="filter-group filter-project">
          <label class="filter-label">Proyecto</label>
          <app-dropdown
            [options]="projectOptions"
            [(ngModel)]="selectedProjectId"
            (ngModelChange)="loadData()"
            placeholder="Todos los proyectos"
            data-testid="filter-proyecto"
          ></app-dropdown>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" *ngIf="data.length > 0">
        <div class="summary-card" data-testid="card-equipos">
          <div class="summary-value">{{ data.length }}</div>
          <div class="summary-label">Equipos</div>
        </div>
        <div class="summary-card" data-testid="card-recepcion">
          <div class="summary-value">{{ getAverageReception() }}%</div>
          <div class="summary-label">Recepción Promedio</div>
        </div>
        <div
          class="summary-card complete"
          *ngIf="getCompleteCount() > 0"
          data-testid="card-completos"
        >
          <div class="summary-value">{{ getCompleteCount() }}</div>
          <div class="summary-label">Equipos al día</div>
        </div>
        <div class="summary-card alert" *ngIf="getMissingCount() > 0" data-testid="card-faltantes">
          <div class="summary-value">{{ getMissingCount() }}</div>
          <div class="summary-label">Con partes faltantes</div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle" *ngIf="data.length > 0">
        <button
          class="toggle-btn"
          [class.active]="viewMode === 'summary'"
          (click)="viewMode = 'summary'"
          data-testid="btn-view-summary"
        >
          <i class="fa-solid fa-list"></i> Resumen
        </button>
        <button
          class="toggle-btn"
          [class.active]="viewMode === 'matrix'"
          (click)="switchToMatrix()"
          data-testid="btn-view-matrix"
        >
          <i class="fa-solid fa-table-cells"></i> Matriz
        </button>
      </div>

      <!-- Summary View -->
      <app-page-card [noPadding]="true" *ngIf="viewMode === 'summary'">
        <aero-table
          [columns]="columns"
          [data]="data"
          [loading]="loading"
          [templates]="{ recepcion: recepcionTemplate, faltantes: faltantesTemplate }"
        ></aero-table>
      </app-page-card>

      <!-- Matrix View -->
      <app-page-card [noPadding]="true" *ngIf="viewMode === 'matrix'">
        <div class="matrix-container" data-testid="reception-matrix">
          <div class="matrix-scroll">
            <table class="matrix-table">
              <thead>
                <tr>
                  <th class="sticky-col col-codigo">Código</th>
                  <th class="sticky-col col-equipo">Equipo</th>
                  <th
                    *ngFor="let d of matrixDates"
                    class="col-date"
                    [class.col-saturday]="d.dayOfWeek === 'S'"
                  >
                    <div class="date-header">
                      <span class="day-name">{{ d.dayOfWeek }}</span>
                      <span class="day-num">{{ d.dayLabel }}</span>
                    </div>
                  </th>
                  <th class="col-pct">%</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of data; trackBy: trackByEquipoId">
                  <td class="sticky-col col-codigo">{{ row.codigo_equipo }}</td>
                  <td class="sticky-col col-equipo">{{ row.marca }} {{ row.modelo }}</td>
                  <td
                    *ngFor="let d of matrixDates"
                    class="col-date cell-status"
                    [class.cell-ok]="!isMissing(row, d.iso)"
                    [class.cell-missing]="isMissing(row, d.iso)"
                    [class.col-saturday]="d.dayOfWeek === 'S'"
                    [attr.title]="
                      isMissing(row, d.iso) ? 'Faltante: ' + d.dayLabel : 'Recibido: ' + d.dayLabel
                    "
                  >
                    <i
                      class="fa-solid"
                      [class.fa-check]="!isMissing(row, d.iso)"
                      [class.fa-xmark]="isMissing(row, d.iso)"
                    ></i>
                  </td>
                  <td
                    class="col-pct"
                    [class.pct-good]="row.porcentaje_recepcion >= 80"
                    [class.pct-warn]="
                      row.porcentaje_recepcion >= 50 && row.porcentaje_recepcion < 80
                    "
                    [class.pct-bad]="row.porcentaje_recepcion < 50"
                  >
                    {{ row.porcentaje_recepcion }}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Matrix Legend -->
          <div class="matrix-legend">
            <span class="legend-item"> <span class="legend-dot ok"></span> Recibido </span>
            <span class="legend-item"> <span class="legend-dot missing"></span> Faltante </span>
            <span class="legend-item"> <span class="legend-dot saturday"></span> Sábado </span>
          </div>
        </div>
      </app-page-card>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="!loading && data.length === 0">
        <i class="fa-solid fa-clipboard-check empty-icon"></i>
        <p>No hay datos de recepción para el rango seleccionado.</p>
      </div>

      <!-- Templates for summary view -->
      <ng-template #recepcionTemplate let-row>
        <div class="progress-container">
          <div class="progress-bar">
            <div
              class="progress-fill"
              [style.width.%]="row.porcentaje_recepcion"
              [class.red]="row.porcentaje_recepcion < 50"
              [class.yellow]="row.porcentaje_recepcion >= 50 && row.porcentaje_recepcion < 80"
              [class.green]="row.porcentaje_recepcion >= 80"
            ></div>
          </div>
          <span class="progress-text">{{ row.porcentaje_recepcion }}%</span>
        </div>
      </ng-template>

      <ng-template #faltantesTemplate let-row>
        <div class="faltantes-container" *ngIf="row.fechas_faltantes?.length > 0">
          <button class="btn-toggle" (click)="toggleExpanded(row.equipo_id)">
            <i
              class="fa-solid"
              [class.fa-chevron-down]="!isExpanded(row.equipo_id)"
              [class.fa-chevron-up]="isExpanded(row.equipo_id)"
            ></i>
            {{ row.reportes_pendientes }} faltante{{ row.reportes_pendientes !== 1 ? 's' : '' }}
          </button>
          <div class="fechas-list" *ngIf="isExpanded(row.equipo_id)">
            <span class="fecha-chip" *ngFor="let f of row.fechas_faltantes">
              {{ formatDate(f) }}
            </span>
          </div>
        </div>
        <span *ngIf="!row.fechas_faltantes?.length" class="all-ok">
          <i class="fa-solid fa-check-circle"></i> Completo
        </span>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      /* Filters */
      .filters-row {
        display: flex;
        gap: 16px;
        align-items: flex-end;
      }
      .filter-group {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .filter-project {
        min-width: 200px;
      }
      .filter-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
      }
      .aero-date-input {
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-md, 6px);
        font-size: 13px;
        color: var(--grey-900);
        background: var(--neutral-0);
        transition: border-color 0.15s;
      }
      .aero-date-input:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(0, 97, 170, 0.1);
      }

      /* Summary Cards */
      .summary-cards {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }
      .summary-card {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--radius-md, 6px);
        padding: 16px 24px;
        text-align: center;
        min-width: 120px;
      }
      .summary-card.alert {
        border-color: var(--semantic-red-300);
        background: var(--semantic-red-50, #fef2f2);
      }
      .summary-card.complete {
        border-color: var(--semantic-green-300);
        background: var(--semantic-green-50, #f0fdf4);
      }
      .summary-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
      }
      .summary-card.alert .summary-value {
        color: var(--semantic-red-500);
      }
      .summary-card.complete .summary-value {
        color: var(--semantic-green-600);
      }
      .summary-label {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

      /* View Toggle */
      .view-toggle {
        display: flex;
        gap: 0;
        margin-bottom: 16px;
        background: var(--grey-100);
        border-radius: var(--radius-md, 6px);
        padding: 3px;
        width: fit-content;
      }
      .toggle-btn {
        padding: 6px 16px;
        border: none;
        background: transparent;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 500;
        color: var(--grey-600);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.15s;
      }
      .toggle-btn.active {
        background: var(--neutral-0);
        color: var(--primary-700);
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
      }
      .toggle-btn:hover:not(.active) {
        color: var(--grey-800);
      }

      /* Summary View */
      .progress-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .progress-bar {
        flex: 1;
        height: 8px;
        background: var(--grey-200);
        border-radius: 4px;
        overflow: hidden;
        min-width: 80px;
      }
      .progress-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      .progress-fill.red {
        background: var(--semantic-red-500);
      }
      .progress-fill.yellow {
        background: var(--semantic-yellow-500);
      }
      .progress-fill.green {
        background: var(--semantic-green-500);
      }
      .progress-text {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-700);
        min-width: 36px;
      }
      .btn-toggle {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 12px;
        color: var(--primary-500);
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 2px 0;
      }
      .btn-toggle:hover {
        text-decoration: underline;
      }
      .fechas-list {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 4px;
      }
      .fecha-chip {
        background: var(--semantic-red-100);
        color: var(--semantic-red-900);
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
      }
      .all-ok {
        color: var(--semantic-green-500);
        font-size: 12px;
        font-weight: 600;
      }

      /* Matrix View */
      .matrix-container {
        width: 100%;
      }
      .matrix-scroll {
        overflow-x: auto;
        overflow-y: auto;
        max-height: 70vh;
      }
      .matrix-table {
        border-collapse: separate;
        border-spacing: 0;
        width: max-content;
        min-width: 100%;
        font-size: 12px;
      }
      .matrix-table thead th {
        background: var(--grey-50);
        border-bottom: 2px solid var(--grey-200);
        padding: 6px 4px;
        font-weight: 600;
        color: var(--grey-700);
        text-align: center;
        white-space: nowrap;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .matrix-table tbody td {
        padding: 6px 4px;
        border-bottom: 1px solid var(--grey-100);
        text-align: center;
        white-space: nowrap;
      }
      .matrix-table tbody tr:hover td {
        background: var(--grey-50);
      }

      /* Sticky columns */
      .sticky-col {
        position: sticky;
        z-index: 3;
        background: var(--neutral-0);
      }
      thead .sticky-col {
        z-index: 4;
        background: var(--grey-50);
      }
      .col-codigo {
        left: 0;
        min-width: 80px;
        max-width: 100px;
        text-align: left !important;
        font-weight: 600;
        color: var(--primary-700);
        padding-left: 12px !important;
        border-right: 1px solid var(--grey-200);
      }
      .col-equipo {
        left: 100px;
        min-width: 140px;
        max-width: 180px;
        text-align: left !important;
        color: var(--grey-700);
        border-right: 2px solid var(--grey-200);
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* Date columns */
      .col-date {
        min-width: 36px;
        width: 36px;
      }
      .col-saturday {
        border-right: 2px solid var(--grey-200);
      }
      .date-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1px;
        line-height: 1.1;
      }
      .day-name {
        font-size: 10px;
        color: var(--grey-500);
        font-weight: 400;
      }
      .day-num {
        font-size: 11px;
        font-weight: 600;
      }

      /* Cell status */
      .cell-status {
        font-size: 13px;
      }
      .cell-ok {
        color: var(--semantic-green-500);
      }
      .cell-ok i {
        font-size: 11px;
      }
      .cell-missing {
        color: var(--semantic-red-400);
        background: var(--semantic-red-50, #fef2f2);
      }
      .cell-missing i {
        font-size: 11px;
      }

      /* Percentage column */
      .col-pct {
        min-width: 48px;
        font-weight: 700;
        font-size: 12px;
        border-left: 2px solid var(--grey-200);
      }
      .pct-good {
        color: var(--semantic-green-600);
      }
      .pct-warn {
        color: var(--semantic-yellow-600);
      }
      .pct-bad {
        color: var(--semantic-red-500);
      }

      /* Legend */
      .matrix-legend {
        display: flex;
        gap: 20px;
        padding: 12px 16px;
        border-top: 1px solid var(--grey-200);
        font-size: 12px;
        color: var(--grey-600);
      }
      .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 2px;
      }
      .legend-dot.ok {
        background: var(--semantic-green-500);
      }
      .legend-dot.missing {
        background: var(--semantic-red-400);
      }
      .legend-dot.saturday {
        background: var(--grey-200);
        border-right: 2px solid var(--grey-400);
      }

      /* Empty state */
      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: var(--grey-500);
      }
      .empty-icon {
        font-size: 48px;
        color: var(--grey-300);
        margin-bottom: 16px;
      }
    `,
  ],
})
export class DailyReportReceptionComponent implements OnInit {
  private reportService = inject(DailyReportService);
  private projectService = inject(ProjectService);

  loading = false;
  data: EquipmentReceptionStatus[] = [];
  expandedIds = new Set<number>();
  viewMode: 'summary' | 'matrix' = 'summary';

  fechaDesde = '';
  fechaHasta = '';
  selectedProjectId: number | null = null;
  projectOptions: DropdownOption[] = [];

  // Matrix data
  matrixDates: MatrixDate[] = [];
  private missingDatesMap = new Map<number, Set<string>>();

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Recepción de Partes' },
  ];

  columns: TableColumn[] = [
    { key: 'codigo_equipo', label: 'Código', type: 'text' },
    { key: 'marca', label: 'Marca', type: 'text' },
    { key: 'modelo', label: 'Modelo', type: 'text' },
    { key: 'reportes_recibidos', label: 'Recibidos', type: 'text' },
    { key: 'total_dias', label: 'Total Días', type: 'text' },
    { key: 'recepcion', label: 'Recepción', type: 'template' },
    { key: 'faltantes', label: 'Faltantes', type: 'template' },
  ];

  ngOnInit() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    this.fechaDesde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    this.fechaHasta = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    this.loadProjects();
    this.loadData();
  }

  loadProjects() {
    this.projectService.getAll({ estado: 'ACTIVO' }).subscribe({
      next: (projects: Project[]) => {
        this.projectOptions = projects.map((p) => ({
          label: `${p.codigo} — ${p.nombre}`,
          value: p.id,
        }));
      },
    });
  }

  loadData() {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.loading = true;
    this.reportService
      .getReceptionStatus(this.fechaDesde, this.fechaHasta, this.selectedProjectId ?? undefined)
      .subscribe({
        next: (result: EquipmentReceptionStatus[]) => {
          this.data = result;
          this.buildMissingDatesMap();
          if (this.viewMode === 'matrix') {
            this.buildMatrixDates();
          }
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  switchToMatrix() {
    this.viewMode = 'matrix';
    if (this.matrixDates.length === 0) {
      this.buildMatrixDates();
    }
  }

  getAverageReception(): number {
    if (this.data.length === 0) return 0;
    const sum = this.data.reduce((acc, d) => acc + d.porcentaje_recepcion, 0);
    return Math.round(sum / this.data.length);
  }

  getMissingCount(): number {
    return this.data.filter((d) => d.reportes_pendientes > 0).length;
  }

  getCompleteCount(): number {
    return this.data.filter((d) => d.reportes_pendientes === 0).length;
  }

  toggleExpanded(equipoId: number): void {
    if (this.expandedIds.has(equipoId)) {
      this.expandedIds.delete(equipoId);
    } else {
      this.expandedIds.add(equipoId);
    }
  }

  isExpanded(equipoId: number): boolean {
    return this.expandedIds.has(equipoId);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
  }

  trackByEquipoId(_index: number, row: EquipmentReceptionStatus): number {
    return row.equipo_id;
  }

  /** Check if a date is missing for a given equipment row */
  isMissing(row: EquipmentReceptionStatus, dateIso: string): boolean {
    return this.missingDatesMap.get(row.equipo_id)?.has(dateIso) ?? false;
  }

  /** Pre-compute missing dates set per equipment for O(1) lookup */
  private buildMissingDatesMap() {
    this.missingDatesMap.clear();
    for (const row of this.data) {
      if (row.fechas_faltantes?.length) {
        this.missingDatesMap.set(row.equipo_id, new Set(row.fechas_faltantes));
      }
    }
  }

  /** Generate working day columns (Mon-Sat) between fechaDesde and fechaHasta */
  private buildMatrixDates() {
    this.matrixDates = [];
    const dayNames = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
    const start = new Date(this.fechaDesde + 'T00:00:00');
    const end = new Date(this.fechaHasta + 'T00:00:00');

    const current = new Date(start);
    while (current <= end) {
      const dow = current.getDay();
      // Only Mon-Sat (1-6), skip Sunday (0)
      if (dow >= 1 && dow <= 6) {
        const iso = current.toISOString().slice(0, 10);
        const dayNum = String(current.getDate()).padStart(2, '0');
        this.matrixDates.push({
          iso,
          dayLabel: dayNum,
          dayOfWeek: dayNames[dow],
        });
      }
      current.setDate(current.getDate() + 1);
    }
  }
}
