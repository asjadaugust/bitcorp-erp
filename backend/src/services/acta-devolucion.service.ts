/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import {
  ActaDevolucion,
  EstadoActa,
  TipoActa,
  CondicionEquipo,
} from '../models/acta-devolucion.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import logger from '../utils/logger';

export interface CrearActaDto {
  equipo_id: number;
  contrato_id?: number;
  proyecto_id?: number;
  fecha_devolucion: string;
  tipo?: TipoActa;
  condicion_equipo?: CondicionEquipo;
  horometro_devolucion?: number;
  kilometraje_devolucion?: number;
  observaciones?: string;
  observaciones_fisicas?: string;
}

export interface ActualizarActaDto {
  fecha_devolucion?: string;
  tipo?: TipoActa;
  condicion_equipo?: CondicionEquipo;
  horometro_devolucion?: number;
  kilometraje_devolucion?: number;
  observaciones?: string;
  observaciones_fisicas?: string;
  contrato_id?: number;
  proyecto_id?: number;
}

export interface FirmarActaDto {
  firma_entregado?: string;
  firma_recibido?: string;
  recibido_por?: number;
  entregado_por?: number;
}

export interface ActaDevolucionDto {
  id: number;
  codigo: string;
  equipo_id: number;
  contrato_id: number | null;
  proyecto_id: number | null;
  fecha_devolucion: string;
  tipo: string;
  estado: string;
  condicion_equipo: string;
  horometro_devolucion: number | null;
  kilometraje_devolucion: number | null;
  observaciones: string | null;
  observaciones_fisicas: string | null;
  recibido_por: number | null;
  entregado_por: number | null;
  tiene_firma_recibido: boolean;
  tiene_firma_entregado: boolean;
  fecha_firma: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toDto(a: ActaDevolucion): ActaDevolucionDto {
  return {
    id: a.id,
    codigo: a.codigo,
    equipo_id: a.equipoId,
    contrato_id: a.contratoId ?? null,
    proyecto_id: a.proyectoId ?? null,
    fecha_devolucion:
      a.fechaDevolucion instanceof Date
        ? a.fechaDevolucion.toISOString().split('T')[0]
        : String(a.fechaDevolucion),
    tipo: a.tipo,
    estado: a.estado,
    condicion_equipo: a.condicionEquipo,
    horometro_devolucion:
      a.horometroDevolucion !== undefined ? Number(a.horometroDevolucion) : null,
    kilometraje_devolucion:
      a.kilometrajeDevolucion !== undefined ? Number(a.kilometrajeDevolucion) : null,
    observaciones: a.observaciones ?? null,
    observaciones_fisicas: a.observacionesFisicas ?? null,
    recibido_por: a.recibidoPor ?? null,
    entregado_por: a.entregadoPor ?? null,
    tiene_firma_recibido: !!a.firmaRecibido,
    tiene_firma_entregado: !!a.firmaEntregado,
    fecha_firma: a.fechaFirma ? a.fechaFirma.toISOString() : null,
    creado_por: a.creadoPor ?? null,
    is_active: a.isActive,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
  };
}

async function generarCodigo(): Promise<string> {
  const repo = AppDataSource.getRepository(ActaDevolucion);
  const count = await repo.count();
  const num = String(count + 1).padStart(4, '0');
  return `ADV-${num}`;
}

export class ActaDevolucionService {
  private get repo() {
    return AppDataSource.getRepository(ActaDevolucion);
  }

  async listar(filtros: {
    equipo_id?: number;
    estado?: EstadoActa;
    tipo?: TipoActa;
    page?: number;
    limit?: number;
  }): Promise<{ data: ActaDevolucionDto[]; total: number }> {
    const { equipo_id, estado, tipo, page = 1, limit = 20 } = filtros;
    const qb = this.repo.createQueryBuilder('a').where('a.is_active = true');

    if (equipo_id) qb.andWhere('a.equipo_id = :equipo_id', { equipo_id });
    if (estado) qb.andWhere('a.estado = :estado', { estado });
    if (tipo) qb.andWhere('a.tipo = :tipo', { tipo });

    qb.orderBy('a.fecha_devolucion', 'DESC')
      .addOrderBy('a.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { data: items.map(toDto), total };
  }

  async obtenerPorId(id: number): Promise<ActaDevolucionDto> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    return toDto(a);
  }

