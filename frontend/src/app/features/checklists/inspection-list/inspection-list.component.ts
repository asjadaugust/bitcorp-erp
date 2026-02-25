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
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { PageCardComponent } from '../../../shared/components/page-card/page-card.component';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    ButtonComponent,
    PageCardComponent,
  ],
  template: `
    <app-page-layout
      title="Inspecciones de Checklist"
      icon="fa-clipboard-check"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <div actions class="action-buttons-header">
        <app-export-dropdown (export)="handleExport($event)"></app-export-dropdown>
        <app-button
          variant="primary"
          icon="fa-plus"
          label="Nueva Inspección"
          (clicked)="createInspection()"
        ></app-button>
      </div>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <app-page-card [noPadding]="true">
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
          }"
          (rowClick)="viewInspection($event)"
        >
        </aero-table>
      </app-page-card>

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

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <app-button
            variant="icon"
            size="sm"
            icon="fa-play"
            (clicked)="continueInspection(row); $event.stopPropagation()"
            *ngIf="row.estado === 'EN_PROGRESO'"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-eye"
            (clicked)="viewInspection(row); $event.stopPropagation()"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-file-pdf"
            (clicked)="exportPDF(row); $event.stopPropagation()"
            *ngIf="row.estado === 'COMPLETADO'"
          ></app-button>
          <app-button
            variant="icon"
            size="sm"
            icon="fa-ban"
            (clicked)="cancelInspection(row); $event.stopPropagation()"
            *ngIf="row.estado === 'EN_PROGRESO'"
          ></app-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .action-buttons-header {
        display: flex;
        gap: var(--s-12);
        align-items: center;
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

      .action-buttons {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    `,
  ],
})
export class InspectionListComponent implements OnInit {
  private checklistService = inject(ChecklistService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

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
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        EN_PROGRESO: {
          label: 'En Progreso',
          class: 'status-badge status-in-progress',
          icon: 'fa-solid fa-spinner',
        },
        COMPLETADO: {
          label: 'Completado',
          class: 'status-badge status-completed',
          icon: 'fa-solid fa-check',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-rejected',
          icon: 'fa-solid fa-xmark',
        },
        CANCELADO: {
          label: 'Cancelado',
          class: 'status-badge status-cancelled',
          icon: 'fa-solid fa-ban',
        },
      },
    },
    {
      key: 'resultadoGeneral',
      label: 'Resultado',
      type: 'badge',
      badgeConfig: {
        APROBADO: {
          label: 'Aprobado',
          class: 'status-badge status-approved',
          icon: 'fa-solid fa-check-double',
        },
        APROBADO_CON_OBSERVACIONES: {
          label: 'Con Observaciones',
          class: 'status-badge status-warning',
          icon: 'fa-solid fa-triangle-exclamation',
        },
        RECHAZADO: {
          label: 'Rechazado',
          class: 'status-badge status-rejected',
          icon: 'fa-solid fa-xmark',
        },
      },
    },
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

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.fechaDesde = (filters['fechaDesde'] as string) || '';
    this.filters.fechaHasta = (filters['fechaHasta'] as string) || '';
    this.filters.estado = (filters['estado'] as string) || '';
    this.filters.resultadoGeneral = (filters['resultadoGeneral'] as string) || '';
    this.filters.page = 1;
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
      this.snackBar.open('No se encontró token de autenticación', 'Cerrar', { duration: 3000 });
      return;
    }

    const url = `${this.checklistService['apiUrl']}/inspections/${inspection.id}/export-pdf`;

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
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `inspeccion-${inspection.codigo}.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch((error) => {
        console.error('Error exporting PDF:', error);
        this.snackBar.open('Error al exportar el PDF', 'Cerrar', { duration: 3000 });
      });
  }

  cancelInspection(inspection: ChecklistInspection): void {
    this.confirmSvc.confirmDelete(`la inspección ${inspection.codigo}`).subscribe((confirmed) => {
      if (confirmed) {
        this.checklistService.cancelInspection(inspection.id).subscribe({
          next: () => {
            this.snackBar.open('Inspección cancelada correctamente', 'Cerrar', {
              duration: 3000,
            });
            this.loadInspections();
          },
          error: (error) => {
            console.error('Error canceling inspection:', error);
            this.snackBar.open('Error al cancelar la inspección', 'Cerrar', { duration: 3000 });
          },
        });
      }
    });
  }

  handleExport(format: ExportFormat): void {
    this.snackBar.open('Función de exportación en desarrollo', 'Cerrar', { duration: 3000 });
  }
}
