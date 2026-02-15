export interface ProviderDocument {
  id: number;
  proveedor_id: number;
  tipo_documento: string;
  numero_documento?: string;
  fecha_emision?: string | Date;
  fecha_vencimiento?: string | Date;
  archivo_url?: string;
  observaciones?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  proveedor_razon_social?: string;
}
