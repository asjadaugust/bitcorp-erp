import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OperatorService } from '../../../core/services/operator.service';
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
    <div class="container-fluid">
      <div class="page-header">
        <h1>📅 Disponibilidad de Operadores</h1>
        <div class="header-actions">
          <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

          <button type="button" class="btn btn-secondary">
            <i class="fa-solid fa-users"></i> Ver Operadores
          </button>
        </div>
      </div>

      <div class="card">
        <div class="calendar-header">
          <button class="btn-icon" (click)="prevMonth()">
            <i class="fa-solid fa-chevron-left"></i>
          </button>
          <h2>{{ currentMonthName }} {{ currentYear }}</h2>
          <button class="btn-icon" (click)="nextMonth()">
            <i class="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        <div class="availability-grid">
          <!-- Header Row -->
          <div class="grid-header">Operador</div>
          <div class="grid-header" *ngFor="let day of daysInMonth">{{ day }}</div>

          <!-- Operator Rows -->
          <ng-container *ngFor="let op of operators">
            <div class="operator-name">{{ op.C05000_Nombre }} {{ op.C05000_Apellido }}</div>
            <div
              *ngFor="let day of daysInMonth"
              class="day-cell"
              [class.available]="isAvailable(op.id, day)"
              [class.unavailable]="!isAvailable(op.id, day)"
              (click)="toggleAvailability(op.id, day)"
            ></div>
          </ng-container>
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
        margin-bottom: 2rem;
      }

      .card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      }

      .calendar-header {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
      }
      .calendar-header h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #2d3748;
      }

      .availability-grid {
        display: grid;
        grid-template-columns: 200px repeat(auto-fit, minmax(30px, 1fr));
        gap: 1px;
        background: #e2e8f0;
        border: 1px solid #e2e8f0;
        overflow-x: auto;
      }

      .grid-header {
        background: #f7fafc;
        padding: 0.75rem;
        font-weight: 600;
        text-align: center;
        position: sticky;
        top: 0;
      }

      .operator-name {
        background: white;
        padding: 0.75rem;
        font-weight: 500;
        border-right: 1px solid #e2e8f0;
      }

      .day-cell {
        background: white;
        height: 40px;
        cursor: pointer;
        transition: background 0.2s;
      }

      .day-cell:hover {
        background: #edf2f7;
      }
      .day-cell.available {
        background: #c6f6d5;
      }
      .day-cell.unavailable {
        background: #fed7d7;
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
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #4a5568;
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        color: #4a5568;
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
  operators: any[] = [];
  availabilityMap = new Map<string, boolean>(); // key: "opId-day"

  ngOnInit() {
    this.updateCalendar();
    this.loadOperators();
  }

  updateCalendar() {
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonthName = this.currentDate.toLocaleString('es-ES', { month: 'long' });
    this.currentMonthName =
      this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    const days = new Date(this.currentYear, this.currentDate.getMonth() + 1, 0).getDate();
    this.daysInMonth = Array.from({ length: days }, (_, i) => i + 1);
  }

  loadOperators() {
    this.operatorService.getAll().subscribe((ops) => {
      this.operators = ops;
      // Mock availability for now
      this.operators.forEach((op) => {
        this.daysInMonth.forEach((day) => {
          this.availabilityMap.set(`${op.id}-${day}`, Math.random() > 0.2);
        });
      });
    });
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateCalendar();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateCalendar();
  }

  isAvailable(opId: number, day: number): boolean {
    return this.availabilityMap.get(`${opId}-${day}`) ?? true;
  }

  toggleAvailability(opId: number, day: number) {
    const key = `${opId}-${day}`;
    const current = this.availabilityMap.get(key);
    this.availabilityMap.set(key, !current);
    // TODO: Call API to save availability
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.operators.length === 0) {
      alert('No hay disponibilidad de operadores para exportar');
      return;
    }

    const exportData: any[] = [];
    this.operators.forEach((op) => {
      const row: any = {
        Operador: `${op.C05000_Nombre} ${op.C05000_Apellido}`,
        ID: op.id,
      };
      this.daysInMonth.forEach((day) => {
        row[`Día ${day}`] = this.isAvailable(op.id, day) ? 'Disponible' : 'No Disponible';
      });
      exportData.push(row);
    });

    this.excelService.exportToExcel(exportData, {
      filename: `disponibilidad-operadores-${this.currentMonthName}-${this.currentYear}`,
      sheetName: 'Disponibilidad',
    });
  }

  exportToCSV(): void {
    if (this.operators.length === 0) {
      alert('No hay disponibilidad de operadores para exportar');
      return;
    }

    const exportData: any[] = [];
    this.operators.forEach((op) => {
      const row: any = {
        Operador: `${op.C05000_Nombre} ${op.C05000_Apellido}`,
        ID: op.id,
      };
      this.daysInMonth.forEach((day) => {
        row[`Día ${day}`] = this.isAvailable(op.id, day) ? 'Disponible' : 'No Disponible';
      });
      exportData.push(row);
    });

    this.excelService.exportToCSV(
      exportData,
      `disponibilidad-operadores-${this.currentMonthName}-${this.currentYear}`
    );
  }
}
