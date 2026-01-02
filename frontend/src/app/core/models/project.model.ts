export interface Project {
  id: number;
  legacyId?: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: string;
  fechaInicio?: Date | string;
  fechaFin?: Date | string; // Entity has fechaFin
  presupuesto?: number;
  estado: 'PLANIFICACION' | 'ACTIVO' | 'PAUSADO' | 'COMPLETADO' | 'CANCELADO';
  cliente?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}
