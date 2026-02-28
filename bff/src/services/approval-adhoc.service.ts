/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { SolicitudAdhoc } from '../models/solicitud-adhoc.model';
import { RespuestaAdhoc } from '../models/respuesta-adhoc.model';
import { AuditoriaAprobacion } from '../models/auditoria-aprobacion.model';
import { NotFoundError, ConflictError } from '../errors';
import {
  SolicitudAdhocDto,
  RespuestaAdhocDto,
  CrearAdhocDto,
  toAdhocDto,
  toRespuestaAdhocDto,
} from '../types/dto/approval.dto';
import logger from '../utils/logger';

export class ApprovalAdhocService {
  private get adhocRepo() {
    return AppDataSource.getRepository(SolicitudAdhoc);
  }
  private get respuestaRepo() {
    return AppDataSource.getRepository(RespuestaAdhoc);
  }
  private get auditRepo() {
    return AppDataSource.getRepository(AuditoriaAprobacion);
  }

  async crear(
    dto: CrearAdhocDto,
    usuarioId: number,
    tenantId?: number
  ): Promise<SolicitudAdhocDto> {
    const adhoc = this.adhocRepo.create({
      tenantId,
      usuarioSolicitanteId: usuarioId,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      aprobadores: dto.aprobadores,
      usuariosCc: dto.usuarios_cc ?? [],
      logicaAprobacion: dto.logica_aprobacion ?? 'ALL_MUST_APPROVE',
      estado: 'PENDIENTE',
      archivosAdjuntos: dto.archivos_adjuntos,
    });

    const saved = await this.adhocRepo.save(adhoc);

    await this.auditRepo.save(
      this.auditRepo.create({
        tenantId,
        solicitudAdhocId: saved.id,
        accion: 'CREATED',
        usuarioId,
      })
    );

    logger.info('ApprovalAdhoc: created', { id: saved.id, usuarioId });
    return toAdhocDto(saved);
  }

  async responder(
    adhocId: number,
    userId: number,
    respuesta: 'APROBADO' | 'RECHAZADO',
    comentario?: string,
    tenantId?: number
  ): Promise<SolicitudAdhocDto> {
    const adhoc = await this.adhocRepo.findOne({ where: { id: adhocId } });
    if (!adhoc) throw new NotFoundError('SolicitudAdhoc', adhocId);

    if (adhoc.estado !== 'PENDIENTE') {
      throw new ConflictError(`La solicitud ad-hoc está en estado '${adhoc.estado}'`);
    }

    if (!adhoc.aprobadores.includes(userId)) {
      throw new ConflictError('El usuario no es aprobador de esta solicitud');
    }

    // Check if already responded
    const existing = await this.respuestaRepo.findOne({
      where: { solicitudAdhocId: adhocId, aprobadorId: userId } as any,
    });
    if (existing) throw new ConflictError('El usuario ya respondió esta solicitud');

    await this.respuestaRepo.save(
      this.respuestaRepo.create({
        tenantId,
        solicitudAdhocId: adhocId,
        aprobadorId: userId,
        respuesta,
        comentario,
      })
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        tenantId,
        solicitudAdhocId: adhocId,
        accion: respuesta === 'APROBADO' ? 'STEP_APPROVED' : 'STEP_REJECTED',
        usuarioId: userId,
        comentario,
      })
    );

    // Determine if solicitud is complete
    if (respuesta === 'RECHAZADO') {
      // Any rejection → immediate RECHAZADO
      await this.adhocRepo.update(adhocId, {
        estado: 'RECHAZADO',
        fechaCompletado: new Date(),
      } as any);
    } else if (adhoc.logicaAprobacion === 'FIRST_APPROVES') {
      // First approval → done
      await this.adhocRepo.update(adhocId, {
        estado: 'APROBADO',
        fechaCompletado: new Date(),
      } as any);
    } else {
      // ALL_MUST_APPROVE — check if everyone approved
      const responses = await this.respuestaRepo.find({
        where: { solicitudAdhocId: adhocId } as any,
      });
      const allApproved = adhoc.aprobadores.every((apId) =>
        responses.some((r) => r.aprobadorId === apId && r.respuesta === 'APROBADO')
      );
      if (allApproved) {
        await this.adhocRepo.update(adhocId, {
          estado: 'APROBADO',
          fechaCompletado: new Date(),
        } as any);
      }
    }

    const updated = await this.adhocRepo.findOne({ where: { id: adhocId } });
    return toAdhocDto(updated!);
  }

  async listarMios(userId: number): Promise<SolicitudAdhocDto[]> {
    const adhocs = await this.adhocRepo.find({
      where: { usuarioSolicitanteId: userId } as any,
      order: { fechaCreacion: 'DESC' } as any,
    });
    return adhocs.map(toAdhocDto);
  }

  async listarPendientes(userId: number): Promise<SolicitudAdhocDto[]> {
    // Solicitudes where user is in aprobadores array and estado is PENDIENTE
    const adhocs = await this.adhocRepo
      .createQueryBuilder('a')
      .where('a.estado = :estado', { estado: 'PENDIENTE' })
      .andWhere(':uid = ANY(SELECT jsonb_array_elements_text(a.aprobadores)::integer)', {
        uid: userId,
      })
      .orderBy('a.fecha_creacion', 'DESC')
      .getMany();
    return adhocs.map(toAdhocDto);
  }

  async obtener(id: number): Promise<SolicitudAdhocDto> {
    const adhoc = await this.adhocRepo.findOne({ where: { id } });
    if (!adhoc) throw new NotFoundError('SolicitudAdhoc', id);
    return toAdhocDto(adhoc);
  }

  async getRespuestas(adhocId: number): Promise<RespuestaAdhocDto[]> {
    const respuestas = await this.respuestaRepo.find({
      where: { solicitudAdhocId: adhocId } as any,
    });
    return respuestas.map(toRespuestaAdhocDto);
  }
}
