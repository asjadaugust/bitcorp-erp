import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ChecklistService } from '../../../core/services/checklist.service';
import { ChecklistInspection } from '../../../core/models/checklist.model';
import {
  AeroTableComponent,
  TableColumn,
} from '../../../core/design-system/table/aero-table.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../../shared/components/filter-bar/filter-bar.component';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';

@Component({
  selector: 'app-inspection-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AeroTableComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
  ],
  template: `
    <app-page-layout
      title="Inspecciones de Checklist"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"></app-export-dropdown>
        <button class="btn btn-primary" (click)="createInspection()">
          <i class="fa-solid fa-plus"></i> Nueva Inspección
        </button>
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-table
        [columns]="columns"
        [data]="inspections"
        [loading]="loading"
        [serverSide]="true"
        [totalItems]="pagination.total"
        (pageChange)="onPageChange($event)"
        (pageSizeChange)="onPageSizeChange($event)"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          equipo: equipoTemplate,
          trabajador: trabajadorTemplate,
          progreso: progresoTemplate,
          estado: estadoTemplate,
          resultado: resultadoTemplate,
        }"
        (rowClick)="viewInspection($event)"
      >
      </aero-table>

      <!-- Custom Templates -->
      <ng-template #equipoTemplate let-row>
        <div class="equipment-info" *ngIf="row.equipo">
          <span class="equip-code">{{ row.equipo.codigo || 'N/A' }}</span>
          <span class="equip-model">{{ row.equipo.modelo || '' }}</span>
        </div>
        <span *ngIf="!row.equipo">-</span>
      </ng-template>

      <ng-template #trabajadorTemplate let-row>
        <div class="worker-info" *ngIf="row.trabajador">
          <span class="worker-name">{{ row.trabajador.nombre }} {{ row.trabajador.apellido }}</span>
        </div>
        <span *ngIf="!row.trabajador">-</span>
      </ng-template>

      <ng-template #progresoTemplate let-row>
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getProgressPercent(row)"></div>
          </div>
          <span class="progress-text">
            {{ (row.itemsConforme || 0) + (row.itemsNoConforme || 0) }} / {{ row.itemsTotal || 0 }}
          </span>
        </div>
      </ng-template>

      <ng-template #estadoTemplate let-row>
        <span class="badge" [ngClass]="getEstadoClass(row.estado)">
          {{ getEstadoLabel(row.estado) }}
        </span>
      </ng-template>

      <ng-template #resultadoTemplate let-row>
        <span
          class="badge"
          [ngClass]="getResultadoClass(row.resultadoGeneral)"
          *ngIf="row.resultadoGeneral"
        >
          {{ getResultadoLabel(row.resultadoGeneral) }}
        </span>
        <span *ngIf="!row.resultadoGeneral">-</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <button
            class="btn-icon"
            (click)="continueInspection(row); $event.stopPropagation()"
            title="Continuar Inspección"
            *ngIf="row.estado === 'EN_PROGRESO'"
          >
            <i class="fa-solid fa-play"></i>
          </button>
          <button
            class="btn-icon"
            (click)="viewInspection(row); $event.stopPropagation()"
            title="Ver Resultados"
          >
            <i class="fa-solid fa-eye"></i>
          </button>
          <button
            class="btn-icon"
            (click)="exportPDF(row); $event.stopPropagation()"
            title="Exportar PDF"
            *ngIf="row.estado === 'COMPLETADO'"
          >
            <i class="fa-solid fa-file-pdf"></i>
          </button>
          <button
            class="btn-icon btn-danger"
            (click)="cancelInspection(row); $event.stopPropagation()"
            title="Cancelar"
            *ngIf="row.estado === 'EN_PROGRESO'"
          >
            <i class="fa-solid fa-ban"></i>
          </button>
        </div>
      </ng-template>
    </app-page-layout>
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

      .equipment-info,
      .worker-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .equip-code,
      .worker-name {
        font-weight: 600;
        color: var(--primary-800);
      }

      .equip-model {
        font-size: 12px;
        color: var(--grey-500);
      }

      .progress-container {
        display: flex;
        flex-direction: column;
        gap: var(--s-4);
      }

      .progress-bar {
        width: 100px;
        height: 8px;
        background: var(--grey-200);
        border-radius: 4px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: var(--primary-500);
        transition: width 0.3s ease;
      }

      .progress-text {
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 600;
      }

      .badge {
        padding: var(--s-4) var(--s-8);
        border-radius: var(--s-4);
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        white-space: nowrap;
      }

      /* Estado badges */
      .estado-en-progreso {
        background: var(--info-100);
        color: var(--info-800);
      }

      .estado-completado {
        background: var(--success-100);
        color: var(--success-800);
      }

      .estado-rechazado {
        background: var(--error-100);
        color: var(--error-800);
      }

      .estado-cancelado {
        background: var(--grey-200);
        color: var(--grey-600);
      }

      /* Resultado badges */
      .resultado-aprobado {
        background: var(--success-100);
        color: var(--success-800);
      }

      .resultado-con-observaciones {
        background: var(--warning-100);
        color: var(--warning-800);
      }

      .resultado-rechazado {
        background: var(--error-100);
        color: var(--error-800);
      }

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }

      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px 8px;
        color: var(--grey-500);
        transition: all 0.2s;
      }

      .btn-icon:hover {
        background: var(--primary-100);
        color: var(--primary-500);
        border-radius: var(--s-4);
      }

      .btn-icon.btn-danger:hover {
        background: var(--error-100);
        color: var(--error-500);
      }

      /* Server-side pagination */
      .server-pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--s-16);
        background: var(--neutral-0);
        border-top: 1px solid var(--grey-200);
        margin-top: var(--s-16);
        border-radius: var(--s-8);
      }

      .pagination-info {
        font-size: 14px;
        color: var(--grey-700);
      }

      .pagination-controls {
        display: flex;
        gap: var(--s-8);
        align-items: center;
      }

      .btn-pagination {
        padding: var(--s-8);
        border: 1px solid var(--grey-300);
        background: var(--neutral-0);
        border-radius: var(--s-4);
        cursor: pointer;
        transition: all 0.2s;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .btn-pagination:hover:not(:disabled) {
        background: var(--primary-100);
        border-color: var(--primary-500);
        color: var(--primary-500);
      }

      .btn-pagination:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .page-indicator {
        padding: 0 var(--s-12);
        font-weight: 600;
        color: var(--grey-800);
      }
    `,
  ],
})
export class InspectionListComponent implements OnInit {
  checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  inspections: ChecklistInspection[] = [];
  loading = false;
  pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  filters = {
    page: 1,
    limit: 10,
    equipoId: undefined as number | undefined,
    trabajadorId: undefined as number | undefined,
    estado: '',
    resultadoGeneral: '',
    fechaDesde: '',
    fechaHasta: '',
  };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Listas de Verificación', url: '/checklists' },
    { label: 'Inspecciones' },
  ];

  tabs: TabItem[] = [
    { label: 'Plantillas', route: '/checklists/templates', icon: 'fa-clipboard-list' },
    { label: 'Inspecciones', route: '/checklists/inspections', icon: 'fa-clipboard-check' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'fechaDesde',
      label: 'Fecha Desde',
      type: 'date',
    },
    {
      key: 'fechaHasta',
      label: 'Fecha Hasta',
      type: 'date',
    },
    {
      key: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'EN_PROGRESO', label: 'En Progreso' },
        { value: 'COMPLETADO', label: 'Completado' },
        { value: 'RECHAZADO', label: 'Rechazado' },
        { value: 'CANCELADO', label: 'Cancelado' },
      ],
    },
    {
      key: 'resultadoGeneral',
      label: 'Resultado',
      type: 'select',
      options: [
        { value: '', label: 'Todos' },
        { value: 'APROBADO', label: 'Aprobado' },
        { value: 'APROBADO_CON_OBSERVACIONES', label: 'Con Observaciones' },
        { value: 'RECHAZADO', label: 'Rechazado' },
      ],
    },
  ];

  columns: TableColumn[] = [
    { key: 'codigo', label: 'Código', type: 'text' },
    { key: 'fechaInspeccion', label: 'Fecha', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'equipo', label: 'Equipo', type: 'template' },
    { key: 'trabajador', label: 'Inspector', type: 'template' },
    { key: 'progreso', label: 'Progreso', type: 'template' },
    { key: 'estado', label: 'Estado', type: 'template' },
    { key: 'resultado', label: 'Resultado', type: 'template' },
  ];

  ngOnInit(): void {
    this.loadInspections();
  }

  loadInspections(): void {
    this.loading = true;
    this.checklistService.getAllInspections(this.filters).subscribe({
      next: (response) => {
        this.inspections = response.data;
        this.pagination = response.pagination;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading inspections:', error);
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, any>): void {
    this.filters.fechaDesde = filters['fechaDesde'] || '';
    this.filters.fechaHasta = filters['fechaHasta'] || '';
    this.filters.estado = filters['estado'] || '';
    this.filters.resultadoGeneral = filters['resultadoGeneral'] || '';
    this.filters.page = 1; // Reset to first page on filter change
    this.loadInspections();
  }

  onPageChange(page: number): void {
    this.filters.page = page;
    this.loadInspections();
  }

  onPageSizeChange(size: number): void {
    this.filters.limit = size;
    this.filters.page = 1;
    this.loadInspections();
  }

  getProgressPercent(inspection: ChecklistInspection): number {
    const completed = (inspection.itemsConforme || 0) + (inspection.itemsNoConforme || 0);
    const total = inspection.itemsTotal || 1;
    return (completed / total) * 100;
  }

  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      EN_PROGRESO: 'En Progreso',
      COMPLETADO: 'Completado',
      RECHAZADO: 'Rechazado',
      CANCELADO: 'Cancelado',
    };
    return labels[estado] || estado;
  }

  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      EN_PROGRESO: 'estado-en-progreso',
      COMPLETADO: 'estado-completado',
      RECHAZADO: 'estado-rechazado',
      CANCELADO: 'estado-cancelado',
    };
    return classes[estado] || '';
  }

  getResultadoLabel(resultado: string): string {
    const labels: Record<string, string> = {
      APROBADO: 'Aprobado',
      APROBADO_CON_OBSERVACIONES: 'Con Observaciones',
      RECHAZADO: 'Rechazado',
    };
    return labels[resultado] || resultado;
  }

  getResultadoClass(resultado: string): string {
    const classes: Record<string, string> = {
      APROBADO: 'resultado-aprobado',
      APROBADO_CON_OBSERVACIONES: 'resultado-con-observaciones',
      RECHAZADO: 'resultado-rechazado',
    };
    return classes[resultado] || '';
  }

  viewInspection(inspection: ChecklistInspection): void {
    this.router.navigate([inspection.id], { relativeTo: this.route });
  }

  continueInspection(inspection: ChecklistInspection): void {
    this.router.navigate([inspection.id, 'execute'], { relativeTo: this.route });
  }

  createInspection(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  exportPDF(inspection: ChecklistInspection): void {
    const token = localStorage.getItem('access_token');
    if (!token) {
      alert('No se encontró token de autenticación');
      return;
    }

    // Create a temporary link to download the PDF
    const url = `${this.checklistService['apiUrl']}/inspections/${inspection.id}/export-pdf`;

    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inspeccion-${inspection.codigo}.pdf`);

    // Add authorization header by fetching with credentials
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Error al generar el PDF');
        }
        return response.blob();
      })
      .then((blob) => {
        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(blob);
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Error exporting PDF:', error);
        alert('Error al exportar el PDF. Por favor intente nuevamente.');
      });
  }

  cancelInspection(inspection: ChecklistInspection): void {
    if (confirm(`¿Está seguro de cancelar la inspección ${inspection.codigo}?`)) {
      this.checklistService.cancelInspection(inspection.id).subscribe({
        next: () => {
          this.loadInspections();
        },
        error: (error) => {
          console.error('Error canceling inspection:', error);
          alert('Error al cancelar la inspección');
        },
      });
    }
  }

  handleExport(format: ExportFormat): void {
    console.log('Export format:', format);
    alert('Función de exportación en desarrollo');
  }
}
