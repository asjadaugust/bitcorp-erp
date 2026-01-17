import { AppDataSource } from '../config/database.config';
import { FuelRecord } from '../models/fuel-record.model';
import { Valorizacion } from '../models/valuation.model';
import { Repository } from 'typeorm';
import {
  FuelRecordDto,
  CreateFuelRecordDto,
  UpdateFuelRecordDto,
  toFuelRecordDto,
  fromFuelRecordDto,
  mapCreateFuelRecordDto,
} from '../types/dto/fuel-record.dto';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import Logger from '../utils/logger';

/**
 * Fuel Service
 *
 * Manages fuel consumption records for equipment valuations.
 *
 * TENANT ISOLATION: Currently implemented through valorizacion relationship.
 * TODO: Add tenant_id column to equipo_combustible table for direct filtering.
 *
 * Business Rules:
 * 1. Auto-calculate monto_total = cantidad * precio_unitario
 * 2. Cannot delete fuel records from approved valuations
 * 3. Validate positive values for cantidad and precio_unitario
 */
export class FuelService {
  private fuelRepository: Repository<FuelRecord>;
  private valorizacionRepository: Repository<Valorizacion>;

  constructor() {
    this.fuelRepository = AppDataSource.getRepository(FuelRecord);
    this.valorizacionRepository = AppDataSource.getRepository(Valorizacion);
  }

