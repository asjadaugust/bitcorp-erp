import { AppDataSource } from '../config/database.config';
import { OperatorDocument } from '../models/operator-document.entity';
import { Repository } from 'typeorm';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';
import {
  OperatorDocumentDto,
  OperatorDocumentCreateDto,
  OperatorDocumentUpdateDto,
} from '../types/dto/operator-document.dto';

// Valid document types (business rule)
const VALID_DOCUMENT_TYPES = [
  'DNI',
  'LICENCIA_CONDUCIR',
  'CERTIFICADO_OPERACION',
  'SCTR',
  'EXAMEN_MEDICO',
  'CAPACITACION',
  'OTRO',
] as const;

export class OperatorDocumentService {
  private repository: Repository<OperatorDocument>;

  constructor() {
    this.repository = AppDataSource.getRepository(OperatorDocument);
  }

  // Transform entity to DTO with snake_case fields
  private transformToDto(entity: OperatorDocument): OperatorDocumentDto {
    return {
      id: entity.id,
      trabajador_id: entity.trabajadorId,
      tipo_documento: entity.tipoDocumento,
      numero_documento: entity.numeroDocumento || null,
      fecha_emision: entity.fechaEmision || null,
      fecha_vencimiento: entity.fechaVencimiento || null,
      archivo_url: entity.archivoUrl || null,
      observaciones: entity.observaciones || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      // Include trabajador info if loaded
      trabajador_nombre: entity.trabajador?.nombres,
      trabajador_apellido: entity.trabajador
        ? `${entity.trabajador.apellidoPaterno} ${entity.trabajador.apellidoMaterno || ''}`.trim()
        : undefined,
    };
  }

