import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { ScheduledTask } from '../../../core/models/scheduled-task.model';

import { PageLayoutComponent } from '../../../shared/components/page-layout/page-layout.component';
import { ActionsContainerComponent } from '../../../shared/components/actions-container/actions-container.component';
import { ButtonComponent } from '../../../shared/components/button/button.component';

@Component({
  selector: 'app-scheduled-task-calendar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    PageLayoutComponent,
    ActionsContainerComponent,
    ButtonComponent,
  ],
  template: `
    <app-page-layout
      title="Calendario de Tareas"
      icon="fa-calendar-check"
      [breadcrumbs]="[
        { label: 'Inicio', url: '/app' },
        { label: 'Operaciones', url: '/operaciones' },
        { label: 'Programación', url: '/operaciones/scheduling/tasks' },
        { label: 'Calendario' },
      ]"
    >
      <app-actions-container actions>
        <app-button
          variant="secondary"
          size="sm"
          label="Ver Lista"
          icon="fa-list"
          (clicked)="viewList()"
        ></app-button>
        <app-button
          variant="primary"
          size="sm"
          label="Nueva Tarea"
          icon="fa-plus"
          (clicked)="createTask()"
        ></app-button>
      </app-actions-container>

      <div class="calendar-wrapper">
        <!-- Calendar Header/Controls -->
        <div class="calendar-header-card">
          <div class="month-navigation">
            <app-button
              variant="icon"
              size="sm"
              icon="fa-chevron-left"
              title="Mes Anterior"
              (clicked)="prevMonth()"
            ></app-button>
            <h2 class="current-month">
              {{ currentMonthName }} <span>{{ currentYear }}</span>
            </h2>
            <app-button
              variant="icon"
              size="sm"
              icon="fa-chevron-right"
              title="Mes Siguiente"
              (clicked)="nextMonth()"
            ></app-button>
          </div>
          <div class="calendar-actions">
            <app-button variant="ghost" size="sm" label="Hoy" (clicked)="goToToday()"></app-button>
          </div>
        </div>

        <!-- Calendar Grid -->
        <div class="calendar-container">
          <div class="calendar-grid">
            <!-- Weekdays Header -->
            <div class="weekday-header" *ngFor="let day of weekDays">{{ day }}</div>

            <!-- Days -->
            <div
              *ngFor="let day of calendarDays"
              class="calendar-day"
              [class.other-month]="!day.isCurrentMonth"
              [class.is-today]="day.isToday"
              (click)="selectDay(day)"
              (keydown.enter)="selectDay(day)"
              tabindex="0"
              role="gridcell"
            >
              <div class="day-slot-header">
                <span class="day-num">{{ day.date.getDate() }}</span>
                <button
                  *ngIf="day.isCurrentMonth"
                  class="quick-add-btn"
                  (click)="createTaskForDate(day.date, $event)"
                  title="Nueva tarea para este día"
                >
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>

              <div class="day-tasks-container">
                <div
                  *ngFor="let task of getTasksForDate(day.date)"
                  class="task-item-pill"
                  [class]="'priority-' + task.prioridad"
                  (click)="editTask(task.id, $event)"
                  (keydown.enter)="editTask(task.id, $event)"
                  tabindex="0"
                  role="button"
                  [title]="task.titulo || task.descripcion"
                >
                  <span class="task-pill-dot"></span>
                  <span class="task-pill-text"
                    >{{ task.equipo?.codigo_equipo || 'EQ' }} -
                    {{ getTaskTypeLabel(task.tipoTarea) }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-page-layout>
  `,
  styles: [
    `
      .calendar-wrapper {
        display: flex;
        flex-direction: column;
        gap: var(--s-20);
        margin-top: var(--s-8);
      }

      .calendar-header-card {
        background: var(--neutral-0);
        padding: var(--s-16) var(--s-24);
        border-radius: var(--radius-lg);
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--grey-200);
      }

      .month-navigation {
        display: flex;
        align-items: center;
        gap: var(--s-24);
      }

      .current-month {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: var(--primary-900);
        min-width: 180px;
        text-align: center;

        span {
          color: var(--grey-400);
          font-weight: 400;
          margin-left: var(--s-8);
        }
      }

      .calendar-container {
        background: var(--neutral-0);
        border-radius: var(--radius-lg);
        border: 1px solid var(--grey-200);
        box-shadow: var(--shadow-md);
        overflow: hidden;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
      }

      .weekday-header {
        padding: var(--s-12);
        text-align: center;
        font-size: 11px;
        font-weight: 700;
        color: var(--grey-500);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        background: var(--grey-50);
        border-bottom: 1px solid var(--grey-200);
      }

      .calendar-day {
        min-height: 140px;
        padding: var(--s-12);
        background: var(--neutral-0);
        border-right: 1px solid var(--grey-100);
        border-bottom: 1px solid var(--grey-100);
        display: flex;
        flex-direction: column;
        gap: var(--s-8);
        transition: all 0.2s;

        &:nth-child(7n) {
          border-right: none;
        }

        &:hover {
          background: var(--primary-50);
        }

        &.other-month {
          background: var(--grey-50);
          .day-num {
            color: var(--grey-300);
          }
        }

        &.is-today {
          background: var(--primary-100);
          .day-num {
            background: var(--klm-blue);
            color: white;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            margin-top: -4px;
          }
        }
      }

      .day-slot-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .day-num {
        font-size: 14px;
        font-weight: 600;
        color: var(--grey-700);
      }

      .quick-add-btn {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: none;
        background: transparent;
        color: var(--grey-300);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: all 0.2s;

        &:hover {
          background: var(--primary-100);
          color: var(--primary-500);
        }
      }

      .calendar-day:hover .quick-add-btn {
        opacity: 1;
      }

      .day-tasks-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        overflow: hidden;
      }

      .task-item-pill {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: var(--s-8);
        cursor: pointer;
        transition: transform 0.1s;
        border: 1px solid transparent;

        &:hover {
          transform: scale(1.02);
        }

        .task-pill-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .task-pill-text {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 600;
        }

        &.priority-low {
          background: var(--grey-50);
          color: var(--grey-700);
          border-color: var(--grey-200);
          .task-pill-dot {
            background: var(--grey-400);
          }
        }
        &.priority-medium {
          background: var(--primary-100);
          color: var(--primary-800);
          border-color: var(--primary-200);
          .task-pill-dot {
            background: var(--primary-500);
          }
        }
        &.priority-high {
          background: var(--semantic-red-100);
          color: var(--semantic-red-900);
          border-color: var(--semantic-red-300);
          .task-pill-dot {
            background: var(--semantic-red-500);
          }
        }
        &.priority-urgent {
          background: var(--neutral-900);
          color: var(--neutral-0);
          .task-pill-dot {
            background: var(--semantic-red-500);
          }
        }
      }
    `,
  ],
})
export class ScheduledTaskCalendarComponent implements OnInit {
  private taskService = inject(ScheduledTaskService);
  private router = inject(Router);

