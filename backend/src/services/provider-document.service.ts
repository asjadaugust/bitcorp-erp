import { AppDataSource } from '../config/database.config';
import { ProviderDocument } from '../models/provider-document.model';
import { Repository } from 'typeorm';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import Logger from '../utils/logger';
import {
  ProviderDocumentDto,
  ProviderDocumentCreateDto,
  ProviderDocumentUpdateDto,
} from '../types/dto/provider-document.dto';

const VALID_DOCUMENT_TYPES = [
  'RUC',
  'VIGENCIA_PODER',
  'DNI_REPRESENTANTE',
  'CERTIFICADO_BANCARIO',
  'BROCHURE',
  'OTRO',
] as const;

export class ProviderDocumentService {
  private repository: Repository<ProviderDocument>;

  constructor() {
    this.repository = AppDataSource.getRepository(ProviderDocument);
  }

  /**
   * Transform entity to DTO
   */
  private transformToDto(entity: ProviderDocument): ProviderDocumentDto {
    return {
      id: entity.id,
      proveedor_id: entity.proveedorId,
      tipo_documento: entity.tipoDocumento,
      numero_documento: entity.numeroDocumento || null,
      fecha_emision: entity.fechaEmision || null,
      fecha_vencimiento: entity.fechaVencimiento || null,
      archivo_url: entity.archivoUrl || null,
      observaciones: entity.observaciones || null,
      created_at: entity.createdAt,
      updated_at: entity.updatedAt,
      proveedor_razon_social: entity.proveedor?.razonSocial,
    };
  }

  /**
   * List provider documents with filters and pagination
   */
  async findAll(
    proveedorId?: number,
    page = 1,
    limit = 10
  ): Promise<{ data: ProviderDocumentDto[]; total: number }> {
    try {
      const query = this.repository
        .createQueryBuilder('doc')
        .leftJoinAndSelect('doc.proveedor', 'proveedor');

      if (proveedorId) {
        query.andWhere('doc.proveedorId = :proveedorId', { proveedorId });
      }

      const [entities, total] = await query
        .orderBy('doc.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();

      return {
        data: entities.map((e) => this.transformToDto(e)),
        total,
      };
    } catch (error) {
      Logger.error('Error listing provider documents', {
        error: error instanceof Error ? error.message : String(error),
        proveedorId,
        context: 'ProviderDocumentService.findAll',
      });
      throw error;
    }
  }

  /**
   * Find provider document by ID
   */
  async findById(id: number): Promise<ProviderDocumentDto> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['proveedor'],
    });

    if (!entity) {
      throw new NotFoundError('Provider document', id);
    }

    return this.transformToDto(entity);
  }

  /**
   * Create provider document
   */
  async create(data: ProviderDocumentCreateDto): Promise<ProviderDocumentDto> {
    try {
      // Validate document type
      const validTypes = VALID_DOCUMENT_TYPES as readonly string[];
      if (!validTypes.includes(data.tipo_documento)) {
        throw new ConflictError('Invalid document type', {
          tipo_documento: data.tipo_documento,
          valid_types: VALID_DOCUMENT_TYPES,
        });
      }

      const document = this.repository.create({
        proveedorId: data.proveedor_id,
        tipoDocumento: data.tipo_documento,
        numeroDocumento: data.numero_documento,
        fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
        fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
        archivoUrl: data.archivo_url,
        observaciones: data.observaciones,
      });

      const saved = await this.repository.save(document);
      return await this.findById(saved.id);
    } catch (error) {
      Logger.error('Error creating provider document', {
        error: error instanceof Error ? error.message : String(error),
        data,
        context: 'ProviderDocumentService.create',
      });
      throw error;
    }
  }

  /**
   * Update provider document
   */
  async update(id: number, data: ProviderDocumentUpdateDto): Promise<ProviderDocumentDto> {
    try {
      await this.findById(id);

      if (data.tipo_documento) {
        const validTypes = VALID_DOCUMENT_TYPES as readonly string[];
        if (!validTypes.includes(data.tipo_documento)) {
          throw new ConflictError('Invalid document type', {
            tipo_documento: data.tipo_documento,
            valid_types: VALID_DOCUMENT_TYPES,
          });
        }
      }

      await this.repository.update(id, {
        proveedorId: data.proveedor_id,
        tipoDocumento: data.tipo_documento,
        numeroDocumento: data.numero_documento,
        fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
        fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
        archivoUrl: data.archivo_url,
        observaciones: data.observaciones,
      });

      return await this.findById(id);
    } catch (error) {
      Logger.error('Error updating provider document', {
        error: error instanceof Error ? error.message : String(error),
        id,
        data,
        context: 'ProviderDocumentService.update',
      });
      throw error;
    }
  }

  /**
   * Delete provider document
   */
  async delete(id: number): Promise<void> {
    try {
      await this.findById(id);
      const result = await this.repository.delete(id);
      if ((result.affected || 0) === 0) {
        throw new NotFoundError('Provider document', id);
      }
    } catch (error) {
      Logger.error('Error deleting provider document', {
        error: error instanceof Error ? error.message : String(error),
        id,
        context: 'ProviderDocumentService.delete',
      });
      throw error;
    }
  }
}
