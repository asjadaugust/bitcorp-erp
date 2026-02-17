import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ValuationService } from '../../core/services/valuation.service';
import { Valuation } from '../../core/models/valuation.model';
import { ExcelExportService } from '../../core/services/excel-export.service';

import {
  AeroTableComponent,
  TableColumn,
} from '../../core/design-system/table/aero-table.component';
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
import { DropdownComponent } from '../../shared/components/dropdown/dropdown.component';

@Component({
  selector: 'app-valuation-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    DropdownComponent,
  ],
  template: `
    <app-page-layout
      title="Valorizaciones"
      icon="fa-file-invoice-dollar"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <button type="button" class="btn btn-secondary" (click)="openGenerationModal()">
          <i class="fa-solid fa-wand-magic-sparkles"></i> Generar
        </button>

        <button type="button" class="btn btn-primary" (click)="createValuation()">
          <i class="fa-solid fa-plus"></i> Nueva Valorización
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="valuations"
        [loading]="loading"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          contrato: contractTemplate,
          period: periodTemplate,
        }"
        (rowClick)="viewValuation($event)"
      >
      </aero-table>

      <!-- Custom Column Templates -->
      <ng-template #contractTemplate let-row>
        <div class="contract-info">
          <span class="contract-code">{{ row.contrato?.numero_contrato || 'N/A' }}</span>
          <span class="project-name">{{
            row.contrato?.nombre_proyecto || row.contrato?.proyecto?.nombre
          }}</span>
        </div>
      </ng-template>

      <ng-template #periodTemplate let-row>
        <div class="date-range">
          <span>{{ row.fechaInicio | date: 'dd/MM/yyyy' }}</span>
          <i class="fa-solid fa-arrow-right"></i>
          <span>{{ row.fechaFin | date: 'dd/MM/yyyy' }}</span>
        </div>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            type="button"
            class="btn-icon"
            (click)="viewValuation(row); $event.stopPropagation()"
            title="Ver Detalles"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            type="button"
            class="btn-icon"
            [disabled]="row.estado === 'ELIMINADO'"
            (click)="editValuation(row); $event.stopPropagation()"
            title="Editar"
          >
            <i class="fa-solid fa-pen"></i>
          </button>
          <button
            type="button"
            class="btn-icon"
            (click)="deleteValuation(row); $event.stopPropagation()"
            title="Eliminar"
          >
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>

    <!-- Generation Modal -->
    <div class="modal-overlay" *ngIf="showGenerationModal" (click)="closeGenerationModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Generar Valorizaciones</h3>
          <button class="close-btn" (click)="closeGenerationModal()">
            <i class="fa-solid fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>
            Selecciona el periodo para generar valorizaciones automáticas basadas en los partes
            diarios aprobados.
          </p>
          <div class="form-group">
            <label>Mes</label>
            <app-dropdown
              [options]="months"
              [(ngModel)]="selectedMonth"
              [placeholder]="'Seleccionar Mes'"
            ></app-dropdown>
          </div>
          <div class="form-group">
            <label>Año</label>
            <input type="number" [(ngModel)]="selectedYear" class="form-control" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeGenerationModal()">Cancelar</button>
          <button class="btn btn-primary" [disabled]="generating" (click)="confirmGeneration()">
            {{ generating ? 'Generando...' : 'Generar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .btn {
        padding: var(--s-8) var(--s-16);
        border: none;
        border-radius: var(--s-8);
        font-size: var(--type-bodySmall-size);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: var(--s-8);
        transition: all 0.2s ease;
      }
      .btn-primary {
        background: var(--primary-500);
        color: var(--neutral-0);
      }
      .btn-primary:hover {
        background: var(--primary-800);
      }
      .btn-secondary {
        background: var(--grey-200);
        color: var(--grey-700);
      }
      .btn-secondary:hover {
        background: var(--grey-300);
      }

      .contract-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .contract-code {
        font-weight: 600;
        color: var(--primary-800);
        font-family: monospace;
      }

      .project-name {
        font-size: 12px;
        color: var(--grey-500);
      }

      .date-range {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--grey-700);
      }

      .date-range i {
        font-size: 10px;
        color: var(--grey-400);
      }

      /* Modal Styles */
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      }

      .modal-content {
        background: white;
        border-radius: var(--radius-md);
        width: 100%;
        max-width: 400px;
        box-shadow: var(--shadow-lg);
      }

      .modal-header {
        padding: 16px 24px;
        border-bottom: 1px solid var(--grey-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .modal-header h3 {
        margin: 0;
        font-size: 18px;
        color: var(--grey-900);
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 20px;
        color: var(--grey-500);
        cursor: pointer;
        padding: 0;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .close-btn:hover {
        background: var(--grey-100);
      }

      .modal-body {
        padding: 24px;
      }

      .modal-footer {
        padding: 16px 24px;
        border-top: 1px solid var(--grey-200);
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .form-group {
        margin-bottom: 16px;
      }

      .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 500;
        color: var(--grey-700);
      }

      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid var(--grey-300);
        border-radius: var(--radius-sm);
      }
    `,
  ],
})
export class ValuationListComponent implements OnInit {
  valuationService = inject(ValuationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private excelService = inject(ExcelExportService);

  valuations: Valuation[] = [];
  loading = false;
  filters = { estado: '', search: '' };

  // Generation Modal State
  showGenerationModal = false;
  generating = false;
  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Equipos', url: '/equipment' },
    { label: 'Valorizaciones' },
  ];

