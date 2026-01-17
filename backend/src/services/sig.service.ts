import { AppDataSource } from '../config/database.config';
import { SigDocument } from '../models/sig-document.model';
import { NotFoundError } from '../errors/http.errors';
import { BusinessRuleError } from '../errors/business.error';
import Logger from '../utils/logger';
import {
  SigDocumentListDto,
  SigDocumentDetailDto,
  SigDocumentCreateDto,
  SigDocumentUpdateDto,
  toSigDocumentListDtoArray,
  toSigDocumentDetailDto,
} from '../types/dto/sig-document.dto';

/**
 * SigService - Sistema Integrado de Gestión (Integrated Management System)
 * Manages SIG documents (ISO procedures, work instructions, forms, policies)
 *
 * Standards Applied:
 * - ✅ Tenant Context: All methods accept tenantId parameter
 * - ✅ Error Handling: Uses NotFoundError, BusinessRuleError with logging
 * - ✅ Return Types: Returns DTOs (not raw entities)
 * - ✅ Pagination: getAllDocuments returns { data, total }
 * - ✅ Logging: Success (info) and errors (error) with context
 * - ✅ Business Rules: Document lifecycle validation
 *
 * Known Limitations:
 * - ⚠️ sig.documento table lacks tenant_id column (schema limitation)
 * - ⚠️ Tenant isolation not enforced at database level
 * - ⚠️ Future: Add tenant_id column via migration
 */
export class SigService {
  private sigRepository = AppDataSource.getRepository(SigDocument);

  /**
   * Get all SIG documents with pagination
   *
   * @param tenantId - Company tenant ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default: 10)
   * @returns Paginated list of SIG documents
   *
   * TODO: Add tenant_id filter once schema migration adds column
   * Currently: No tenant filtering (schema limitation)
   */
  async getAllDocuments(
    tenantId: number,
    page = 1,
    limit = 10
  ): Promise<{ data: SigDocumentListDto[]; total: number }> {
    try {
      Logger.info('Retrieving SIG documents', {
        tenantId,
        page,
        limit,
        context: 'SigService.getAllDocuments',
      });

      // TODO: Add tenant_id filter when column exists
      // where: { tenant_id: tenantId }
      const [documents, total] = await this.sigRepository.findAndCount({
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      Logger.info('SIG documents retrieved successfully', {
        tenantId,
        count: documents.length,
        total,
        page,
        context: 'SigService.getAllDocuments',
      });

      return {
        data: toSigDocumentListDtoArray(documents),
        total,
      };
    } catch (error) {
      Logger.error('Error retrieving SIG documents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        page,
        limit,
        context: 'SigService.getAllDocuments',
      });
      throw error;
    }
  }

  /**
   * Create a new SIG document
   *
   * @param tenantId - Company tenant ID
   * @param data - Document data
   * @returns Created SIG document
   *
   * Business Rules:
   * - New documents start in 'VIGENTE' (ACTIVE) state by default
   * - codigo (code) must be unique
   */
  async createDocument(
    tenantId: number,
    data: SigDocumentCreateDto
  ): Promise<SigDocumentDetailDto> {
    try {
      Logger.info('Creating SIG document', {
        tenantId,
        data,
        context: 'SigService.createDocument',
      });

      // Check if codigo already exists
      const existing = await this.sigRepository.findOne({
        where: { codigo: data.codigo },
      });

      if (existing) {
        throw new BusinessRuleError(
          'SIG document code already exists',
          'DUPLICATE_CODIGO',
          { codigo: data.codigo },
          'Use a different document code'
        );
      }

      // Create document
      const document = this.sigRepository.create({
        ...data,
        estado: data.estado || 'VIGENTE', // Default to VIGENTE
        // TODO: Add tenant_id when column exists
        // tenant_id: tenantId,
      });

      const saved = await this.sigRepository.save(document);

      Logger.info('SIG document created successfully', {
        tenantId,
        documentId: saved.id,
        codigo: saved.codigo,
        titulo: saved.titulo,
        context: 'SigService.createDocument',
      });

      return toSigDocumentDetailDto(saved);
    } catch (error) {
      Logger.error('Error creating SIG document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'SigService.createDocument',
      });
      throw error;
    }
  }