  async crear(dto: CrearActaDto, usuarioId: number): Promise<ActaDevolucionDto> {
    if (!dto.equipo_id) throw new ValidationError('El equipo es requerido');
    if (!dto.fecha_devolucion) throw new ValidationError('La fecha de devolución es obligatoria');

    const codigo = await generarCodigo();
    const a = this.repo.create({
      codigo,
      equipoId: dto.equipo_id,
      contratoId: dto.contrato_id,
      proyectoId: dto.proyecto_id,
      fechaDevolucion: new Date(dto.fecha_devolucion),
      tipo: dto.tipo ?? 'DEVOLUCION',
      condicionEquipo: dto.condicion_equipo ?? 'BUENO',
      horometroDevolucion: dto.horometro_devolucion,
      kilometrajeDevolucion: dto.kilometraje_devolucion,
      observaciones: dto.observaciones,
      observacionesFisicas: dto.observaciones_fisicas,
      estado: 'BORRADOR',
      creadoPor: usuarioId,
    });

    const saved = await this.repo.save(a);
    logger.info(`Acta de devolución creada: ${codigo} para equipo ${dto.equipo_id}`);
    return toDto(saved);
  }

  async actualizar(id: number, dto: ActualizarActaDto): Promise<ActaDevolucionDto> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    if (!['BORRADOR', 'PENDIENTE'].includes(a.estado)) {
      throw new ConflictError('Solo se pueden editar actas en estado BORRADOR o PENDIENTE');
    }

    if (dto.fecha_devolucion !== undefined) a.fechaDevolucion = new Date(dto.fecha_devolucion);
    if (dto.tipo !== undefined) a.tipo = dto.tipo;
    if (dto.condicion_equipo !== undefined) a.condicionEquipo = dto.condicion_equipo;
    if (dto.horometro_devolucion !== undefined) a.horometroDevolucion = dto.horometro_devolucion;
    if (dto.kilometraje_devolucion !== undefined)
      a.kilometrajeDevolucion = dto.kilometraje_devolucion;
    if (dto.observaciones !== undefined) a.observaciones = dto.observaciones;
    if (dto.observaciones_fisicas !== undefined) a.observacionesFisicas = dto.observaciones_fisicas;
    if (dto.contrato_id !== undefined) a.contratoId = dto.contrato_id;
    if (dto.proyecto_id !== undefined) a.proyectoId = dto.proyecto_id;

    const saved = await this.repo.save(a);
    return toDto(saved);
  }

  async enviarParaFirma(id: number): Promise<ActaDevolucionDto> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    if (a.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden enviar actas en estado BORRADOR');
    }
    a.estado = 'PENDIENTE';
    const saved = await this.repo.save(a);
    logger.info(`Acta ${a.codigo} enviada para firma`);
    return toDto(saved);
  }

  async firmar(id: number, dto: FirmarActaDto): Promise<ActaDevolucionDto> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    if (a.estado !== 'PENDIENTE') {
      throw new ConflictError('Solo se pueden firmar actas en estado PENDIENTE');
    }

    if (dto.firma_entregado) a.firmaEntregado = dto.firma_entregado;
    if (dto.firma_recibido) a.firmaRecibido = dto.firma_recibido;
    if (dto.recibido_por !== undefined) a.recibidoPor = dto.recibido_por;
    if (dto.entregado_por !== undefined) a.entregadoPor = dto.entregado_por;

    // Mark as signed when both signatures present
    if (a.firmaEntregado && a.firmaRecibido) {
      a.estado = 'FIRMADO';
      a.fechaFirma = new Date();
    }

    const saved = await this.repo.save(a);
    logger.info(`Acta ${a.codigo} firmada. Estado: ${a.estado}`);
    return toDto(saved);
  }

  async anular(id: number, observaciones?: string): Promise<ActaDevolucionDto> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    if (a.estado === 'ANULADO') throw new ConflictError('El acta ya está anulada');
    a.estado = 'ANULADO';
    if (observaciones)
      a.observaciones =
        (a.observaciones ? a.observaciones + '\n' : '') + `[ANULADO] ${observaciones}`;
    const saved = await this.repo.save(a);
    logger.info(`Acta ${a.codigo} anulada`);
    return toDto(saved);
  }

  async eliminar(id: number): Promise<void> {
    const a = await this.repo.findOne({ where: { id, isActive: true } });
    if (!a) throw new NotFoundError(`Acta de devolución #${id} no encontrada`);
    if (a.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden eliminar actas en estado BORRADOR');
    }
    a.isActive = false;
    await this.repo.save(a);
  }
}
