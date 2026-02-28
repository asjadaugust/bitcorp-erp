import { AppDataSource } from '../config/database.config';
import { ConfiguracionCombustible } from '../models/combustible-config.model';
import logger from '../utils/logger';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface CombustibleConfigDto {
  id: number;
  precio_manipuleo: number;
  activo: boolean;
  updated_by: number | null;
  updated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CombustibleConfigService {
  static readonly DEFAULT_MANIPULEO_RATE = 0.8;

  private get repository() {
    return AppDataSource.getRepository(ConfiguracionCombustible);
  }

  private toDto(entity: ConfiguracionCombustible): CombustibleConfigDto {
    return {
      id: entity.id,
      precio_manipuleo: parseFloat(entity.precioManipuleo as unknown as string) || 0,
      activo: entity.activo,
      updated_by: entity.updatedBy ?? null,
      updated_at: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  /** Returns the current config (first active row) or null */
  async obtener(): Promise<CombustibleConfigDto | null> {
    const config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });
    if (!config) return null;
    return this.toDto(config);
  }

  /** Returns just the manipuleo rate (fallback to 0.80 if no config) */
  async obtenerPrecioManipuleo(): Promise<number> {
    const config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });
    if (!config) return CombustibleConfigService.DEFAULT_MANIPULEO_RATE;
    return (
      parseFloat(config.precioManipuleo as unknown as string) ||
      CombustibleConfigService.DEFAULT_MANIPULEO_RATE
    );
  }

  /** Updates the manipuleo rate */
  async actualizar(precio: number, userId: number): Promise<CombustibleConfigDto> {
    let config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });

    if (!config) {
      config = this.repository.create({
        precioManipuleo: precio,
        activo: true,
        updatedBy: userId,
      });
    } else {
      config.precioManipuleo = precio;
      config.updatedBy = userId;
    }

    const saved = await this.repository.save(config);

    logger.info('Configuración de combustible actualizada', {
      precioManipuleo: precio,
      userId,
      context: 'CombustibleConfigService.actualizar',
    });

    return this.toDto(saved);
  }
}
