/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { SafetyIncident } from '../../models/safety-incident.model';
import { sendSuccess, sendError, sendCreated } from '../../utils/api-response';
import Logger from '../../utils/logger';

export class SstController {
  getIncidents = async (req: Request, res: Response): Promise<void> => {
    try {
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);
      const incidents = await incidentRepo.find({
        order: { fechaIncidente: 'DESC' },
      });

      sendSuccess(res, incidents);
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

  createIncident = async (req: Request, res: Response): Promise<void> => {
    try {
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);

      const incidentData = {
        ...req.body,
        reportedById: (req as any).user?.id,
      };

      const incident = incidentRepo.create(incidentData);
      const savedIncident = await incidentRepo.save(incident);

      sendCreated(res, savedIncident);
    } catch (error: any) {
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
}
