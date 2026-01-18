export interface Equipment {
  id: number;
  codigo_equipo: string;
  categoria: string | null;
  marca: string | null;
  modelo: string | null;
  placa: string | null;
  estado: string;
  tipo_proveedor: string | null;
  proveedor_id: number | null;
  proveedor_nombre: string | null;
  is_active: boolean;

  // Additional fields (if present in API)
  equipment_type_id?: number | null;
  serial_number?: string | null;
  chassis_number?: string | null;
  engine_serial_number?: string | null;
  manufacture_year?: number | null;
  net_power?: number | null;
  engine_type?: string | null;
  meter_type?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date | string;
  updated_at?: Date | string;
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
