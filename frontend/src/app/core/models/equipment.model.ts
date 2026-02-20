export interface Equipment {
  id: number;
  codigo_equipo: string;
  categoria: string | null;
  tipo_equipo_id: number | null;
  tipo_equipo_nombre: string | null;
  categoria_prd: string | null;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  estado: string;
  tipo_proveedor: string | null;
  es_propio: boolean; // true when tipo_proveedor === 'PROPIO'
  proveedor_id: number | null;
  proveedor_nombre: string | null;
  is_active: boolean;

  // Additional fields (if present in API)
  numero_serie_equipo?: string | null;
  numero_chasis?: string | null;
  numero_serie_motor?: string | null;
  anio_fabricacion?: number | null;
  potencia_neta?: number | null;
  tipo_motor?: string | null;
  medidor_uso?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;

  // Virtual/Joined fields used in templates
  tipo_medicion?: string | null;
  razon_social?: string | null;
  clase?: string | null;
  nombre_proyecto?: string | null;
}

export interface EquipmentListResponse {
  success: true;
  data: Equipment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface EquipmentResponse {
  success: true;
  data: Equipment;
}
