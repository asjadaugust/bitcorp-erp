/**
 * Scheduling models — Timesheet & GenerateTimesheetDto
 *
 * NOTE: MaintenanceSchedule is defined in maintenance-schedule.model.ts
 *       ScheduledTask is defined in scheduled-task.model.ts
 *       Do NOT duplicate those interfaces here.
 *
 * Backend entity: Timesheet (table: rrhh.tareo)
 * Backend uses camelCase Spanish: trabajadorId, periodo, totalDiasTrabajados, totalHoras,
 *   montoCalculado, estado, observaciones, creadoPor, aprobadoPor, aprobadoEn
 */

export type EstadoTareo = 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';

export interface Timesheet {
  id: number;
  trabajadorId: number;
  periodo: string; // Format: 'YYYY-MM'
  totalDiasTrabajados: number;
  totalHoras: number;
  montoCalculado?: number;
  estado: EstadoTareo;
  observaciones?: string;
  creadoPor?: number;
  aprobadoPor?: number;
  aprobadoEn?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relations
  trabajador_nombre?: string; // Backend returns this flat property
  trabajador?: {
    id: number;
    nombre_completo: string;
    nombres?: string;
    apellido_paterno?: string;
  };
  details?: TimesheetDetail[];
}

export interface TimesheetDetail {
  id: number;
  timesheet_id: number;
  work_date: string;
  project_id?: string;
  equipment_id?: number;
  start_time?: string;
  end_time?: string;
  hours_worked: number;
  notes?: string;

  // Relations
  project?: {
    G00007_Codigo: string;
    G00007_Nombre: string;
  };
  equipment?: {
    C08001_id: number;
    C08001_Nombre: string;
    C08001_Codigo: string;
  };
}

export interface GenerateTimesheetDto {
  trabajador_id: number;
  periodo: string; // 'YYYY-MM'
}
