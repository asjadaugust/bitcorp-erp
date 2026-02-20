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
  equipoId: number;
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
  };
  tipoMantenimiento: TipoMantenimiento;
  descripcion?: string;
  fechaProgramada?: string;
  fechaRealizada?: string;
  costoEstimado?: number;
  costoReal?: number;
  tecnicoResponsable?: string;
  estado: EstadoMantenimiento;
  observaciones?: string;
  intervalValue?: number;
  intervalType?: string;
  nextDueHours?: number;
  createdAt?: string;
  updatedAt?: string;
}
