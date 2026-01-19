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
 * Handles bank accounts, CCI (Código de Cuenta Interbancaria), and payment information
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
 *
 * Multi-Tenancy:
 * - TODO: Add tenant_id filtering when schema updated (Phase 21)
 * - Currently all financial info visible across tenants (security risk)
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
   * - TODO: Should filter by tenant_id (deferred to Phase 21)
   *
   * @param providerId - Provider ID to find financial info for
   * @returns Array of provider financial info DTOs (snake_case)
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const financialInfo = await service.findByProviderId(123);
   * // Returns: [{ id: 1, provider_id: 123, bank_name: "BCP", account_number: "123456", currency: "PEN", ... }]
   */
  async findByProviderId(providerId: string | number): Promise<ProviderFinancialInfoDto[]> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation (all financial info visible)
      // Should be: WHERE financial_info.tenant_id = :tenantId
      const financialInfo = await this.repository.find({
        where: { providerId: Number(providerId) },
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
        context: 'ProviderFinancialInfoService.findByProviderId',
      });

      return financialInfo.map((f) => this.toDto(f));
    } catch (error) {
      Logger.error('Error finding provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId,
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
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   *
   * @param id - Financial info ID
   * @returns Provider financial info DTO (snake_case)
   * @throws {NotFoundError} If financial info not found
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const financialInfo = await service.findById(456);
   * // Returns: { id: 456, provider_id: 123, bank_name: "BCP", account_number: "123456789", currency: "PEN", ... }
   */
  async findById(id: number): Promise<ProviderFinancialInfoDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation
      // Should be: WHERE financial_info.id = :id AND financial_info.tenant_id = :tenantId
      const financialInfo = await this.repository.findOne({
        where: { id },
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
   * - CCI (Código de Cuenta Interbancaria) is optional but recommended for Peru
   * - tenant_id defaults to 1 (should come from auth context in Phase 21)
   *
   * @param data - Financial info creation data (snake_case from API)
   * @returns Created provider financial info DTO
   * @throws {ValidationError} If required fields missing
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const financialInfo = await service.create({
   *   bank_name: "Banco de Crédito del Perú (BCP)",
   *   account_number: "19312345678901",
   *   cci: "00219312345678901234",
   *   account_holder_name: "EMPRESA SAC",
   *   account_type: "checking",
   *   currency: "PEN",
   *   is_primary: true
   * });
   */
  async create(data: ProviderFinancialInfoCreateDto): Promise<ProviderFinancialInfoDto> {
    try {
      // Validation: bank_name and account_number are required (handled by DTO class-validator)
      // Additional validation can be added here if needed

      const financialInfo = this.repository.create({
        providerId: data.provider_id!,
        bankName: data.bank_name,
        accountNumber: data.account_number,
        cci: data.cci,
        accountHolderName: data.account_holder_name,
        accountType: data.account_type as AccountType,
        currency: (data.currency || 'PEN') as Currency,
        isPrimary: data.is_primary ?? false,
        status: (data.status || 'active') as FinancialStatus,
        // TODO: tenantId should come from auth context (Phase 21)
        // Current: Hardcoded to 1
        // Should be: tenantId: req.user.tenantId
        tenantId: data.tenant_id || 1,
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
        context: 'ProviderFinancialInfoService.create',
      });

      return this.toDto(saved);
    } catch (error) {
      Logger.error('Error creating provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: data.provider_id,
        bankName: data.bank_name,
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
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   *
   * @param id - Financial info ID to update
   * @param data - Financial info update data (snake_case from API)
   * @returns Updated provider financial info DTO
   * @throws {NotFoundError} If financial info not found
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const updated = await service.update(456, {
   *   account_number: "19312345678902",
   *   cci: "00219312345678901235",
   *   is_primary: true,
   *   status: "active"
   * });
   */
  async update(
    id: number,
    data: ProviderFinancialInfoUpdateDto
  ): Promise<ProviderFinancialInfoDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation
      // Should be: WHERE financial_info.id = :id AND financial_info.tenant_id = :tenantId
      const existing = await this.repository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ProviderFinancialInfo', id);
      }

      // Build update object with only provided fields
      const updateData: Partial<ProviderFinancialInfo> = {};
      if (data.bank_name !== undefined) updateData.bankName = data.bank_name;
      if (data.account_number !== undefined) updateData.accountNumber = data.account_number;
      if (data.cci !== undefined) updateData.cci = data.cci;
      if (data.account_holder_name !== undefined)
        updateData.accountHolderName = data.account_holder_name;
      if (data.account_type !== undefined)
        updateData.accountType = data.account_type as AccountType;
      if (data.currency !== undefined) updateData.currency = data.currency as Currency;
      if (data.is_primary !== undefined) updateData.isPrimary = data.is_primary;
      if (data.status !== undefined) updateData.status = data.status as FinancialStatus;
      if (data.updated_by !== undefined) updateData.updatedBy = data.updated_by;

      // Update fields
      await this.repository.update(id, updateData);

      // Return updated financial info
      const updated = await this.repository.findOne({ where: { id } });
      if (!updated) {
        throw new DatabaseError('Failed to retrieve financial info after update');
      }

      Logger.info('Provider financial info updated successfully', {
        id: updated.id,
        providerId: updated.providerId,
        bankName: updated.bankName,
        updatedFields: Object.keys(updateData),
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
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   * - TODO: Should prevent deletion of primary account if it's the only one
   * - Consider impact on historical payment records
   *
   * @param id - Financial info ID to delete
   * @returns true if deleted, false if not found
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const deleted = await service.delete(456);
   * // Returns: true
   */
  async delete(id: number): Promise<boolean> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: Can delete any financial info
      // Should be: DELETE WHERE id = :id AND tenant_id = :tenantId
      const result = await this.repository.delete(id);
      const deleted = (result.affected ?? 0) > 0;

      if (deleted) {
        Logger.info('Provider financial info deleted successfully', {
          financialInfoId: id,
          context: 'ProviderFinancialInfoService.delete',
        });
      } else {
        Logger.warn('Attempted to delete non-existent provider financial info', {
          financialInfoId: id,
          context: 'ProviderFinancialInfoService.delete',
        });
      }

      return deleted;
    } catch (error) {
      Logger.error('Error deleting provider financial info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        financialInfoId: id,
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
      provider_id: info.providerId,
      bank_name: info.bankName,
      account_number: info.accountNumber,
      cci: info.cci,
      account_holder_name: info.accountHolderName,
      account_type: info.accountType,
      currency: info.currency,
      is_primary: info.isPrimary,
      status: info.status,
      tenant_id: info.tenantId,
      created_by: info.createdBy,
      updated_by: info.updatedBy,
      created_at: info.createdAt.toISOString(),
      updated_at: info.updatedAt.toISOString(),
    };
  }
}
