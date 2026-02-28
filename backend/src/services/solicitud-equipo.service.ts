/* eslint-disable @typescript-eslint/no-explicit-any */
import { ApprovalRequestService } from './approval-request.service';
import { AppDataSource } from '../config/database.config';
import { SolicitudEquipo, EstadoSolicitud } from '../models/solicitud-equipo.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import logger from '../utils/logger';

export interface CrearSolicitudDto {
  proyecto_id?: number;
  tipo_equipo: string;
  descripcion?: string;
  cantidad?: number;
  fecha_requerida: string;
  justificacion?: string;
  prioridad?: 'BAJA' | 'MEDIA' | 'ALTA';
}

export interface ActualizarSolicitudDto {
  tipo_equipo?: string;
  descripcion?: string;
  cantidad?: number;
  fecha_requerida?: string;
  justificacion?: string;
  prioridad?: 'BAJA' | 'MEDIA' | 'ALTA';
  observaciones?: string;
}

export interface SolicitudEquipoDto {
  id: number;
  codigo: string;
  proyecto_id: number | null;
  tipo_equipo: string;
  descripcion: string | null;
  cantidad: number;
  fecha_requerida: string;
  justificacion: string | null;
  prioridad: string;
  estado: string;
  observaciones: string | null;
  aprobado_por: number | null;
  fecha_aprobacion: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function toDto(s: SolicitudEquipo): SolicitudEquipoDto {
  return {
    id: s.id,
    codigo: s.codigo,
    proyecto_id: s.proyectoId ?? null,
    tipo_equipo: s.tipoEquipo,
    descripcion: s.descripcion ?? null,
    cantidad: s.cantidad,
    fecha_requerida:
      s.fechaRequerida instanceof Date
        ? s.fechaRequerida.toISOString().split('T')[0]
        : String(s.fechaRequerida),
    justificacion: s.justificacion ?? null,
    prioridad: s.prioridad,
    estado: s.estado,
    observaciones: s.observaciones ?? null,
    aprobado_por: s.aprobadoPor ?? null,
    fecha_aprobacion: s.fechaAprobacion ? s.fechaAprobacion.toISOString() : null,
    creado_por: s.creadoPor ?? null,
    is_active: s.isActive,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

async function generarCodigo(): Promise<string> {
  const repo = AppDataSource.getRepository(SolicitudEquipo);
  const count = await repo.count();
  const num = String(count + 1).padStart(4, '0');
  return `SEQ-${num}`;
}

export class SolicitudEquipoService {
  private get repo() {
    return AppDataSource.getRepository(SolicitudEquipo);
  }

  async listar(filtros: {
    estado?: EstadoSolicitud;
    proyecto_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: SolicitudEquipoDto[]; total: number }> {
    const { estado, proyecto_id, page = 1, limit = 20 } = filtros;
    const qb = this.repo.createQueryBuilder('s').where('s.is_active = true');

    if (estado) qb.andWhere('s.estado = :estado', { estado });
    if (proyecto_id) qb.andWhere('s.proyecto_id = :proyecto_id', { proyecto_id });

    qb.orderBy('s.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { data: items.map(toDto), total };
  }

  async obtenerPorId(id: number): Promise<SolicitudEquipoDto> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    return toDto(s);
  }

  async crear(dto: CrearSolicitudDto, usuarioId: number): Promise<SolicitudEquipoDto> {
    if (!dto.tipo_equipo?.trim()) {
      throw new ValidationError('El tipo de equipo es requerido');
    }
    if (!dto.fecha_requerida) {
      throw new ValidationError('La fecha requerida es obligatoria');
    }

    const codigo = await generarCodigo();
    const s = this.repo.create({
      codigo,
      proyectoId: dto.proyecto_id,
      tipoEquipo: dto.tipo_equipo.trim(),
      descripcion: dto.descripcion,
      cantidad: dto.cantidad ?? 1,
      fechaRequerida: new Date(dto.fecha_requerida),
      justificacion: dto.justificacion,
      prioridad: dto.prioridad ?? 'MEDIA',
      estado: 'BORRADOR',
      creadoPor: usuarioId,
    });

    const saved = await this.repo.save(s);
    logger.info(`Solicitud de equipo creada: ${codigo} por usuario ${usuarioId}`);
    return toDto(saved);
  }

  async actualizar(id: number, dto: ActualizarSolicitudDto): Promise<SolicitudEquipoDto> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    if (s.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden editar solicitudes en estado BORRADOR');
    }

    if (dto.tipo_equipo !== undefined) s.tipoEquipo = dto.tipo_equipo.trim();
    if (dto.descripcion !== undefined) s.descripcion = dto.descripcion;
    if (dto.cantidad !== undefined) s.cantidad = dto.cantidad;
    if (dto.fecha_requerida !== undefined) s.fechaRequerida = new Date(dto.fecha_requerida);
    if (dto.justificacion !== undefined) s.justificacion = dto.justificacion;
    if (dto.prioridad !== undefined) s.prioridad = dto.prioridad;
    if (dto.observaciones !== undefined) s.observaciones = dto.observaciones;

    const saved = await this.repo.save(s);
    return toDto(saved);
  }

  async enviar(id: number, usuarioId?: number): Promise<SolicitudEquipoDto> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    if (s.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden enviar solicitudes en estado BORRADOR');
    }
    s.estado = 'ENVIADO';
    const saved = await this.repo.save(s);

    // Integrate with flexible approval engine (non-breaking — template optional)
    if (usuarioId) {
      try {
        const approvalSvc = new ApprovalRequestService();
        const solicitud = await approvalSvc.instanciar(
          'solicitud_equipo',
          saved.id,
          saved.proyectoId ?? undefined,
          `Solicitud de Equipo ${saved.codigo}`,
          saved.descripcion ?? undefined,
          usuarioId
        );
        await this.repo.update(saved.id, { solicitudAprobacionId: solicitud.id } as any);
        saved.solicitudAprobacionId = solicitud.id;
      } catch (approvalError: any) {
        logger.warn('Approval engine not triggered for solicitud_equipo', {
          solicitud_id: id,
          reason: approvalError.message,
        });
      }
    }

    logger.info(`Solicitud ${s.codigo} enviada para aprobación`);
    return toDto(saved);
  }

  async aprobar(
    id: number,
    usuarioId: number,
    observaciones?: string
  ): Promise<SolicitudEquipoDto> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    if (s.estado !== 'ENVIADO') {
      throw new ConflictError('Solo se pueden aprobar solicitudes en estado ENVIADO');
    }
    s.estado = 'APROBADO';
    s.aprobadoPor = usuarioId;
    s.fechaAprobacion = new Date();
    if (observaciones) s.observaciones = observaciones;
    const saved = await this.repo.save(s);
    logger.info(`Solicitud ${s.codigo} aprobada por usuario ${usuarioId}`);
    return toDto(saved);
  }

  async rechazar(
    id: number,
    usuarioId: number,
    observaciones?: string
  ): Promise<SolicitudEquipoDto> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    if (s.estado !== 'ENVIADO') {
      throw new ConflictError('Solo se pueden rechazar solicitudes en estado ENVIADO');
    }
    s.estado = 'RECHAZADO';
    if (observaciones) s.observaciones = observaciones;
    const saved = await this.repo.save(s);
    logger.info(`Solicitud ${s.codigo} rechazada por usuario ${usuarioId}`);
    return toDto(saved);
  }

  async eliminar(id: number): Promise<void> {
    const s = await this.repo.findOne({ where: { id, isActive: true } });
    if (!s) throw new NotFoundError(`Solicitud de equipo #${id} no encontrada`);
    if (s.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden eliminar solicitudes en estado BORRADOR');
    }
    s.isActive = false;
    await this.repo.save(s);
  }
}
