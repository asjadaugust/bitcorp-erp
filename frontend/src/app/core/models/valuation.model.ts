/**
 * Valuation model
 * Matches backend entity: Valorizacion (table: equipo.valorizacion_equipo)
 * Backend entity uses camelCase mapped from snake_case DB columns
 */

export type EstadoValorizacion =
  | 'BORRADOR'
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'VALIDADO'
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
  importeManipuleo?: number;
  importeGastoObra?: number;
  importeAdelanto?: number;
  importeExcesoCombustible?: number;
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
  validadoPor?: number;
  validadoEn?: string;
  conformidadProveedor?: boolean;
  conformidadFecha?: string;
  conformidadObservaciones?: string;
  createdAt?: string;
  updatedAt: string;

  // Shorthand for header display
  cliente_nombre?: string;
  codigo_equipo?: string;

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
    numero_contrato?: string; // Legacy
    nombre_proyecto?: string;
    proveedor?: {
      id: number;
      ruc: string;
      razon_social: string;
    };
  };
}

export interface ValuationSummaryEquipment {
  codigo_equipo: string;
  nombre: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  tipo_medidor?: string;
}

export interface ValuationSummaryProvider {
  ruc: string;
  razon_social: string;
  direccion?: string;
}

export interface ValuationSummaryContract {
  numero_contrato: string;
  tipo_documento: string;
  modalidad: string;
  tipo_tarifa?: string;
  tarifa: number;
  moneda: string;
  minimo_por: string;
  cantidad_minima: number;
}

export interface ValuationSummaryHeader {
  id_valorizacion: string;
  numero_valorizacion: string;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_cambio: number;
}

export interface ValuationSummaryFinancial {
  cantidad: number;
  unidad_medida: string;
  precio_unitario: number;
  valorizacion_bruta: number;
  cantidad_combustible: number;
  precio_combustible: number;
  importe_combustible: number;
  precio_manipuleo_combustible: number;
  importe_manipuleo_combustible: number;
  importe_manipuleo: number;
  importe_gasto_obra: number;
  importe_adelanto: number;
  importe_exceso_combustible: number;
  cargos_adicionales: number;
  valorizacion_neta: number;
  igv: number;
  neto_facturar: number;
}

export interface ValuationSummary {
  equipo: ValuationSummaryEquipment;
  proveedor: ValuationSummaryProvider;
  contrato: ValuationSummaryContract;
  valorizacion: ValuationSummaryHeader;
  financiero: ValuationSummaryFinancial;
}

export interface PaymentData {
  fecha_pago: string;
  metodo_pago: string;
  referencia_pago: string;
}
