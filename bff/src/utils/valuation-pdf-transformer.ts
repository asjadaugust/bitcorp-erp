/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Valuation PDF DTO Transformers
 * Transforms database entities to DTOs for PDF generation
 * Following ARCHITECTURE.md: Explicit transformation with snake_case naming
 */

import { Valorizacion } from '../models/valuation.model';
import { Contract } from '../models/contract.model';
import { Equipment } from '../models/equipment.model';
import { ExcessFuel } from '../models/excess-fuel.model';
import { WorkExpense } from '../models/work-expense.model';
import { AdvanceAmortization } from '../models/advance-amortization.model';
import {
  ValuationPage1Dto,
  ValuationPage2Dto,
  ValuationPage3Dto,
  ValuationPage4Dto,
  ValuationPage5Dto,
  ValuationPage6Dto,
  ValuationPage7Dto,
  ValuationEquipmentDto,
  ValuationProviderDto,
  ValuationContractDto,
  ValuationHeaderDto,
  ValuationFinancialDto,
  ValuationHistoryItemDto,
  ValuationHistoryTotalsDto,
  FuelConsumptionDetailDto,
  ExcessFuelDetailDto,
  WorkExpenseDetailDto,
  AdvanceDetailDto,
} from '../types/dto/valuation-pdf.dto';

/**
 * Transform valuation entity and related data to Page 1 DTO
 */
export function transformToValuationPage1Dto(
  valuation: Valorizacion,
  contract: Contract,
  equipment: Equipment,
  financialTotals?: {
    importe_gasto_obra?: number;
    importe_adelanto?: number;
    importe_exceso_combustible?: number;
  },
  precioManipuleo: number = 0.8
): ValuationPage1Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Contract information
  const contratoDto: ValuationContractDto = {
    numero_contrato: contract.numeroContrato || '',
    tipo_documento: contract.tipo || 'CONTRATO',
    modalidad: 'MÁQUINA SECA NO OPERADA', // Default - field removed from model
    tipo_tarifa: contract.tipoTarifa,
    tarifa: parseFloat(String(contract.tarifa || 0)),
    moneda:
      contract.moneda === 'USD'
        ? 'USD'
        : contract.moneda === 'PEN'
          ? 'SOLES'
          : contract.moneda || 'SOLES',
    minimo_por: 'MES', // Default - field removed from model
    cantidad_minima: contract.horasIncluidas || 0,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Financial calculations
  const financieroDto: ValuationFinancialDto = calculateFinancials(
    valuation,
    contract,
    financialTotals,
    precioManipuleo
  );

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    contrato: contratoDto,
    valorizacion: valorizacionDto,
    financiero: financieroDto,
  };
}

/**
 * Calculate financial summary from valuation data
 */
