/**
 * MaintenanceSchedule model
 * Matches backend entity: MaintenanceSchedule (table: equipo.programa_mantenimiento)
 * Backend entity field names use camelCase Spanish (e.g. equipoId, tipoMantenimiento)
 */

export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
export type EstadoMantenimiento =
  | 'PROGRAMADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'PENDIENTE';

export interface MaintenanceSchedule {
  id: number;
  equipo_id: number; // Backend snake_case
  equipoId: number; // Legacy camelCase
  equipo_codigo?: string; // Backend flattened
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
  };
  tipo_mantenimiento: TipoMantenimiento; // Backend snake_case
  tipoMantenimiento: TipoMantenimiento; // Legacy camelCase
  descripcion?: string;
  fecha_programada?: string; // Backend snake_case
  fechaProgramada?: string; // Legacy camelCase
  fechaRealizada?: string;
  costo_estimado?: number; // Backend snake_case
  costoEstimado?: number; // Legacy camelCase
  costoReal?: number;
  tecnico_responsable?: string; // Backend snake_case
  tecnicoResponsable?: string; // Legacy camelCase
  estado: EstadoMantenimiento;
  observaciones?: string;
  created_at?: string; // Backend snake_case
  createdAt?: string; // Legacy camelCase
  updatedAt?: string;
}
