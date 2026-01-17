/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Contract, Addendum } from '../models/contract.model';
import { Repository, Between } from 'typeorm';
import { ContractDto, toContractDto, fromContractDto } from '../types/dto/contract.dto';
import Logger from '../utils/logger';

export class ContractService {
  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  /**
   * Get all contracts with optional filters
   */
  async findAll(filters?: {
    search?: string;
    estado?: string;
    equipment_id?: number;
    provider_id?: number;
  }): Promise<ContractDto[]> {
    try {
      const query = this.contractRepository
        .createQueryBuilder('contract')
        .leftJoinAndSelect('contract.equipo', 'equipo')
        .leftJoinAndSelect('equipo.provider', 'provider')
        .where('contract.tipo = :tipo', { tipo: 'CONTRATO' })
        .andWhere('contract.estado != :cancelado', { cancelado: 'CANCELADO' });

      if (filters?.estado) {
        query.andWhere('contract.estado = :estado', { estado: filters.estado });
      }

      if (filters?.equipment_id) {
        query.andWhere('contract.equipoId = :equipment_id', {
          equipment_id: filters.equipment_id,
        });
      }

      if (filters?.provider_id) {
        query.andWhere('equipo.proveedorId = :provider_id', {
          provider_id: filters.provider_id,
        });
      }

      if (filters?.search) {
        query.andWhere(
          '(contract.numeroContrato ILIKE :search OR provider.razon_social ILIKE :search OR equipo.modelo ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      query.orderBy('contract.fechaInicio', 'DESC');

      const contracts = await query.getMany();

      // Transform entities to DTOs
      return contracts.map(toContractDto);
    } catch (error) {
      Logger.error('Error finding contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractService.findAll',
      });
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  /**
   * Get contract by ID
   */
  async findById(id: number): Promise<ContractDto> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id },
        relations: ['adendas', 'equipo', 'equipo.provider'],
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Transform entity to DTO
      return toContractDto(contract);
    } catch (error) {
      Logger.error('Error finding contract by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ContractService.findById',
      });
      throw error;
    }
  }

  /**
   * Get contract by numeroContrato
   */
  async findByNumero(numeroContrato: string): Promise<Contract | null> {
    try {
      return await this.contractRepository.findOne({
        where: { numeroContrato },
      });
    } catch (error) {
      Logger.error('Error finding contract by numero', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        numeroContrato,
        context: 'ContractService.findByNumero',
      });
      throw error;
    }
  }

  /**
   * Create new contract
   */
  async create(data: Partial<ContractDto>): Promise<ContractDto> {
    try {
      // Validate required fields
      if (!data.numero_contrato || !data.fecha_inicio || !data.fecha_fin) {
        throw new Error('numero_contrato, fecha_inicio, and fecha_fin are required');
      }

      // Validate dates
      if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
        throw new Error('End date must be after start date');
      }

      // Check if numeroContrato already exists
      const existing = await this.findByNumero(data.numero_contrato);
      if (existing) {
        throw new Error('Contract with this number already exists');
      }

      // Check for overlapping contracts
      if (data.equipo_id) {
        const overlapping = await this.checkOverlappingContracts(
          data.equipo_id,
          new Date(data.fecha_inicio),
          new Date(data.fecha_fin)
        );
        if (overlapping) {
          throw new Error('Equipment already has an active contract for this period');
        }
      }

      // Transform DTO to entity
      const entityData = fromContractDto(data);

      const contract = this.contractRepository.create({
        ...entityData,
        tipo: 'CONTRATO',
        estado: 'ACTIVO',
      });

      const saved = await this.contractRepository.save(contract);

      // Return as DTO
      return toContractDto(saved);
    } catch (error) {
      Logger.error('Error creating contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ContractService.create',
      });
      throw error;
    }
  }

  /**
   * Update contract
   */
  async update(id: number, data: Partial<ContractDto>): Promise<ContractDto> {
    try {
      const contractDto = await this.findById(id);

      // Validate dates if being updated
      if (data.fecha_inicio && data.fecha_fin) {
        if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
          throw new Error('End date must be after start date');
        }
      }

      // If updating numeroContrato, check it doesn't exist
      if (data.numero_contrato && data.numero_contrato !== contractDto.numero_contrato) {
        const existing = await this.findByNumero(data.numero_contrato);
        if (existing && existing.id !== id) {
          throw new Error('Contract with this number already exists');
        }
      }

      // Transform DTO to entity data
      const entityData = fromContractDto(data);

      // Update entity
      await this.contractRepository.update(id, entityData);

      // Fetch updated entity and return as DTO
      const updated = await this.contractRepository.findOne({
        where: { id },
        relations: ['adendas', 'equipo', 'equipo.provider'],
      });

      if (!updated) {
        throw new Error('Contract not found after update');
      }

      return toContractDto(updated);
    } catch (error) {
      Logger.error('Error updating contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'ContractService.update',
      });
      throw error;
    }
  }

  /**
   * Soft delete contract
   */
  async delete(id: number): Promise<void> {
    try {
      await this.contractRepository.update(id, {
        estado: 'CANCELADO' as any,
      });
    } catch (error) {
      Logger.error('Error deleting contract', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ContractService.delete',
      });
      throw new Error('Failed to delete contract');
    }
  }

  /**
   * Get expiring contracts
   */
  async findExpiring(days: number = 30): Promise<ContractDto[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const contracts = await this.contractRepository.find({
        where: {
          estado: 'ACTIVO',
          fechaFin: Between(today, futureDate),
        },
        relations: ['equipo', 'equipo.provider'],
        order: { fechaFin: 'ASC' },
      });

      return contracts.map(toContractDto);
    } catch (error) {
      Logger.error('Error finding expiring contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        days,
        context: 'ContractService.findExpiring',
      });
      throw error;
    }
  }

  /**
   * Check for overlapping contracts
   */
  private async checkOverlappingContracts(
    equipoId: number,
    fechaInicio: Date,
    fechaFin: Date,
    excludeContractId?: number
  ): Promise<boolean> {
    try {
      const query = this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.equipoId = :equipoId', { equipoId })
        .andWhere('contract.estado = :estado', { estado: 'ACTIVO' })
        .andWhere('contract.tipo = :tipo', { tipo: 'CONTRATO' })
        .andWhere('(contract.fechaInicio <= :fechaFin AND contract.fechaFin >= :fechaInicio)', {
          fechaInicio,
          fechaFin,
        });

      if (excludeContractId) {
        query.andWhere('contract.id != :excludeContractId', { excludeContractId });
      }

      const count = await query.getCount();
      return count > 0;
    } catch (error) {
      Logger.error('Error checking overlapping contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        equipoId,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        excludeContractId,
        context: 'ContractService.checkOverlappingContracts',
      });
      return false;
    }
  }

  /**
   * Get addendums for a contract (addendums are stored in same table with tipo='ADENDA')
   */
  async getAddendums(contractId: number): Promise<ContractDto[]> {
    try {
      const addendums = await this.contractRepository.find({
        where: {
          contratoPadreId: contractId,
          tipo: 'ADENDA',
        },
        relations: ['equipo', 'equipo.provider'],
        order: { createdAt: 'ASC' },
      });

      return addendums.map(toContractDto);
    } catch (error) {
      Logger.error('Error fetching addendums', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contractId,
        context: 'ContractService.getAddendums',
      });
      throw error;
    }
  }

  /**
   * Create addendum (stored in same table with tipo='ADENDA')
   */
  async createAddendum(data: Partial<ContractDto>): Promise<ContractDto> {
    try {
      if (!data.contrato_padre_id || !data.numero_contrato || !data.fecha_fin) {
        throw new Error('contrato_padre_id, numero_contrato, and fecha_fin are required');
      }

      const contractDto = await this.findById(data.contrato_padre_id);

      // Validate new end date is after current end date
      if (new Date(data.fecha_fin) <= new Date(contractDto.fecha_fin)) {
        throw new Error('New end date must be after current contract end date');
      }

      // Transform DTO to entity
      const entityData = fromContractDto(data);

      const addendum = this.contractRepository.create({
        ...entityData,
        tipo: 'ADENDA',
        estado: 'ACTIVO',
      });

      const savedAddendum = await this.contractRepository.save(addendum);

      // Update parent contract end date
      await this.contractRepository.update(contractDto.id, {
        fechaFin: new Date(data.fecha_fin),
      });

      return toContractDto(savedAddendum);
    } catch (error) {
      Logger.error('Error creating addendum', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ContractService.createAddendum',
      });
      throw error;
    }
  }

  /**
   * Get active contracts count
   */
  async getActiveCount(): Promise<number> {
    try {
      return await this.contractRepository.count({
        where: {
          estado: 'ACTIVO',
          tipo: 'CONTRATO',
        },
      });
    } catch (error) {
      Logger.error('Error counting contracts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ContractService.getActiveCount',
      });
      throw error;
    }
  }
}
