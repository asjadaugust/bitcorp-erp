import { AppDataSource } from '../config/database.config';
import { OperatorDocument } from '../models/operator-document.entity';
import { Repository } from 'typeorm';

// DTO with snake_case fields for API responses
export interface OperatorDocumentDto {
  id: number;
  trabajador_id: number;
  tipo_documento: string;
  numero_documento: string | null;
  fecha_emision: Date | null;
  fecha_vencimiento: Date | null;
  archivo_url: string | null;
  observaciones: string | null;
  created_at: Date;
  updated_at: Date;
  // Optional relation fields
  trabajador_nombre?: string;
  trabajador_apellido?: string;
}

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

  async findAll(filters?: {
    trabajadorId?: number;
    tipoDocumento?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: OperatorDocumentDto[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.repository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.trabajador', 'trabajador');

    if (filters?.trabajadorId) {
      query.andWhere('doc.trabajadorId = :trabajadorId', { trabajadorId: filters.trabajadorId });
    }

    if (filters?.tipoDocumento) {
      query.andWhere('doc.tipoDocumento = :tipoDocumento', {
        tipoDocumento: filters.tipoDocumento,
      });
    }

    const [entities, total] = await query
      .orderBy('doc.fechaVencimiento', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data: entities.map((e) => this.transformToDto(e)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<OperatorDocumentDto | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['trabajador'],
    });
    return entity ? this.transformToDto(entity) : null;
  }

  async findByOperator(operatorId: number): Promise<OperatorDocumentDto[]> {
    const entities = await this.repository.find({
      where: { trabajadorId: operatorId },
      relations: ['trabajador'],
      order: { tipoDocumento: 'ASC' },
    });
    return entities.map((e) => this.transformToDto(e));
  }

  async findExpiring(daysAhead: number = 30): Promise<OperatorDocumentDto[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const entities = await this.repository
      .createQueryBuilder('doc')
      .leftJoinAndSelect('doc.trabajador', 'trabajador')
      .where('doc.fechaVencimiento IS NOT NULL')
      .andWhere('doc.fechaVencimiento <= :futureDate', { futureDate })
      .andWhere('doc.fechaVencimiento >= CURRENT_DATE')
      .orderBy('doc.fechaVencimiento', 'ASC')
      .getMany();

    return entities.map((e) => this.transformToDto(e));
  }

  async create(data: Partial<OperatorDocument>): Promise<OperatorDocumentDto> {
    const document = this.repository.create(data);
    const saved = await this.repository.save(document);
    // Reload with relations
    const entity = await this.repository.findOne({
      where: { id: saved.id },
      relations: ['trabajador'],
    });
    return this.transformToDto(entity!);
  }

  async update(id: number, data: Partial<OperatorDocument>): Promise<OperatorDocumentDto | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }
}
