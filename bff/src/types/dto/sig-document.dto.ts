import { SigDocument, EstadoDocumento } from '../../models/sig-document.model';

/**
 * SIG Document List DTO - Minimal fields for list views
 * Used in getAllDocuments endpoint
 */
export interface SigDocumentListDto {
  id: number;
  codigo: string;
  titulo: string;
  tipo_documento?: string;
  estado: EstadoDocumento;
  version?: string;
  created_at: string;
}

/**
 * SIG Document Detail DTO - Full fields for detail view
 * Used in getDocumentById endpoint
 */
export interface SigDocumentDetailDto {
  id: number;
  legacy_id?: string;
  codigo: string;
  titulo: string;
  tipo_documento?: string;
  iso_standard?: string;
  version?: string;
  fecha_emision?: string;
  fecha_revision?: string;
  archivo_url?: string;
  estado: EstadoDocumento;
  creado_por?: number;
  created_at: string;
  updated_at: string;
}

/**
 * SIG Document Create DTO - Fields required for creation
 */
export interface SigDocumentCreateDto {
  codigo: string;
  titulo: string;
  tipo_documento?: string;
  iso_standard?: string;
  version?: string;
  fecha_emision?: string;
  fecha_revision?: string;
  archivo_url?: string;
  estado?: EstadoDocumento;
}

/**
 * SIG Document Update DTO - Fields that can be updated
 */
export interface SigDocumentUpdateDto {
  titulo?: string;
  tipo_documento?: string;
  iso_standard?: string;
  version?: string;
  fecha_emision?: string;
  fecha_revision?: string;
  archivo_url?: string;
  estado?: EstadoDocumento;
}

/**
 * Transform SigDocument entity to List DTO (snake_case, minimal fields)
 */
export function toSigDocumentListDto(entity: SigDocument): SigDocumentListDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    titulo: entity.titulo,
    tipo_documento: entity.tipoDocumento,
    estado: entity.estado,
    version: entity.version,
    created_at: entity.createdAt.toISOString(),
  };
}

/**
 * Transform array of SigDocument entities to List DTOs
 */
export function toSigDocumentListDtoArray(entities: SigDocument[]): SigDocumentListDto[] {
  return entities.map(toSigDocumentListDto);
}

/**
 * Transform SigDocument entity to Detail DTO (snake_case, all fields)
 */
export function toSigDocumentDetailDto(entity: SigDocument): SigDocumentDetailDto {
  return {
    id: entity.id,
    legacy_id: entity.legacyId,
    codigo: entity.codigo,
    titulo: entity.titulo,
    tipo_documento: entity.tipoDocumento,
    iso_standard: entity.isoStandard,
    version: entity.version,
    fecha_emision: entity.fechaEmision?.toISOString().split('T')[0],
    fecha_revision: entity.fechaRevision?.toISOString().split('T')[0],
    archivo_url: entity.archivoUrl,
    estado: entity.estado,
    creado_por: entity.creadoPor,
    created_at: entity.createdAt.toISOString(),
    updated_at: entity.updatedAt.toISOString(),
  };
}
