/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import {
  ActaEntrega,
  EstadoActaEntrega,
  TipoEntrega,
  CondicionEquipo,
} from '../models/acta-entrega.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import logger from '../utils/logger';

// ─── DTOs ───────────────────────────────────────────────────────────────────

export interface CrearActaEntregaDto {
  equipo_id: number;
  contrato_id?: number;
  proyecto_id?: number;
  fecha_entrega: string;
  tipo?: TipoEntrega;
  condicion_equipo?: CondicionEquipo;
  horometro_entrega?: number;
  kilometraje_entrega?: number;
  observaciones?: string;
  observaciones_fisicas?: string;
}

export interface ActualizarActaEntregaDto {
  fecha_entrega?: string;
  tipo?: TipoEntrega;
  condicion_equipo?: CondicionEquipo;
  horometro_entrega?: number;
  kilometraje_entrega?: number;
  observaciones?: string;
  observaciones_fisicas?: string;
  contrato_id?: number;
  proyecto_id?: number;
}

export interface FirmarActaEntregaDto {
  firma_entregado?: string;
  firma_recibido?: string;
  recibido_por?: number;
  entregado_por?: number;
}

export interface ActaEntregaDto {
  id: number;
  codigo: string;
  equipo_id: number;
  contrato_id: number | null;
  proyecto_id: number | null;
  fecha_entrega: string;
  tipo: string;
  estado: string;
  condicion_equipo: string;
  horometro_entrega: number | null;
  kilometraje_entrega: number | null;
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

// ─── Transformer ────────────────────────────────────────────────────────────

function toDto(a: ActaEntrega): ActaEntregaDto {
  return {
    id: a.id,
    codigo: a.codigo,
    equipo_id: a.equipoId,
    contrato_id: a.contratoId ?? null,
    proyecto_id: a.proyectoId ?? null,
    fecha_entrega:
      a.fechaEntrega instanceof Date
        ? a.fechaEntrega.toISOString().split('T')[0]
        : String(a.fechaEntrega),
    tipo: a.tipo,
    estado: a.estado,
    condicion_equipo: a.condicionEquipo,
    horometro_entrega: a.horometroEntrega !== undefined ? Number(a.horometroEntrega) : null,
    kilometraje_entrega: a.kilometrajeEntrega !== undefined ? Number(a.kilometrajeEntrega) : null,
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

// ─── Service ────────────────────────────────────────────────────────────────

export class ActaEntregaService {
  private get repo() {
    return AppDataSource.getRepository(ActaEntrega);
  }

  private async generarCodigo(): Promise<string> {
    const count = await this.repo.count();
    const num = String(count + 1).padStart(4, '0');
    return `AEN-${num}`;
  }

  async listar(filtros: {
    equipo_id?: number;
    estado?: EstadoActaEntrega;
    tipo?: TipoEntrega;
    page?: number;
    limit?: number;
  }): Promise<{ data: ActaEntregaDto[]; total: number }> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20;

    const qb = this.repo.createQueryBuilder('a').where('a.isActive = :active', { active: true });

    if (filtros.equipo_id) {
      qb.andWhere('a.equipoId = :equipoId', { equipoId: filtros.equipo_id });
    }
    if (filtros.estado) {
      qb.andWhere('a.estado = :estado', { estado: filtros.estado });
    }
    if (filtros.tipo) {
      qb.andWhere('a.tipo = :tipo', { tipo: filtros.tipo });
    }

    qb.orderBy('a.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { data: items.map(toDto), total };
  }

  async obtenerPorId(id: number): Promise<ActaEntregaDto> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    return toDto(acta);
  }

  async crear(dto: CrearActaEntregaDto, usuarioId: number): Promise<ActaEntregaDto> {
    if (!dto.equipo_id) throw new ValidationError('equipo_id es requerido');
    if (!dto.fecha_entrega) throw new ValidationError('fecha_entrega es requerida');

    const codigo = await this.generarCodigo();

    const acta = this.repo.create({
      codigo,
      equipoId: dto.equipo_id,
      contratoId: dto.contrato_id,
      proyectoId: dto.proyecto_id,
      fechaEntrega: new Date(dto.fecha_entrega),
      tipo: dto.tipo || 'ENTREGA',
      condicionEquipo: dto.condicion_equipo || 'BUENO',
      horometroEntrega: dto.horometro_entrega,
      kilometrajeEntrega: dto.kilometraje_entrega,
      observaciones: dto.observaciones,
      observacionesFisicas: dto.observaciones_fisicas,
      creadoPor: usuarioId,
      estado: 'BORRADOR',
    });

    const saved = await this.repo.save(acta);
    logger.info('Acta de entrega creada', { id: saved.id, codigo: saved.codigo });
    return toDto(saved);
  }

  async actualizar(id: number, dto: ActualizarActaEntregaDto): Promise<ActaEntregaDto> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    if (acta.estado !== 'BORRADOR' && acta.estado !== 'PENDIENTE') {
      throw new ConflictError('Solo se puede actualizar actas en estado BORRADOR o PENDIENTE');
    }

    if (dto.fecha_entrega) acta.fechaEntrega = new Date(dto.fecha_entrega);
    if (dto.tipo) acta.tipo = dto.tipo;
    if (dto.condicion_equipo) acta.condicionEquipo = dto.condicion_equipo;
    if (dto.horometro_entrega !== undefined) acta.horometroEntrega = dto.horometro_entrega;
    if (dto.kilometraje_entrega !== undefined) acta.kilometrajeEntrega = dto.kilometraje_entrega;
    if (dto.observaciones !== undefined) acta.observaciones = dto.observaciones;
    if (dto.observaciones_fisicas !== undefined)
      acta.observacionesFisicas = dto.observaciones_fisicas;
    if (dto.contrato_id !== undefined) acta.contratoId = dto.contrato_id;
    if (dto.proyecto_id !== undefined) acta.proyectoId = dto.proyecto_id;

    const saved = await this.repo.save(acta);
    return toDto(saved);
  }

  async enviarParaFirma(id: number): Promise<ActaEntregaDto> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    if (acta.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se puede enviar a firma actas en estado BORRADOR');
    }

    acta.estado = 'PENDIENTE';
    const saved = await this.repo.save(acta);
    return toDto(saved);
  }

