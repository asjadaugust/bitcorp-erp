import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ScheduledTaskService } from '../../../core/services/scheduled-task.service';
import { ScheduledTask } from '../../../core/models/scheduled-task.model';

@Component({
  selector: 'app-scheduled-task-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="container-fluid">
      <div class="page-header">
        <h1>📅 Calendario de Tareas</h1>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="viewList()">
            <i class="fa-solid fa-list"></i> Ver Lista
          </button>
          <button class="btn btn-primary" (click)="createTask()">
            <i class="fa-solid fa-plus"></i> Nueva Tarea
          </button>
        </div>
      </div>

      <!-- Calendar Controls -->
      <div class="calendar-controls card">
        <button class="btn-icon" (click)="prevMonth()">
          <i class="fa-solid fa-chevron-left"></i>
        </button>
        <h2>{{ currentMonthName }} {{ currentYear }}</h2>
        <button class="btn-icon" (click)="nextMonth()">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      <!-- Calendar Grid -->
      <div class="calendar-grid">
        <!-- Weekdays Header -->
        <div class="weekday" *ngFor="let day of weekDays">{{ day }}</div>

        <!-- Days -->
        <div
          *ngFor="let day of calendarDays"
          class="calendar-day"
          [class.other-month]="!day.isCurrentMonth"
          [class.today]="day.isToday"
          (click)="selectDay(day)"
        >
          <div class="day-header">
            <span class="day-number">{{ day.date.getDate() }}</span>
            <button
              *ngIf="day.isCurrentMonth"
              class="btn-add-mini"
              (click)="createTaskForDate(day.date, $event)"
            >
              +
            </button>
          </div>

          <div class="day-tasks">
            <div
              *ngFor="let task of getTasksForDate(day.date)"
              class="task-pill"
              [class]="'priority-' + task.prioridad"
              (click)="editTask(task.id, $event)"
              [title]="task.descripcion"
            >
              {{ task.equipo?.codigo }} - {{ task.tipoTarea }}
            </div>
          </div>
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
      .header-actions {
        display: flex;
        gap: 1rem;
      }

      .calendar-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: white;
        border-radius: 12px;
        margin-bottom: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .calendar-controls h2 {
        margin: 0;
        font-size: 1.5rem;
        color: #2d3748;
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
      }

      .weekday {
        padding: 1rem;
        text-align: center;
        font-weight: 600;
        color: #718096;
        background: #f7fafc;
        border-bottom: 1px solid #e2e8f0;
        text-transform: uppercase;
        font-size: 0.875rem;
      }

      .calendar-day {
        min-height: 120px;
        padding: 0.5rem;
        border-right: 1px solid #e2e8f0;
        border-bottom: 1px solid #e2e8f0;
        background: white;
        transition: background 0.2s;
        cursor: pointer;
      }
      .calendar-day:hover {
        background: #f7fafc;
      }
      .calendar-day.other-month {
        background: #fcfcfc;
        color: #cbd5e0;
      }
      .calendar-day.today {
        background: #ebf8ff;
      }

      .day-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .day-number {
        font-weight: 600;
        font-size: 0.9rem;
      }

      .btn-add-mini {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: none;
        background: transparent;
        color: #a0aec0;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        line-height: 1;
        opacity: 0;
        transition: all 0.2s;
      }
      .calendar-day:hover .btn-add-mini {
        opacity: 1;
      }
      .btn-add-mini:hover {
        background: #3182ce;
        color: white;
      }

      .day-tasks {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .task-pill {
        font-size: 0.7rem;
        padding: 2px 6px;
        border-radius: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        color: #2d3748;
        background: #edf2f7;
        border-left: 3px solid #cbd5e0;
      }
      .task-pill:hover {
        filter: brightness(0.95);
      }

      .priority-BAJA {
        border-left-color: #38b2ac;
        background: #e6fffa;
      }
      .priority-MEDIA {
        border-left-color: #dd6b20;
        background: #fffaf0;
      }
      .priority-ALTA {
        border-left-color: #e53e3e;
        background: #fff5f5;
      }
      .priority-URGENTE {
        border-left-color: #822727;
        background: #fed7d7;
        color: #822727;
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
      .btn-primary {
        background: #3182ce;
        color: white;
      }
      .btn-secondary {
        background: #e2e8f0;
        color: #2d3748;
      }
      .btn-icon {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        color: #4a5568;
        padding: 0.5rem;
        border-radius: 50%;
      }
      .btn-icon:hover {
        background: #edf2f7;
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
      next: (res: any) => {
        this.tasks = res.data;
      },
      error: (err: any) => console.error('Error loading tasks:', err),
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

  selectDay(day: any) {
    // Optional: Open day view or modal
  }

  viewList() {
    this.router.navigate(['/operaciones/scheduling/tasks']);
  }
}
