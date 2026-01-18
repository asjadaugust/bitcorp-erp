export interface Provider {
  id: number;
  legacy_id?: string;
  razon_social: string;
  ruc: string;
  nombre_comercial?: string;
  tipo_proveedor?:
    | 'EQUIPO_PESADO'
    | 'SERVICIOS'
    | 'REPUESTOS'
    | 'COMBUSTIBLE'
    | 'OTROS'
    | 'EQUIPOS';
  direccion?: string;
  telefono?: string;
  correo_electronico?: string; // Changed from email to match API
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}
