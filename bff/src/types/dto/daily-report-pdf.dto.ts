/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Daily Report PDF DTO
 * Represents data structure for generating "PARTE DIARIO DE EQUIPOS" PDF (Form CLUC-GEM-F-005)
 * All field names use snake_case following backend architecture guidelines
 */

// =====================================================
// Main Daily Report PDF DTO
// =====================================================

export interface DailyReportPdfDto {
  // Header section - Form metadata
  razon_social: string; // "Consorcio La Unión"
  codigo_forma: string; // "CLUC-GEM-F-005"
  version: string; // "01"

  // Basic information section
  proyecto: string; // Project name
  fecha: string; // Date (DD/MM/YYYY format)
  turno: 'DIA' | 'NOCHE'; // Shift
  numero_parte: string; // Report number (N° field in red box)
  codigo_equipo: string; // Equipment code (CÓDIGO field)
  empresa: string; // Company name (EMPRESA field)
  equipo: string; // Equipment description
  operador: string; // Operator name
  placa?: string; // License plate (PLACA field)
  responsable_frente?: string; // Site supervisor (RESPONSABLE DE FRENTE)

  // Hourmeter/Odometer section (left table)
  horometro_inicial?: number;
  horometro_final?: number;
  horometro_total?: number; // Calculated difference
  kilometraje_inicial?: number;
  kilometraje_final?: number;
  kilometraje_total?: number; // Calculated difference

  // Fuel section (middle table)
  petroleo_gln?: number; // Diesel in gallons (Petroleo D-2 Gln)
  gasolina_gln?: number; // Gasoline in gallons (Gasolina Gln)
  hora_abastecimiento?: string; // Refueling time (HH:MM format)
  num_vale_combustible?: string; // Fuel voucher number (N° Vale Combustible)
  horometro_kilometraje?: string; // Reading at refueling (Horómetro / Kilometraje)

  // Pre-warming hours (Anexo B, per tipo_equipo)
  horas_precalentamiento?: number; // From precalentamiento_config or manual override

  // Location section (right boxes)
  lugar_salida?: string; // Departure location (Lugar de Salida)
  lugar_llegada?: string; // Arrival location (Lugar de Llegada)

  // Production control table (up to 16 rows)
  produccion: ProductionRowDto[];

  // Activities checkboxes - ACTIVIDADES DE PRODUCCIÓN (codes 01-11)
  actividades_produccion: ActivityCheckbox[];

  // Delays checkboxes - DEMORAS OPERATIVAS (codes D01-D07)
  demoras_operativas: string[]; // Array of selected codes

  // Other events checkboxes - OTROS EVENTOS (codes D08-D13)
  otros_eventos: OtherEventCheckbox[];

  // Mechanical delays checkboxes - DEMORAS MECÁNICAS (codes D14-D20)
  demoras_mecanicas: MechanicalDelayCheckbox[];

  // Observations section
  observaciones_correcciones?: string; // OBSERVACIONES / CORRECCIONES text area

  // Signatures section (base64 encoded images from canvas)
  firma_operador?: string; // OPERADOR signature
  firma_supervisor?: string; // SUPERVISOR signature
  firma_jefe_equipos?: string; // JEFE EQUIPOS signature
  firma_residente?: string; // RESIDENTE signature
  firma_planeamiento_control?: string; // PLANEAMIENTO Y CONTROL signature
}

// =====================================================
// Production Control Row DTO
// =====================================================

export interface ProductionRowDto {
  numero: number; // Row number (01-16)
  ubicacion_prog_ini?: string; // Ubicación Labores - Prog. Ini.
  ubicacion_prog_fin?: string; // Ubicación Labores - Prog. Fin.
  hora_ini?: string; // Hora Ini. (HH:MM format)
  hora_fin?: string; // Hora Fin. (HH:MM format)
  material_descripcion?: string; // Material Trabajado o Descripción Actividad
  metrado?: string; // METRADO measurement (e.g., "350 m3")
  edt?: string; // EDT code
}

// =====================================================
// Activity Checkboxes DTO
// =====================================================

export interface ActivityCheckbox {
  codigo: string; // '01' through '11'
  descripcion?: string; // For "Otras" activities (codes 09, 10, 11)
}

// Activity code mapping for reference:
// 01 = Corte en Banco
// 02 = Excavación
// 03 = Cargado de Material
// 04 = Relleno
// 05 = Conformado
// 06 = Perfilado
// 07 = Nivelado
// 08 = Compactado
// 09 = Otras (with free text)
// 10 = Otras (with free text)
// 11 = Otras (with free text)

// =====================================================
// Other Event Checkboxes DTO
// =====================================================

export interface OtherEventCheckbox {
  codigo: string; // 'D08' through 'D13'
  descripcion?: string; // For "Otros" event (code D13)
}

// Other event code mapping for reference:
// D08 = Condiciones Climáticas
// D09 = Daños a terceros (Corte de Servicios)
// D10 = Coordinación con Entidades
// D11 = Falta de Personal
// D12 = Esperando Instrucciones
// D13 = Otros (with free text)

// =====================================================
// Mechanical Delay Checkboxes DTO
// =====================================================

export interface MechanicalDelayCheckbox {
  codigo: string; // 'D14' through 'D20'
  descripcion?: string; // For "Otros" delay (code D20)
}

// Mechanical delay code mapping for reference:
// D14 = Falla Mecánica
// D15 = Falla Eléctrica
// D16 = Falla Hidráulica
// D17 = Falla de Neumáticos
// D18 = Mantenimiento Programado
// D19 = Mantenimiento Preventivo
// D20 = Otros (with free text)

// =====================================================
// Operational Delay Codes (for reference)
// =====================================================
// D01 = Falta de Frente
// D02 = Falta de Combustible
// D03 = Falta de Lubricantes
// D04 = Traslado
// D05 = Corte de Tráfico
// D06 = Derrumbe
// D07 = Falta de Agua

// =====================================================
// Constants for dropdown/checkbox options
// =====================================================

export const ACTIVITY_CODES = {
  '01': 'Corte en Banco',
  '02': 'Excavación',
  '03': 'Cargado de Material',
  '04': 'Relleno',
  '05': 'Conformado',
  '06': 'Perfilado',
  '07': 'Nivelado',
  '08': 'Compactado',
  '09': 'Otras',
  '10': 'Otras',
  '11': 'Otras',
};

export const OPERATIONAL_DELAY_CODES = {
  D01: 'Falta de Frente',
  D02: 'Falta de Combustible',
  D03: 'Falta de Lubricantes',
  D04: 'Traslado',
  D05: 'Corte de Tráfico',
  D06: 'Derrumbe',
  D07: 'Falta de Agua',
};

export const OTHER_EVENT_CODES = {
  D08: 'Condiciones Climáticas',
  D09: 'Daños a terceros (Corte de Servicios)',
  D10: 'Coordinación con Entidades',
  D11: 'Falta de Personal',
  D12: 'Esperando Instrucciones',
  D13: 'Otros',
};

export const MECHANICAL_DELAY_CODES = {
  D14: 'Falla Mecánica',
  D15: 'Falla Eléctrica',
  D16: 'Falla Hidráulica',
  D17: 'Falla de Neumáticos',
  D18: 'Mantenimiento Programado',
  D19: 'Mantenimiento Preventivo',
  D20: 'Otros',
};
