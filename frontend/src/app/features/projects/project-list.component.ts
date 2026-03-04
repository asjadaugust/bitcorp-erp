import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { Project } from '../../core/models/project.model';
import {
  AeroDataGridComponent,
  DataGridColumn,
} from '../../core/design-system/data-grid/aero-data-grid.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../shared/components/page-layout/page-layout.component';
import {
  FilterBarComponent,
  FilterConfig,
} from '../../shared/components/filter-bar/filter-bar.component';
import { ExcelExportService } from '../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../shared/components/export-dropdown/export-dropdown.component';
import { ActionsContainerComponent } from '../../shared/components/actions-container/actions-container.component';
import { ConfirmService } from '../../core/services/confirm.service';
import { AeroButtonComponent } from '../../core/design-system';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    AeroDataGridComponent,
    PageLayoutComponent,
    FilterBarComponent,
    ExportDropdownComponent,
    ActionsContainerComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Proyectos"
      icon="fa-folder-open"
      [breadcrumbs]="breadcrumbs"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown [disabled]="projects.length === 0" (export)="handleExport($event)">
        </app-export-dropdown>

        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createProject()"
          >Nuevo Proyecto</aero-button
        >
      </app-actions-container>

      <app-filter-bar
        [config]="filterConfig"
        (filterChange)="onFilterChange($event)"
      ></app-filter-bar>

      <aero-data-grid
        [columns]="columns"
        [data]="projects"
        [loading]="loading"
        [dense]="true"
        [showColumnChooser]="true"
        [actionsTemplate]="actionsTemplate"
        [templates]="{
          code: codeTemplate,
          project: projectTemplate,
          dates: datesTemplate,
        }"
        (rowClick)="viewProject($event)"
      >
      </aero-data-grid>

      <!-- Custom Templates -->
      <ng-template #codeTemplate let-row>
        <span class="code-badge">{{ row.codigo }}</span>
      </ng-template>

      <ng-template #projectTemplate let-row>
        <div class="project-info">
          <span class="project-name">{{ row.nombre }}</span>
          <span class="project-desc" *ngIf="row.descripcion">{{ row.descripcion }}</span>
        </div>
      </ng-template>

      <ng-template #datesTemplate let-row>
        <div class="date-range" *ngIf="row.fechaInicio && row.fechaFin">
          <span>{{ row.fechaInicio | date: 'dd/MM/yyyy' }}</span>
          <i class="fa-solid fa-arrow-right"></i>
          <span>{{ row.fechaFin | date: 'dd/MM/yyyy' }}</span>
        </div>
        <span *ngIf="!row.fechaInicio || !row.fechaFin">-</span>
      </ng-template>

      <!-- Actions Template -->
      <ng-template #actionsTemplate let-row>
        <div class="action-buttons">
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-eye"
            title="Ver Detalles"
            (clicked)="viewProject(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-pen"
            title="Editar"
            (clicked)="editProject(row); $event.stopPropagation()"
          ></aero-button>
          <aero-button
            variant="ghost"
            size="small"
            iconCenter="fa-trash"
            title="Eliminar"
            (clicked)="deleteProject(row); $event.stopPropagation()"
          ></aero-button>
        </div>
      </ng-template>
    </app-page-layout>
  `,
  styles: [
    `
      .code-badge {
        font-family: monospace;
        background: var(--grey-100);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        color: var(--grey-700);
        font-weight: 600;
      }

      .project-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .project-name {
        font-weight: 600;
        color: var(--primary-800);
      }

      .project-desc {
        font-size: 12px;
        color: var(--grey-500);
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
    `,
  ],
})
export class ProjectListComponent implements OnInit {
  projectService = inject(ProjectService);
  private excelService = inject(ExcelExportService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private confirmSvc = inject(ConfirmService);

  projects: Project[] = [];
  loading = false;
  filters = { status: '', search: '' };

  breadcrumbs = [
    { label: 'Inicio', url: '/app' },
    { label: 'Operaciones', url: '/operaciones' },
    { label: 'Proyectos' },
  ];

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  filterConfig: FilterConfig[] = [
    {
      key: 'search',
      label: 'Buscar',
      type: 'text',
      placeholder: 'Buscar por código, nombre...',
    },
    {
      key: 'dateRange',
      label: 'Duración Proyecto',
      type: 'dateRange',
    },
    {
      key: 'cliente',
      label: 'Cliente',
      type: 'text',
      placeholder: 'Ej. Minera Yanacocha',
    },
    {
      key: 'status',
      label: 'Estado',
      type: 'select',
      options: [
        { label: 'Planificación', value: 'PLANIFICACION' },
        { label: 'Activo', value: 'ACTIVO' },
        { label: 'Pausado', value: 'PAUSADO' },
        { label: 'Completado', value: 'COMPLETADO' },
        { label: 'Cancelado', value: 'CANCELADO' },
      ],
    },
  ];

  columns: DataGridColumn[] = [
    { key: 'code', label: 'Codigo', type: 'template', sortable: true },
    { key: 'project', label: 'Nombre del Proyecto', type: 'template', sortable: true },
    { key: 'cliente', label: 'Cliente', type: 'text', sortable: true },
    { key: 'ubicacion', label: 'Ubicacion', type: 'text', sortable: true },
    { key: 'dates', label: 'Fechas', type: 'template' },
    { key: 'presupuesto', label: 'Presupuesto', type: 'currency', format: 'PEN', sortable: true },
    { key: 'responsable', label: 'Responsable', type: 'text', hidden: true },
    { key: 'tipo_proyecto', label: 'Tipo Proyecto', type: 'text', hidden: true },
    { key: 'avance', label: 'Avance %', type: 'number', hidden: true },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeConfig: {
        PLANIFICACION: {
          label: 'Planificación',
          class: 'status-badge status-on-hold',
          icon: 'fa-compass-drafting',
        },
        ACTIVO: { label: 'Activo', class: 'status-badge status-active', icon: 'fa-play' },
        PAUSADO: { label: 'Pausado', class: 'status-badge status-on-hold', icon: 'fa-pause' },
        COMPLETADO: {
          label: 'Completado',
          class: 'status-badge status-completed',
          icon: 'fa-check-circle',
        },
        CANCELADO: { label: 'Cancelado', class: 'status-badge status-cancelled', icon: 'fa-ban' },
      },
    },
  ];

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getAll(this.filters).subscribe({
      next: (data) => {
        this.projects = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  onFilterChange(filters: Record<string, unknown>): void {
    this.filters.search = (filters['search'] as string) || '';
    this.filters.status = (filters['status'] as string) || '';
    this.loadProjects();
  }

  viewProject(project: Project): void {
    this.router.navigate(['/operaciones/projects', project.id]);
  }

  editProject(project: Project): void {
    this.router.navigate(['/operaciones/projects', project.id, 'edit']);
  }

  createProject(): void {
    this.router.navigate(['/operaciones/projects/new']);
  }

  deleteProject(project: Project): void {
    this.confirmSvc.confirmDelete(`el proyecto ${project.nombre}`).subscribe((confirmed) => {
      if (confirmed) {
        this.loading = true;
        this.projectService.delete(project.id.toString()).subscribe({
          next: () => {
            this.snackBar.open('Proyecto eliminado correctamente', 'Cerrar', { duration: 3000 });
            this.loadProjects();
          },
          error: (err) => {
            console.error('Error deleting project', err);
            this.loading = false;
            this.snackBar.open('Error al eliminar el proyecto', 'Cerrar', { duration: 3000 });
          },
        });
      }
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
    if (this.projects.length === 0) {
      this.snackBar.open('No hay proyectos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.projects.map((project) => ({
      Código: project.codigo || '',
      Nombre: project.nombre || '',
      Cliente: project.cliente || '',
      Ubicación: project.ubicacion || '',
      'Fecha Inicio': project.fechaInicio
        ? new Date(project.fechaInicio).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': project.fechaFin ? new Date(project.fechaFin).toLocaleDateString('es-PE') : '',
      'Presupuesto Total': project.presupuesto ? `S/ ${project.presupuesto.toFixed(2)}` : '',
      Estado: project.estado || '',
      Descripción: project.descripcion || '',
      Activo: project.isActive ? 'Sí' : 'No',
      Creado: project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'proyectos',
      sheetName: 'Proyectos',
      includeTimestamp: true,
    });
  }

  exportToCSV(): void {
    if (this.projects.length === 0) {
      this.snackBar.open('No hay proyectos para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.projects.map((project) => ({
      Código: project.codigo || '',
      Nombre: project.nombre || '',
      Cliente: project.cliente || '',
      Ubicación: project.ubicacion || '',
      'Fecha Inicio': project.fechaInicio
        ? new Date(project.fechaInicio).toLocaleDateString('es-PE')
        : '',
      'Fecha Fin': project.fechaFin ? new Date(project.fechaFin).toLocaleDateString('es-PE') : '',
      'Presupuesto Total': project.presupuesto ? `S/ ${project.presupuesto.toFixed(2)}` : '',
      Estado: project.estado || '',
      Descripción: project.descripcion || '',
      Activo: project.isActive ? 'Sí' : 'No',
      Creado: project.createdAt ? new Date(project.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'proyectos');
  }
}
