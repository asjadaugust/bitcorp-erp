export interface Provider {
  id: number;
  code: string;
  business_name: string; // razon_social
  tax_id: string; // ruc
  commercial_name?: string; // nombre_comercial
  provider_type: 'rental' | 'owned' | 'service' | 'material'; // tipo_proveedor
  address?: string;
  phone?: string;
  email?: string;
  contact_name?: string;
  payment_terms?: string; // condiciones_pago
  status: 'active' | 'inactive' | 'blacklisted';
  created_at?: string;
  updated_at?: string;
}