  tabs: TabItem[] = [
    { label: 'Equipos', route: '/equipment', icon: 'fa-list' },
    { label: 'Partes Diarios', route: '/equipment/daily-reports', icon: 'fa-clipboard-list' },
    { label: 'Mantenimiento', route: '/equipment/maintenance', icon: 'fa-wrench' },
    { label: 'Programación', route: '/equipment/maintenance/schedule', icon: 'fa-calendar' },
    { label: 'Contratos', route: '/equipment/contracts', icon: 'fa-file-contract' },
    { label: 'Valorizaciones', route: '/equipment/valuations', icon: 'fa-dollar-sign' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por contrato, factura...',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Borrador', value: 'BORRADOR' },
        { label: 'Pendiente', value: 'PENDIENTE' },
        { label: 'En Revisión', value: 'EN_REVISION' },
        { label: 'Validado', value: 'VALIDADO' },
        { label: 'Aprobado', value: 'APROBADO' },
        { label: 'Rechazado', value: 'RECHAZADO' },
        { label: 'Pagado', value: 'PAGADO' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'contrato', label: 'Contrato', type: 'template' },
    { key: 'period', label: 'Periodo', type: 'template' },
    { key: 'numeroValorizacion', label: 'N° Valoriz.', type: 'text' },
    { key: 'totalValorizado', label: 'Total', type: 'currency', format: 'PEN', align: 'right' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        BORRADOR: {
          label: 'Borrador',
          class: 'status-badge status-draft',
          icon: 'fa-solid fa-file-pen',
        },
        PAGADO: {
          label: 'Pagado',
          class: 'status-badge status-paid',
          icon: 'fa-solid fa-check-circle',
        },
        APROBADO: {
          label: 'Aprobado',
          class: 'status-badge status-approved',
          icon: 'fa-solid fa-check',
        },
        VALIDADO: {
          label: 'Validado',
          class: 'status-badge status-validated',
          icon: 'fa-solid fa-clipboard-check',
        },
        EN_REVISION: {
          label: 'En Revisión',
          class: 'status-badge status-under_review',
          icon: 'fa-solid fa-file-signature',
        },
        PENDIENTE: {
          label: 'Pendiente',
          class: 'status-badge status-pending',
          icon: 'fa-solid fa-clock',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-rejected',
          icon: 'fa-solid fa-file-circle-xmark',
        },
        ELIMINADO: {
          label: 'Eliminado',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-trash',
        },
      },
    },
  ];

  ngOnInit(): void {
    this.loadValuations();
  }

  loadValuations(): void {
    this.loading = true;
    console.log('Loading valuations...');
    this.valuationService.getAll(this.filters).subscribe({
      next: (data) => {
        console.log('Valuations loaded:', data);
        this.valuations = [...data]; // Force new reference
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading valuations:', err);
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.search = filters['search'] || '';
    this.filters.estado = filters['estado'] || '';
    this.loadValuations();
  }

  viewValuation(val: Valuation): void {
    this.router.navigate([val.id], { relativeTo: this.route });
  }

  editValuation(val: Valuation): void {
    this.router.navigate([val.id, 'edit'], { relativeTo: this.route });
  }

  deleteValuation(val: Valuation): void {
    if (confirm('¿Está seguro de eliminar esta valorización?')) {
      this.loading = true;
      this.valuationService.delete(val.id).subscribe({
        next: () => {
          this.loadValuations();
        },
        error: (err) => {
          this.loading = false;
          alert('Error al eliminar: ' + err.message);
        },
      });
    }
  }

  createValuation(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  openGenerationModal(): void {
    this.showGenerationModal = true;
  }

  closeGenerationModal(): void {
    this.showGenerationModal = false;
  }

  confirmGeneration(): void {
    console.log('[DEBUG] confirmGeneration called', {
      month: this.selectedMonth,
      year: this.selectedYear,
    });
    if (this.selectedMonth === undefined || this.selectedYear === undefined) {
      console.warn('[DEBUG] confirmGeneration aborted: missing values');
      return;
    }
    this.generating = true;
    this.valuationService
      .generate({
        month: this.selectedMonth,
        year: this.selectedYear,
      })
      .subscribe({
        next: (res: any) => {
          console.log('[DEBUG] generation success', res);
          this.generating = false;
          this.closeGenerationModal();
          this.loadValuations();
          const count = Array.isArray(res) ? res.length : res?.data?.length || 0;
          alert(`Se generaron/actualizaron ${count} valorizaciones.`);
        },
        error: (err) => {
          this.generating = false;
          alert('Error al generar valorizaciones: ' + err.message);
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

  exportToExcel(): void {
    if (this.valuations.length === 0) {
      alert('No hay valorizaciones para exportar');
      return;
    }

    const exportData = this.valuations.map((val) => ({
      Contrato: val.contrato?.numero_contrato || 'N/A',
      Proyecto: val.contrato?.nombre_proyecto || 'N/A',
      'N° Valorización': val.numeroValorizacion || '',
      Periodo: val.periodo || '',
      'Fecha Inicio': val.fechaInicio ? new Date(val.fechaInicio).toLocaleDateString('es-PE') : '',
      'Fecha Fin': val.fechaFin ? new Date(val.fechaFin).toLocaleDateString('es-PE') : '',
      'Costo Base': val.costoBase || 0,
      'Costo Combustible': val.costoCombustible || 0,
      'Cargos Adicionales': val.cargosAdicionales || 0,
      'Total Valorizado': val.totalValorizado || 0,
      Estado: val.estado || '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'valorizaciones',
      sheetName: 'Valorizaciones',
    });
  }

  exportToCSV(): void {
    if (this.valuations.length === 0) {
      alert('No hay valorizaciones para exportar');
      return;
    }

    const exportData = this.valuations.map((val) => ({
      Contrato: val.contrato?.numero_contrato || 'N/A',
      Proyecto: val.contrato?.nombre_proyecto || 'N/A',
      'N° Valorización': val.numeroValorizacion || '',
      Periodo: val.periodo || '',
      'Fecha Inicio': val.fechaInicio ? new Date(val.fechaInicio).toLocaleDateString('es-PE') : '',
      'Fecha Fin': val.fechaFin ? new Date(val.fechaFin).toLocaleDateString('es-PE') : '',
      'Costo Base': val.costoBase || 0,
      'Costo Combustible': val.costoCombustible || 0,
      'Cargos Adicionales': val.cargosAdicionales || 0,
      'Total Valorizado': val.totalValorizado || 0,
      Estado: val.estado || '',
    }));

    this.excelService.exportToCSV(exportData, 'valorizaciones');
  }
}