  currentDate = new Date();
  currentMonthName = '';
  currentYear = 0;
  weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  calendarDays: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];
  tasks: ScheduledTask[] = [];

  ngOnInit() {
    this.updateCalendar();
    this.loadTasks();
  }

  updateCalendar() {
    this.currentYear = this.currentDate.getFullYear();
    this.currentMonthName = this.currentDate.toLocaleString('es-ES', { month: 'long' });
    this.currentMonthName =
      this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    this.generateCalendarGrid();
  }

  generateCalendarGrid() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay(); // 0 = Sunday
    const endDay = lastDayOfMonth.getDate();

    this.calendarDays = [];

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      this.calendarDays.push({
        date: new Date(year, month - 1, prevMonthLastDay - i),
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // Current month days
    const today = new Date();
    for (let i = 1; i <= endDay; i++) {
      const date = new Date(year, month, i);
      this.calendarDays.push({
        date: date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    // Next month days
    const remainingCells = 42 - this.calendarDays.length; // 6 rows * 7 cols
    for (let i = 1; i <= remainingCells; i++) {
      this.calendarDays.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
        isToday: false,
      });
    }
  }

  loadTasks() {
    // Load tasks for current month view (including padding days)
    const start = this.calendarDays[0].date.toISOString().split('T')[0];
    const end = this.calendarDays[this.calendarDays.length - 1].date.toISOString().split('T')[0];

    this.taskService.getAll({ date_from: start, date_to: end }).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (err: unknown) => console.error('Error loading tasks:', err),
    });
  }

  getTasksForDate(date: Date): ScheduledTask[] {
    if (!this.tasks || !Array.isArray(this.tasks)) {
      return [];
    }
    const dateStr = date.toISOString().split('T')[0];
    return this.tasks.filter((t) => {
      const taskDate = t.fechaInicio;
      return taskDate && taskDate.startsWith(dateStr);
    });
  }

  prevMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateCalendar();
    this.loadTasks();
  }

  nextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateCalendar();
    this.loadTasks();
  }

  goToToday() {
    this.currentDate = new Date();
    this.updateCalendar();
    this.loadTasks();
  }

  createTask() {
    this.router.navigate(['/operaciones/scheduling/tasks/new']);
  }

  createTaskForDate(date: Date, event: Event) {
    event.stopPropagation();
    const dateStr = date.toISOString().split('T')[0];
    this.router.navigate(['/operaciones/scheduling/tasks/new'], { queryParams: { date: dateStr } });
  }

  editTask(id: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/operaciones/scheduling/tasks', id, 'edit']);
  }

  selectDay(_day: { date: Date; isCurrentMonth: boolean; isToday: boolean }) {
    // Optional: Open day view or modal
  }

  viewList() {
    this.router.navigate(['/operaciones/scheduling/tasks']);
  }

  getTaskTypeLabel(type: string): string {
    const map: Record<string, string> = {
      maintenance: 'Mant.',
      inspection: 'Insp.',
      assignment: 'Asig.',
    };
    return map[type] || type;
  }
}
