export interface FuelRecord {
  id: number;
  equipment_id: number;
  date: string;
  gallons: number;
  cost_per_gallon: number;
  total_cost: number;
  provider_id?: number;
  odometer?: number;
  hourmeter?: number;
  created_at?: string;
  updated_at?: string;

  // Relations
  equipment?: {
    id: number;
    code: string;
    brand: string;
    model: string;
  };
  provider?: {
    id: number;
    business_name: string;
  };
}
