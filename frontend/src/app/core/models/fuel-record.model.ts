export type TipoCombustible =
  | 'DIESEL'
  | 'GASOLINA_84'
  | 'GASOLINA_90'
  | 'GASOLINA_95'
  | 'GASOLINA_97'
  | 'GLP'
  | 'GNV';

export interface FuelRecord {
  id: number;
  valorizacion_id: number;
  fecha: Date | string;
  cantidad: number | null;
  precio_unitario: number | null;
  monto_total: number | null;
  tipo_combustible: TipoCombustible | null;
  proveedor: string | null;
  numero_documento: string | null;
  observaciones: string | null;
  created_at: Date | string;
  // Relation fields
  valorizacion_periodo: string | null;
  valorizacion_equipment_id: number | null;
}

export interface FuelListResponse {
  success: true;
  data: FuelRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FuelResponse {
  success: true;
  data: FuelRecord;
}
