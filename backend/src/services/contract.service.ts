/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Contract, Addendum } from '../models/contract.model';
import { Repository, Between } from 'typeorm';

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
  }): Promise<any[]> {
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
        query.andWhere('equipo.provider_id = :provider_id', {
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

      // Transform data to match frontend expectations
      return contracts.map((contract) => ({
        ...contract,
        code: contract.numeroContrato,
        provider_name: contract.equipo?.provider?.razon_social || 'N/A',
        equipment_info: contract.equipo
          ? `${contract.equipo.modelo || ''} / ${contract.equipo.placa || ''}`.trim()
          : 'N/A',
        modalidad: contract.tipoTarifa || 'N/A',
        start_date: contract.fechaInicio,
        end_date: contract.fechaFin,
        status: contract.estado,
      }));
    } catch (error) {
      console.error('Error finding contracts:', error);
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  /**
   * Get contract by ID
   */
  async findById(id: number): Promise<any> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id },
        relations: ['adendas', 'equipo', 'equipo.provider'],
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Transform to match frontend expectations
      return {
        ...contract,
        code: contract.numeroContrato,
        numero_contrato: contract.numeroContrato,
        provider_name: contract.equipo?.provider?.razon_social || 'N/A',
        provider_id: contract.equipo?.provider_id || null,
        equipment_id: contract.equipoId,
        equipment_info: contract.equipo
          ? `${contract.equipo.modelo || ''} / ${contract.equipo.placa || ''}`.trim()
          : 'N/A',
        equipment_code: contract.equipo?.codigo_equipo || 'N/A',
        modalidad: contract.tipoTarifa || 'N/A',
        fecha_contrato: contract.fechaContrato,
        fecha_inicio: contract.fechaInicio,
        fecha_fin: contract.fechaFin,
        start_date: contract.fechaInicio,
        end_date: contract.fechaFin,
        tipo_tarifa: contract.tipoTarifa,
        incluye_motor: contract.incluyeMotor,
        incluye_operador: contract.incluyeOperador,
        costo_adicional_motor: contract.costoAdicionalMotor,
        horas_incluidas: contract.horasIncluidas,
        penalidad_exceso: contract.penalidadExceso,
        condiciones_especiales: contract.condicionesEspeciales,
        documento_url: contract.documentoUrl,
        status: contract.estado,
        estado: contract.estado,
        created_at: contract.createdAt,
        updated_at: contract.updatedAt,
        // For now, set client_name and project_name to provider name
        // In a full implementation, these would come from project assignments
        client_name: contract.equipo?.provider?.razon_social || 'N/A',
        project_name: 'N/A', // Would need to query equipment assignments for actual project
      };
    } catch (error) {
      console.error('Error finding contract:', error);
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
      console.error('Error finding contract by numero:', error);
      throw error;
    }
  }

  /**
   * Create new contract
   */
  async create(data: Partial<Contract>): Promise<Contract> {
    try {
      // Validate required fields
      if (!data.numeroContrato || !data.fechaInicio || !data.fechaFin) {
        throw new Error('numeroContrato, fechaInicio, and fechaFin are required');
      }

      // Validate dates
      if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
        throw new Error('End date must be after start date');
      }

      // Check if numeroContrato already exists
      const existing = await this.findByNumero(data.numeroContrato);
      if (existing) {
        throw new Error('Contract with this number already exists');
      }

      // Check for overlapping contracts
      if (data.equipoId) {
        const overlapping = await this.checkOverlappingContracts(
          data.equipoId,
          new Date(data.fechaInicio),
          new Date(data.fechaFin)
        );
        if (overlapping) {
          throw new Error('Equipment already has an active contract for this period');
        }
      }

      const contract = this.contractRepository.create({
        ...data,
        tipo: 'CONTRATO',
        estado: 'ACTIVO',
      });

      return await this.contractRepository.save(contract);
    } catch (error) {
      console.error('Error creating contract:', error);
      throw error;
    }
  }

  /**
   * Update contract
   */
  async update(id: number, data: Partial<Contract>): Promise<Contract> {
    try {
      const contract = await this.findById(id);

      // Validate dates if being updated
      if (data.fechaInicio && data.fechaFin) {
        if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
          throw new Error('End date must be after start date');
        }
      }

      // If updating numeroContrato, check it doesn't exist
      if (data.numeroContrato && data.numeroContrato !== contract.numeroContrato) {
        const existing = await this.findByNumero(data.numeroContrato);
        if (existing && existing.id !== id) {
          throw new Error('Contract with this number already exists');
        }
      }

      // Update fields
      Object.assign(contract, data);

      return await this.contractRepository.save(contract);
    } catch (error) {
      console.error('Error updating contract:', error);
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
      console.error('Error deleting contract:', error);
      throw new Error('Failed to delete contract');
    }
  }

  /**
   * Get expiring contracts
   */
  async findExpiring(days: number = 30): Promise<Contract[]> {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      return await this.contractRepository.find({
        where: {
          estado: 'ACTIVO',
          fechaFin: Between(today, futureDate),
        },
        order: { fechaFin: 'ASC' },
      });
    } catch (error) {
      console.error('Error finding expiring contracts:', error);
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
      console.error('Error checking overlapping contracts:', error);
      return false;
    }
  }

  /**
   * Get addendums for a contract (addendums are stored in same table with tipo='ADENDA')
   */
  async getAddendums(contractId: number): Promise<Addendum[]> {
    try {
      return await this.contractRepository.find({
        where: {
          contratoPadreId: contractId,
          tipo: 'ADENDA',
        },
        order: { createdAt: 'ASC' },
      });
    } catch (error) {
      console.error('Error fetching addendums:', error);
      throw error;
    }
  }

  /**
   * Create addendum (stored in same table with tipo='ADENDA')
   */
  async createAddendum(data: Partial<Contract>): Promise<Contract> {
    try {
      if (!data.contratoPadreId || !data.numeroContrato || !data.fechaFin) {
        throw new Error('contratoPadreId, numeroContrato, and fechaFin are required');
      }

      const contract = await this.findById(data.contratoPadreId);

      // Validate new end date is after current end date
      if (new Date(data.fechaFin) <= new Date(contract.fechaFin)) {
        throw new Error('New end date must be after current contract end date');
      }

      const addendum = this.contractRepository.create({
        ...data,
        tipo: 'ADENDA',
        estado: 'ACTIVO',
      });

      const savedAddendum = await this.contractRepository.save(addendum);

      // Update parent contract end date
      await this.contractRepository.update(contract.id, {
        fechaFin: new Date(data.fechaFin),
      });

      return savedAddendum;
    } catch (error) {
      console.error('Error creating addendum:', error);
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
      console.error('Error counting contracts:', error);
      throw error;
    }
  }
}
