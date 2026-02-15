export type PrioridadTarea = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';
export type EstadoTarea =
  | 'PENDIENTE'
  | 'ASIGNADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'VENCIDO';

export interface ScheduledTask {
  id: number;
  scheduleId?: number;
  schedule?: any;
  equipoId: number;
  equipo?: any;
  operadorId?: number;
  operador?: any;
  tipoTarea: string; // 'mantenimiento' | 'inspeccion' | 'reparacion'
  titulo?: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  horaInicio?: string;
  horaFin?: string;
  todoDia?: boolean;
  recurrencia?: string;
  duracionMinutos?: number;
  prioridad: string;
  estado: string;
  fechaCompletado?: string;
  notasCompletado?: string;
  registroMantenimientoId?: number;
  creadoPor?: number;
  asignadoPor?: number;
  projectId?: number;
  project?: any;
  createdAt?: string;
  updatedAt?: string;
}
