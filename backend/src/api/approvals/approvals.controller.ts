/* eslint-disable @typescript-eslint/no-explicit-any */
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ApprovalTemplateService } from '../../services/approval-template.service';
import { ApprovalRequestService } from '../../services/approval-request.service';
import { ApprovalAdhocService } from '../../services/approval-adhoc.service';
import { sendSuccess, sendCreated, sendError } from '../../utils/api-response';
import { NotFoundError, ConflictError, ValidationError } from '../../errors';
import logger from '../../utils/logger';

const templateSvc = new ApprovalTemplateService();
const requestSvc = new ApprovalRequestService();
const adhocSvc = new ApprovalAdhocService();

export class ApprovalsController {
  // ─── Templates ──────────────────────────────────────────────────────────────

  async getTemplates(req: AuthRequest, res: Response) {
    try {
      const data = await templateSvc.listar();
      sendSuccess(res, data);
    } catch (error: any) {
      logger.error('Error listando plantillas', { error: error.message });
      sendError(res, 500, 'TEMPLATES_LIST_FAILED', 'Error al listar plantillas', error.message);
    }
  }

  async createTemplate(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user!.id_usuario;
      const data = await templateSvc.crearPlantilla(req.body, usuarioId);
      sendCreated(res, data);
    } catch (error: any) {
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      logger.error('Error creando plantilla', { error: error.message });
      sendError(res, 500, 'TEMPLATE_CREATE_FAILED', 'Error al crear plantilla', error.message);
    }
  }

  async getTemplate(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID de plantilla inválido');
      const data = await templateSvc.obtenerPorId(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'TEMPLATE_GET_FAILED', 'Error al obtener plantilla', error.message);
    }
  }

  async updateTemplate(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID de plantilla inválido');
      const usuarioId = req.user!.id_usuario;
      const data = await templateSvc.actualizar(id, req.body, usuarioId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      sendError(res, 500, 'TEMPLATE_UPDATE_FAILED', 'Error al actualizar plantilla', error.message);
    }
  }

  async activateTemplate(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID de plantilla inválido');
      const data = await templateSvc.activar(id, req.user!.id_usuario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'TEMPLATE_ACTIVATE_FAILED', 'Error al activar plantilla', error.message);
    }
  }

  async archiveTemplate(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID de plantilla inválido');
      const data = await templateSvc.archivar(id, req.user!.id_usuario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'TEMPLATE_ARCHIVE_FAILED', 'Error al archivar plantilla', error.message);
    }
  }

  // ─── Dashboard ──────────────────────────────────────────────────────────────

  async getDashboardRecibidos(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id_usuario;
      const userRole = (req.user as any).rol;
      const data = await requestSvc.getDashboardRecibidos(userId, userRole);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'DASHBOARD_FAILED', 'Error al obtener recibidos', error.message);
    }
  }

  async getDashboardEnviados(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id_usuario;
      const data = await requestSvc.getDashboardEnviados(userId);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'DASHBOARD_FAILED', 'Error al obtener enviados', error.message);
    }
  }

  async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id_usuario;
      const userRole = (req.user as any).rol;
      const data = await requestSvc.getDashboardStats(userId, userRole);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'DASHBOARD_FAILED', 'Error al obtener estadísticas', error.message);
    }
  }

  // ─── Requests ───────────────────────────────────────────────────────────────

  async getRequests(req: AuthRequest, res: Response) {
    try {
      const data = await requestSvc.listar();
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'REQUESTS_LIST_FAILED', 'Error al listar solicitudes', error.message);
    }
  }

  async createRequest(req: AuthRequest, res: Response) {
    try {
      const usuarioId = req.user!.id_usuario;
      const { module_name, entity_id, proyecto_id, titulo, descripcion } = req.body;

      if (!module_name || !entity_id || !titulo) {
        return sendError(
          res,
          422,
          'VALIDATION_ERROR',
          'Campos requeridos: module_name, entity_id, titulo'
        );
      }

      const data = await requestSvc.instanciar(
        module_name,
        parseInt(entity_id),
        proyecto_id ? parseInt(proyecto_id) : undefined,
        titulo,
        descripcion,
        usuarioId
      );
      sendCreated(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      sendError(res, 500, 'REQUEST_CREATE_FAILED', 'Error al crear solicitud', error.message);
    }
  }

  async getRequest(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const data = await requestSvc.getSolicitud(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'REQUEST_GET_FAILED', 'Error al obtener solicitud', error.message);
    }
  }

  async approveRequest(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const userId = req.user!.id_usuario;
      const userRole = (req.user as any).rol;
      const { comentario } = req.body;
      const data = await requestSvc.aprobarPaso(id, userId, userRole, comentario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'APPROVE_FAILED', 'Error al aprobar solicitud', error.message);
    }
  }

  async rejectRequest(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const userId = req.user!.id_usuario;
      const { comentario } = req.body;

      if (!comentario) {
        return sendError(
          res,
          422,
          'VALIDATION_ERROR',
          'El comentario es obligatorio para rechazar'
        );
      }

      const data = await requestSvc.rechazar(id, userId, comentario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'REJECT_FAILED', 'Error al rechazar solicitud', error.message);
    }
  }

  async rebaseRequest(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const { nueva_plantilla_id } = req.body;
      if (!nueva_plantilla_id)
        return sendError(res, 422, 'VALIDATION_ERROR', 'nueva_plantilla_id es requerido');
      const userId = req.user!.id_usuario;
      const data = await requestSvc.rebase(id, parseInt(nueva_plantilla_id), userId);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'REBASE_FAILED', 'Error al rebasar solicitud', error.message);
    }
  }

  async cancelRequest(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const userId = req.user!.id_usuario;
      await requestSvc.cancelar(id, userId);
      sendSuccess(res, { message: 'Solicitud cancelada' });
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'CANCEL_FAILED', 'Error al cancelar solicitud', error.message);
    }
  }

  async getRequestAudit(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const data = await requestSvc.getAuditTrail(id);
      sendSuccess(res, data);
    } catch (error: any) {
      sendError(res, 500, 'AUDIT_FAILED', 'Error al obtener auditoría', error.message);
    }
  }

  // ─── Ad-hoc ─────────────────────────────────────────────────────────────────

  async getAdhocList(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id_usuario;
      const [mios, pendientes] = await Promise.all([
        adhocSvc.listarMios(userId),
        adhocSvc.listarPendientes(userId),
      ]);
      sendSuccess(res, { enviados: mios, pendientes });
    } catch (error: any) {
      sendError(res, 500, 'ADHOC_LIST_FAILED', 'Error al listar ad-hoc', error.message);
    }
  }

  async createAdhoc(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id_usuario;
      const data = await adhocSvc.crear(req.body, userId);
      sendCreated(res, data);
    } catch (error: any) {
      if (error instanceof ValidationError)
        return sendError(res, 422, 'VALIDATION_ERROR', error.message);
      sendError(res, 500, 'ADHOC_CREATE_FAILED', 'Error al crear ad-hoc', error.message);
    }
  }

  async getAdhoc(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const data = await adhocSvc.obtener(id);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      sendError(res, 500, 'ADHOC_GET_FAILED', 'Error al obtener ad-hoc', error.message);
    }
  }

  async respondAdhoc(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return sendError(res, 400, 'INVALID_ID', 'ID inválido');
      const userId = req.user!.id_usuario;
      const { respuesta, comentario } = req.body;

      if (!['APROBADO', 'RECHAZADO'].includes(respuesta)) {
        return sendError(res, 422, 'VALIDATION_ERROR', 'respuesta debe ser APROBADO o RECHAZADO');
      }

      const data = await adhocSvc.responder(id, userId, respuesta, comentario);
      sendSuccess(res, data);
    } catch (error: any) {
      if (error instanceof NotFoundError) return sendError(res, 404, 'NOT_FOUND', error.message);
      if (error instanceof ConflictError) return sendError(res, 409, 'CONFLICT', error.message);
      sendError(res, 500, 'ADHOC_RESPOND_FAILED', 'Error al responder ad-hoc', error.message);
    }
  }
}