  async firmar(id: number, dto: FirmarActaEntregaDto): Promise<ActaEntregaDto> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    if (acta.estado !== 'PENDIENTE') {
      throw new ConflictError('Solo se puede firmar actas en estado PENDIENTE');
    }

    if (dto.firma_entregado) acta.firmaEntregado = dto.firma_entregado;
    if (dto.firma_recibido) acta.firmaRecibido = dto.firma_recibido;
    if (dto.recibido_por) acta.recibidoPor = dto.recibido_por;
    if (dto.entregado_por) acta.entregadoPor = dto.entregado_por;

    // Auto-transition to FIRMADO when both signatures present
    if (acta.firmaEntregado && acta.firmaRecibido) {
      acta.estado = 'FIRMADO';
      acta.fechaFirma = new Date();
    }

    const saved = await this.repo.save(acta);
    return toDto(saved);
  }

  async anular(id: number, observaciones?: string): Promise<ActaEntregaDto> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    if (acta.estado === 'ANULADO') {
      throw new ConflictError('El acta ya está anulada');
    }

    acta.estado = 'ANULADO';
    if (observaciones) acta.observaciones = observaciones;
    const saved = await this.repo.save(acta);
    return toDto(saved);
  }

  async eliminar(id: number): Promise<void> {
    const acta = await this.repo.findOne({ where: { id, isActive: true } });
    if (!acta) throw new NotFoundError(`Acta de entrega #${id} no encontrada`);
    if (acta.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se puede eliminar actas en estado BORRADOR');
    }

    acta.isActive = false;
    await this.repo.save(acta);
  }
}
