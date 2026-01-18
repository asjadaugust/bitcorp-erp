export interface Contract {
  id: number; // Changed from string to number to match API
  legacy_id?: string;
  numero_contrato: string;

  // Equipment references (Spanish snake_case to match API)
  equipo_id: number; // Changed from equipment_id
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

  // Options
  incluye_motor: boolean;
  incluye_operador: boolean;
  costo_adicional_motor?: string; // API returns string
  horas_incluidas?: number;
  penalidad_exceso?: string; // API returns string

  // Additional info
  condiciones_especiales?: string;
  documento_url?: string;
  estado: string; // ACTIVO, VENCIDO, etc. (Spanish uppercase)

  // Metadata
  created_at?: string;
  updated_at?: string;
  creado_por?: number;
}
