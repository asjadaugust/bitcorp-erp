/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { SolicitudAprobacion } from '../models/solicitud-aprobacion.model';
import { PasoSolicitud } from '../models/paso-solicitud.model';
import { PlantillaPaso } from '../models/plantilla-paso.model';
import { AuditoriaAprobacion } from '../models/auditoria-aprobacion.model';
import { ModuleName } from '../models/plantilla-aprobacion.model';
import { NotFoundError, ConflictError } from '../errors';
import {
  SolicitudAprobacionDto,
  DashboardStatsDto,
  toSolicitudDto,
} from '../types/dto/approval.dto';
import { ApprovalTemplateService } from './approval-template.service';
import { ApprovalCallbackService } from './approval-callback.service';
import logger from '../utils/logger';

export class ApprovalRequestService {
  private templateSvc = new ApprovalTemplateService();
  private callbackSvc = new ApprovalCallbackService();

  private get repo() {
    return AppDataSource.getRepository(SolicitudAprobacion);
  }
  private get pasoRepo() {
    return AppDataSource.getRepository(PasoSolicitud);
  }
  private get pasoPlantillaRepo() {
    return AppDataSource.getRepository(PlantillaPaso);
  }
  private get auditRepo() {
    return AppDataSource.getRepository(AuditoriaAprobacion);
  }

  private async audit(
    params: Partial<AuditoriaAprobacion> & {
      accion: AuditoriaAprobacion['accion'];
      usuarioId: number;
    }
  ): Promise<void> {
    const entry = this.auditRepo.create(params);
    await this.auditRepo.save(entry);
  }

  async instanciar(
    moduleName: ModuleName,
    entityId: number,
    proyectoId: number | undefined,
    titulo: string,
    descripcion: string | undefined,
    usuarioId: number,
    tenantId?: number
  ): Promise<SolicitudAprobacionDto> {
    const plantilla = await this.templateSvc.obtenerPlantillaActiva(moduleName, proyectoId);
    if (!plantilla) {
      throw new NotFoundError(`No hay plantilla activa para el módulo '${moduleName}'`, 0);
    }

    const pasosDePlantilla = plantilla.pasos ?? [];
    if (pasosDePlantilla.length === 0) {
      throw new NotFoundError('La plantilla no tiene pasos configurados', 0);
    }

    const primerPaso = pasosDePlantilla.sort((a, b) => a.pasoNumero - b.pasoNumero)[0];

    const solicitud = this.repo.create({
      tenantId,
      plantillaId: plantilla.id,
      plantillaVersion: plantilla.version,
      moduleName,
      entityId,
      proyectoId,
      usuarioSolicitanteId: usuarioId,
      titulo,
      descripcion,
      estado: 'PENDIENTE',
      pasoActual: primerPaso.pasoNumero,
    });

    const saved = await this.repo.save(solicitud);

    // Create PasoSolicitud rows for each step
    const pasoRows = pasosDePlantilla.map((p) =>
      this.pasoRepo.create({
        tenantId,
        solicitudId: saved.id,
        pasoNumero: p.pasoNumero,
        estadoPaso: 'PENDIENTE',
      })
    );
    const savedPasos = await this.pasoRepo.save(pasoRows);

    await this.audit({
      tenantId,
      solicitudId: saved.id,
      plantillaVersion: plantilla.version,
      accion: 'CREATED',
      usuarioId,
      pasoNumero: primerPaso.pasoNumero,
    });

    saved.pasos = savedPasos;
    logger.info('ApprovalRequest: instanciated', { id: saved.id, moduleName, entityId });
    return toSolicitudDto(saved);
  }

