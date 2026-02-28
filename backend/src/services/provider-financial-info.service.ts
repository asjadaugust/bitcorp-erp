import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import {
  ProviderFinancialInfo,
  AccountType,
  FinancialStatus,
  Currency,
} from '../models/provider-financial-info.model';
import Logger from '../utils/logger';
import { NotFoundError, DatabaseError } from '../errors';
import {
  ProviderFinancialInfoCreateDto,
  ProviderFinancialInfoUpdateDto,
  ProviderFinancialInfoDto,
} from '../types/dto/provider-financial-info.dto';

/**
 * Service for managing provider financial information
 *
 * Handles bank accounts, CCI (Codigo de Cuenta Interbancaria), and payment information
 * for providers. Supports multi-currency accounts and primary account designation.
 *
 * Business Rules:
 * - Each provider can have multiple bank accounts
 * - One account can be designated as primary (isPrimary = true)
 * - Supported account types: savings, checking, business
 * - Supported currencies: PEN, USD, EUR (default: PEN)
 * - CCI is Peru-specific interbank code (20 digits, optional)
 * - Accounts ordered by isPrimary DESC, createdAt DESC
 * - Soft delete preferred (status = 'inactive') over hard delete
 * - All queries filtered by tenant_id for multi-tenant isolation
 */
export class ProviderFinancialInfoService {
  private get repository(): Repository<ProviderFinancialInfo> {
    return AppDataSource.getRepository(ProviderFinancialInfo);
  }