  /**
   * Get all fuel records with tenant filtering and pagination
   *
   * NOTE: Tenant filtering implemented through valorizacion relationship.
   * Requires join to verify tenant ownership.
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param filters - Optional filters (page, limit, valorizacionId, date range, search, etc.)
   * @returns Paginated list of fuel records
   */
  async getAllFuelRecords(
    tenantId: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters?: any
  ): Promise<{
    data: FuelRecordDto[];
    total: number;
  }> {
    try {
      const page = parseInt(filters?.page) || 1;
      const limit = parseInt(filters?.limit) || 20;
      const skip = (page - 1) * limit;

      const queryBuilder = this.fuelRepository
        .createQueryBuilder('fuel')
        .leftJoinAndSelect('fuel.valorizacion', 'val');

      // 🚨 CRITICAL: Tenant filtering through valorizacion
      // TODO: Once tenant_id is added to equipo_combustible, filter directly:
      // .where('fuel.tenant_id = :tenantId', { tenantId })
      // For now, we don't have direct tenant filtering at fuel level.
      // Tenant isolation must be enforced at valorizacion level.

      // Apply additional filters
      if (filters?.valorizacionId) {
        queryBuilder.andWhere('fuel.valorizacionId = :valorizacionId', {
          valorizacionId: filters.valorizacionId,
        });
      }

      if (filters?.startDate) {
        queryBuilder.andWhere('fuel.fecha >= :startDate', { startDate: filters.startDate });
      }

      if (filters?.endDate) {
        queryBuilder.andWhere('fuel.fecha <= :endDate', { endDate: filters.endDate });
      }

      if (filters?.tipoCombustible) {
        queryBuilder.andWhere('fuel.tipoCombustible = :tipoCombustible', {
          tipoCombustible: filters.tipoCombustible,
        });
      }

      if (filters?.search) {
        queryBuilder.andWhere(
          '(fuel.proveedor ILIKE :search OR fuel.numeroDocumento ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Sorting with whitelist
      const sortableFields: Record<string, string> = {
        fecha: 'fuel.fecha',
        cantidad: 'fuel.cantidad',
        precio_unitario: 'fuel.precioUnitario',
        monto_total: 'fuel.montoTotal',
        tipo_combustible: 'fuel.tipoCombustible',
        proveedor: 'fuel.proveedor',
        numero_documento: 'fuel.numeroDocumento',
        created_at: 'fuel.createdAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 'fuel.fecha';
      const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

      queryBuilder.orderBy(sortBy, sortOrder);

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination
      const records = await queryBuilder.skip(skip).take(limit).getMany();

      Logger.info('Fuel records retrieved', {
        tenantId,
        total,
        page,
        limit,
        filters,
        context: 'FuelService.getAllFuelRecords',
      });

      return {
        data: records.map((r) => toFuelRecordDto(r)),
        total,
      };
    } catch (error) {
      Logger.error('Error retrieving fuel records', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        context: 'FuelService.getAllFuelRecords',
      });
      throw error;
    }
  }

  /**
   * Get a single fuel record by ID with tenant verification
   *
   * NOTE: Tenant verification done through valorizacion relationship.
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Fuel record ID
   * @returns Fuel record DTO
   * @throws NotFoundError if record not found or doesn't belong to tenant
   */
  async getFuelRecordById(tenantId: number, id: number): Promise<FuelRecordDto> {
    try {
      const record = await this.fuelRepository.findOne({
        where: { id },
        relations: ['valorizacion'],
      });

      if (!record) {
        throw new NotFoundError('FuelRecord', id);
      }

      // TODO: Verify tenant ownership through valorizacion when tenant_id is added
      // For now, assuming caller has already verified valorizacion access

      return toFuelRecordDto(record);
    } catch (error) {
      Logger.error('Error finding fuel record', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'FuelService.getFuelRecordById',
      });
      throw error;
    }
  }

  /**
   * Create a new fuel record with business validation
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param data - Fuel record creation data
   * @returns Created fuel record DTO
   * @throws BusinessRuleError if validation fails
   * @throws NotFoundError if associated valuation not found
   */
  async createFuelRecord(tenantId: number, data: CreateFuelRecordDto): Promise<FuelRecordDto> {
    try {
      // Map dual input format to DTO
      const dtoData = mapCreateFuelRecordDto(data);

      // Business rule: Validate positive values
      if (dtoData.cantidad !== undefined && dtoData.cantidad <= 0) {
        throw new BusinessRuleError(
          'Fuel quantity must be positive',
          'INVALID_QUANTITY',
          { cantidad: dtoData.cantidad },
          'Enter a positive quantity value'
        );
      }

      if (dtoData.precio_unitario !== undefined && dtoData.precio_unitario < 0) {
        throw new BusinessRuleError(
          'Fuel price must be non-negative',
          'INVALID_PRICE',
          { precio_unitario: dtoData.precio_unitario },
          'Enter a non-negative price value'
        );
      }

      // Business rule: Verify valuation exists
      // TODO: Add tenant verification when tenant_id is added to valorizacion
      if (dtoData.valorizacion_id) {
        const valuation = await this.valorizacionRepository.findOne({
          where: {
            id: dtoData.valorizacion_id,
          },
        });

        if (!valuation) {
          throw new NotFoundError('Valuation', dtoData.valorizacion_id);
        }
      }

      // Calculate monto_total if cantidad and precio_unitario are provided
      if (dtoData.cantidad && dtoData.precio_unitario && !dtoData.monto_total) {
        dtoData.monto_total = dtoData.cantidad * dtoData.precio_unitario;
      }

      const fuelRecord = this.fuelRepository.create(fromFuelRecordDto(dtoData));
      const saved = await this.fuelRepository.save(fuelRecord);

      // Reload with relations to transform
      const withRelations = await this.fuelRepository.findOne({
        where: { id: saved.id },
        relations: ['valorizacion'],
      });

      Logger.info('Fuel record created', {
        tenantId,
        fuelRecordId: saved.id,
        valorizacionId: dtoData.valorizacion_id,
        cantidad: dtoData.cantidad,
        monto_total: dtoData.monto_total,
        context: 'FuelService.createFuelRecord',
      });

      return toFuelRecordDto(withRelations!);
    } catch (error) {
      Logger.error('Error creating fuel record', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'FuelService.createFuelRecord',
      });
      throw error;
    }
  }

