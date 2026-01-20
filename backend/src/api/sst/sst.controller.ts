/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { SstService } from '../../services/sst.service';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';
import Logger from '../../utils/logger';
import { NotFoundError, ConflictError } from '../../errors/http.errors';

export class SstController {
  private sstService = new SstService();

  /**
   * GET /incidents - List all safety incidents with pagination and filters
   */
  getIncidents = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const filters = {
        search: req.query.search as string,
        estado: req.query.estado as string,
        severidad: req.query.severidad as string,
      };

      const result = await this.sstService.findAll(tenantId, filters, page, limit);

      sendSuccess(res, result.data, {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error: any) {
      Logger.error('Error fetching incidents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.getIncidents',
      });
      sendError(
        res,
        500,
        'INCIDENTS_FETCH_FAILED',
        'Error al obtener los incidentes de seguridad',
        error.message
      );
    }
  };

  /**
   * GET /incidents/:id - Get single safety incident by ID
   */
  getIncidentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);

      const incident = await this.sstService.findById(tenantId, id);
      sendSuccess(res, incident);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      Logger.error('Error fetching incident by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.getIncidentById',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al obtener el incidente', error.message);
    }
  };

  /**
   * POST /incidents - Create new safety incident
   */
  createIncident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const incidentData = {
        ...req.body,
        reportado_por: (req as any).user?.id,
      };

      const incident = await this.sstService.create(tenantId, incidentData);
      sendCreated(res, incident);
    } catch (error: any) {
      if (error instanceof ConflictError) {
        sendError(res, 409, 'VALIDATION_ERROR', error.message);
        return;
      }
      Logger.error('Error creating incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.createIncident',
      });
      sendError(
        res,
        500,
        'INCIDENT_CREATE_FAILED',
        'Error al crear el incidente de seguridad',
        error.message
      );
    }
  };

  /**
   * PUT /incidents/:id - Update safety incident
   */
  updateIncident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);

      const incident = await this.sstService.update(tenantId, id, req.body);
      sendSuccess(res, incident);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      if (error instanceof ConflictError) {
        sendError(res, 409, 'VALIDATION_ERROR', error.message);
        return;
      }
      Logger.error('Error updating incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.updateIncident',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al actualizar el incidente', error.message);
    }
  };

  /**
   * DELETE /incidents/:id - Delete safety incident
   */
  deleteIncident = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const tenantId = req.user!.id_empresa; // Get tenantId from JWT token (multi-tenant context)
      const id = parseInt(req.params.id);

      await this.sstService.delete(tenantId, id);
      sendSuccess(res, { message: 'Incidente eliminado exitosamente' });
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        sendError(res, 404, 'INCIDENT_NOT_FOUND', 'Incidente no encontrado');
        return;
      }
      Logger.error('Error deleting incident', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'SstController.deleteIncident',
      });
      sendError(res, 500, 'INTERNAL_ERROR', 'Error al eliminar el incidente', error.message);
    }
  };
}