  /**
   * Get all financial info for a provider
   *
   * Business Rules:
   * - Returns financial info ordered by isPrimary DESC (primary accounts first)
   * - Then ordered by createdAt DESC (newest first)
   * - Returns all accounts regardless of status (active/inactive)
   * - Each provider can have multiple bank accounts
   * - One account can be designated as primary (isPrimary = true)
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param providerId - Provider ID to find financial info for
   * @returns Array of provider financial info DTOs (snake_case)
   * @throws {DatabaseError} If database query fails
   */
  async findByProviderId(
    tenantId: number,
    providerId: string | number
  ): Promise<ProviderFinancialInfoDto[]> {
    try {
      const financialInfo = await this.repository.find({
        where: { providerId: Number(providerId), tenantId },
        order: {
          isPrimary: 'DESC',
          createdAt: 'DESC',
        },
      });

      Logger.info('Provider financial info retrieved successfully', {
        providerId: Number(providerId),
        count: financialInfo.length,
        hasPrimary: financialInfo.some((f) => f.isPrimary),
        currencies: [...new Set(financialInfo.map((f) => f.currency))],
        tenantId,
        context: 'ProviderFinancialInfoService.findByProviderId',
      });

      return financialInfo.map((f) => this.toDto(f));
    } catch (error) {
      Logger.error('Error finding provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId,
        tenantId,
        context: 'ProviderFinancialInfoService.findByProviderId',
      });
      throw new DatabaseError('Failed to retrieve provider financial info');
    }
  }

  /**
   * Get financial info by ID
   *
   * Business Rules:
   * - Returns single financial info or throws NotFoundError
   * - Verifies tenant_id matches for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Financial info ID
   * @returns Provider financial info DTO (snake_case)
   * @throws {NotFoundError} If financial info not found
   * @throws {DatabaseError} If database query fails
   */
  async findById(tenantId: number, id: number): Promise<ProviderFinancialInfoDto> {
    try {
      const financialInfo = await this.repository.findOne({
        where: { id, tenantId },
      });

      if (!financialInfo) {
        throw new NotFoundError('ProviderFinancialInfo', id);
      }

      Logger.info('Provider financial info found', {
        financialInfoId: financialInfo.id,
        providerId: financialInfo.providerId,
        bankName: financialInfo.bankName,
        isPrimary: financialInfo.isPrimary,
        currency: financialInfo.currency,
        status: financialInfo.status,
        tenantId,
        context: 'ProviderFinancialInfoService.findById',
      });

      return this.toDto(financialInfo);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error finding provider financial info by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: id,
        tenantId,
        context: 'ProviderFinancialInfoService.findById',
      });
      throw new DatabaseError('Failed to retrieve provider financial info');
    }
  }

  /**
   * Create new financial info for a provider
   *
   * Business Rules:
   * - bank_name and account_number are required
   * - Default currency: PEN (Peruvian Sol)
   * - Default status: 'active'
   * - Default isPrimary: false
   * - If multiple primary accounts exist, application should handle logic to unset others
   * - CCI (Codigo de Cuenta Interbancaria) is optional but recommended for Peru
   * - tenant_id set from authenticated user context
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param data - Financial info creation data (snake_case from API)
   * @returns Created provider financial info DTO
   * @throws {ValidationError} If required fields missing
   * @throws {DatabaseError} If database operation fails
   */
  async create(
    tenantId: number,
    data: ProviderFinancialInfoCreateDto
  ): Promise<ProviderFinancialInfoDto> {
    try {
      const financialInfo = this.repository.create({
        providerId: data.id_proveedor!,
        bankName: data.nombre_banco,
        accountNumber: data.numero_cuenta,
        cci: data.cci,
        accountHolderName: data.nombre_titular,
        accountType: data.tipo_cuenta as AccountType,
        currency: (data.moneda || 'PEN') as Currency,
        isPrimary: data.es_principal ?? false,
        status: (data.estado || 'active') as FinancialStatus,
        tenantId,
        createdBy: data.created_by,
      });

      const saved = await this.repository.save(financialInfo);

      Logger.info('Provider financial info created successfully', {
        id: saved.id,
        providerId: saved.providerId,
        bankName: saved.bankName,
        accountType: saved.accountType,
        currency: saved.currency,
        isPrimary: saved.isPrimary,
        hasCci: !!saved.cci,
        status: saved.status,
        tenantId,
        context: 'ProviderFinancialInfoService.create',
      });

      return this.toDto(saved);
    } catch (error) {
      Logger.error('Error creating provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: data.id_proveedor,
        bankName: data.nombre_banco,
        tenantId,
        context: 'ProviderFinancialInfoService.create',
      });
      throw new DatabaseError('Failed to create provider financial info');
    }
  }

  /**
   * Update existing financial info
   *
   * Business Rules:
   * - Only updates provided fields (partial update)
   * - Cannot change providerId (business rule: account belongs to one provider)
   * - Can update isPrimary (caller should handle unsetting other primary accounts)
   * - Can update status (active/inactive for soft delete)
   * - Verifies tenant_id matches for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Financial info ID to update
   * @param data - Financial info update data (snake_case from API)
   * @returns Updated provider financial info DTO
   * @throws {NotFoundError} If financial info not found
   * @throws {DatabaseError} If database operation fails
   */
  async update(
    tenantId: number,
    id: number,
    data: ProviderFinancialInfoUpdateDto
  ): Promise<ProviderFinancialInfoDto> {
    try {
      const existing = await this.repository.findOne({ where: { id, tenantId } });
      if (!existing) {
        throw new NotFoundError('ProviderFinancialInfo', id);
      }

      // Build update object with only provided fields
      const updateData: Partial<ProviderFinancialInfo> = {};
      if (data.nombre_banco !== undefined) updateData.bankName = data.nombre_banco;
      if (data.numero_cuenta !== undefined) updateData.accountNumber = data.numero_cuenta;
      if (data.cci !== undefined) updateData.cci = data.cci;
      if (data.nombre_titular !== undefined) updateData.accountHolderName = data.nombre_titular;
      if (data.tipo_cuenta !== undefined) updateData.accountType = data.tipo_cuenta as AccountType;
      if (data.moneda !== undefined) updateData.currency = data.moneda as Currency;
      if (data.es_principal !== undefined) updateData.isPrimary = data.es_principal;
      if (data.estado !== undefined) updateData.status = data.estado as FinancialStatus;
      if (data.updated_by !== undefined) updateData.updatedBy = data.updated_by;

      // Update fields
      await this.repository.update(id, updateData);

      // Return updated financial info
      const updated = await this.repository.findOne({ where: { id, tenantId } });
      if (!updated) {
        throw new DatabaseError('Failed to retrieve financial info after update');
      }

      Logger.info('Provider financial info updated successfully', {
        id: updated.id,
        providerId: updated.providerId,
        bankName: updated.bankName,
        updatedFields: Object.keys(updateData),
        tenantId,
        context: 'ProviderFinancialInfoService.update',
      });

      return this.toDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }

      Logger.error('Error updating provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: id,
        tenantId,
        context: 'ProviderFinancialInfoService.update',
      });
      throw new DatabaseError('Failed to update provider financial info');
    }
  }

  /**
   * Delete financial info (hard delete)
   *
   * Business Rules:
   * - Permanently deletes financial info record
   * - Prefer soft delete (status = 'inactive') for audit trail
   * - Verifies tenant_id matches for multi-tenant isolation
   * - Consider impact on historical payment records
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Financial info ID to delete
   * @returns true if deleted, false if not found
   * @throws {DatabaseError} If database operation fails
   */
  async delete(tenantId: number, id: number): Promise<boolean> {
    try {
      // Verify financial info belongs to this tenant before deleting
      const financialInfo = await this.repository.findOne({ where: { id, tenantId } });
      if (!financialInfo) {
        return false;
      }

      const result = await this.repository.delete(id);
      const deleted = (result.affected ?? 0) > 0;

      if (deleted) {
        Logger.info('Provider financial info deleted successfully', {
          financialInfoId: id,
          tenantId,
          context: 'ProviderFinancialInfoService.delete',
        });
      } else {
        Logger.warn('Attempted to delete non-existent provider financial info', {
          financialInfoId: id,
          tenantId,
          context: 'ProviderFinancialInfoService.delete',
        });
      }

      return deleted;
    } catch (error) {
      Logger.error('Error deleting provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: id,
        tenantId,
        context: 'ProviderFinancialInfoService.delete',
      });
      throw new DatabaseError('Failed to delete provider financial info');
    }
  }

  /**
   * Transform ProviderFinancialInfo entity to ProviderFinancialInfoDto (snake_case for API)
   *
   * @param info - ProviderFinancialInfo entity (camelCase)
   * @returns ProviderFinancialInfoDto (snake_case)
   * @private
   */
  private toDto(info: ProviderFinancialInfo): ProviderFinancialInfoDto {
    return {
      id: info.id,
      id_proveedor: info.providerId,
      nombre_banco: info.bankName,
      numero_cuenta: info.accountNumber,
      cci: info.cci,
      nombre_titular: info.accountHolderName,
      tipo_cuenta: info.accountType,
      moneda: info.currency,
      es_principal: info.isPrimary,
      estado: info.status,
      tenant_id: info.tenantId,
      created_by: info.createdBy,
      updated_by: info.updatedBy,
      created_at: info.createdAt.toISOString(),
      updated_at: info.updatedAt.toISOString(),
    };
  }
}
