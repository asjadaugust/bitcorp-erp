import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import {
  ProviderFinancialInfo,
  AccountType,
  FinancialStatus,
  Currency,
} from '../models/provider-financial-info.model';

// DTO type that accepts both snake_case (from API) and camelCase (from entity)
interface ProviderFinancialInfoInput {
  // Snake case (API input)
  provider_id?: number;
  bank_name?: string;
  account_number?: string;
  cci?: string;
  account_holder_name?: string;
  account_type?: string;
  is_primary?: boolean;
  tenant_id?: number;
  created_by?: number;
  updated_by?: number;

  // Camel case (Entity properties)
  providerId?: number;
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  accountType?: string;
  currency?: string;
  isPrimary?: boolean;
  status?: string;
  tenantId?: number;
  createdBy?: number;
  updatedBy?: number;
}

export class ProviderFinancialInfoService {
  private get repository(): Repository<ProviderFinancialInfo> {
    return AppDataSource.getRepository(ProviderFinancialInfo);
  }

  /**
   * Get all financial info for a provider
   *
   * ✅ MIGRATED: FROM pool.query to TypeORM find
   */
  async findByProviderId(providerId: string | number): Promise<ProviderFinancialInfo[]> {
    try {
      const financialInfo = await this.repository.find({
        where: { providerId: Number(providerId) },
        order: {
          isPrimary: 'DESC',
          createdAt: 'DESC',
        },
      });

      return financialInfo;
    } catch (error) {
      console.error('Error finding financial info:', error);
      throw error;
    }
  }

  /**
   * Get financial info by ID
   *
   * ✅ MIGRATED: FROM pool.query to TypeORM findOne
   */
  async findById(id: number): Promise<ProviderFinancialInfo> {
    try {
      const financialInfo = await this.repository.findOne({
        where: { id },
      });

      if (!financialInfo) {
        throw new Error('Financial info not found');
      }

      return financialInfo;
    } catch (error) {
      console.error('Error finding financial info:', error);
      throw error;
    }
  }

  /**
   * Create new financial info
   *
   * ✅ MIGRATED: FROM pool.query INSERT to TypeORM save
   */
  async create(data: ProviderFinancialInfoInput): Promise<ProviderFinancialInfo> {
    try {
      const financialInfo = this.repository.create({
        providerId: data.providerId || data.provider_id,
        bankName: data.bankName || data.bank_name || '',
        accountNumber: data.accountNumber || data.account_number || '',
        cci: data.cci,
        accountHolderName: data.accountHolderName || data.account_holder_name,
        accountType: (data.accountType || data.account_type) as AccountType,
        currency: (data.currency || 'PEN') as Currency,
        isPrimary: data.isPrimary ?? data.is_primary ?? false,
        status: (data.status || 'active') as FinancialStatus,
        tenantId: data.tenantId || data.tenant_id || 1,
        createdBy: data.createdBy || data.created_by,
      });

      const saved = await this.repository.save(financialInfo);
      return saved;
    } catch (error) {
      console.error('Error creating financial info:', error);
      throw error;
    }
  }

  /**
   * Update financial info
   *
   * ✅ MIGRATED: FROM pool.query UPDATE to TypeORM update + findOne
   */
  async update(id: number, data: ProviderFinancialInfoInput): Promise<ProviderFinancialInfo> {
    try {
      // Check if financial info exists
      const existing = await this.repository.findOne({ where: { id } });
      if (!existing) {
        throw new Error('Financial info not found');
      }

      // Update fields
      await this.repository.update(id, {
        bankName: data.bankName || data.bank_name,
        accountNumber: data.accountNumber || data.account_number,
        cci: data.cci,
        accountHolderName: data.accountHolderName || data.account_holder_name,
        accountType: (data.accountType || data.account_type) as AccountType,
        currency: (data.currency || 'PEN') as Currency,
        isPrimary: data.isPrimary ?? data.is_primary ?? false,
        status: (data.status || 'active') as FinancialStatus,
        updatedBy: data.updatedBy || data.updated_by,
      });

      // Return updated financial info
      const updated = await this.repository.findOne({ where: { id } });
      if (!updated) {
        throw new Error('Financial info not found after update');
      }

      return updated;
    } catch (error) {
      console.error('Error updating financial info:', error);
      throw error;
    }
  }

  /**
   * Delete financial info
   *
   * ✅ MIGRATED: FROM pool.query DELETE to TypeORM delete
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting financial info:', error);
      throw error;
    }
  }
}
