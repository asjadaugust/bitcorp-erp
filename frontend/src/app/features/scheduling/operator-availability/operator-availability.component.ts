import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService } from '../../../core/services/operator.service';
import { Operator, DisponibilidadProgramada } from '../../../core/models/operator.model';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../shared/components/export-dropdown/export-dropdown.component';

@Component({
  selector: 'app-operator-availability',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ExportDropdownComponent],
  template: `
    <div class="container-fluid" data-testid="operator-availability">
      <div class="page-header">
        <h1>📅 Disponibilidad de Operadores</h1>
        <div class="header-actions">
          <app-export-dropdown (export)="handleExport($event)"></app-export-dropdown>
          <a routerLink="/operators" class="btn btn-secondary" data-testid="btn-ver-operadores">
            👥 Ver Operadores
          </a>
        </div>
      </div>

      <!-- Month Navigation -->
      <div class="calendar-nav" data-testid="calendar-nav">
        <button
          class="btn-icon"
          (click)="prevMonth()"
          data-testid="btn-prev-month"
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <h2 data-testid="month-label">{{ currentMonthName }} {{ currentYear }}</h2>
        <button
          class="btn-icon"
          (click)="nextMonth()"
          data-testid="btn-next-month"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state" data-testid="loading-state">
        <p>Cargando disponibilidad...</p>
      </div>

      <!-- Legend -->
      <div *ngIf="!loading" class="legend" data-testid="legend">
        <span class="legend-item available">● Disponible</span>
        <span class="legend-item unavailable">● No disponible</span>
        <span class="legend-item saving" *ngIf="savingCount > 0">Guardando...</span>
      </div>

      <!-- Availability Grid -->
      <div class="card" *ngIf="!loading">
        <div
          class="availability-grid"
          data-testid="availability-grid"
          [style.grid-template-columns]="
            '200px repeat(' + daysInMonth.length + ', minmax(28px, 1fr))'
          "
        >
          <!-- Header Row -->
          <div class="grid-header grid-header--operator">Operador</div>
          <div
            class="grid-header"
            *ngFor="let day of daysInMonth"
            [attr.data-testid]="'day-header-' + day"
          >
            {{ day }}
          </div>

          <!-- Operator Rows -->
          <ng-container *ngFor="let op of operators; let i = index">
            <div class="operator-name" [attr.data-testid]="'operator-row-' + op.id">
              {{ op.nombres }} {{ op.apellido_paterno }}
            </div>
            <div
              *ngFor="let day of daysInMonth"
              class="day-cell"
              [class.available]="isAvailable(op.id, day)"
              [class.unavailable]="!isAvailable(op.id, day)"
              [class.saving]="isSaving(op.id, day)"
              (click)="toggleAvailability(op, day)"
              (keydown.enter)="toggleAvailability(op, day)"
              tabindex="0"
              role="gridcell"
              [attr.aria-label]="
                'Disponibilidad ' +
                op.nombres +
                ' día ' +
                day +
                ': ' +
                (isAvailable(op.id, day) ? 'disponible' : 'no disponible')
              "
              [attr.data-testid]="'day-cell-' + op.id + '-' + day"
            ></div>
          </ng-container>
        </div>

        <!-- Empty State -->
        <div *ngIf="operators.length === 0" class="empty-state" data-testid="empty-state">
          No se encontraron operadores activos.
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .container-fluid {
        padding: 2rem;
        max-width: 1400px;
        margin: 0 auto;
      }
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #072b45;
      }
      .header-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .calendar-nav {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        margin-bottom: 1.5rem;
      }
      .calendar-nav h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #2d3748;
        min-width: 200px;
        text-align: center;
      }

      .loading-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 12px;
        color: #6b7280;
      }

      .legend {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
        padding: 0 0.25rem;
      }
      .legend-item {
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .legend-item.available {
        color: #059669;
      }
      .legend-item.unavailable {
        color: #dc2626;
      }
      .legend-item.saving {
        color: #d97706;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        overflow-x: auto;
      }

      .availability-grid {
        display: grid;
        gap: 1px;
        background: #e2e8f0;
        border: 1px solid #e2e8f0;
        min-width: 600px;
      }

      .grid-header {
        background: #f7fafc;
        padding: 0.5rem 0.25rem;
        font-weight: 600;
        text-align: center;
        font-size: 12px;
        color: #4a5568;
      }
      .grid-header--operator {
        text-align: left;
        padding: 0.5rem 0.75rem;
      }

      .operator-name {
        background: white;
        padding: 0.5rem 0.75rem;
        font-size: 13px;
        font-weight: 500;
        color: #2d3748;
        border-right: 1px solid #e2e8f0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .day-cell {
        background: white;
        height: 36px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .day-cell:hover {
        filter: brightness(0.95);
      }
      .day-cell.available {
        background: #c6f6d5;
      }
      .day-cell.unavailable {
        background: #fed7d7;
      }
      .day-cell.saving {
        opacity: 0.5;
        cursor: wait;
      }

      .empty-state {
        text-align: center;
        padding: 2rem;
        color: #9ca3af;
      }

      .btn {
        padding: 0.5rem 1rem;
        border-radius: 6px;
        font-weight: 600;
        border: none;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        font-size: 14px;
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }
      .btn-secondary:hover {
        background: #cbd5e0;
      }
      .btn-icon {
        background: none;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        cursor: pointer;
        font-size: 1.4rem;
        color: #4a5568;
        padding: 0.25rem 0.75rem;
        line-height: 1;
      }
      .btn-icon:hover {
        background: #f7fafc;
      }
    `,
  ],
})
export class OperatorAvailabilityComponent implements OnInit {
  private operatorService = inject(OperatorService);
  private excelService = inject(ExcelExportService);

  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;
  daysInMonth: number[] = [];
  operators: Operator[] = [];
  loading = true;

