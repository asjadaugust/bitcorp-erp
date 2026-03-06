export type ProveedorEstado =
  | 'ACTIVO'
  | 'EN_EVALUACION'
  | 'HOMOLOGADO'
  | 'LISTA_NEGRA'
  | 'EMPRESA_CERRADA';

export interface Provider {
  id: number;
  legacy_id?: string;
  razon_social: string;
  ruc: string;
  nombre_comercial?: string;
  tipo_proveedor?: string | string[] | null;
  direccion?: string;
  telefono?: string;
  correo_electronico?: string;
  estado_contribuyente?: string;
  condicion_contribuyente?: string;
  is_active: boolean;
  estado?: ProveedorEstado;
  created_at: Date | string;
  updated_at: Date | string;
}
