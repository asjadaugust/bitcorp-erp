export interface MaintenanceRecord {
  id: number;
  equipment_id: number;
  maintenance_type: 'preventive' | 'corrective' | 'predictive';
  description: string;
  start_date: string;
  end_date?: string;
  cost: number;
  provider_id?: number;
  provider_name?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  hourmeter_reading?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  equipment?: {
    id: number;
    code: string;
    equipment_code?: string;
    brand: string;
    model: string;
  };
  provider?: {
    id: number;
    business_name: string;
  };
}
