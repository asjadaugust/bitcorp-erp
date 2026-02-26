import { DailyReportPhoto } from '../../models/daily-report-photo.model';

export interface ParteDiarioFotoDto {
  id: number;
  parte_diario_id: number;
  filename: string;
  original_name: string | null;
  url: string;
  mime_type: string;
  size: number | null;
  orden: number;
  created_at: string;
}

export function toParteDiarioFotoDto(entity: DailyReportPhoto): ParteDiarioFotoDto {
  return {
    id: entity.id,
    parte_diario_id: entity.parteDiarioId,
    filename: entity.filename,
    original_name: entity.originalName || null,
    url: `/uploads/daily-reports/${entity.filename}`,
    mime_type: entity.mimeType || 'image/jpeg',
    size: entity.size || null,
    orden: entity.orden || 0,
    created_at: entity.createdAt ? entity.createdAt.toISOString() : new Date().toISOString(),
  };
}