function calculateFinancials(
  valuation: Valorizacion,
  contract: Contract,
  financialTotals?: {
    importe_gasto_obra?: number;
    importe_adelanto?: number;
    importe_exceso_combustible?: number;
  },
  precioManipuleo: number = 0.8
): ValuationFinancialDto {
  // Parse all numeric values (TypeORM returns decimals as strings)
  const horasTrabajadas = parseFloat(String(valuation.horasTrabajadas || 0));
  const diasTrabajados = valuation.diasTrabajados || 0;
  const combustibleConsumido = parseFloat(String(valuation.combustibleConsumido || 0));
  const costoBase = parseFloat(String(valuation.costoBase || 0));
  const costoCombustible = parseFloat(String(valuation.costoCombustible || 0));
  const cargosAdicionales = parseFloat(String(valuation.cargosAdicionales || 0));
  const tarifa = parseFloat(String(contract.tarifa || 0));

  // Determine unit of measure based on meter type
  const unidadMedida = contract.tipoTarifa?.toUpperCase().includes('HORA') ? 'H-M' : 'D-C';
  const cantidad = unidadMedida === 'H-M' ? horasTrabajadas : diasTrabajados;

  // Base valuation (can override from DB or calculate)
  const valorizacionBruta = costoBase > 0 ? costoBase : cantidad * tarifa;

  // Fuel costs
  const precioCombustible = combustibleConsumido > 0 ? costoCombustible / combustibleConsumido : 0;

  // Fuel handling charge (configurable, defaults to S/. 0.80 per gallon)
  const precioManipuleoCombustible = precioManipuleo;
  const importeManipuleoCombustible = combustibleConsumido * precioManipuleoCombustible;

  // Work expenses
  const importeGastoObra = financialTotals?.importe_gasto_obra || 0;

  // Advances/prepayments
  const importeAdelanto = financialTotals?.importe_adelanto || 0;

  // Excess fuel charges
  const importeExcesoCombustible = financialTotals?.importe_exceso_combustible || 0;

  // Total discounts (negative amounts reduce the valuation)
  const descuentoTotal =
    costoCombustible +
    importeManipuleoCombustible +
    importeGastoObra +
    importeAdelanto +
    importeExcesoCombustible;

  // Net valuation
  // cargos_adicionales (excess hours) are ADDED to base valuation or handled separately?
  // In ValuationService.calculateValuation: totalEstimated = costoBase + excessCost
  // So cargos_adicionales should be ADDED to valorizacionBruta or listed as an ADDITION.
  const valorizacionTotalBruta = valorizacionBruta + cargosAdicionales;

  // Net valuation = (Base + Excess Hours) - (Fuel + Handling + Expenses + Advances + Excess Fuel)
  const valorizacionNeta = valorizacionTotalBruta - descuentoTotal;

  // IGV (18% by default, can be overridden)
  const igvPorcentaje = parseFloat(String(valuation.igvPorcentaje || 18));
  const igv = valorizacionNeta * (igvPorcentaje / 100);

  // Total to invoice
  const netoFacturar = valorizacionNeta + igv;

  return {
    cantidad,
    unidad_medida: unidadMedida,
    precio_unitario: tarifa,
    valorizacion_bruta: valorizacionBruta,
    cantidad_combustible: combustibleConsumido,
    precio_combustible: precioCombustible,
    importe_combustible: costoCombustible,
    precio_manipuleo_combustible: precioManipuleoCombustible,
    importe_manipuleo_combustible: importeManipuleoCombustible,
    importe_gasto_obra: importeGastoObra,
    importe_adelanto: importeAdelanto,
    importe_exceso_combustible: importeExcesoCombustible,
    cargos_adicionales: cargosAdicionales,
    valorizacion_neta: valorizacionNeta,
    igv,
    neto_facturar: netoFacturar,
  };
}

/**
 * Transform valuation entity and related data to Page 2 DTO (RESUMEN ACUMULADO)
 */
export function transformToValuationPage2Dto(
  currentValuation: Valorizacion,
  historicalValuations: Valorizacion[],
  equipment: Equipment,
  precioManipuleo: number = 0.8
): ValuationPage2Dto {
  // Equipment information (reuse from Page 1)
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information (reuse from Page 1)
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header (reuse from Page 1)
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion:
      currentValuation.legacyId || `VAL-${String(currentValuation.id).padStart(3, '0')}`,
    numero_valorizacion:
      currentValuation.numeroValorizacion || String(currentValuation.id).padStart(3, '0'),
    fecha_inicio: currentValuation.fechaInicio,
    fecha_fin: currentValuation.fechaFin,
    tipo_cambio: parseFloat(String(currentValuation.tipoCambio || 1.0)),
  };

  // Transform historical valuations to history items
  const history: ValuationHistoryItemDto[] = historicalValuations.map((val) => {
    const contract = (val as any).contract;
    const horasTrabajadas = parseFloat(String(val.horasTrabajadas || 0));
    const diasTrabajados = val.diasTrabajados || 0;
    const costoBase = parseFloat(String(val.costoBase || 0));
    const costoCombustible = parseFloat(String(val.costoCombustible || 0));
    const tarifa = contract ? parseFloat(String(contract.tarifa || 0)) : 0;

    // Determine unit of measure
    const unidadMedida = contract?.tipoTarifa?.toUpperCase().includes('HORA') ? 'H-M' : 'D-C';
    const cantidad = unidadMedida === 'H-M' ? horasTrabajadas : diasTrabajados;

    // Calculate amounts
    const valorizacionBruta = costoBase > 0 ? costoBase : cantidad * tarifa;

    // Calculate total discounts (fuel, handling, work expenses, advances, excess fuel)
    const combustibleConsumido = parseFloat(String(val.combustibleConsumido || 0));
    const precioManipuleoCombustible = precioManipuleo;
    const importeManipuleoCombustible = combustibleConsumido * precioManipuleoCombustible;
    const descuentoTotal = costoCombustible + importeManipuleoCombustible;

    const valorizacionNeta = valorizacionBruta - descuentoTotal;

    return {
      numero_contrato_adenda: contract?.numeroContrato || '',
      numero_valorizacion: val.numeroValorizacion || String(val.id).padStart(3, '0'),
      fecha_inicio: val.fechaInicio,
      fecha_fin: val.fechaFin,
      cantidad_valorizacion: cantidad,
      unidad_medida: unidadMedida,
      tarifa_contrato_pu: tarifa,
      valorizacion_bruta: valorizacionBruta,
      descuento_total: descuentoTotal,
      valorizacion_neta: valorizacionNeta,
    };
  });

  // Calculate totals
  const totals: ValuationHistoryTotalsDto = {
    cantidad_total: history.reduce((sum, item) => sum + item.cantidad_valorizacion, 0),
    valorizacion_bruta_total: history.reduce((sum, item) => sum + item.valorizacion_bruta, 0),
    descuento_total: history.reduce((sum, item) => sum + item.descuento_total, 0),
    valorizacion_neta_total: history.reduce((sum, item) => sum + item.valorizacion_neta, 0),
  };

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    history,
    totals,
    fecha_impresion: new Date(),
  };
}

