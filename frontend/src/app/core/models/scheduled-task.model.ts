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
  programaId?: number;
  programa?: any;
  equipoId: number;
  equipo?: any;
  operadorId?: number;
  operador?: any;
  tipoTarea: string; // 'mantenimiento' | 'asignacion' | 'inspeccion'
  titulo?: string;
  descripcion?: string;
  fechaInicio: string;
  fechaFin?: string;
  horaInicio?: string;
  horaFin?: string;
  todoDia?: boolean;
  recurrencia?: string;
  duracionMinutos?: number;
  prioridad: PrioridadTarea;
  estado: EstadoTarea;
  fechaCompletado?: string;
  notasCompletado?: string;
  registroMantenimientoId?: number;
  creadoPor?: number;
  asignadoPor?: number;
  proyectoId?: number;
  proyecto?: any;
  createdAt?: string;
  updatedAt?: string;
}
