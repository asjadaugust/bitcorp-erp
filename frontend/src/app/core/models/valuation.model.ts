/**
 * Valuation model
 * Matches backend entity: Valorizacion (table: equipo.valorizacion_equipo)
 * Backend entity uses camelCase mapped from snake_case DB columns
 */

export type EstadoValorizacion =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'PAGADO'
  | 'ELIMINADO';

export interface Valuation {
  id: number;
  legacyId?: string;
  equipoId: number;
  contratoId?: number;
  proyectoId?: number;
  periodo: string; // Format: 'YYYY-MM'
  fechaInicio: string;
  fechaFin: string;
  diasTrabajados?: number;
  horasTrabajadas?: number;
  combustibleConsumido?: number;
  costoBase?: number;
  costoCombustible?: number;
  cargosAdicionales?: number;
  totalValorizado?: number;
  numeroValorizacion?: string;
  tipoCambio?: number;
  descuentoPorcentaje?: number;
  descuentoMonto?: number;
  igvPorcentaje?: number;
  igvMonto?: number;
  totalConIgv?: number;
  estado: EstadoValorizacion;
  observaciones?: string;
  creadoPor?: number;
  aprobadoPor?: number;
  aprobadoEn?: string;
  createdAt?: string;
  updatedAt?: string;

  // Relations (populated by backend joins)
  equipo?: {
    id: number;
    codigo_equipo: string;
    marca: string;
    modelo: string;
  };
  contrato?: {
    id: number;
    codigo: string;
    nombre_proyecto: string;
  };
}

export interface PaymentData {
  fecha_pago: string;
  metodo_pago: string;
  referencia_pago: string;
}
