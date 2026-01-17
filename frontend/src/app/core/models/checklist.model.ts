// Enums and Types
export type FrecuenciaChecklist = 'DIARIO' | 'SEMANAL' | 'MENSUAL' | 'ANTES_USO';
export type TipoVerificacion = 'VISUAL' | 'MEDICION' | 'FUNCIONAL' | 'AUDITIVO';
export type EstadoInspeccion = 'EN_PROGRESO' | 'COMPLETADO' | 'RECHAZADO' | 'CANCELADO';
export type ResultadoGeneral = 'APROBADO' | 'APROBADO_CON_OBSERVACIONES' | 'RECHAZADO';
export type AccionRequerida = 'NINGUNA' | 'OBSERVAR' | 'REPARAR' | 'REEMPLAZAR';

// Checklist Template
export interface ChecklistTemplate {
  id: number;
  codigo: string;
  nombre: string;
  tipoEquipo?: string;
  descripcion?: string;
  frecuencia?: FrecuenciaChecklist;
  activo: boolean;
  createdBy?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  items?: ChecklistItem[];
}

// Checklist Item
export interface ChecklistItem {
  id: number;
  plantillaId: number;
  orden: number;
  categoria?: string;
  descripcion: string;
  tipoVerificacion: TipoVerificacion;
  valorEsperado?: string;
  esCritico: boolean;
  requiereFoto: boolean;
  instrucciones?: string;
  createdAt?: Date | string;
}

// Checklist Inspection
export interface ChecklistInspection {
  id: number;
  codigo: string;
  plantillaId: number;
  equipoId: number;
  trabajadorId: number;
  fechaInspeccion: Date | string;
  horaInicio?: string;
  horaFin?: string;
  ubicacion?: string;
  horometroInicial?: number;
  odometroInicial?: number;
  estado: EstadoInspeccion;
  resultadoGeneral?: ResultadoGeneral;
  itemsConforme: number;
  itemsNoConforme: number;
  itemsTotal: number;
  observacionesGenerales?: string;
  requiereMantenimiento: boolean;
  equipoOperativo: boolean;
  completadoEn?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relations
  plantilla?: ChecklistTemplate;
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
  };
  trabajador?: {
    id: number;
    nombre_completo: string;
  };
}

// Checklist Result
export interface ChecklistResult {
  id: number;
  inspeccionId: number;
  itemId: number;
  conforme?: boolean;
  valorMedido?: string;
  observaciones?: string;
  accionRequerida?: AccionRequerida;
  fotoUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Relations
  item?: ChecklistItem;
}

// Inspection with Results (for detail view)
export interface InspectionWithResults extends ChecklistInspection {
  resultados?: ChecklistResult[];
}

// Statistics
export interface ChecklistStats {
  total: number;
  aprobadas: number;
  conObservaciones: number;
  rechazadas: number;
  tasaAprobacion: number;
}
