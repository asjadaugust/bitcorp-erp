import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ProviderContact, ContactType, ContactStatus } from '../models/provider-contact.model';
import Logger from '../utils/logger';
import { NotFoundError, DatabaseError } from '../errors';
import {
  ProviderContactCreateDto,
  ProviderContactUpdateDto,
  ProviderContactDto,
} from '../types/dto/provider-contact.dto';

/**
 * Service for managing provider contacts
 *
 * Handles commercial, technical, billing, and general contacts for providers.
 * Supports primary contact designation and contact status management.
 *
 * Business Rules:
 * - Each provider can have multiple contacts
 * - One contact can be designated as primary (isPrimary = true)
 * - Contacts can be of different types: general, commercial, technical, financial, logistics
 * - Contacts ordered by isPrimary DESC, createdAt DESC
 * - Soft delete preferred (status = 'inactive') over hard delete
 *
 * Multi-Tenancy:
 * - TODO: Add tenant_id filtering when schema updated (Phase 21)
 * - Currently all contacts visible across tenants (security risk)
 */
export class ProviderContactService {
  private get repository(): Repository<ProviderContact> {
    return AppDataSource.getRepository(ProviderContact);
  }

  /**
   * Get all contacts for a provider
   *
   * Business Rules:
   * - Returns contacts ordered by isPrimary DESC (primary contacts first)
   * - Then ordered by createdAt DESC (newest first)
   * - Returns all contacts regardless of status (active/inactive)
   * - TODO: Should filter by tenant_id (deferred to Phase 21)
   *
   * @param providerId - Provider ID to find contacts for
   * @returns Array of provider contact DTOs (snake_case)
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const contacts = await service.findByProviderId(123);
   * // Returns: [{ id: 1, provider_id: 123, contact_name: "Juan Pérez", ... }]
   */
  async findByProviderId(providerId: string | number): Promise<ProviderContactDto[]> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation (all contacts visible)
      // Should be: WHERE contact.tenant_id = :tenantId
      const contacts = await this.repository.find({
        where: { providerId: Number(providerId) },
        order: {
          isPrimary: 'DESC',
          createdAt: 'DESC',
        },
      });

      Logger.info('Provider contacts retrieved successfully', {
        providerId: Number(providerId),
        count: contacts.length,
        hasPrimary: contacts.some((c) => c.isPrimary),
        context: 'ProviderContactService.findByProviderId',
      });