  /**
   * List operator documents with filters and pagination
   */
  async findAll(
    tenantId: number,
    filters?: {
      trabajadorId?: number;
      tipoDocumento?: string;
    },
    page = 1,
    limit = 10
  ): Promise<{ data: OperatorDocumentDto[]; total: number }> {
    try {
      Logger.info('Listing operator documents', {
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorDocumentService.findAll',
      });

      const query = this.repository
        .createQueryBuilder('doc')
        .leftJoinAndSelect('doc.trabajador', 'trabajador');

      // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
      // query.andWhere('doc.tenant_id = :tenantId', { tenantId });

      if (filters?.trabajadorId) {
        query.andWhere('doc.trabajadorId = :trabajadorId', {
          trabajadorId: filters.trabajadorId,
        });
      }

      if (filters?.tipoDocumento) {
        query.andWhere('doc.tipoDocumento = :tipoDocumento', {
          tipoDocumento: filters.tipoDocumento,
        });
      }

      const [entities, total] = await query
        .orderBy('doc.fechaVencimiento', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      Logger.info('Operator documents listed', {
        tenantId,
        count: entities.length,
        total,
        context: 'OperatorDocumentService.findAll',
      });

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error listing operator documents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorDocumentService.findAll',
      });
      throw error;
    }
  }

  /**
   * Find operator document by ID
   */
  async findById(tenantId: number, id: number): Promise<OperatorDocumentDto> {
    try {
      Logger.info('Fetching operator document', {
        tenantId,
        id,
        context: 'OperatorDocumentService.findById',
      });

      const entity = await this.repository.findOne({
        where: { id },
        // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
        // where: { id, tenant_id: tenantId },
        relations: ['trabajador'],
      });

      if (!entity) {
        throw new NotFoundError('Operator document', id, { tenantId });
      }

      Logger.info('Operator document fetched', {
        tenantId,
        id,
        context: 'OperatorDocumentService.findById',
      });

      return this.transformToDto(entity);
    } catch (error) {
      Logger.error('Error fetching operator document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorDocumentService.findById',
      });
      throw error;
    }
  }

  /**
   * Find all documents for a specific operator
   */
  async findByOperator(tenantId: number, operatorId: number): Promise<OperatorDocumentDto[]> {
    try {
      Logger.info('Fetching operator documents by operator', {
        tenantId,
        operatorId,
        context: 'OperatorDocumentService.findByOperator',
      });

      const entities = await this.repository.find({
        where: { trabajadorId: operatorId },
        // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
        // where: { trabajadorId: operatorId, tenant_id: tenantId },
        relations: ['trabajador'],
        order: { tipoDocumento: 'ASC' },
      });

      Logger.info('Operator documents fetched by operator', {
        tenantId,
        operatorId,
        count: entities.length,
        context: 'OperatorDocumentService.findByOperator',
      });

      return entities.map((e) => this.transformToDto(e));
    } catch (error) {
      Logger.error('Error fetching operator documents by operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        operatorId,
        context: 'OperatorDocumentService.findByOperator',
      });
      throw error;
    }
  }

  /**
   * Find documents expiring within specified days
   */
  async findExpiring(
    tenantId: number,
    daysAhead: number = 30,
    page = 1,
    limit = 50
  ): Promise<{ data: OperatorDocumentDto[]; total: number }> {
    try {
      Logger.info('Fetching expiring operator documents', {
        tenantId,
        daysAhead,
        page,
        limit,
        context: 'OperatorDocumentService.findExpiring',
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const query = this.repository
        .createQueryBuilder('doc')
        .leftJoinAndSelect('doc.trabajador', 'trabajador')
        .where('doc.fechaVencimiento IS NOT NULL')
        .andWhere('doc.fechaVencimiento <= :futureDate', { futureDate })
        .andWhere('doc.fechaVencimiento >= CURRENT_DATE')
        .orderBy('doc.fechaVencimiento', 'ASC');

      // TODO: Add tenant_id filter when column exists in rrhh.documento_trabajador
      // query.andWhere('doc.tenant_id = :tenantId', { tenantId });

      const [entities, total] = await query
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      Logger.info('Expiring operator documents fetched', {
        tenantId,
        daysAhead,
        count: entities.length,
        total,
        context: 'OperatorDocumentService.findExpiring',
      });

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error fetching expiring operator documents', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        daysAhead,
        context: 'OperatorDocumentService.findExpiring',
      });
      throw error;
    }
  }

  /**
   * Create operator document
   */
  async create(tenantId: number, data: OperatorDocumentCreateDto): Promise<OperatorDocumentDto> {
    try {
      Logger.info('Creating operator document', {
        tenantId,
        data,
        context: 'OperatorDocumentService.create',
      });

      // Business rule: Validate document type
      const validTypes = VALID_DOCUMENT_TYPES as readonly string[];
      if (!validTypes.includes(data.tipo_documento)) {
        throw new ConflictError('Invalid document type', {
          tipo_documento: data.tipo_documento,
          valid_types: VALID_DOCUMENT_TYPES,
        });
      }

      // Business rule: Validate archivo_url if provided (prevent directory traversal)
      if (data.archivo_url && (data.archivo_url.includes('..') || data.archivo_url.includes('~'))) {
        throw new ConflictError('Invalid file path', {
          archivo_url: data.archivo_url,
        });
      }

      // Business rule: Check for duplicate active documents (same type for same operator)
      const existing = await this.repository.findOne({
        where: {
          trabajadorId: data.trabajador_id,
          tipoDocumento: data.tipo_documento,
        },
        // TODO: Add tenant_id filter when column exists
      });

      if (existing && existing.fechaVencimiento && existing.fechaVencimiento > new Date()) {
        throw new ConflictError('Active document of this type already exists', {
          trabajador_id: data.trabajador_id,
          tipo_documento: data.tipo_documento,
          existing_id: existing.id,
        });
      }

      const document = this.repository.create({
        trabajadorId: data.trabajador_id,
        tipoDocumento: data.tipo_documento,
        numeroDocumento: data.numero_documento,
        fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
        fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
        archivoUrl: data.archivo_url,
        observaciones: data.observaciones,
      });

      const saved = await this.repository.save(document);

      // Reload with relations
      const entity = await this.repository.findOne({
        where: { id: saved.id },
        relations: ['trabajador'],
      });

      Logger.info('Operator document created', {
        tenantId,
        id: saved.id,
        context: 'OperatorDocumentService.create',
      });

      return this.transformToDto(entity!);
    } catch (error) {
      Logger.error('Error creating operator document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        data,
        context: 'OperatorDocumentService.create',
      });
      throw error;
    }
  }

  /**
   * Update operator document
   */
  async update(
    tenantId: number,
    id: number,
    data: OperatorDocumentUpdateDto
  ): Promise<OperatorDocumentDto> {
    try {
      Logger.info('Updating operator document', {
        tenantId,
        id,
        data,
        context: 'OperatorDocumentService.update',
      });

      // Verify document exists (with tenant check when available)
      await this.findById(tenantId, id);

      // Business rule: Validate document type if provided
      if (data.tipo_documento) {
        const validTypes = VALID_DOCUMENT_TYPES as readonly string[];
        if (!validTypes.includes(data.tipo_documento)) {
          throw new ConflictError('Invalid document type', {
            tipo_documento: data.tipo_documento,
            valid_types: VALID_DOCUMENT_TYPES,
          });
        }
      }

      // Business rule: Validate archivo_url if provided
      if (data.archivo_url && (data.archivo_url.includes('..') || data.archivo_url.includes('~'))) {
        throw new ConflictError('Invalid file path', {
          archivo_url: data.archivo_url,
        });
      }

      await this.repository.update(id, {
        trabajadorId: data.trabajador_id,
        tipoDocumento: data.tipo_documento,
        numeroDocumento: data.numero_documento,
        fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
        fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
        archivoUrl: data.archivo_url,
        observaciones: data.observaciones,
      });

      Logger.info('Operator document updated', {
        tenantId,
        id,
        context: 'OperatorDocumentService.update',
      });

      return await this.findById(tenantId, id);
    } catch (error) {
      Logger.error('Error updating operator document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'OperatorDocumentService.update',
      });
      throw error;
    }
  }

  /**
   * Delete operator document
   */
  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting operator document', {
        tenantId,
        id,
        context: 'OperatorDocumentService.delete',
      });

      // Verify document exists and get file URL for cleanup
      const entity = await this.findById(tenantId, id);

      // TODO: Delete file from storage if exists
      if (entity.archivo_url) {
        Logger.info('File deletion pending (not implemented)', {
          archivo_url: entity.archivo_url,
          context: 'OperatorDocumentService.delete',
        });
        // await this.fileStorageService.delete(entity.archivo_url);
      }

      const result = await this.repository.delete(id);
      // TODO: Add tenant_id filter when column exists

      if ((result.affected || 0) === 0) {
        throw new NotFoundError('Operator document', id, { tenantId });
      }

      Logger.info('Operator document deleted', {
        tenantId,
        id,
        context: 'OperatorDocumentService.delete',
      });
    } catch (error) {
      Logger.error('Error deleting operator document', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorDocumentService.delete',
      });
      throw error;
    }
  }
}
