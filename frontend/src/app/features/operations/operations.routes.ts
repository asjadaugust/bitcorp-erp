import { Routes } from '@angular/router';

export const OPERATIONS_ROUTES: Routes = [
  { path: '', redirectTo: 'projects', pathMatch: 'full' },

  // Projects
  {
    path: 'projects',
    loadComponent: () =>
      import('../projects/project-list.component').then((m) => m.ProjectListComponent),
  },
  {
    path: 'projects/new',
    loadComponent: () =>
      import('./components/project-form/project-form.component').then(
        (m) => m.ProjectFormComponent
      ),
  },
  {
    path: 'projects/:id',
    loadComponent: () =>
      import('../projects/project-detail.component').then((m) => m.ProjectDetailComponent),
  },
  {
    path: 'projects/:id/edit',
    loadComponent: () =>
      import('./components/project-form/project-form.component').then(
        (m) => m.ProjectFormComponent
      ),
  },

  // Scheduling
  {
    path: 'scheduling',
    children: [
      { path: '', redirectTo: 'tasks', pathMatch: 'full' },
      {
        path: 'tasks',
        loadComponent: () =>
          import('../scheduling/scheduled-task/scheduled-task-list.component').then(
            (m) => m.ScheduledTaskListComponent
          ),
      },
      {
        path: 'tasks/new',
        loadComponent: () =>
          import('../scheduling/scheduled-task/scheduled-task-form.component').then(
            (m) => m.ScheduledTaskFormComponent
          ),
      },
      {
        path: 'tasks/:id/edit',
        loadComponent: () =>
          import('../scheduling/scheduled-task/scheduled-task-form.component').then(
            (m) => m.ScheduledTaskFormComponent
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('../scheduling/scheduled-task/scheduled-task-calendar.component').then(
            (m) => m.ScheduledTaskCalendarComponent
          ),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('../scheduling/operator-availability/operator-availability.component').then(
            (m) => m.OperatorAvailabilityComponent
          ),
      },
    ],
  },

  // Timesheets
  {
    path: 'timesheets',
    loadComponent: () =>
      import('../timesheets/timesheet-list.component').then((m) => m.TimesheetListComponent),
  },
  {
    path: 'timesheets/new',
    loadComponent: () =>
      import('./components/timesheet-form/timesheet-form.component').then(
        (m) => m.TimesheetFormComponent
      ),
  },
  {
    path: 'timesheets/generate',
    loadComponent: () =>
      import('../timesheets/timesheet-generate.component').then(
        (m) => m.TimesheetGenerateComponent
      ),
  },
  {
    path: 'timesheets/:id',
    loadComponent: () =>
      import('../timesheets/timesheet-detail.component').then((m) => m.TimesheetDetailComponent),
  },
  {
    path: 'timesheets/:id/edit',
    loadComponent: () =>
      import('./components/timesheet-form/timesheet-form.component').then(
        (m) => m.TimesheetFormComponent
      ),
  },
];
