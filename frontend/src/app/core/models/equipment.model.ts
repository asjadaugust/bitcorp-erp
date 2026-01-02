export interface Equipment {
  id: number;
  legacy_id?: string;
  codigo_equipo: string;
  equipment_type_id?: number;
  provider_id?: number;
  // provider relation handled below
  tipo_proveedor?: string;
  categoria?: string;
  placa?: string;
  marca?: string;
  modelo?: string;
  numero_serie_equipo?: string;
  numero_chasis?: string;
  numero_serie_motor?: string;
  anio_fabricacion?: number;
  potencia_neta?: number;
  tipo_motor?: string;
  medidor_uso?: string; // horometro | odometro
  estado: string; // disponible etc
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;

  // Relations
  provider?: {
    id: number;
    ruc: string;
    razon_social: string;
    tipo_proveedor?: string;
  };
}