  // Map key: "opId-day" → boolean (true = disponible)
  availabilityMap = new Map<string, boolean>();
  // Set of keys currently being saved: "opId-day"
  savingKeys = new Set<string>();

  get savingCount(): number {
    return this.savingKeys.size;
  }

  ngOnInit() {
    this.updateCalendar();
    this.loadData();
  }

  private getMesAnio(): string {
    const y = this.currentDate.getFullYear();
    const m = String(this.currentDate.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  updateCalendar() {
    this.currentYear = this.currentDate.getFullYear();
    const name = this.currentDate.toLocaleString('es-ES', { month: 'long' });
    this.currentMonthName = name.charAt(0).toUpperCase() + name.slice(1);
    const days = new Date(this.currentYear, this.currentDate.getMonth() + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  loadData() {
    this.loading = true;
    this.availabilityMap.clear();

    // Load operators list first
    this.operatorService.getAll().subscribe({
      next: (ops) => {
        this.operators = ops;
        // Default all cells to disponible = true
        ops.forEach((op) => {
          this.daysInMonth.forEach((day) => {
            this.availabilityMap.set(`${op.id}-${day}`, true);
          });
        });
        // Then load saved programacion for this month
        this.operatorService.getProgramacionMensual(this.getMesAnio()).subscribe({
          next: (records: DisponibilidadProgramada[]) => {
            records.forEach((r) => {
              const day = parseInt(r.fecha.split('-')[2], 10);
              this.availabilityMap.set(`${r.trabajador_id}-${day}`, r.disponible);
            });
            this.loading = false;
          },
          error: () => {
            // Non-fatal: just show defaults
            this.loading = false;
          },
        });
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateCalendar();
    this.loadData();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateCalendar();
    this.loadData();
  }

  isAvailable(opId: number, day: number): boolean {
    return this.availabilityMap.get(`${opId}-${day}`) ?? true;
  }

  isSaving(opId: number, day: number): boolean {
    return this.savingKeys.has(`${opId}-${day}`);
  }

  toggleAvailability(op: Operator, day: number) {
    const key = `${op.id}-${day}`;
    if (this.savingKeys.has(key)) return; // Prevent double-click during save

    const current = this.availabilityMap.get(key) ?? true;
    const newValue = !current;

    // Optimistic update
    this.availabilityMap.set(key, newValue);
    this.savingKeys.add(key);

    // Build the fecha string: YYYY-MM-DD
    const y = this.currentDate.getFullYear();
    const m = String(this.currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const fecha = `${y}-${m}-${d}`;

    this.operatorService.setDisponibilidad(op.id, fecha, newValue).subscribe({
      next: () => {
        this.savingKeys.delete(key);
      },
      error: () => {
        // Revert on error
        this.availabilityMap.set(key, current);
        this.savingKeys.delete(key);
      },
    });
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  private buildExportData(): Record<string, string | number>[] {
    return this.operators.map((op) => {
      const row: Record<string, string | number> = {
        Operador: `${op.nombres || ''} ${op.apellido_paterno || ''}`.trim(),
        ID: op.id,
      };
      this.daysInMonth.forEach((day) => {
        row[`Día ${day}`] = this.isAvailable(op.id, day) ? 'Disponible' : 'No Disponible';
      });
      return row;
    });
  }

  exportToExcel(): void {
    if (this.operators.length === 0) return;
    this.excelService.exportToExcel(this.buildExportData(), {
      filename: `disponibilidad-operadores-${this.currentMonthName}-${this.currentYear}`,
      sheetName: 'Disponibilidad',
    });
  }

  exportToCSV(): void {
    if (this.operators.length === 0) return;
    this.excelService.exportToCSV(
      this.buildExportData(),
      `disponibilidad-operadores-${this.currentMonthName}-${this.currentYear}`
    );
  }
}
