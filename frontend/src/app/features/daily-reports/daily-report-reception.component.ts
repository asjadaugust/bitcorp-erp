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
import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';

@Component({
  selector: 'app-daily-report-reception',
  standalone: true,
  imports: [CommonModule, FormsModule, PageLayoutComponent, AeroTableComponent],
  template: `
    <app-page-layout
      title="Recepción de Partes Diarios"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
    >
      <div class="filters-row" actions>
        <div class="date-filter">
          <span class="label">Desde</span>
          <input type="date" [(ngModel)]="fechaDesde" (change)="loadData()" />
        </div>
        <div class="date-filter">
          <span class="label">Hasta</span>
          <input type="date" [(ngModel)]="fechaHasta" (change)="loadData()" />
        </div>
      </div>

      <div class="summary-cards" *ngIf="data.length > 0">
        <div class="summary-card">
          <div class="summary-value">{{ data.length }}</div>
          <div class="summary-label">Equipos</div>
        </div>
        <div class="summary-card">
          <div class="summary-value">{{ getAverageReception() }}%</div>
          <div class="summary-label">Recepción Promedio</div>
        </div>
        <div class="summary-card alert" *ngIf="getMissingCount() > 0">
          <div class="summary-value">{{ getMissingCount() }}</div>
          <div class="summary-label">Con partes faltantes</div>
        </div>
      </div>

      <aero-table
        [columns]="columns"
        [data]="data"
        [loading]="loading"
        [templates]="{ recepcion: recepcionTemplate, faltantes: faltantesTemplate }"
      ></aero-table>

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
      .filters-row {
        display: flex;
        gap: 16px;
        align-items: flex-end;
      }
      .date-filter {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .date-filter label {
        font-size: 12px;
        font-weight: 600;
        color: var(--grey-600);
      }
      .date-filter input {
        padding: 6px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--s-8);
        font-size: 13px;
      }

      .summary-cards {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
      }
      .summary-card {
        background: var(--neutral-0);
        border: 1px solid var(--grey-200);
        border-radius: var(--s-8);
        padding: 16px 24px;
        text-align: center;
        min-width: 120px;
      }
      .summary-card.alert {
        border-color: var(--error-300);
        background: var(--error-50, #fef2f2);
      }
      .summary-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--grey-900);
      }
      .summary-card.alert .summary-value {
        color: var(--error-600);
      }
      .summary-label {
        font-size: 12px;
        color: var(--grey-500);
        margin-top: 4px;
      }

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
        background: var(--error-500);
      }
      .progress-fill.yellow {
        background: #f9a825;
      }
      .progress-fill.green {
        background: var(--success-500, #22c55e);
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
        background: var(--error-100);
        color: var(--error-700);
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .all-ok {
        color: var(--success-600, #16a34a);
        font-size: 12px;
        font-weight: 600;
      }
    `,
  ],
})
export class DailyReportReceptionComponent implements OnInit {
  private reportService = inject(DailyReportService);

  loading = false;
  data: EquipmentReceptionStatus[] = [];
  expandedIds = new Set<number>();

  fechaDesde = '';
  fechaHasta = '';

  breadcrumbs: Breadcrumb[] = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipos' },
    { label: 'Partes Diarios', url: '/equipos/daily-reports' },
    { label: 'Recepción' },
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
    // Default to current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    this.fechaDesde = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    this.fechaHasta = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    this.loadData();
  }

  loadData() {
    if (!this.fechaDesde || !this.fechaHasta) return;
    this.loading = true;
    this.reportService.getReceptionStatus(this.fechaDesde, this.fechaHasta).subscribe({
      next: (result: EquipmentReceptionStatus[]) => {
        this.data = result;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  getAverageReception(): number {
    if (this.data.length === 0) return 0;
    const sum = this.data.reduce((acc, d) => acc + d.porcentaje_recepcion, 0);
    return Math.round(sum / this.data.length);
  }

  getMissingCount(): number {
    return this.data.filter((d) => d.reportes_pendientes > 0).length;
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
}
