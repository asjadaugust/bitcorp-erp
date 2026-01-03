import { AppDataSource } from '../config/database.config';
import { Contract, Addendum } from '../models/contract.model';
import { Repository, LessThan, MoreThan, Between } from 'typeorm';

export class ContractService {
  private get contractRepository(): Repository<Contract> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Contract);
  }

  private get addendumRepository(): Repository<Addendum> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Addendum);
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
        .leftJoinAndSelect('contract.equipment', 'equipment')
        .leftJoinAndSelect('equipment.provider', 'provider')
        .where('contract.estado != :inactivo', { inactivo: 'INACTIVO' });

      if (filters?.estado) {
        query.andWhere('contract.estado = :estado', { estado: filters.estado });
      }

      if (filters?.equipment_id) {
        query.andWhere('contract.equipment_id = :equipment_id', {
          equipment_id: filters.equipment_id,
        });
      }

      if (filters?.provider_id) {
        query.andWhere('equipment.provider_id = :provider_id', {
          provider_id: filters.provider_id,
        });
      }

      if (filters?.search) {
        query.andWhere(
          '(contract.numero_contrato ILIKE :search OR provider.razon_social ILIKE :search OR equipment.modelo ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      query.orderBy('contract.fecha_inicio', 'DESC');

      const contracts = await query.getMany();

      // Transform data to match frontend expectations
      return contracts.map((contract) => ({
        ...contract,
        code: contract.numero_contrato,
        provider_name: contract.equipment?.provider?.razon_social || 'N/A',
        equipment_info: contract.equipment
          ? `${contract.equipment.modelo || ''} / ${contract.equipment.placa || ''}`.trim()
          : 'N/A',
        modalidad: contract.tipo_tarifa || 'N/A',
        start_date: contract.fecha_inicio,
        end_date: contract.fecha_fin,
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
  async findById(id: number): Promise<Contract> {
    try {
      const contract = await this.contractRepository.findOne({
        where: { id },
        relations: ['addendums'],
      });

      if (!contract) {
        throw new Error('Contract not found');
      }

      return contract;
    } catch (error) {
      console.error('Error finding contract:', error);
      throw error;
    }
  }

  /**
   * Get contract by numero_contrato
   */
  async findByNumero(numero_contrato: string): Promise<Contract | null> {
    try {
      return await this.contractRepository.findOne({
        where: { numero_contrato },
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
      if (!data.numero_contrato || !data.fecha_inicio || !data.fecha_fin) {
        throw new Error('numero_contrato, fecha_inicio, and fecha_fin are required');
      }

      // Validate dates
      if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
        throw new Error('End date must be after start date');
      }

      // Check if numero_contrato already exists
      const existing = await this.findByNumero(data.numero_contrato);
      if (existing) {
        throw new Error('Contract with this number already exists');
      }

      // Check for overlapping contracts
      if (data.equipment_id) {
        const overlapping = await this.checkOverlappingContracts(
          data.equipment_id,
          new Date(data.fecha_inicio),
          new Date(data.fecha_fin)
        );
        if (overlapping) {
          throw new Error('Equipment already has an active contract for this period');
        }
      }

      const contract = this.contractRepository.create({
        ...data,
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
      if (data.fecha_inicio && data.fecha_fin) {
        if (new Date(data.fecha_fin) <= new Date(data.fecha_inicio)) {
          throw new Error('End date must be after start date');
        }
      }

      // If updating numero_contrato, check it doesn't exist
      if (data.numero_contrato && data.numero_contrato !== contract.numero_contrato) {
        const existing = await this.findByNumero(data.numero_contrato);
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
        estado: 'INACTIVO',
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
          fecha_fin: Between(today, futureDate),
        },
        order: { fecha_fin: 'ASC' },
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
    equipment_id: number,
    fecha_inicio: Date,
    fecha_fin: Date,
    excludeContractId?: number
  ): Promise<boolean> {
    try {
      const query = this.contractRepository
        .createQueryBuilder('contract')
        .where('contract.equipment_id = :equipment_id', { equipment_id })
        .andWhere('contract.estado = :estado', { estado: 'ACTIVO' })
        .andWhere('(contract.fecha_inicio <= :fecha_fin AND contract.fecha_fin >= :fecha_inicio)', {
          fecha_inicio,
          fecha_fin,
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
   * Get addendums for a contract
   */
  async getAddendums(contractId: number): Promise<Addendum[]> {
    try {
      return await this.addendumRepository.find({
        where: { contract_id: contractId },
        order: { created_at: 'ASC' },
      });
    } catch (error) {
      console.error('Error fetching addendums:', error);
      throw error;
    }
  }

  /**
   * Create addendum
   */
  async createAddendum(data: Partial<Addendum>): Promise<Addendum> {
    try {
      if (
        !data.contract_id ||
        !data.numero_adenda ||
        !data.nueva_fecha_fin ||
        !data.justificacion
      ) {
        throw new Error(
          'contract_id, numero_adenda, nueva_fecha_fin, and justificacion are required'
        );
      }

      const contract = await this.findById(data.contract_id);

      // Validate new end date is after current end date
      if (new Date(data.nueva_fecha_fin) <= new Date(contract.fecha_fin)) {
        throw new Error('New end date must be after current contract end date');
      }

      const addendum = this.addendumRepository.create({
        ...data,
      });

      const savedAddendum = await this.addendumRepository.save(addendum);

      // Update contract status to 'extendido' and update end date
      await this.contractRepository.update(contract.id, {
        estado: 'extendido',
        fecha_fin: new Date(data.nueva_fecha_fin),
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
        where: { estado: 'ACTIVO' },
      });
    } catch (error) {
      console.error('Error counting contracts:', error);
      throw error;
    }
  }
}