/**
 * Helper: Parse numeric value from string or number
 */
export function parseNumeric(value: any, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Transform to Page 3 DTO (DETALLE DE COMBUSTIBLE)
 */
export function transformToValuationPage3Dto(
  valuation: Valorizacion,
  fuelRecords: any[],
  equipment: Equipment
): ValuationPage3Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Transform fuel records
  const combustible_detalle: FuelConsumptionDetailDto[] = fuelRecords.map((f) => ({
    fecha: f.fecha,
    num_vale_salida: String(f.numero_documento || ''),
    horometro_odometro: f.tipo_combustible || 'DIESEL', // Use tipo_combustible as fallback if horo/odo not in this table
    inicial: 0, // Not present in this table
    cantidad: parseFloat(String(f.cantidad || 0)),
    precio_unitario_sin_igv: parseFloat(String(f.precio_unitario || 0)),
    precio_unitario: parseFloat(String(f.precio_unitario || 0)), // Add for template compatibility
    importe: parseFloat(String(f.monto_total || 0)),
    comentario: f.observaciones,
  }));

  // Calculate totals
  const total_cantidad = combustible_detalle.reduce((sum, item) => sum + item.cantidad, 0);
  const total_importe = combustible_detalle.reduce((sum, item) => sum + item.importe, 0);

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    combustible_detalle,
    total_cantidad,
    total_importe,
    fecha_impresion: new Date(),
  };
}

/**
 * Transform to Page 4 DTO (EXCESO DE COMBUSTIBLE)
 */
export function transformToValuationPage4Dto(
  valuation: Valorizacion,
  excessFuel: ExcessFuel | null,
  equipment: Equipment
): ValuationPage4Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Transform excess fuel record (if exists)
  let exceso_combustible: ExcessFuelDetailDto | undefined;

  if (excessFuel) {
    exceso_combustible = {
      consumo_combustible: parseFloat(String(excessFuel.consumoCombustible || 0)),
      tipo_horo_odo: excessFuel.tipoHoroOdo || 'HORÓMETRO',
      inicio: parseFloat(String(excessFuel.inicio || 0)),
      final: parseFloat(String(excessFuel.final || 0)),
      total: parseFloat(String(excessFuel.total || 0)),
      rendimiento: parseFloat(String(excessFuel.rendimiento || 0)),
      ratio_control: parseFloat(String(excessFuel.ratioControl || 0)),
      diferencia: parseFloat(String(excessFuel.diferencia || 0)),
      exceso_combustible: parseFloat(String(excessFuel.excesoCombustible || 0)),
      precio_unitario: parseFloat(String(excessFuel.precioUnitario || 0)),
      importe_exceso_combustible: parseFloat(String(excessFuel.importeExcesoCombustible || 0)),
    };
  }

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    exceso_combustible,
    fecha_impresion: new Date(),
  };
}

/**
 * Transform to Page 5 DTO (GASTOS DE OBRA)
 */
