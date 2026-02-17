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

  // Termination (Cláusula 12)
  motivo_resolucion?: string;
  fecha_resolucion?: string;
  monto_liquidacion?: number;

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