  async aprobarPaso(
    solicitudId: number,
    usuarioId: number,
    userRole: string,
    comentario?: string,
    tenantId?: number
  ): Promise<SolicitudAprobacionDto> {
    const solicitud = await this.repo.findOne({
      where: { id: solicitudId },
      relations: ['pasos'],
    });
    if (!solicitud) throw new NotFoundError('SolicitudAprobacion', solicitudId);

    if (!['PENDIENTE', 'EN_REVISION'].includes(solicitud.estado)) {
      throw new ConflictError(
        `La solicitud está en estado '${solicitud.estado}' y no puede ser aprobada`
      );
    }

    // Load the plantilla paso for current step to verify role
    const pasoDePlantilla = await this.pasoPlantillaRepo.findOne({
      where: {
        plantillaId: solicitud.plantillaId,
        pasoNumero: solicitud.pasoActual,
      } as any,
    });

    if (pasoDePlantilla) {
      if (pasoDePlantilla.tipoAprobador === 'ROLE' && pasoDePlantilla.rol) {
        if (pasoDePlantilla.rol !== userRole) {
          throw new ConflictError(
            `El paso ${solicitud.pasoActual} requiere el rol '${pasoDePlantilla.rol}', pero el usuario tiene rol '${userRole}'`
          );
        }
      } else if (pasoDePlantilla.tipoAprobador === 'USER_ID' && pasoDePlantilla.usuarioId) {
        if (pasoDePlantilla.usuarioId !== usuarioId) {
          throw new ConflictError(
            `El paso ${solicitud.pasoActual} solo puede ser aprobado por el usuario ${pasoDePlantilla.usuarioId}`
          );
        }
      }
    }

    // Update current paso_solicitud
    const currentPaso = solicitud.pasos?.find((p) => p.pasoNumero === solicitud.pasoActual);
    if (!currentPaso) {
      throw new NotFoundError(`PasoSolicitud paso ${solicitud.pasoActual}`, solicitudId);
    }

    if (currentPaso.estadoPaso === 'APROBADO') {
      throw new ConflictError('Este paso ya fue aprobado');
    }

    await this.pasoRepo.update(currentPaso.id, {
      estadoPaso: 'APROBADO',
      aprobadorId: usuarioId,
      accionFecha: new Date(),
      comentario,
    } as any);

    await this.audit({
      tenantId,
      solicitudId,
      plantillaVersion: solicitud.plantillaVersion,
      accion: 'STEP_APPROVED',
      usuarioId,
      pasoNumero: solicitud.pasoActual,
      comentario,
    });

    // Check if there's a next step
    const nextPaso = await this.pasoPlantillaRepo.findOne({
      where: {
        plantillaId: solicitud.plantillaId,
        pasoNumero: solicitud.pasoActual + 1,
      } as any,
    });

    if (nextPaso) {
      // Advance to next step
      await this.repo.update(solicitudId, {
        pasoActual: nextPaso.pasoNumero,
        estado: 'EN_REVISION',
      } as any);
      logger.info('ApprovalRequest: advanced to step', {
        solicitudId,
        paso: nextPaso.pasoNumero,
      });
    } else {
      // All steps done — complete the solicitud
      const now = new Date();
      await this.repo.update(solicitudId, {
        estado: 'APROBADO',
        fechaCompletado: now,
        completadoPorId: usuarioId,
      } as any);

      await this.audit({
        tenantId,
        solicitudId,
        plantillaVersion: solicitud.plantillaVersion,
        accion: 'COMPLETED',
        usuarioId,
        comentario: 'Todos los pasos completados',
      });

      // Fire callback to update the parent entity
      await this.callbackSvc.onAprobado(
        solicitud.moduleName,
        solicitud.entityId,
        solicitudId,
        tenantId
      );

      logger.info('ApprovalRequest: completed and approved', { solicitudId });
    }

    const updated = await this.repo.findOne({
      where: { id: solicitudId },
      relations: ['pasos'],
    });
    return toSolicitudDto(updated!);
  }

  async rechazar(
    solicitudId: number,
    usuarioId: number,
    comentario: string,
    tenantId?: number
  ): Promise<SolicitudAprobacionDto> {
    const solicitud = await this.repo.findOne({
      where: { id: solicitudId },
      relations: ['pasos'],
    });
    if (!solicitud) throw new NotFoundError('SolicitudAprobacion', solicitudId);

    if (!['PENDIENTE', 'EN_REVISION'].includes(solicitud.estado)) {
      throw new ConflictError(
        `La solicitud está en estado '${solicitud.estado}' y no puede ser rechazada`
      );
    }

    // Mark current paso as RECHAZADO
    const currentPaso = solicitud.pasos?.find((p) => p.pasoNumero === solicitud.pasoActual);
    if (currentPaso) {
      await this.pasoRepo.update(currentPaso.id, {
        estadoPaso: 'RECHAZADO',
        aprobadorId: usuarioId,
        accionFecha: new Date(),
        comentario,
      } as any);
    }

    await this.repo.update(solicitudId, {
      estado: 'RECHAZADO',
      fechaCompletado: new Date(),
      completadoPorId: usuarioId,
    } as any);

    await this.audit({
      tenantId,
      solicitudId,
      accion: 'REJECTED',
      usuarioId,
      pasoNumero: solicitud.pasoActual,
      comentario,
    });

    await this.callbackSvc.onRechazado(
      solicitud.moduleName,
      solicitud.entityId,
      solicitudId,
      tenantId
    );

    const updated = await this.repo.findOne({
      where: { id: solicitudId },
      relations: ['pasos'],
    });
    return toSolicitudDto(updated!);
  }

