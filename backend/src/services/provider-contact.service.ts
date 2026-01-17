import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ProviderContact, ContactType, ContactStatus } from '../models/provider-contact.model';

// DTO type that accepts both snake_case (from API) and camelCase (from entity)
interface ProviderContactInput {
  // Snake case (API input)
  provider_id?: number;
  contact_name?: string;
  primary_phone?: string;
  secondary_phone?: string;
  secondary_email?: string;
  contact_type?: string;
  is_primary?: boolean;
  tenant_id?: number;
  created_by?: number;
  updated_by?: number;

  // Camel case (Entity properties)
  providerId?: number;
  contactName?: string;
  position?: string;
  primaryPhone?: string;
  secondaryPhone?: string;
  email?: string;
  secondaryEmail?: string;
  contactType?: string;
  isPrimary?: boolean;
  status?: string;
  notes?: string;
  tenantId?: number;
  createdBy?: number;
  updatedBy?: number;
}

export class ProviderContactService {
  private get repository(): Repository<ProviderContact> {
    return AppDataSource.getRepository(ProviderContact);
  }

  /**
   * Get all contacts for a provider
   *
   * ✅ MIGRATED: FROM pool.query to TypeORM find
   */
  async findByProviderId(providerId: string | number): Promise<ProviderContact[]> {
    try {
      const contacts = await this.repository.find({
        where: { providerId: Number(providerId) },
        order: {
          isPrimary: 'DESC',
          createdAt: 'DESC',
        },
      });

      return contacts;
    } catch (error) {
      console.error('Error finding contacts:', error);
      throw error;
    }
  }

  /**
   * Get contact by ID
   *
   * ✅ MIGRATED: FROM pool.query to TypeORM findOne
   */
  async findById(id: number): Promise<ProviderContact> {
    try {
      const contact = await this.repository.findOne({
        where: { id },
      });

      if (!contact) {
        throw new Error('Contact not found');
      }

      return contact;
    } catch (error) {
      console.error('Error finding contact:', error);
      throw error;
    }
  }

  /**
   * Create new contact
   *
   * ✅ MIGRATED: FROM pool.query INSERT to TypeORM save
   */
  async create(data: ProviderContactInput): Promise<ProviderContact> {
    try {
      const contact = this.repository.create({
        providerId: data.providerId || data.provider_id,
        contactName: data.contactName || data.contact_name || '',
        position: data.position,
        primaryPhone: data.primaryPhone || data.primary_phone,
        secondaryPhone: data.secondaryPhone || data.secondary_phone,
        email: data.email,
        secondaryEmail: data.secondaryEmail || data.secondary_email,
        contactType: (data.contactType || data.contact_type || 'general') as ContactType,
        isPrimary: data.isPrimary ?? data.is_primary ?? false,
        status: (data.status || 'active') as ContactStatus,
        notes: data.notes,
        tenantId: data.tenantId || data.tenant_id || 1,
        createdBy: data.createdBy || data.created_by,
      });

      const saved = await this.repository.save(contact);
      return saved;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  /**
   * Update contact
   *
   * ✅ MIGRATED: FROM pool.query UPDATE to TypeORM update + findOne
   */
  async update(id: number, data: ProviderContactInput): Promise<ProviderContact> {
    try {
      // Check if contact exists
      const existing = await this.repository.findOne({ where: { id } });
      if (!existing) {
        throw new Error('Contact not found');
      }

      // Update fields
      await this.repository.update(id, {
        contactName: data.contactName || data.contact_name,
        position: data.position,
        primaryPhone: data.primaryPhone || data.primary_phone,
        secondaryPhone: data.secondaryPhone || data.secondary_phone,
        email: data.email,
        secondaryEmail: data.secondaryEmail || data.secondary_email,
        contactType: (data.contactType || data.contact_type || 'general') as ContactType,
        isPrimary: data.isPrimary ?? data.is_primary ?? false,
        status: (data.status || 'active') as ContactStatus,
        notes: data.notes,
        updatedBy: data.updatedBy || data.updated_by,
      });

      // Return updated contact
      const updated = await this.repository.findOne({ where: { id } });
      if (!updated) {
        throw new Error('Contact not found after update');
      }

      return updated;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  /**
   * Delete contact
   *
   * ✅ MIGRATED: FROM pool.query DELETE to TypeORM delete
   */
  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }
}