export function transformToValuationPage5Dto(
  valuation: Valorizacion,
  workExpenses: WorkExpense[],
  equipment: Equipment
): ValuationPage5Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Transform work expenses
  const gastos_obra: WorkExpenseDetailDto[] = workExpenses.map((w) => ({
    fecha_operacion: w.fechaOperacion,
    proveedor: w.proveedor || '',
    concepto: w.concepto || '',
    tipo_documento: w.tipoDocumento,
    num_documento: w.numDocumento,
    importe: parseFloat(String(w.importe || 0)),
    incluye_igv: w.incluyeIgv || 'SI',
    importe_sin_igv: parseFloat(String(w.importeSinIgv || 0)),
  }));

  // Calculate totals
  const total_gastos_sin_igv = gastos_obra.reduce((sum, item) => sum + item.importe_sin_igv, 0);
  const total_gastos_con_igv = gastos_obra.reduce((sum, item) => sum + item.importe, 0);

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    gastos_obra,
    total_gastos_sin_igv,
    total_gastos_con_igv,
    fecha_impresion: new Date(),
  };
}

/**
 * Transform to Page 6 DTO (ADELANTOS/AMORTIZACIONES)
 */
export function transformToValuationPage6Dto(
  valuation: Valorizacion,
  advances: AdvanceAmortization[],
  equipment: Equipment
): ValuationPage6Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Transform advances/amortizations
  const adelantos: AdvanceDetailDto[] = advances.map((a) => ({
    fecha_operacion: a.fechaOperacion,
    tipo_operacion: a.tipoOperacion,
    num_documento: a.numDocumento,
    concepto: a.concepto || '',
    num_cuota: a.numCuota,
    monto: parseFloat(String(a.monto || 0)),
  }));

  // Calculate totals (adelantos are positive, amortizaciones are negative)
  const total_adelantos = adelantos
    .filter((a) => a.tipo_operacion === 'ADELANTO')
    .reduce((sum, item) => sum + item.monto, 0);

  const total_amortizaciones = adelantos
    .filter((a) => a.tipo_operacion === 'AMORTIZACION')
    .reduce((sum, item) => sum + Math.abs(item.monto), 0);

  const saldo_neto = total_adelantos - total_amortizaciones;

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    adelantos,
    total_adelantos,
    total_amortizaciones,
    saldo_neto,
    fecha_impresion: new Date(),
  };
}

/**
 * Transform to Page 7 DTO (RESUMEN Y FIRMAS)
 */
export function transformToValuationPage7Dto(
  valuation: Valorizacion,
  contract: Contract,
  equipment: Equipment,
  financialTotals?: {
    importe_gasto_obra?: number;
    importe_adelanto?: number;
    importe_exceso_combustible?: number;
  },
  precioManipuleo: number = 0.8
): ValuationPage7Dto {
  // Equipment information
  const equipoDto: ValuationEquipmentDto = {
    codigo_equipo: equipment.codigoEquipo || '',
    nombre: equipment.categoria || '',
    placa: equipment.placa,
    marca: equipment.marca,
    modelo: equipment.modelo,
    tipo_medidor: equipment.medidorUso?.toUpperCase() || 'HORÓMETRO',
    codigo_externo: equipment.legacyId,
  };

  // Provider information
  const proveedorDto: ValuationProviderDto = {
    ruc: (equipment as any).provider?.ruc || '',
    razon_social: (equipment as any).provider?.razon_social || '',
    direccion: (equipment as any).provider?.direccion,
  };

  // Valuation header
  const valorizacionDto: ValuationHeaderDto = {
    id_valorizacion: valuation.legacyId || `VAL-${String(valuation.id).padStart(3, '0')}`,
    numero_valorizacion: valuation.numeroValorizacion || String(valuation.id).padStart(3, '0'),
    fecha_inicio: valuation.fechaInicio,
    fecha_fin: valuation.fechaFin,
    tipo_cambio: parseFloat(String(valuation.tipoCambio || 1.0)),
  };

  // Reuse financial calculation from Page 1
  const financieroDto: ValuationFinancialDto = calculateFinancials(
    valuation,
    contract,
    financialTotals,
    precioManipuleo
  );

  return {
    equipo: equipoDto,
    proveedor: proveedorDto,
    valorizacion: valorizacionDto,
    financiero: financieroDto,
    preparado_por: (valuation as any).creator?.nombres,
    revisado_por: undefined, // Not in current schema
    aprobado_por: (valuation as any).approver?.nombres,
    fecha_aprobacion: (valuation as any).approvedAt,
    observaciones: valuation.observaciones,
    fecha_impresion: new Date(),
  };
}
