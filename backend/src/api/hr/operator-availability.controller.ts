import { Request, Response } from 'express';
import { OperatorAvailabilityService } from '../../services/operator-availability.service';

const availabilityService = new OperatorAvailabilityService();

export class OperatorAvailabilityController {
  async getAvailabilities(req: Request, res: Response) {
    try {
      const { operator_id, project_id, status, date, start_date, end_date } = req.query;
      const availabilities = await availabilityService.findAll({
        operator_id: operator_id ? Number(operator_id) : undefined,
        project_id: project_id ? Number(project_id) : undefined,
        status: status as string,
        date: date ? new Date(date as string) : undefined,
        start_date: start_date ? new Date(start_date as string) : undefined,
        end_date: end_date ? new Date(end_date as string) : undefined
      });
      res.json(availabilities);
    } catch (error) {
      console.error('Error fetching availabilities:', error);
      res.status(500).json({ error: 'Failed to fetch availabilities' });
    }
  }

  async getAvailabilityById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const availability = await availabilityService.findById(Number(id));
      if (!availability) {
        return res.status(404).json({ error: 'Availability not found' });
      }
      res.json(availability);
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  }

  async getAvailabilityByOperator(req: Request, res: Response) {
    try {
      const { operatorId } = req.params;
      const { start_date, end_date } = req.query;
      const availabilities = await availabilityService.findByOperator(
        Number(operatorId),
        start_date ? new Date(start_date as string) : undefined,
        end_date ? new Date(end_date as string) : undefined
      );
      res.json(availabilities);
    } catch (error) {
      console.error('Error fetching operator availability:', error);
      res.status(500).json({ error: 'Failed to fetch operator availability' });
    }
  }

  async getAvailableOperators(req: Request, res: Response) {
    try {
      const { date, project_id } = req.query;
      if (!date) {
        return res.status(400).json({ error: 'Date parameter is required' });
      }
      const availabilities = await availabilityService.findAvailableOperators(
        new Date(date as string),
        project_id ? Number(project_id) : undefined
      );
      res.json(availabilities);
    } catch (error) {
      console.error('Error fetching available operators:', error);
      res.status(500).json({ error: 'Failed to fetch available operators' });
    }
  }

  async createAvailability(req: Request, res: Response) {
    try {
      const availability = await availabilityService.create(req.body);
      res.status(201).json(availability);
    } catch (error) {
      console.error('Error creating availability:', error);
      res.status(500).json({ error: 'Failed to create availability' });
    }
  }

  async bulkCreateAvailability(req: Request, res: Response) {
    try {
      const { availabilities } = req.body;
      if (!Array.isArray(availabilities)) {
        return res.status(400).json({ error: 'Availabilities must be an array' });
      }
      const created = await availabilityService.bulkCreate(availabilities);
      res.status(201).json(created);
    } catch (error) {
      console.error('Error bulk creating availability:', error);
      res.status(500).json({ error: 'Failed to bulk create availability' });
    }
  }

  async updateAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const availability = await availabilityService.update(Number(id), req.body);
      if (!availability) {
        return res.status(404).json({ error: 'Availability not found' });
      }
      res.json(availability);
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({ error: 'Failed to update availability' });
    }
  }

  async deleteAvailability(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const success = await availabilityService.delete(Number(id));
      if (!success) {
        return res.status(404).json({ error: 'Availability not found' });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting availability:', error);
      res.status(500).json({ error: 'Failed to delete availability' });
    }
  }
}
