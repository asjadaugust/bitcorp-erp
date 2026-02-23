import { TipoCombustibleVale, EstadoVale } from '../../models/vale-combustible.model';

export interface ValeDto {
  id: number;
  codigo: string;
  parte_diario_id: number | null;
  equipo_id: number;
  proyecto_id: number | null;
  fecha: string;
  numero_vale: string;
  tipo_combustible: TipoCombustibleVale;
  cantidad_galones: number;
  precio_unitario: number | null;
  monto_total: number | null;
  proveedor: string | null;
  observaciones: string | null;
  estado: EstadoVale;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreateValeDto {
  parte_diario_id?: number | null;
  equipo_id: number;
  proyecto_id?: number | null;
  fecha: string;
  numero_vale: string;
  tipo_combustible: TipoCombustibleVale;
  cantidad_galones: number;
  precio_unitario?: number | null;
  proveedor?: string | null;
  observaciones?: string | null;
}

export interface UpdateValeDto {
  parte_diario_id?: number | null;
  fecha?: string;
  numero_vale?: string;
  tipo_combustible?: TipoCombustibleVale;
  cantidad_galones?: number;
  precio_unitario?: number | null;
  proveedor?: string | null;
  observaciones?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toValeDto(entity: Record<string, any>): ValeDto {
  const fecha =
    entity.fecha instanceof Date
      ? entity.fecha.toISOString().slice(0, 10)
      : String(entity.fecha).slice(0, 10);

  return {
    id: entity.id,
    codigo: entity.codigo,
    parte_diario_id: entity.parteDiarioId ?? null,
    equipo_id: entity.equipoId,
    proyecto_id: entity.proyectoId ?? null,
    fecha,
    numero_vale: entity.numeroVale,
    tipo_combustible: entity.tipoCombustible,
    cantidad_galones: Number(entity.cantidadGalones),
    precio_unitario: entity.precioUnitario != null ? Number(entity.precioUnitario) : null,
    monto_total: entity.montoTotal != null ? Number(entity.montoTotal) : null,
    proveedor: entity.proveedor ?? null,
    observaciones: entity.observaciones ?? null,
    estado: entity.estado,
    creado_por: entity.creadoPor ?? null,
    created_at:
      entity.createdAt instanceof Date ? entity.createdAt.toISOString() : String(entity.createdAt),
    updated_at:
      entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : String(entity.updatedAt),
  };
}
