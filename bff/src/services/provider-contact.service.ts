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
 * - All queries filtered by tenant_id for multi-tenant isolation
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
   * - Filtered by tenant_id for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param providerId - Provider ID to find contacts for
   * @returns Array of provider contact DTOs (snake_case)
   * @throws {DatabaseError} If database query fails
   */
  async findByProviderId(
    tenantId: number,
    providerId: string | number
  ): Promise<ProviderContactDto[]> {
    try {
      const contacts = await this.repository.find({
        where: { providerId: Number(providerId), tenantId },
        order: {
          isPrimary: 'DESC',
          createdAt: 'DESC',
        },
      });

      Logger.info('Provider contacts retrieved successfully', {
        providerId: Number(providerId),
        count: contacts.length,
        hasPrimary: contacts.some((c) => c.isPrimary),
        tenantId,
        context: 'ProviderContactService.findByProviderId',
      });

      return contacts.map((c) => this.toDto(c));
    } catch (error) {
      Logger.error('Error finding provider contacts', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId,
        tenantId,
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
   * - Verifies tenant_id matches for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Contact ID
   * @returns Provider contact DTO (snake_case)
   * @throws {NotFoundError} If contact not found
   * @throws {DatabaseError} If database query fails
   */
  async findById(tenantId: number, id: number): Promise<ProviderContactDto> {
    try {
      const contact = await this.repository.findOne({
        where: { id, tenantId },
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
        tenantId,
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
        tenantId,
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
   * - tenant_id set from authenticated user context
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param data - Contact creation data (snake_case from API)
   * @returns Created provider contact DTO
   * @throws {ValidationError} If required fields missing
   * @throws {DatabaseError} If database operation fails
   */
  async create(tenantId: number, data: ProviderContactCreateDto): Promise<ProviderContactDto> {
    try {
      const contact = this.repository.create({
        providerId: data.id_proveedor!,
        contactName: data.nombre_contacto,
        position: data.cargo,
        primaryPhone: data.telefono_principal,
        secondaryPhone: data.telefono_secundario,
        email: data.correo,
        secondaryEmail: data.correo_secundario,
        contactType: (data.tipo_contacto || 'general') as ContactType,
        isPrimary: data.es_principal ?? false,
        status: (data.estado || 'active') as ContactStatus,
        notes: data.notas,
        tenantId,
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
        tenantId,
        context: 'ProviderContactService.create',
      });

      return this.toDto(saved);
    } catch (error) {
      Logger.error('Error creating provider contact', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        providerId: data.id_proveedor,
        contactName: data.nombre_contacto,
        tenantId,
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
   * - Verifies tenant_id matches for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Contact ID to update
   * @param data - Contact update data (snake_case from API)
   * @returns Updated provider contact DTO
   * @throws {NotFoundError} If contact not found
   * @throws {DatabaseError} If database operation fails
   */
  async update(
    tenantId: number,
    id: number,
    data: ProviderContactUpdateDto
  ): Promise<ProviderContactDto> {
    try {
      const existing = await this.repository.findOne({ where: { id, tenantId } });
      if (!existing) {
        throw new NotFoundError('ProviderContact', id);
      }

      // Build update object with only provided fields
      const updateData: Partial<ProviderContact> = {};
      if (data.nombre_contacto !== undefined) updateData.contactName = data.nombre_contacto;
      if (data.cargo !== undefined) updateData.position = data.cargo;
      if (data.telefono_principal !== undefined) updateData.primaryPhone = data.telefono_principal;
      if (data.telefono_secundario !== undefined)
        updateData.secondaryPhone = data.telefono_secundario;
      if (data.correo !== undefined) updateData.email = data.correo;
      if (data.correo_secundario !== undefined) updateData.secondaryEmail = data.correo_secundario;
      if (data.tipo_contacto !== undefined)
        updateData.contactType = data.tipo_contacto as ContactType;
      if (data.es_principal !== undefined) updateData.isPrimary = data.es_principal;
      if (data.estado !== undefined) updateData.status = data.estado as ContactStatus;
      if (data.notas !== undefined) updateData.notes = data.notas;
      if (data.updated_by !== undefined) updateData.updatedBy = data.updated_by;

      // Update fields
      await this.repository.update(id, updateData);

      // Return updated contact
      const updated = await this.repository.findOne({ where: { id, tenantId } });
      if (!updated) {
        throw new DatabaseError('Failed to retrieve contact after update');
      }

      Logger.info('Provider contact updated successfully', {
        id: updated.id,
        providerId: updated.providerId,
        contactName: updated.contactName,
        updatedFields: Object.keys(updateData),
        tenantId,
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
        tenantId,
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
   * - Verifies tenant_id matches for multi-tenant isolation
   *
   * @param tenantId - Tenant identifier for multi-tenant isolation
   * @param id - Contact ID to delete
   * @returns true if deleted, false if not found
   * @throws {DatabaseError} If database operation fails
   */
  async delete(tenantId: number, id: number): Promise<boolean> {
    try {
      // Verify contact belongs to this tenant before deleting
      const contact = await this.repository.findOne({ where: { id, tenantId } });
      if (!contact) {
        return false;
      }

      const result = await this.repository.delete(id);
      const deleted = (result.affected ?? 0) > 0;

      if (deleted) {
        Logger.info('Provider contact deleted successfully', {
          contactId: id,
          tenantId,
          context: 'ProviderContactService.delete',
        });
      } else {
        Logger.warn('Attempted to delete non-existent provider contact', {
          contactId: id,
          tenantId,
          context: 'ProviderContactService.delete',
        });
      }

      return deleted;
    } catch (error) {
      Logger.error('Error deleting provider contact', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        contactId: id,
        tenantId,
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
      id_proveedor: contact.providerId,
      nombre_contacto: contact.contactName,
      cargo: contact.position,
      telefono_principal: contact.primaryPhone,
      telefono_secundario: contact.secondaryPhone,
      correo: contact.email,
      correo_secundario: contact.secondaryEmail,
      tipo_contacto: contact.contactType,
      es_principal: contact.isPrimary,
      estado: contact.status,
      notas: contact.notes,
      tenant_id: contact.tenantId,
      created_by: contact.createdBy,
      updated_by: contact.updatedBy,
      created_at: contact.createdAt.toISOString(),
      updated_at: contact.updatedAt.toISOString(),
    };
  }
}
