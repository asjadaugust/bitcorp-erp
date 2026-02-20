import { AppDataSource } from '../config/database.config';
import { PrecalentamientoConfig } from '../models/precalentamiento-config.model';
import { NotFoundError } from '../errors';
import logger from '../utils/logger';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface PrecalentamientoConfigDto {
  id: number;
  tipo_equipo_id: number;
  tipo_equipo_codigo: string;
  tipo_equipo_nombre: string;
  categoria_prd: string;
  horas_precalentamiento: number;
  activo: boolean;
  updated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class PrecalentamientoConfigService {
  private get repository() {
    return AppDataSource.getRepository(PrecalentamientoConfig);
  }

  private toDto(entity: PrecalentamientoConfig): PrecalentamientoConfigDto {
    return {
      id: entity.id,
      tipo_equipo_id: entity.tipoEquipoId,
      tipo_equipo_codigo: entity.tipoEquipo?.codigo ?? '',
      tipo_equipo_nombre: entity.tipoEquipo?.nombre ?? '',
      categoria_prd: entity.tipoEquipo?.categoriaPrd ?? '',
      horas_precalentamiento: parseFloat(entity.horasPrecalentamiento as unknown as string) || 0,
      activo: entity.activo,
      updated_at: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  /** Devuelve todas las configuraciones, ordenadas por categoría y nombre */
  async listar(): Promise<PrecalentamientoConfigDto[]> {
    const configs = await this.repository.find({
      order: {
        tipoEquipo: { categoriaPrd: 'ASC', nombre: 'ASC' },
      },
    });

    logger.info('Configs precalentamiento listadas', {
      total: configs.length,
      context: 'PrecalentamientoConfigService.listar',
    });

    return configs.map((c) => this.toDto(c));
  }

  /** Devuelve la config para un tipo de equipo específico (o null si no existe) */
  async obtenerPorTipoEquipo(tipoEquipoId: number): Promise<PrecalentamientoConfigDto | null> {
    const config = await this.repository.findOne({ where: { tipoEquipoId } });
    if (!config) return null;
    return this.toDto(config);
  }

  /** Devuelve solo las horas de precalentamiento para un tipo de equipo (0 si no existe) */
  async obtenerHoras(tipoEquipoId: number): Promise<number> {
    const config = await this.repository.findOne({
      where: { tipoEquipoId, activo: true },
    });
    return config ? parseFloat(config.horasPrecalentamiento as unknown as string) || 0 : 0;
  }

  /** Actualiza las horas de precalentamiento para un tipo de equipo */
  async actualizar(tipoEquipoId: number, horas: number): Promise<PrecalentamientoConfigDto> {
    const config = await this.repository.findOne({ where: { tipoEquipoId } });
    if (!config) {
      throw new NotFoundError('PrecalentamientoConfig', tipoEquipoId);
    }

    config.horasPrecalentamiento = horas;
    const saved = await this.repository.save(config);

    logger.info('Config precalentamiento actualizada', {
      tipoEquipoId,
      horas,
      context: 'PrecalentamientoConfigService.actualizar',
    });

    return this.toDto(saved);
  }
}
