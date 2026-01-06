/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ContractService } from '../../services/contract.service';

const contractService = new ContractService();

export class ContractController {
  /**
   * GET /api/contracts
   * Get all contracts with optional filters
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const { search, estado, equipment_id, provider_id, project_id } = req.query;

      const filters: any = {};

      if (search) filters.search = String(search);
      if (estado) filters.estado = String(estado);
      if (equipment_id) filters.equipment_id = parseInt(String(equipment_id));
      if (provider_id) filters.provider_id = parseInt(String(provider_id));
      if (project_id) filters.project_id = parseInt(String(project_id));

      const contracts = await contractService.findAll(filters);

      res.json(contracts);
    } catch (error: any) {
      console.error('Error in getAll contracts:', error);
      res.status(500).json({
        error: 'Failed to fetch contracts',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/contracts/:id
   * Get contract by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contract ID' });
        return;
      }

      const contract = await contractService.findById(id);

      res.json(contract);
    } catch (error: any) {
      console.error('Error in getById contract:', error);

      if (error.message === 'Contract not found') {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.status(500).json({
        error: 'Failed to fetch contract',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/contracts/numero/:numero
   * Get contract by numero_contrato
   */
  static async getByNumero(req: Request, res: Response): Promise<void> {
    try {
      const { numero } = req.params;

      const contract = await contractService.findByNumero(numero);

      if (!contract) {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      res.json(contract);
    } catch (error: any) {
      console.error('Error in getByNumero contract:', error);
      res.status(500).json({
        error: 'Failed to fetch contract',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/contracts
   * Create new contract
   */
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const contract = await contractService.create(req.body);

      res.status(201).json(contract);
    } catch (error: any) {
      console.error('Error in create contract:', error);

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to create contract',
        message: error.message,
      });
    }
  }

  /**
   * PUT /api/contracts/:id
   * Update contract
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contract ID' });
        return;
      }

      const contract = await contractService.update(id, req.body);

      res.json(contract);
    } catch (error: any) {
      console.error('Error in update contract:', error);

      if (error.message === 'Contract not found') {
        res.status(404).json({ error: 'Contract not found' });
        return;
      }

      if (error.message.includes('already exists')) {
        res.status(409).json({ error: error.message });
        return;
      }

      if (error.message.includes('must be')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to update contract',
        message: error.message,
      });
    }
  }

  /**
   * DELETE /api/contracts/:id
   * Soft delete contract
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contract ID' });
        return;
      }

      await contractService.delete(id);

      res.status(204).send();
    } catch (error: any) {
      console.error('Error in delete contract:', error);
      res.status(500).json({
        error: 'Failed to delete contract',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/contracts/expiring/:days
   * Get expiring contracts
   */
  static async getExpiring(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.params.days || '30');

      const contracts = await contractService.findExpiring(days);

      res.json(contracts);
    } catch (error: any) {
      console.error('Error in getExpiring contracts:', error);
      res.status(500).json({
        error: 'Failed to fetch expiring contracts',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/contracts/:id/addendums
   * Get addendums for a contract
   */
  static async getAddendums(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid contract ID' });
        return;
      }

      const addendums = await contractService.getAddendums(id);

      res.json(addendums);
    } catch (error: any) {
      console.error('Error in getAddendums:', error);
      res.status(500).json({
        error: 'Failed to fetch addendums',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/contracts/:id/addendums
   * Create addendum for a contract
   */
  static async createAddendum(req: Request, res: Response): Promise<void> {
    try {
      const contract_id = parseInt(req.params.id);

      if (isNaN(contract_id)) {
        res.status(400).json({ error: 'Invalid contract ID' });
        return;
      }

      const addendum = await contractService.createAddendum({
        ...req.body,
        contract_id,
      });

      res.status(201).json(addendum);
    } catch (error: any) {
      console.error('Error in createAddendum:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message.includes('required') || error.message.includes('must be')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to create addendum',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/contracts/stats/count
   * Get active contracts count
   */
  static async getActiveCount(req: Request, res: Response): Promise<void> {
    try {
      const count = await contractService.getActiveCount();

      res.json({ count });
    } catch (error: any) {
      console.error('Error in getActiveCount:', error);
      res.status(500).json({
        error: 'Failed to count contracts',
        message: error.message,
      });
    }
  }
}
