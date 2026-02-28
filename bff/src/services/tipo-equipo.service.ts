import { AppDataSource } from '../config/database.config';
import { TipoEquipo, CategoriaPrd } from '../models/tipo-equipo.model';
import { NotFoundError } from '../errors';
import logger from '../utils/logger';

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface TipoEquipoDto {
  id: number;
  codigo: string;
  nombre: string;
  categoria_prd: CategoriaPrd;
  descripcion: string | null;
  activo: boolean;
}

export interface CategoriaPrdDto {
  categoria_prd: CategoriaPrd;
  label: string;
  tipos: TipoEquipoDto[];
}

// ─── Label map ────────────────────────────────────────────────────────────────

export const CATEGORIA_PRD_LABELS: Record<CategoriaPrd, string> = {
  MAQUINARIA_PESADA: 'Maquinaria Pesada',
  VEHICULOS_PESADOS: 'Vehículos Pesados',
  VEHICULOS_LIVIANOS: 'Vehículos Livianos',
  EQUIPOS_MENORES: 'Equipos Menores',
};

export const CATEGORIAS_PRD_ORDER: CategoriaPrd[] = [
  'MAQUINARIA_PESADA',
  'VEHICULOS_PESADOS',
  'VEHICULOS_LIVIANOS',
  'EQUIPOS_MENORES',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDto(entity: TipoEquipo): TipoEquipoDto {
  return {
    id: entity.id,
    codigo: entity.codigo,
    nombre: entity.nombre,
    categoria_prd: entity.categoriaPrd,
    descripcion: entity.descripcion ?? null,
    activo: entity.activo,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TipoEquipoService {
  private get repository() {
    return AppDataSource.getRepository(TipoEquipo);
  }

  /** Return all active tipos ordered by category + nombre */
  async listar(): Promise<TipoEquipoDto[]> {
    const tipos = await this.repository.find({
      where: { activo: true },
      order: { categoriaPrd: 'ASC', nombre: 'ASC' },
    });

    logger.info('Tipos de equipo listados', {
      total: tipos.length,
      context: 'TipoEquipoService.listar',
    });

    return tipos.map(toDto);
  }

  /** Return tipos grouped by categoria_prd */
  async listarAgrupados(): Promise<CategoriaPrdDto[]> {
    const tipos = await this.listar();

    const grupos = CATEGORIAS_PRD_ORDER.map((cat) => ({
      categoria_prd: cat,
      label: CATEGORIA_PRD_LABELS[cat],
      tipos: tipos.filter((t) => t.categoria_prd === cat),
    }));

    return grupos.filter((g) => g.tipos.length > 0);
  }

  /** Return tipos for a specific categoria_prd */
  async listarPorCategoria(categoriaPrd: CategoriaPrd): Promise<TipoEquipoDto[]> {
    const tipos = await this.repository.find({
      where: { categoriaPrd, activo: true },
      order: { nombre: 'ASC' },
    });
    return tipos.map(toDto);
  }

  /** Get single tipo by ID */
  async obtenerPorId(id: number): Promise<TipoEquipoDto> {
    const tipo = await this.repository.findOne({ where: { id } });
    if (!tipo) {
      throw new NotFoundError('TipoEquipo', id);
    }
    return toDto(tipo);
  }
}
