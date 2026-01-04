export interface Equipment {
  id: number;
  code: string;
  equipment_type_id: number | null;
  provider_id: number | null;
  provider_name: string | null;
  provider_type: string | null;
  category: string | null;
  plate_number: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  chassis_number: string | null;
  engine_serial_number: string | null;
  manufacture_year: number | null;
  net_power: number | null;
  engine_type: string | null;
  meter_type: string | null;
  status: string;
  is_active: boolean;
  created_by: number | null;
  updated_by: number | null;
  created_at: Date | string;
  updated_at: Date | string;
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
