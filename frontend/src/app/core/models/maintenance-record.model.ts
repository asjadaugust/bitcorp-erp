export type TipoMantenimiento = 'PREVENTIVO' | 'CORRECTIVO' | 'PREDICTIVO';
export type EstadoMantenimiento =
  | 'PROGRAMADO'
  | 'EN_PROCESO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'PENDIENTE';

export interface MaintenanceRecord {
  id: number;
  equipoId: number;
  tipoMantenimiento: TipoMantenimiento;
  descripcion?: string;
  fechaProgramada?: Date | string;
  fechaRealizada?: Date | string;
  costoEstimado?: number;
  costoReal?: number;
  tecnicoResponsable?: string;
  estado: EstadoMantenimiento;
  observaciones?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relations
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
    placa?: string;
  };
}
