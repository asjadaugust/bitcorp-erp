export interface Provider {
  id: number;
  legacy_id?: string;
  razon_social: string;
  ruc: string;
  nombre_comercial?: string;
  tipo_proveedor?: 'EQUIPO_PESADO' | 'SERVICIOS' | 'REPUESTOS' | 'COMBUSTIBLE' | 'OTROS';
  direccion?: string;
  telefono?: string;
  email?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}