  /**
   * Get SIG document by ID
   *
   * @param tenantId - Company tenant ID
   * @param id - Document ID
   * @returns SIG document detail
   * @throws NotFoundError if document not found
   *
   * TODO: Add tenant ownership verification once tenant_id column exists
   */
  async getDocumentById(tenantId: number, id: string): Promise<SigDocumentDetailDto> {
    try {
      Logger.info('Retrieving SIG document by ID', {
        tenantId,
        documentId: id,
        context: 'SigService.getDocumentById',
      });

      // TODO: Add tenant_id filter when column exists
      // where: { id: parseInt(id), tenant_id: tenantId }
      const document = await this.sigRepository.findOne({
        where: { id: parseInt(id) },
      });

      if (!document) {
        throw new NotFoundError('SIG Document', id);
      }

      Logger.info('SIG document retrieved successfully', {
        tenantId,
        documentId: id,
        codigo: document.codigo,
        context: 'SigService.getDocumentById',
      });

      return toSigDocumentDetailDto(document);
    } catch (error) {
      Logger.error('Error retrieving SIG document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        documentId: id,
        context: 'SigService.getDocumentById',
      });
      throw error;
    }
  }

  /**
   * Update SIG document
   *
   * @param tenantId - Company tenant ID
   * @param id - Document ID
   * @param data - Fields to update
   * @returns Updated SIG document
   * @throws NotFoundError if document not found
   *
   * Business Rules:
   * - Cannot change codigo (document code) after creation
   */
  async updateDocument(
    tenantId: number,
    id: string,
    data: SigDocumentUpdateDto
  ): Promise<SigDocumentDetailDto> {
    try {
      Logger.info('Updating SIG document', {
        tenantId,
        documentId: id,
        data,
        context: 'SigService.updateDocument',
      });

      // Verify document exists (and belongs to tenant)
      await this.getDocumentById(tenantId, id);

      // Update document
      await this.sigRepository.update(parseInt(id), data);

      // Return updated document
      const updated = await this.getDocumentById(tenantId, id);

      Logger.info('SIG document updated successfully', {
        tenantId,
        documentId: id,
        updatedFields: Object.keys(data),
        context: 'SigService.updateDocument',
      });

      return updated;
    } catch (error) {
      Logger.error('Error updating SIG document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        documentId: id,
        data,
        context: 'SigService.updateDocument',
      });
      throw error;
    }
  }

  /**
   * Delete SIG document
   *
   * @param tenantId - Company tenant ID
   * @param id - Document ID
   * @throws NotFoundError if document not found
   * @throws BusinessRuleError if document is VIGENTE (active)
   *
   * Business Rules:
   * - Cannot delete VIGENTE (active) documents
   * - Only OBSOLETO (obsolete) or ANULADO (cancelled) documents can be deleted
   * - Soft delete preferred (update estado to ANULADO) instead of hard delete
   */
  async deleteDocument(tenantId: number, id: string): Promise<void> {
    try {
      Logger.info('Deleting SIG document', {
        tenantId,
        documentId: id,
        context: 'SigService.deleteDocument',
      });

      // Verify document exists and get its state
      const document = await this.getDocumentById(tenantId, id);

      // Business rule: Cannot delete VIGENTE documents
      if (document.estado === 'VIGENTE') {
        throw new BusinessRuleError(
          'Cannot delete active SIG documents',
          'CANNOT_DELETE_VIGENTE',
          { documentId: id, estado: document.estado },
          'Mark document as OBSOLETO or ANULADO before deleting'
        );
      }

      // Hard delete (consider soft delete instead in future)
      await this.sigRepository.delete(parseInt(id));

      Logger.info('SIG document deleted successfully', {
        tenantId,
        documentId: id,
        codigo: document.codigo,
        context: 'SigService.deleteDocument',
      });
    } catch (error) {
      Logger.error('Error deleting SIG document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        documentId: id,
        context: 'SigService.deleteDocument',
      });
      throw error;
    }
  }
}