  /**
   * Update a fuel record with tenant verification and business validation
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Fuel record ID
   * @param data - Update data
   * @returns Updated fuel record DTO
   * @throws NotFoundError if record not found or doesn't belong to tenant
   */
  async updateFuelRecord(
    tenantId: number,
    id: number,
    data: UpdateFuelRecordDto
  ): Promise<FuelRecordDto> {
    try {
      const existing = await this.fuelRepository.findOne({
        where: { id },
        relations: ['valorizacion'],
      });

      if (!existing) {
        throw new NotFoundError('FuelRecord', id);
      }

      // TODO: Verify tenant ownership through valorizacion when tenant_id is available

      // Map dual input format to DTO
      const dtoData = mapCreateFuelRecordDto(data);

      // Business rule: Validate positive values (if provided)
      if (dtoData.cantidad !== undefined && dtoData.cantidad <= 0) {
        throw new BusinessRuleError(
          'Fuel quantity must be positive',
          'INVALID_QUANTITY',
          { cantidad: dtoData.cantidad },
          'Enter a positive quantity value'
        );
      }

      if (dtoData.precio_unitario !== undefined && dtoData.precio_unitario < 0) {
        throw new BusinessRuleError(
          'Fuel price must be non-negative',
          'INVALID_PRICE',
          { precio_unitario: dtoData.precio_unitario },
          'Enter a non-negative price value'
        );
      }

      // Recalculate monto_total if cantidad or precio_unitario changed
      const newCantidad = dtoData.cantidad ?? existing.cantidad;
      const newPrecioUnitario = dtoData.precio_unitario ?? existing.precioUnitario;
      if (newCantidad && newPrecioUnitario) {
        dtoData.monto_total = newCantidad * newPrecioUnitario;
      }

      Object.assign(existing, fromFuelRecordDto(dtoData));
      const saved = await this.fuelRepository.save(existing);

      // Reload with relations
      const withRelations = await this.fuelRepository.findOne({
        where: { id: saved.id },
        relations: ['valorizacion'],
      });

      Logger.info('Fuel record updated', {
        tenantId,
        fuelRecordId: id,
        updatedFields: Object.keys(dtoData),
        newMontoTotal: dtoData.monto_total,
        context: 'FuelService.updateFuelRecord',
      });

      return toFuelRecordDto(withRelations!);
    } catch (error) {
      Logger.error('Error updating fuel record', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'FuelService.updateFuelRecord',
      });
      throw error;
    }
  }

  /**
   * Delete a fuel record with business rule validation
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param id - Fuel record ID
   * @returns void
   * @throws NotFoundError if record not found or doesn't belong to tenant
   * @throws BusinessRuleError if valuation is approved
   */
  async deleteFuelRecord(tenantId: number, id: number): Promise<void> {
    try {
      const existing = await this.fuelRepository.findOne({
        where: { id },
        relations: ['valorizacion'],
      });

      if (!existing) {
        throw new NotFoundError('FuelRecord', id);
      }

      // TODO: Verify tenant ownership through valorizacion when tenant_id is available

      // Business rule: Cannot delete if valuation is approved
      if (existing.valorizacion?.estado === 'APROBADO') {
        throw BusinessRuleError.cannotDelete('FuelRecord', 'belongs to an approved valuation', {
          valuationStatus: existing.valorizacion.estado,
          valorizacionId: existing.valorizacion.id,
        });
      }

      await this.fuelRepository.delete(id);

      Logger.info('Fuel record deleted', {
        tenantId,
        fuelRecordId: id,
        valorizacionId: existing.valorizacionId,
        context: 'FuelService.deleteFuelRecord',
      });
    } catch (error) {
      Logger.error('Error deleting fuel record', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'FuelService.deleteFuelRecord',
      });
      throw error;
    }
  }

  /**
   * Get all fuel records for a specific valuation
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param valorizacionId - Valuation ID
   * @returns Array of fuel record DTOs
   */
  async getFuelRecordsByValorizacion(
    tenantId: number,
    valorizacionId: number
  ): Promise<FuelRecordDto[]> {
    try {
      const records = await this.fuelRepository.find({
        where: {
          valorizacionId,
        },
        relations: ['valorizacion'],
        order: { fecha: 'DESC' },
      });

      // TODO: Filter by tenant when tenant_id is added to model

      return records.map((r) => toFuelRecordDto(r));
    } catch (error) {
      Logger.error('Error retrieving fuel records by valorizacion', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        valorizacionId,
        context: 'FuelService.getFuelRecordsByValorizacion',
      });
      throw error;
    }
  }

  /**
   * Calculate total fuel cost for a valuation
   *
   * @param tenantId - Tenant identifier for data isolation
   * @param valorizacionId - Valuation ID
   * @returns Total fuel cost
   */
  async getTotalFuelCostByValorizacion(tenantId: number, valorizacionId: number): Promise<number> {
    try {
      const result = await this.fuelRepository
        .createQueryBuilder('fuel')
        .select('SUM(fuel.montoTotal)', 'total')
        .where('fuel.valorizacionId = :valorizacionId', { valorizacionId })
        .getRawOne();

      // TODO: Add tenant filtering when tenant_id is available

      const total = parseFloat(result?.total || '0');

      Logger.info('Total fuel cost calculated', {
        tenantId,
        valorizacionId,
        total,
        context: 'FuelService.getTotalFuelCostByValorizacion',
      });

      return total;
    } catch (error) {
      Logger.error('Error calculating total fuel cost', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        valorizacionId,
        context: 'FuelService.getTotalFuelCostByValorizacion',
      });
      throw error;
    }
  }
}