  async rebase(
    solicitudId: number,
    newPlantillaId: number,
    usuarioId: number,
    tenantId?: number
  ): Promise<SolicitudAprobacionDto> {
    const solicitud = await this.repo.findOne({ where: { id: solicitudId } });
    if (!solicitud) throw new NotFoundError('SolicitudAprobacion', solicitudId);

    const oldVersion = solicitud.plantillaVersion;

    const newPlantilla = await AppDataSource.getRepository(
      await import('../models/plantilla-aprobacion.model').then((m) => m.PlantillaAprobacion)
    ).findOne({ where: { id: newPlantillaId }, relations: ['pasos'] });

    if (!newPlantilla) throw new NotFoundError('PlantillaAprobacion', newPlantillaId);

    // Remove pending pasos for current and future steps
    await this.pasoRepo
      .createQueryBuilder()
      .delete()
      .where('solicitud_id = :sid AND estado_paso = :e', { sid: solicitudId, e: 'PENDIENTE' })
      .execute();

    // Create new paso rows for remaining steps
    const remainingPasos = (newPlantilla.pasos ?? [])
      .filter((p) => p.pasoNumero >= solicitud.pasoActual)
      .map((p) =>
        this.pasoRepo.create({
          tenantId,
          solicitudId,
          pasoNumero: p.pasoNumero,
          estadoPaso: 'PENDIENTE',
        })
      );
    await this.pasoRepo.save(remainingPasos);

    await this.repo.update(solicitudId, {
      plantillaId: newPlantillaId,
      plantillaVersion: newPlantilla.version,
    } as any);

    await this.audit({
      tenantId,
      solicitudId,
      accion: 'REBASED',
      usuarioId,
      metadata: { from_version: oldVersion, to_version: newPlantilla.version },
    });

    const updated = await this.repo.findOne({
      where: { id: solicitudId },
      relations: ['pasos'],
    });
    return toSolicitudDto(updated!);
  }

  async getDashboardRecibidos(userId: number, userRole: string): Promise<SolicitudAprobacionDto[]> {
    // Find solicitudes where the current step's plantilla_paso matches the user's role or user_id
    const solicitudes = await this.repo
      .createQueryBuilder('s')
      .innerJoin(
        PlantillaPaso,
        'pp',
        'pp.plantilla_id = s.plantilla_id AND pp.paso_numero = s.paso_actual'
      )
      .where('s.estado IN (:...estados)', { estados: ['PENDIENTE', 'EN_REVISION'] })
      .andWhere(
        '(pp.tipo_aprobador = :role_type AND pp.rol = :role) OR (pp.tipo_aprobador = :user_type AND pp.usuario_id = :uid)',
        { role_type: 'ROLE', role: userRole, user_type: 'USER_ID', uid: userId }
      )
      .orderBy('s.fecha_creacion', 'DESC')
      .getMany();

    return solicitudes.map(toSolicitudDto);
  }

  async getDashboardEnviados(userId: number): Promise<SolicitudAprobacionDto[]> {
    const solicitudes = await this.repo.find({
      where: { usuarioSolicitanteId: userId } as any,
      relations: ['pasos'],
      order: { fechaCreacion: 'DESC' } as any,
    });
    return solicitudes.map(toSolicitudDto);
  }

  async getDashboardStats(userId: number, userRole: string): Promise<DashboardStatsDto> {
    const recibidos = await this.getDashboardRecibidos(userId, userRole);
    const enviados = await this.getDashboardEnviados(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const aprobadosHoy = enviados.filter(
      (s) => s.estado === 'APROBADO' && s.fecha_completado && new Date(s.fecha_completado) >= today
    ).length;

    const rechazadosHoy = enviados.filter(
      (s) => s.estado === 'RECHAZADO' && s.fecha_completado && new Date(s.fecha_completado) >= today
    ).length;

    return {
      pendientes_recibidos: recibidos.length,
      pendientes_enviados: enviados.filter((s) => ['PENDIENTE', 'EN_REVISION'].includes(s.estado))
        .length,
      aprobados_hoy: aprobadosHoy,
      rechazados_hoy: rechazadosHoy,
    };
  }

  async getSolicitud(id: number): Promise<SolicitudAprobacionDto> {
    const s = await this.repo.findOne({ where: { id }, relations: ['pasos'] });
    if (!s) throw new NotFoundError('SolicitudAprobacion', id);
    return toSolicitudDto(s);
  }

  async listar(): Promise<SolicitudAprobacionDto[]> {
    const all = await this.repo.find({
      relations: ['pasos'],
      order: { fechaCreacion: 'DESC' } as any,
    });
    return all.map(toSolicitudDto);
  }

  async getAuditTrail(solicitudId: number): Promise<any[]> {
    const entries = await this.auditRepo.find({
      where: { solicitudId } as any,
      order: { timestamp: 'ASC' } as any,
    });
    return entries.map((a) => ({
      id: a.id,
      accion: a.accion,
      usuario_id: a.usuarioId,
      paso_numero: a.pasoNumero,
      comentario: a.comentario,
      timestamp: a.timestamp?.toISOString(),
      metadata: a.metadata,
    }));
  }

  async cancelar(solicitudId: number, usuarioId: number, tenantId?: number): Promise<void> {
    const solicitud = await this.repo.findOne({ where: { id: solicitudId } });
    if (!solicitud) throw new NotFoundError('SolicitudAprobacion', solicitudId);

    if (['APROBADO', 'RECHAZADO', 'CANCELADO'].includes(solicitud.estado)) {
      throw new ConflictError(`La solicitud ya está en estado final '${solicitud.estado}'`);
    }

    await this.repo.update(solicitudId, { estado: 'CANCELADO' } as any);
    await this.audit({
      tenantId,
      solicitudId,
      accion: 'CANCELLED',
      usuarioId,
    });
  }
}
