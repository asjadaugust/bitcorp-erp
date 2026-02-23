export interface Contract {
  id: number; // Changed from string to number to match API
  legacy_id?: string;
  numero_contrato: string;

  // Equipment references (Spanish snake_case to match API)
  equipo_id: number; // Changed from equipo_id
  equipo_codigo?: string;
  equipo_marca?: string;
  equipo_modelo?: string;
  equipo_placa?: string;

  // Provider reference
  proveedor_id: number | null; // Changed from provider_id

  // Contract details
  tipo: string; // CONTRATO, ADDENDUM, etc.
  contrato_padre_id?: number | null;
  fecha_contrato: string;
  fecha_inicio: string;
  fecha_fin: string;
  duracion_dias?: number;

  // Pricing
  moneda: 'PEN' | 'USD';
  tipo_tarifa: string; // POR_HORA, POR_DIA, POR_MES, FIJO (Spanish uppercase)
  tarifa: string; // API returns string
  modalidad?: string; // ALQUILER SOLO EQUIPO, etc.
  minimo_por?: string; // DIA, HORA, etc.
  cantidad_minima?: number;

  // Options
  incluye_motor: boolean;
  incluye_operador: boolean;
  costo_adicional_motor?: string; // API returns string
  horas_incluidas?: number;
  penalidad_exceso?: string; // API returns string

  // Ownership proof (Cláusula 2)
  documento_acredita?: string;
  fecha_acreditada?: string;

  // Jurisdiction & duration text (Cláusula 2, 4)
  jurisdiccion?: string;
  plazo_texto?: string;

  // Termination (Cláusula 12) — Resolution & Liquidation
  motivo_resolucion?: string;
  fecha_resolucion?: string;
  monto_liquidacion?: number;
  causal_resolucion?: string;
  resuelto_por?: number;
  fecha_liquidacion?: string;
  liquidado_por?: number;
  observaciones_liquidacion?: string;

  // Additional info
  condiciones_especiales?: string;
  documento_url?: string;
  estado: string; // BORRADOR, ACTIVO, VENCIDO, CANCELADO

  // Metadata
  created_at?: string;
  updated_at?: string;
  creado_por?: number;

  // Display fields (frontend computed)
  modalidad_display?: string;
  tipo_tarifa_display?: string;
  proveedor_razon_social?: string;
  equipo_info?: string;
}

export interface ContractObligacion {
  id: number;
  contrato_id: number;
  tipo_obligacion: string;
  estado: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
  fecha_compromiso?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
}

export const OBLIGACION_LABELS: Record<string, string> = {
  CONDICIONES_OPERATIVAS: 'Equipo en condiciones operativas (§7.1)',
  REPRESENTANTE_FRENTE: 'Representante en frente de trabajo (§7.2)',
  POLIZA_TREC: 'Póliza TREC vigente (§7.3)',
  NORMAS_SEGURIDAD: 'Cumplimiento de normas de seguridad (§7.4)',
  SOAT: 'SOAT vigente (§7.5)',
  REPARACION_REEMPLAZO: 'Reparación/reemplazo en máximo 5 días (§7.6)',
  KIT_ANTIDERRAME: 'Kit anti-derrame y dispositivos de seguridad (§7.7)',
  DOCUMENTOS_VALIDOS: 'Documentos válidos — CITV y licencia operador (§7.8)',
  REEMPLAZO_OPERADOR: 'Reemplazo de operador por renuncia (§7.9)',
};

// ─── Obligaciones del Arrendatario (WS-22 — Cláusula 8) ─────────────────────

export interface ContractObligacionArrendatario {
  id: number;
  contrato_id: number;
  tipo_obligacion: string;
  estado: 'PENDIENTE' | 'CUMPLIDA' | 'INCUMPLIDA';
  fecha_compromiso?: string | null;
  observaciones?: string | null;
  created_at: string;
  updated_at: string;
}

export const OBLIGACION_ARRENDATARIO_LABELS: Record<string, string> = {
  GUARDIANIA: 'Guardianía y custodia del equipo en zona de trabajo (§8.1)',
  SENALIZACION_SEGURIDAD: 'Señalizaciones de seguridad en área de trabajo (§8.2)',
  PAGOS_OPORTUNOS: 'Cumplir con los pagos previstos en Cláusula Quinta (§8.3)',
  NO_TRASLADO_SIN_AUTORIZACION: 'No trasladar equipo sin autorización del arrendador (§8.4)',
};