      return contacts.map((c) => this.toDto(c));
    } catch (error) {
      Logger.error('Error finding provider contacts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId,
        context: 'ProviderContactService.findByProviderId',
      });
      throw new DatabaseError('Failed to retrieve provider contacts');
    }
  }

  /**
   * Get contact by ID
   *
   * Business Rules:
   * - Returns single contact or throws NotFoundError
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   *
   * @param id - Contact ID
   * @returns Provider contact DTO (snake_case)
   * @throws {NotFoundError} If contact not found
   * @throws {DatabaseError} If database query fails
   *
   * @example
   * const contact = await service.findById(456);
   * // Returns: { id: 456, provider_id: 123, contact_name: "María López", ... }
   */
  async findById(id: number): Promise<ProviderContactDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation
      // Should be: WHERE contact.id = :id AND contact.tenant_id = :tenantId
      const contact = await this.repository.findOne({
        where: { id },
      });

      if (!contact) {
        throw new NotFoundError('ProviderContact', id);
      }

      Logger.info('Provider contact found', {
        contactId: contact.id,
        providerId: contact.providerId,
        contactName: contact.contactName,
        isPrimary: contact.isPrimary,
        status: contact.status,
        context: 'ProviderContactService.findById',
      });

      return this.toDto(contact);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      Logger.error('Error finding provider contact by id', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: id,
        context: 'ProviderContactService.findById',
      });
      throw new DatabaseError('Failed to retrieve provider contact');
    }
  }

  /**
   * Create new contact for a provider
   *
   * Business Rules:
   * - contact_name is required
   * - Default contact_type: 'general'
   * - Default status: 'active'
   * - Default isPrimary: false
   * - If multiple primary contacts exist, application should handle logic to unset others
   * - tenant_id defaults to 1 (should come from auth context in Phase 21)
   *
   * @param data - Contact creation data (snake_case from API)
   * @returns Created provider contact DTO
   * @throws {ValidationError} If required fields missing
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const contact = await service.create({
   *   contact_name: "Carlos Ruiz",
   *   position: "Gerente Comercial",
   *   primary_phone: "+51 999 888 777",
   *   email: "cruiz@provider.com",
   *   contact_type: "commercial",
   *   is_primary: true
   * });
   */
  async create(data: ProviderContactCreateDto): Promise<ProviderContactDto> {
    try {
      // Validation: contact_name is required (handled by DTO class-validator)
      // Additional validation can be added here if needed

      const contact = this.repository.create({
        providerId: data.provider_id!,
        contactName: data.contact_name,
        position: data.position,
        primaryPhone: data.primary_phone,
        secondaryPhone: data.secondary_phone,
        email: data.email,
        secondaryEmail: data.secondary_email,
        contactType: (data.contact_type || 'general') as ContactType,
        isPrimary: data.is_primary ?? false,
        status: (data.status || 'active') as ContactStatus,
        notes: data.notes,
        // TODO: tenantId should come from auth context (Phase 21)
        // Current: Hardcoded to 1
        // Should be: tenantId: req.user.tenantId
        tenantId: data.tenant_id || 1,
        createdBy: data.created_by,
      });

      const saved = await this.repository.save(contact);

      Logger.info('Provider contact created successfully', {
        id: saved.id,
        providerId: saved.providerId,
        contactName: saved.contactName,
        contactType: saved.contactType,
        isPrimary: saved.isPrimary,
        status: saved.status,
        context: 'ProviderContactService.create',
      });

      return this.toDto(saved);
    } catch (error) {
      Logger.error('Error creating provider contact', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: data.provider_id,
        contactName: data.contact_name,
        context: 'ProviderContactService.create',
      });
      throw new DatabaseError('Failed to create provider contact');
    }
  }

  /**
   * Update existing contact
   *
   * Business Rules:
   * - Only updates provided fields (partial update)
   * - Cannot change providerId (business rule: contact belongs to one provider)
   * - Can update isPrimary (caller should handle unsetting other primary contacts)
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   *
   * @param id - Contact ID to update
   * @param data - Contact update data (snake_case from API)
   * @returns Updated provider contact DTO
   * @throws {NotFoundError} If contact not found
   * @throws {DatabaseError} If database operation fails
   *
   * @example
   * const updated = await service.update(456, {
   *   position: "Gerente General",
   *   primary_phone: "+51 999 111 222",
   *   is_primary: true
   * });
   */
  async update(id: number, data: ProviderContactUpdateDto): Promise<ProviderContactDto> {
    try {
      // TODO: Add tenant_id filter when schema updated (Phase 21)
      // Current: No tenant isolation
      // Should be: WHERE contact.id = :id AND contact.tenant_id = :tenantId
      const existing = await this.repository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ProviderContact', id);
      }

      // Build update object with only provided fields
      const updateData: Partial<ProviderContact> = {};
      if (data.contact_name !== undefined) updateData.contactName = data.contact_name;
      if (data.position !== undefined) updateData.position = data.position;
      if (data.primary_phone !== undefined) updateData.primaryPhone = data.primary_phone;
      if (data.secondary_phone !== undefined) updateData.secondaryPhone = data.secondary_phone;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.secondary_email !== undefined) updateData.secondaryEmail = data.secondary_email;
      if (data.contact_type !== undefined)
        updateData.contactType = data.contact_type as ContactType;
      if (data.is_primary !== undefined) updateData.isPrimary = data.is_primary;
      if (data.status !== undefined) updateData.status = data.status as ContactStatus;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.updated_by !== undefined) updateData.updatedBy = data.updated_by;

      // Update fields
      await this.repository.update(id, updateData);

      // Return updated contact
      const updated = await this.repository.findOne({ where: { id } });
      if (!updated) {
        throw new DatabaseError('Failed to retrieve contact after update');
      }

      Logger.info('Provider contact updated successfully', {
        id: updated.id,
        providerId: updated.providerId,
        contactName: updated.contactName,
        updatedFields: Object.keys(updateData),
        context: 'ProviderContactService.update',
      });

      return this.toDto(updated);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }

      Logger.error('Error updating provider contact', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: id,
        context: 'ProviderContactService.update',
      });
      throw new DatabaseError('Failed to update provider contact');
    }
  }

  /**
   * Delete contact (hard delete)
   *
   * Business Rules:
   * - Permanently deletes contact record
   * - Prefer soft delete (status = 'inactive') for audit trail
   * - TODO: Should verify tenant_id matches current tenant (Phase 21)
   * - TODO: Should prevent deletion of primary contact if it's the only one
   *
   * @param id - Contact ID to delete
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
      // Current: Can delete any contact
      // Should be: DELETE WHERE id = :id AND tenant_id = :tenantId
      const result = await this.repository.delete(id);
      const deleted = (result.affected ?? 0) > 0;

      if (deleted) {
        Logger.info('Provider contact deleted successfully', {
          contactId: id,
          context: 'ProviderContactService.delete',
        });
      } else {
        Logger.warn('Attempted to delete non-existent provider contact', {
          contactId: id,
          context: 'ProviderContactService.delete',
        });
      }

      return deleted;
    } catch (error) {
      Logger.error('Error deleting provider contact', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: id,
        context: 'ProviderContactService.delete',
      });
      throw new DatabaseError('Failed to delete provider contact');
    }
  }

  /**
   * Transform ProviderContact entity to ProviderContactDto (snake_case for API)
   *
   * @param contact - ProviderContact entity (camelCase)
   * @returns ProviderContactDto (snake_case)
   * @private
   */
  private toDto(contact: ProviderContact): ProviderContactDto {
    return {
      id: contact.id,
      provider_id: contact.providerId,
      contact_name: contact.contactName,
      position: contact.position,
      primary_phone: contact.primaryPhone,
      secondary_phone: contact.secondaryPhone,
      email: contact.email,
      secondary_email: contact.secondaryEmail,
      contact_type: contact.contactType,
      is_primary: contact.isPrimary,
      status: contact.status,
      notes: contact.notes,
      tenant_id: contact.tenantId,
      created_by: contact.createdBy,
      updated_by: contact.updatedBy,
      created_at: contact.createdAt.toISOString(),
      updated_at: contact.updatedAt.toISOString(),
    };
  }
}
