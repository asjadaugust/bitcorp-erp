export interface Provider {
  id: number;
  legacy_id?: string;
  // code: string; // Not in backend entity
  razon_social: string;
  ruc: string;
  nombre_comercial?: string;
  tipo_proveedor?: 'equipment' | 'services' | 'supplies' | 'fuel' | 'other';
  direccion?: string;
  telefono?: string;
  email?: string;
  // contact_name?: string; // Not in backend
  // payment_terms?: string; // Not in backend
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}
