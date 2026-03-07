/**
 * Canonical constants for Parte Diario (Daily Report) module.
 * Shared across Admin, Operator, and Mobile surfaces.
 */

export interface LabelValue<T = string> {
  label: string;
  value: T;
}

// ─── Turno ─────────────────────────────────────────────────────────

export const TURNO_OPTIONS: LabelValue[] = [
  { label: 'Dia', value: 'DIA' },
  { label: 'Noche', value: 'NOCHE' },
];

// ─── Weather ───────────────────────────────────────────────────────

export const WEATHER_OPTIONS: LabelValue[] = [
  { label: 'Soleado', value: 'SOLEADO' },
  { label: 'Parcialmente Nublado', value: 'PARCIALMENTE_NUBLADO' },
  { label: 'Nublado', value: 'NUBLADO' },
  { label: 'Lluvioso', value: 'LLUVIOSO' },
  { label: 'Tormenta', value: 'TORMENTA' },
];

// ─── Estados (status workflow) ─────────────────────────────────────

export interface EstadoConfig {
  label: string;
  badgeClass: string;
}

export const PARTE_DIARIO_ESTADOS: Record<string, EstadoConfig> = {
  BORRADOR:             { label: 'Borrador',          badgeClass: 'neutral' },
  PENDIENTE:            { label: 'Pendiente',         badgeClass: 'info' },
  APROBADO:             { label: 'Aprobado',          badgeClass: 'success' },
  RECHAZADO:            { label: 'Rechazado',         badgeClass: 'error' },
  APROBADO_SUPERVISOR:  { label: 'Aprob. Supervisor', badgeClass: 'info' },
  REVISADO_COSTOS:      { label: 'Rev. Costos',       badgeClass: 'info' },
  PENDIENTE_FINANZAS:   { label: 'Pend. Finanzas',    badgeClass: 'info' },
  APROBADO_FINANZAS:    { label: 'Aprob. Finanzas',   badgeClass: 'success' },
  ENVIADO:              { label: 'Enviado',            badgeClass: 'info' },
};

export const ESTADO_FILTER_OPTIONS: LabelValue[] = Object.entries(PARTE_DIARIO_ESTADOS).map(
  ([value, config]) => ({ label: config.label, value })
);

// ─── Activity Codes (Produccion) ───────────────────────────────────

export const ACTIVITY_CODES: LabelValue[] = [
  { label: 'TP - Trabajo Productivo', value: 'TP' },
  { label: 'TC - Trabajo Contributario', value: 'TC' },
  { label: 'TNC - Trabajo No Contributario', value: 'TNC' },
  { label: 'MO - Movilizacion', value: 'MO' },
  { label: 'ES - Espera', value: 'ES' },
  { label: 'MT - Mantenimiento', value: 'MT' },
  { label: 'AB - Abastecimiento', value: 'AB' },
  { label: 'PC - Precalentamiento', value: 'PC' },
  { label: 'OT - Otros', value: 'OT' },
];

// ─── Delay Codes ───────────────────────────────────────────────────

export const DELAY_CODES_OPERATIVA: LabelValue[] = [
  { label: 'DO1 - Falta de frente', value: 'DO1' },
  { label: 'DO2 - Falta de material', value: 'DO2' },
  { label: 'DO3 - Clima adverso', value: 'DO3' },
  { label: 'DO4 - Falta de operador', value: 'DO4' },
  { label: 'DO5 - Falta de combustible', value: 'DO5' },
  { label: 'DO6 - Voladura', value: 'DO6' },
  { label: 'DO7 - Acceso restringido', value: 'DO7' },
  { label: 'DO8 - Otros', value: 'DO8' },
];

export const DELAY_CODES_MECANICA: LabelValue[] = [
  { label: 'DM1 - Falla de motor', value: 'DM1' },
  { label: 'DM2 - Falla hidraulica', value: 'DM2' },
  { label: 'DM3 - Falla electrica', value: 'DM3' },
  { label: 'DM4 - Falla de tren de rodaje', value: 'DM4' },
  { label: 'DM5 - Mantenimiento preventivo', value: 'DM5' },
  { label: 'DM6 - Mantenimiento correctivo', value: 'DM6' },
  { label: 'DM7 - Otros', value: 'DM7' },
];
