import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { ScheduledTask } from '../../../core/models/scheduled-task.model';
import { ExcelExportService } from '../../../core/services/excel-export.service';
import {
  ExportDropdownComponent,
  ExportFormat,
} from '../../../shared/components/export-dropdown/export-dropdown.component';
import {
  PageLayoutComponent,
  TabItem,
} from '../../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import {
  DropdownComponent,
  DropdownOption,
} from '../../../shared/components/dropdown/dropdown.component';

import {
  AeroCardComponent,
  CardInfoItem,
} from '../../../shared/components/aero-card/aero-card.component';
import { AeroButtonComponent } from '../../../core/design-system';
import { ConfirmService } from '../../../core/services/confirm.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-scheduled-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    ExportDropdownComponent,
    DropdownComponent,
    AeroCardComponent,
    AeroButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Programación de Tareas"
      icon="fa-calendar-check"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Operaciones', url: '/operaciones' },
        { label: 'Programación' },
      ]"
      [loading]="loading"
      [tabs]="tabs"
    >
      <app-actions-container actions>
        <app-export-dropdown (export)="handleExport($event)"> </app-export-dropdown>

        <aero-button variant="secondary" iconLeft="fa-calendar" (clicked)="viewCalendar()"
          >Ver Calendario</aero-button
        >
        <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createTask()"
          >Nueva Tarea</aero-button
        >
      </app-actions-container>

      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <span class="label">Estado</span>
            <app-dropdown
              [(ngModel)]="filters.estado"
              [options]="statusOptions"
              (ngModelChange)="loadTasks()"
              [placeholder]="'Todos'"
            ></app-dropdown>
          </div>
          <div class="filter-group">
            <span class="label">Fecha Desde</span>
            <input
              type="date"
              [(ngModel)]="filters.fechaDesde"
              (change)="loadTasks()"
              class="form-control"
            />
          </div>
          <div class="filter-group">
            <span class="label">Fecha Hasta</span>
            <input
              type="date"
              [(ngModel)]="filters.fechaHasta"
              (change)="loadTasks()"
              class="form-control"
            />
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <div class="error-content">
          <i class="fa-solid fa-circle-exclamation error-icon"></i>
          <h3>Error de Conexión</h3>
          <p>{{ error }}</p>
          <aero-button variant="secondary" iconLeft="fa-sync" (clicked)="loadTasks()"
            >Reintentar</aero-button
          >
        </div>
      </div>

      <!-- Tasks Grid -->
      <div *ngIf="!loading && !error" class="tasks-container">
        <div *ngIf="!loading && tasks.length > 0" class="tasks-grid">
          <app-aero-card
            *ngFor="let task of tasks"
            [title]="task.titulo || task.descripcion || 'Sin título'"
            [statusLabel]="getStatusLabel(task.estado)"
            [statusClass]="task.estado"
            [statusIcon]="getStatusIcon(task.estado)"
            [date]="task.fechaInicio"
            [timestamp]="task.createdAt"
            [infoItems]="getTaskInfoItems(task)"
            [observations]="
              task.descripcion && task.titulo ? (task.descripcion | slice: 0 : 100) : ''
            "
            (cardClick)="viewTask(task.id)"
          >
            <div actions>
              <aero-button
                *ngIf="task.estado === 'pending'"
                variant="ghost"
                size="small"
                iconCenter="fa-user-plus"
                title="Asignar Operador"
                (clicked)="assignTask(task, $event)"
              ></aero-button>
              <aero-button
                *ngIf="task.estado !== 'completed' && task.estado !== 'cancelled'"
                variant="ghost"
                size="small"
                iconCenter="fa-check"
                title="Completar Tarea"
                (clicked)="completeTask(task, $event)"
              ></aero-button>
              <aero-button
                variant="ghost"
                size="small"
                iconCenter="fa-pen"
                title="Editar"
                (clicked)="editTask(task.id, $event)"
              ></aero-button>
            </div>
          </app-aero-card>
        </div>

        <!-- Empty State -->
        <div *ngIf="tasks.length === 0" class="empty-state">
          <div class="empty-illustration">
            <i class="fa-solid fa-calendar-circle-exclamation"></i>
          </div>
          <h3>No hay tareas</h3>
          <p>No se encontraron tareas programadas para los filtros seleccionados.</p>
          <aero-button variant="primary" iconLeft="fa-plus" (clicked)="createTask()"
            >Crear Primera Tarea</aero-button
          >
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .tasks-container {
        margin-top: var(--s-8);
      }

      .tasks-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: var(--s-24);
      }

      .empty-state {
        text-align: center;
        padding: var(--s-64) var(--s-24);
        background: var(--grey-100);
        border-radius: var(--radius-lg);
        border: 2px dashed var(--grey-200);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--s-24);

        .empty-illustration {
          font-size: 64px;
          color: var(--grey-200);
          animation: bounce 2s infinite ease-in-out;
        }

        h3 {
          font-size: 24px;
          color: var(--primary-900);
          margin: 0;
        }
        p {
          color: var(--grey-500);
          margin: 0;
          max-width: 400px;
          line-height: 1.6;
        }
      }

      .error-container {
        display: flex;
        justify-content: center;
        padding: var(--s-48) 0;
      }

      .error-content {
        background: var(--grey-100);
        padding: var(--s-32);
        border-radius: var(--radius-lg);
        text-align: center;
        max-width: 400px;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--grey-100);

        .error-icon {
          font-size: 40px;
          color: var(--accent-500);
          margin-bottom: var(--s-16);
        }
        h3 {
          margin-bottom: var(--s-8);
          color: var(--primary-900);
        }
        p {
          color: var(--grey-600);
          margin-bottom: var(--s-24);
        }
      }

      @keyframes bounce {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
        }
      }
    `,
  ],
})
export class ScheduledTaskListComponent implements OnInit {
  private taskService = inject(ScheduledTaskService);
  private router = inject(Router);
  private excelService = inject(ExcelExportService);
  private confirmSvc = inject(ConfirmService);
  private snackBar = inject(MatSnackBar);

  tasks: ScheduledTask[] = [];
  loading = false;
  error: string | null = null;

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'EDT', route: '/operaciones/edt', icon: 'fa-sitemap' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  filters: { estado: string; fechaDesde: string; fechaHasta: string; [key: string]: string } = {
    estado: '',
    fechaDesde: '',
    fechaHasta: '',
  };

  statusOptions: DropdownOption[] = [
    { label: 'Pendiente', value: 'pending' },
    { label: 'Asignado', value: 'assigned' },
    { label: 'En Proceso', value: 'in_progress' },
    { label: 'Completado', value: 'completed' },
  ];

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    this.loading = true;
    this.error = null;

    this.taskService.getAll(this.filters).subscribe({
      next: (res: unknown) => {
        // Handle both wrapped and unwrapped responses
        this.tasks = Array.isArray(res)
          ? res
          : ((res as Record<string, unknown>)['data'] as ScheduledTask[]) ||
            (res as ScheduledTask[]) ||
            [];
        this.loading = false;
      },
      error: (err: unknown) => {
        console.error('Error loading tasks:', err);
        this.error = 'Error al cargar tareas';
        this.loading = false;
      },
    });
  }

  createTask() {
    this.router.navigate(['/operaciones/scheduling/tasks/new']);
  }

  editTask(id: number, event?: Event) {
    if (event) event.stopPropagation();
    this.router.navigate(['/operaciones/scheduling/tasks', id, 'edit']);
  }

  viewTask(id: number) {
    this.router.navigate(['/operaciones/scheduling/tasks', id]);
  }

  assignTask(task: ScheduledTask, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/operaciones/scheduling/tasks', task.id, 'assign']);
  }

  completeTask(task: ScheduledTask, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/operaciones/scheduling/tasks', task.id, 'complete']);
  }

  deleteTask(id: number) {
    this.confirmSvc.confirmDelete('esta tarea').subscribe((confirmed) => {
      if (!confirmed) return;
      this.taskService.delete(id).subscribe({
        next: () => this.loadTasks(),
        error: (err: unknown) =>
          this.snackBar.open('Error al eliminar: ' + (err as Error).message, 'Cerrar', {
            duration: 4000,
          }),
      });
    });
  }

  viewCalendar() {
    this.router.navigate(['/operaciones/scheduling/calendar']);
  }

  getTaskInfoItems(task: ScheduledTask): CardInfoItem[] {
    return [
      {
        icon: 'fa-solid fa-truck-front',
        label: 'Equipo',
        value: (task.equipo?.['codigo_equipo'] as string) || 'N/A',
      },
      {
        icon: 'fa-solid fa-user-gear',
        label: 'Operador',
        value: task.operador
          ? (((task.operador as any)['nombreCompleto'] ||
              (task.operador as any)['nombres']) as string)
          : 'Sin asignar',
      },
      {
        icon: 'fa-solid fa-wrench',
        label: 'Tipo',
        value: this.getTaskTypeLabel(task.tipoTarea),
      },
      {
        icon: 'fa-solid fa-gauge-high',
        label: 'Prioridad',
        value: this.getPriorityLabel(task.prioridad),
        highlight: task.prioridad === 'high' || task.prioridad === 'urgent',
      },
    ];
  }

  getTaskTypeLabel(type: string): string {
    const map: Record<string, string> = {
      maintenance: 'Mantenimiento',
      inspection: 'Inspección',
      assignment: 'Asignación',
    };
    return map[type] || type;
  }

  getStatusIcon(status: string): string {
    const map: Record<string, string> = {
      pending: 'fa-solid fa-clock-rotate-left',
      assigned: 'fa-solid fa-user-check',
      in_progress: 'fa-solid fa-spinner fa-spin',
      completed: 'fa-solid fa-circle-check',
      cancelled: 'fa-solid fa-circle-xmark',
    };
    return map[status] || 'fa-solid fa-circle';
  }

  handleExport(format: ExportFormat): void {
    if (format === 'excel') {
      this.exportToExcel();
    } else if (format === 'csv') {
      this.exportToCSV();
    }
  }

  exportToExcel(): void {
    if (this.tasks.length === 0) {
      this.snackBar.open('No hay tareas programadas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.tasks.map((task) => ({
      Tipo: task.tipoTarea || '',
      Título: task.titulo || task.descripcion || '',
      Equipo: (task.equipo?.['codigo_equipo'] as string) || 'N/A',
      Operador: task.operador
        ? (((task.operador as any)['nombreCompleto'] ||
            (task.operador as any)['nombres']) as string)
        : 'Sin asignar',
      'Fecha Programada': task.fechaInicio
        ? new Date(task.fechaInicio).toLocaleDateString('es-PE')
        : '',
      'Duración (min)': task.duracionMinutos || 0,
      Prioridad: this.getPriorityLabel(task.prioridad),
      Estado: this.getStatusLabel(task.estado),
      'Notas Completación': task.notasCompletado || '',
      Creado: task.createdAt ? new Date(task.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToExcel(exportData, {
      filename: 'tareas-programadas',
      sheetName: 'Tareas',
    });
  }

  exportToCSV(): void {
    if (this.tasks.length === 0) {
      this.snackBar.open('No hay tareas programadas para exportar', 'Cerrar', { duration: 3000 });
      return;
    }

    const exportData = this.tasks.map((task) => ({
      Tipo: task.tipoTarea || '',
      Título: task.titulo || task.descripcion || '',
      Equipo: (task.equipo?.['codigo_equipo'] as string) || 'N/A',
      Operador: task.operador
        ? (((task.operador as any)['nombreCompleto'] ||
            (task.operador as any)['nombres']) as string)
        : 'Sin asignar',
      'Fecha Programada': task.fechaInicio
        ? new Date(task.fechaInicio).toLocaleDateString('es-PE')
        : '',
      'Duración (min)': task.duracionMinutos || 0,
      Prioridad: this.getPriorityLabel(task.prioridad),
      Estado: this.getStatusLabel(task.estado),
      'Notas Completación': task.notasCompletado || '',
      Creado: task.createdAt ? new Date(task.createdAt).toLocaleDateString('es-PE') : '',
    }));

    this.excelService.exportToCSV(exportData, 'tareas-programadas');
  }

  getPriorityLabel(priority: string): string {
    const map: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return map[priority] || priority;
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending: 'Pendiente',
      assigned: 'Asignada',
      in_progress: 'En Proceso',
      completed: 'Completada',
      cancelled: 'Cancelada',
      overdue: 'Vencida',
    };
    return map[status] || status;
  }
}
