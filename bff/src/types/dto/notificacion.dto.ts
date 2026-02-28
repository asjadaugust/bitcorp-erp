export interface NotificacionDto {
  id: number;
  usuario_id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  url: string | null;
  leido: boolean;
  leido_at: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toNotificacionDto(entity: Record<string, any>): NotificacionDto {
  return {
    id: entity.id,
    usuario_id: entity.userId,
    tipo: entity.type,
    titulo: entity.title,
    mensaje: entity.message,
    url: entity.url ?? null,
    leido: entity.read,
    leido_at:
      entity.readAt instanceof Date
        ? entity.readAt.toISOString()
        : entity.readAt
          ? String(entity.readAt)
          : null,
    data: entity.data ?? null,
    created_at:
      entity.createdAt instanceof Date ? entity.createdAt.toISOString() : String(entity.createdAt),
    updated_at:
      entity.updatedAt instanceof Date ? entity.updatedAt.toISOString() : String(entity.updatedAt),
  };
}
