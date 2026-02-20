/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import {
  PeriodoInoperatividad,
  EstadoPeriodoInoperatividad,
} from '../models/periodo-inoperatividad.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import logger from '../utils/logger';

// ─── DTOs ────────────────────────────────────────────────────────────────────

export interface CrearPeriodoDto {
  equipo_id: number;
  contrato_id?: number;
  fecha_inicio: string;
  motivo: string;
  dias_plazo?: number; // defaults to 5 (PRD Clause 7.6)
}

export interface ResolverPeriodoDto {
  fecha_fin: string;
  observaciones_penalidad?: string;
}

export interface AplicarPenalidadDto {
  monto_penalidad: number;
  observaciones_penalidad?: string;
}

export interface PeriodoInoperatividadDto {
  id: number;
  equipo_id: number;
  equipo_codigo: string | null;
  equipo_descripcion: string | null;
  contrato_id: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  dias_inoperativo: number;
  motivo: string;
  estado: string;
  excede_plazo: boolean;
  dias_plazo: number;
  dias_restantes: number | null;
  penalidad_aplicada: boolean;
  monto_penalidad: number | null;
  observaciones_penalidad: string | null;
  resuelto_por: number | null;
  creado_por: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcularDiasInoperativo(fechaInicio: Date, fechaFin?: Date): number {
  const fin = fechaFin ?? new Date();
  const diffMs = fin.getTime() - fechaInicio.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function toDto(
  p: PeriodoInoperatividad,
  equipoCodigo?: string | null,
  equipoDescripcion?: string | null
): PeriodoInoperatividadDto {
  const fechaInicio =
    p.fechaInicio instanceof Date
      ? p.fechaInicio.toISOString().split('T')[0]
      : String(p.fechaInicio);

  const fechaFin = p.fechaFin
    ? p.fechaFin instanceof Date
      ? p.fechaFin.toISOString().split('T')[0]
      : String(p.fechaFin)
    : null;

  // dias_restantes: how many days left before 5-day threshold
  let diasRestantes: number | null = null;
  if (p.estado === 'ACTIVO' && !p.excedePlazo) {
    diasRestantes = Math.max(0, p.diasPlazo - p.diasInoperativo);
  }

  return {
    id: p.id,
    equipo_id: p.equipoId,
    equipo_codigo: equipoCodigo ?? null,
    equipo_descripcion: equipoDescripcion ?? null,
    contrato_id: p.contratoId ?? null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    dias_inoperativo: p.diasInoperativo,
    motivo: p.motivo,
    estado: p.estado,
    excede_plazo: p.excedePlazo,
    dias_plazo: p.diasPlazo,
    dias_restantes: diasRestantes,
    penalidad_aplicada: p.penalidadAplicada,
    monto_penalidad: p.montoPenalidad !== undefined ? Number(p.montoPenalidad) : null,
    observaciones_penalidad: p.observacionesPenalidad ?? null,
    resuelto_por: p.resueltoPor ?? null,
    creado_por: p.creadoPor ?? null,
    created_at: p.createdAt.toISOString(),
    updated_at: p.updatedAt.toISOString(),
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class PeriodoInoperatividadService {
  private get repo() {
    return AppDataSource.getRepository(PeriodoInoperatividad);
  }

  async listar(filtros: {
    equipo_id?: number;
    contrato_id?: number;
    estado?: EstadoPeriodoInoperatividad;
    excede_plazo?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: PeriodoInoperatividadDto[]; total: number }> {
    const { equipo_id, contrato_id, estado, excede_plazo, page = 1, limit = 20 } = filtros;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (equipo_id) {
      params.push(equipo_id);
      whereClause += ` AND p.equipo_id = $${params.length}`;
    }
    if (contrato_id) {
      params.push(contrato_id);
      whereClause += ` AND p.contrato_id = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      whereClause += ` AND p.estado = $${params.length}`;
    }
    if (excede_plazo !== undefined) {
      params.push(excede_plazo);
      whereClause += ` AND p.excede_plazo = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*) as total FROM equipo.periodo_inoperatividad p ${whereClause}`;
    const dataSql = `
      SELECT 
        p.id, p.equipo_id as "equipoId", p.contrato_id as "contratoId", 
        p.fecha_inicio as "fechaInicio", p.fecha_fin as "fechaFin", 
        p.dias_inoperativo as "diasInoperativo", p.motivo, p.estado, 
        p.excede_plazo as "excedePlazo", p.dias_plazo as "diasPlazo", 
        p.penalidad_aplicada as "penalidadAplicada", p.monto_penalidad as "montoPenalidad", 
        p.observaciones_penalidad as "observacionesPenalidad", p.resuelto_por as "resueltoPor", 
        p.creado_por as "creadoPor", p.created_at as "createdAt", p.updated_at as "updatedAt",
        eq.codigo_equipo as eq_codigo_equipo, eq.modelo as eq_modelo
      FROM equipo.periodo_inoperatividad p
      LEFT JOIN equipo.equipo eq ON eq.id = p.equipo_id
      ${whereClause}
      ORDER BY p.fecha_inicio DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      this.repo.manager.query(countSql, params),
      this.repo.manager.query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult[0].total);
    const data = rawData.map((p: any) => toDto(p, p.eq_codigo_equipo, p.eq_modelo));
    return { data, total };
  }

  async obtenerPorId(id: number): Promise<PeriodoInoperatividadDto> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundError(`Período de inoperatividad #${id} no encontrado`);
    return toDto(p);
  }

  async crear(dto: CrearPeriodoDto, usuarioId: number): Promise<PeriodoInoperatividadDto> {
    if (!dto.equipo_id) throw new ValidationError('El equipo es requerido');
    if (!dto.fecha_inicio) throw new ValidationError('La fecha de inicio es obligatoria');
    if (!dto.motivo?.trim()) throw new ValidationError('El motivo es obligatorio');

    const fechaInicio = new Date(dto.fecha_inicio);
    if (isNaN(fechaInicio.getTime())) {
      throw new ValidationError('La fecha de inicio no es válida');
    }

    const diasPlazo = dto.dias_plazo ?? 5;
    const diasInoperativo = calcularDiasInoperativo(fechaInicio);
    const excedePlazo = diasInoperativo >= diasPlazo;

    const p = this.repo.create({
      equipoId: dto.equipo_id,
      contratoId: dto.contrato_id,
      fechaInicio,
      motivo: dto.motivo.trim(),
      estado: 'ACTIVO',
      diasInoperativo,
      diasPlazo,
      excedePlazo,
      penalidadAplicada: false,
      creadoPor: usuarioId,
    });

    const saved = await this.repo.save(p);
    logger.info(
      `Período de inoperatividad creado: #${saved.id} para equipo ${dto.equipo_id}. Días: ${diasInoperativo}`
    );
    return toDto(saved);
  }

  async resolver(
    id: number,
    dto: ResolverPeriodoDto,
    usuarioId: number
  ): Promise<PeriodoInoperatividadDto> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundError(`Período de inoperatividad #${id} no encontrado`);
    if (p.estado !== 'ACTIVO') {
      throw new ConflictError(
        `El período ya está en estado ${p.estado}. Solo se pueden resolver períodos ACTIVOS.`
      );
    }

    const fechaFin = new Date(dto.fecha_fin);
    if (isNaN(fechaFin.getTime())) {
      throw new ValidationError('La fecha de resolución no es válida');
    }
    if (fechaFin < p.fechaInicio) {
      throw new ValidationError(
        'La fecha de resolución no puede ser anterior a la fecha de inicio'
      );
    }

    const diasInoperativo = calcularDiasInoperativo(p.fechaInicio, fechaFin);
    const excedePlazo = diasInoperativo >= p.diasPlazo;

    p.fechaFin = fechaFin;
    p.diasInoperativo = diasInoperativo;
    p.excedePlazo = excedePlazo;
    p.estado = excedePlazo ? 'PENALIZADO' : 'RESUELTO';
    p.resueltoPor = usuarioId;
    if (dto.observaciones_penalidad) p.observacionesPenalidad = dto.observaciones_penalidad;

    const saved = await this.repo.save(p);
    logger.info(
      `Período #${id} resuelto. Días inoperativo: ${diasInoperativo}. Estado: ${p.estado}`
    );
    return toDto(saved);
  }

  async aplicarPenalidad(id: number, dto: AplicarPenalidadDto): Promise<PeriodoInoperatividadDto> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundError(`Período de inoperatividad #${id} no encontrado`);
    if (!p.excedePlazo) {
      throw new ConflictError('Solo se puede aplicar penalidad a períodos que exceden el plazo');
    }
    if (p.penalidadAplicada) {
      throw new ConflictError('Ya se aplicó una penalidad a este período');
    }

    p.penalidadAplicada = true;
    p.montoPenalidad = dto.monto_penalidad;
    p.estado = 'PENALIZADO';
    if (dto.observaciones_penalidad) p.observacionesPenalidad = dto.observaciones_penalidad;

    const saved = await this.repo.save(p);
    logger.info(`Penalidad aplicada al período #${id}: S/ ${dto.monto_penalidad}`);
    return toDto(saved);
  }

  /**
   * Called by cron job daily — recalculates dias_inoperativo for all ACTIVO periods
   * and flags those exceeding the dias_plazo threshold.
   * Returns count of newly flagged periods.
   */
  async verificarVencimientos(): Promise<{
    actualizados: number;
    nuevosExcedidos: number;
  }> {
    const activos = await this.repo.find({ where: { estado: 'ACTIVO' } });
    let actualizados = 0;
    let nuevosExcedidos = 0;

    for (const p of activos) {
      const diasActuales = calcularDiasInoperativo(p.fechaInicio);
      const excediaBefore = p.excedePlazo;
      const excedeNow = diasActuales >= p.diasPlazo;

      if (diasActuales !== p.diasInoperativo || excedeNow !== excediaBefore) {
        p.diasInoperativo = diasActuales;
        p.excedePlazo = excedeNow;
        await this.repo.save(p);
        actualizados++;
        if (excedeNow && !excediaBefore) nuevosExcedidos++;
      }
    }

    logger.info(
      `Verificación de inoperatividad: ${actualizados} actualizados, ${nuevosExcedidos} nuevos excedidos`
    );
    return { actualizados, nuevosExcedidos };
  }

  /**
   * Get a summary of inoperability for a specific equipment.
   */
  async getResumen(equipoId: number): Promise<{
    total: number;
    activos: number;
    resueltos: number;
    penalizados: number;
    exceden_plazo: number;
    max_dias_inoperativo: number;
  }> {
    const rows = await this.repo
      .createQueryBuilder('p')
      .select('p.estado', 'estado')
      .addSelect('COUNT(*)', 'cnt')
      .addSelect('MAX(p.dias_inoperativo)', 'max_dias')
      .addSelect('SUM(CASE WHEN p.excede_plazo THEN 1 ELSE 0 END)', 'excede')
      .where('p.equipo_id = :equipoId', { equipoId })
      .groupBy('p.estado')
      .getRawMany();

    let total = 0;
    let activos = 0;
    let resueltos = 0;
    let penalizados = 0;
    let exceden_plazo = 0;
    let max_dias_inoperativo = 0;

    for (const row of rows) {
      const cnt = parseInt(row.cnt);
      total += cnt;
      if (row.estado === 'ACTIVO') activos = cnt;
      if (row.estado === 'RESUELTO') resueltos = cnt;
      if (row.estado === 'PENALIZADO') penalizados = cnt;
      exceden_plazo += parseInt(row.excede ?? '0');
      const maxDias = parseInt(row.max_dias ?? '0');
      if (maxDias > max_dias_inoperativo) max_dias_inoperativo = maxDias;
    }

    return { total, activos, resueltos, penalizados, exceden_plazo, max_dias_inoperativo };
  }
}
