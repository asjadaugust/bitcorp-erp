import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database.config';
import { SafetyIncident } from '../../models/safety-incident.model';

export class SstController {
  getIncidents = async (req: Request, res: Response) => {
    try {
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);
      const incidents = await incidentRepo.find({
        order: { fechaIncidente: 'DESC' },
      });
      
      res.json({
        success: true,
        data: incidents,
      });
    } catch (error) {
      console.error('Error fetching incidents:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching incidents',
        details: (error as Error).message,
      });
    }
  };

  createIncident = async (req: Request, res: Response) => {
    try {
      const incidentRepo = AppDataSource.getRepository(SafetyIncident);
      
      const incidentData = {
        ...req.body,
        reportedById: (req as any).user?.id,
      };
      
      const incident = incidentRepo.create(incidentData);
      const savedIncident = await incidentRepo.save(incident);
      
      res.status(201).json({
        success: true,
        data: savedIncident,
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      res.status(500).json({
        success: false,
        error: 'Error creating incident',
        details: (error as Error).message,
      });
    }
  };
}
