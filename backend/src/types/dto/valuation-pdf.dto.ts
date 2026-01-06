/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * DTOs for Valuation PDF Generation
 * Following ARCHITECTURE.md guidelines:
 * - All DTOs use snake_case for field names
 * - Explicit transformation from database entities
 * - Type-safe interfaces
 */

/**
 * Equipment information for valuation report
 */
export interface ValuationEquipmentDto {
  codigo_equipo: string;
  nombre: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  tipo_medidor?: string; // "HORÓMETRO" | "ODÓMETRO"
  codigo_externo?: string;
}

/**
 * Provider information for valuation report
 */
export interface ValuationProviderDto {
  ruc: string;
  razon_social: string;
  direccion?: string;
}

/**
 * Contract information for valuation report
 */
export interface ValuationContractDto {
  numero_contrato: string;
  tipo_documento: string; // "CONTRATO" | "ADENDA"
  modalidad: string; // "MÁQUINA SECA NO OPERADA" | "MAQUINA CON OPERADOR"
  tipo_tarifa?: string;
  tarifa: number;
  moneda: string; // "PEN" | "USD" | "SOLES"
  minimo_por: string; // "MES" | "DIA" | "HORA"
  cantidad_minima: number;
}

/**
 * Valuation header information
 */
export interface ValuationHeaderDto {
  id_valorizacion: string;
  numero_valorizacion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  tipo_cambio: number;
}

/**
 * Fuel consumption detail
 */
export interface FuelConsumptionDetailDto {
  fecha: Date;
  num_vale_salida: string;
  horometro_odometro: string;
  inicial: number;
  cantidad: number;
  precio_unitario_sin_igv: number;
  importe: number;
  comentario?: string;
}

/**
 * Work expense detail
 */
export interface WorkExpenseDetailDto {
  fecha_operacion: Date;
  proveedor: string;
  concepto: string;
  tipo_documento?: string;
  num_documento?: string;
  importe: number;
  incluye_igv: string; // "SI" | "NO"
  importe_sin_igv: number;
}

/**
 * Advance/prepayment detail
 */
export interface AdvanceDetailDto {
  fecha_operacion: Date;
  tipo_operacion: string; // "ADELANTO" | "AMORTIZACION"
  num_documento?: string;
  concepto: string;
  num_cuota?: string;
  monto: number;
}

/**
 * Excess fuel charge detail
 */
export interface ExcessFuelDetailDto {
  consumo_combustible: number;
  tipo_horo_odo: string;
  inicio: number;
  final: number;
  total: number;
  rendimiento: number;
  ratio_control: number;
  diferencia: number;
  exceso_combustible: number;
  precio_unitario: number;
  importe_exceso_combustible: number;
}

/**
 * Financial summary for valuation report
 */
export interface ValuationFinancialDto {
  // Base valuation
  cantidad: number; // Hours or days worked
  unidad_medida: string; // "H-M" | "D-C"
  precio_unitario: number;
  valorizacion_bruta: number;

  // Fuel costs
  cantidad_combustible: number;
  precio_combustible: number;
  importe_combustible: number;

  // Fuel handling
  precio_manipuleo_combustible: number;
  importe_manipuleo_combustible: number;

  // Work expenses
  importe_gasto_obra: number;

  // Advances/prepayments
  importe_adelanto: number;

  // Excess fuel
  importe_exceso_combustible: number;

  // Net calculation
  valorizacion_neta: number;
  igv: number;
  neto_facturar: number;
}

/**
 * Complete Page 1 data for valuation PDF
 */
export interface ValuationPage1Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  contrato: ValuationContractDto;
  valorizacion: ValuationHeaderDto;
  financiero: ValuationFinancialDto;
}

/**
 * Historical valuation item for Page 2 (RESUMEN ACUMULADO)
 */
export interface ValuationHistoryItemDto {
  numero_contrato_adenda: string;
  numero_valorizacion: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  cantidad_valorizacion: number;
  unidad_medida: string;
  tarifa_contrato_pu: number;
  valorizacion_bruta: number;
  descuento_total: number;
  valorizacion_neta: number;
}

/**
 * Historical totals for Page 2
 */
export interface ValuationHistoryTotalsDto {
  cantidad_total: number;
  valorizacion_bruta_total: number;
  descuento_total: number;
  valorizacion_neta_total: number;
}

/**
 * Complete Page 2 data for valuation PDF (RESUMEN ACUMULADO)
 */
export interface ValuationPage2Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  history: ValuationHistoryItemDto[];
  totals: ValuationHistoryTotalsDto;
  fecha_impresion: Date;
}

/**
 * Complete Page 3 data (DETALLE DE COMBUSTIBLE)
 */
export interface ValuationPage3Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  combustible_detalle: FuelConsumptionDetailDto[];
  total_cantidad: number;
  total_importe: number;
  fecha_impresion: Date;
}

/**
 * Complete Page 4 data (EXCESO DE COMBUSTIBLE)
 */
export interface ValuationPage4Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  exceso_combustible?: ExcessFuelDetailDto;
  fecha_impresion: Date;
}

/**
 * Complete Page 5 data (GASTOS DE OBRA)
 */
export interface ValuationPage5Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  gastos_obra: WorkExpenseDetailDto[];
  total_gastos_sin_igv: number;
  total_gastos_con_igv: number;
  fecha_impresion: Date;
}

/**
 * Complete Page 6 data (ADELANTOS/AMORTIZACIONES)
 */
export interface ValuationPage6Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  adelantos: AdvanceDetailDto[];
  total_adelantos: number;
  total_amortizaciones: number;
  saldo_neto: number;
  fecha_impresion: Date;
}

/**
 * Complete Page 7 data (RESUMEN Y FIRMAS)
 */
export interface ValuationPage7Dto {
  equipo: ValuationEquipmentDto;
  proveedor: ValuationProviderDto;
  valorizacion: ValuationHeaderDto;
  financiero: ValuationFinancialDto;
  preparado_por?: string;
  revisado_por?: string;
  aprobado_por?: string;
  fecha_aprobacion?: Date;
  observaciones?: string;
  fecha_impresion: Date;
}

/**
 * Complete valuation details including all pages data
 */
export interface ValuationCompleteDto extends ValuationPage1Dto {
  // Page 2-3 data
  combustible_detalles?: FuelConsumptionDetailDto[];
  gasto_obra_detalles?: WorkExpenseDetailDto[];
  adelanto_detalles?: AdvanceDetailDto[];
  exceso_combustible_detalles?: ExcessFuelDetailDto[];
}
