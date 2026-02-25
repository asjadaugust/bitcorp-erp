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

        <button type="button" class="btn btn-secondary" (click)="viewCalendar()">
          <i class="fa-solid fa-calendar"></i> Ver Calendario
        </button>

        <button type="button" class="btn btn-primary" (click)="createTask()">
          <i class="fa-solid fa-plus"></i> Nueva Tarea
        </button>
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
          <button class="btn btn-secondary" (click)="loadTasks()">
            <i class="fa-solid fa-sync"></i> Reintentar
          </button>
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
              <button
                *ngIf="task.estado === 'pending'"
                class="card-action-btn card-action-btn--primary"
                (click)="assignTask(task, $event)"
                title="Asignar Operador"
              >
                <i class="fa-solid fa-user-plus"></i>
              </button>
              <button
                *ngIf="task.estado !== 'completed' && task.estado !== 'cancelled'"
                class="card-action-btn card-action-btn--success"
                (click)="completeTask(task, $event)"
                title="Completar Tarea"
              >
                <i class="fa-solid fa-check"></i>
              </button>
              <button
                class="card-action-btn card-action-btn--info"
                (click)="editTask(task.id, $event)"
                title="Editar"
              >
                <i class="fa-solid fa-pen"></i>
              </button>
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
          <button class="btn btn-primary" (click)="createTask()">
            <i class="fa-solid fa-plus"></i> Crear Primera Tarea
          </button>
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

      .task-card {
        background: var(--neutral-0);
        border-radius: var(--radius-lg);
        overflow: hidden;
        display: flex;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;

        &:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-300);
        }

        &.priority-high {
          border-left: 1px solid var(--semantic-red-300);
        }
      }

      .card-status-indicator {
        width: 6px;
        flex-shrink: 0;

        &.status-pending {
          background-color: var(--grey-300);
        }
        &.status-assigned {
          background-color: var(--semantic-blue-500);
        }
        &.status-in_progress {
          background-color: var(--semantic-yellow-500);
        }
        &.status-completed {
          background-color: var(--semantic-green-500);
        }
        &.status-cancelled,
        &.status-overdue {
          background-color: var(--semantic-red-500);
        }
      }

      .card-main {
        flex: 1;
        padding: var(--s-20);
        display: flex;
        flex-direction: column;
        gap: var(--s-16);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .header-type {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        color: var(--grey-500);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;

        i {
          font-size: 14px;
          color: var(--grey-400);
        }
      }

      .priority-badge {
        font-size: 10px;
        padding: 4px 10px;
        border-radius: 20px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;

        &.priority-low {
          background: var(--grey-100);
          color: var(--grey-700);
        }
        &.priority-medium {
          background: var(--primary-100);
          color: var(--primary-800);
        }
        &.priority-high {
          background: var(--semantic-red-100);
          color: var(--semantic-red-900);
        }
        &.priority-urgent {
          background: var(--neutral-900);
          color: var(--neutral-0);
        }
      }

      .task-title {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: var(--primary-900);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .task-details {
        display: flex;
        flex-direction: column;
        gap: var(--s-12);
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: var(--s-12);
        font-size: 14px;

        i {
          width: 20px;
          text-align: center;
          color: var(--grey-400);
          font-size: 16px;
        }

        .detail-label {
          color: var(--grey-500);
          font-weight: 500;
          min-width: 75px;
        }

        .detail-value {
          color: var(--grey-800);
          font-weight: 600;
        }

        .text-unassigned {
          color: var(--grey-400);
          font-style: italic;
          font-weight: 400;
        }
      }

      .card-footer {
        margin-top: auto;
        padding-top: var(--s-16);
        border-top: 1px solid var(--grey-100);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .status-pill {
        display: flex;
        align-items: center;
        gap: var(--s-8);
        padding: 6px 14px;
        border-radius: 30px;
        font-size: 12px;
        font-weight: 600;

        i {
          font-size: 8px;
        }

        &.status-pending {
          background: var(--grey-100);
          color: var(--grey-600);
        }
        &.status-assigned {
          background: var(--semantic-blue-100);
          color: var(--semantic-blue-900);
        }
        &.status-in_progress {
          background: var(--semantic-yellow-100);
          color: var(--semantic-yellow-900);
        }
        &.status-completed {
          background: var(--semantic-green-100);
          color: var(--semantic-green-900);
        }
        &.status-cancelled,
        &.status-overdue {
          background: var(--semantic-red-100);
          color: var(--semantic-red-900);
        }
      }

      .card-actions {
        display: flex;
        gap: var(--s-12);
      }

      .action-btn {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        border: 1px solid var(--grey-200);
        background: var(--neutral-0);
        color: var(--grey-500);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: var(--grey-50);
          transform: scale(1.05);
        }

        &.edit:hover {
          color: var(--primary-500);
          border-color: var(--primary-300);
        }
        &.delete:hover {
          color: var(--semantic-red-500);
          border-color: var(--semantic-red-300);
        }
      }

      .empty-state {
        text-align: center;
        padding: var(--s-64) var(--s-24);
        background: var(--neutral-0);
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
        background: var(--neutral-0);
        padding: var(--s-32);
        border-radius: var(--radius-lg);
        text-align: center;
        max-width: 400px;
        box-shadow: var(--shadow-md);
        border: 1px solid var(--semantic-red-100);

        .error-icon {
          font-size: 40px;
          color: var(--semantic-red-500);
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

  tasks: ScheduledTask[] = [];
  loading = false;
  error: string | null = null;

  tabs: TabItem[] = [
    { label: 'Proyectos', route: '/operaciones/projects', icon: 'fa-folder-open' },
    { label: 'Programación', route: '/operaciones/scheduling', icon: 'fa-calendar-days' },
    { label: 'Planillas', route: '/operaciones/timesheets', icon: 'fa-clipboard-user' },
  ];

  filters: { estado: string; fechaDesde: string; fechaHasta: string;[key: string]: string } = {
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
        this.tasks = Array.isArray(res) ? res : (res as Record<string, unknown>).data as ScheduledTask[] || (res as ScheduledTask[]) || [];
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

  editTask(id: number) {
    this.router.navigate(['/operaciones/scheduling/tasks', id, 'edit']);
  }

  deleteTask(id: number) {
    if (confirm('¿Estás seguro de eliminar esta tarea?')) {
      this.taskService.delete(id).subscribe({
        next: () => this.loadTasks(),
        error: (err: unknown) => alert('Error al eliminar: ' + (err as Error).message),
      });
    }
  }

  viewCalendar() {
    this.router.navigate(['/operaciones/scheduling/calendar']);
  }

  getTaskInfoItems(task: ScheduledTask): CardInfoItem[] {
    return [
      {
        icon: 'fa-solid fa-truck-front',
        label: 'Equipo',
        value: task.equipo?.codigo_equipo || 'N/A',
      },
      {
        icon: 'fa-solid fa-user-gear',
        label: 'Operador',
        value: task.operador
          ? task.operador.nombreCompleto || task.operador.nombres
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
      alert('No hay tareas programadas para exportar');
      return;
    }

    const exportData = this.tasks.map((task) => ({
      Tipo: task.tipoTarea || '',
      Título: task.titulo || task.descripcion || '',
      Equipo: task.equipo?.codigo_equipo || 'N/A',
      Operador: task.operador
        ? task.operador.nombreCompleto || task.operador.nombres
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
      alert('No hay tareas programadas para exportar');
      return;
    }

    const exportData = this.tasks.map((task) => ({
      Tipo: task.tipoTarea || '',
      Título: task.titulo || task.descripcion || '',
      Equipo: task.equipo?.codigo_equipo || 'N/A',
      Operador: task.operador
        ? task.operador.nombreCompleto || task.operador.nombres
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
