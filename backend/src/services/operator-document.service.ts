import { AppDataSource } from '../config/database.config';
import { OperatorDocument } from '../models/operator-document.entity';
import { Repository } from 'typeorm';

export class OperatorDocumentService {
  private repository: Repository<OperatorDocument>;

  constructor() {
    this.repository = AppDataSource.getRepository(OperatorDocument);
  }

  async findAll(filters?: { operator_id?: number; document_type?: string; is_active?: boolean }): Promise<OperatorDocument[]> {
    const query = this.repository.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.operator', 'operator')
      .where('doc.is_active = :is_active', { is_active: filters?.is_active ?? true });

    if (filters?.operator_id) {
      query.andWhere('doc.operator_id = :operator_id', { operator_id: filters.operator_id });
    }

    if (filters?.document_type) {
      query.andWhere('doc.document_type = :document_type', { document_type: filters.document_type });
    }

    return await query.orderBy('doc.expiry_date', 'ASC').getMany();
  }

  async findById(id: number): Promise<OperatorDocument | null> {
    return await this.repository.findOne({
      where: { id, is_active: true },
      relations: ['operator']
    });
  }

  async findByOperator(operatorId: number): Promise<OperatorDocument[]> {
    return await this.repository.find({
      where: { operator_id: operatorId, is_active: true },
      order: { document_type: 'ASC' }
    });
  }

  async findExpiring(daysAhead: number = 30): Promise<OperatorDocument[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.repository.createQueryBuilder('doc')
      .leftJoinAndSelect('doc.operator', 'operator')
      .where('doc.is_active = :is_active', { is_active: true })
      .andWhere('doc.expiry_date IS NOT NULL')
      .andWhere('doc.expiry_date <= :future_date', { future_date: futureDate })
      .andWhere('doc.expiry_date >= CURRENT_DATE')
      .orderBy('doc.expiry_date', 'ASC')
      .getMany();
  }

  async create(data: Partial<OperatorDocument>): Promise<OperatorDocument> {
    const document = this.repository.create(data);
    return await this.repository.save(document);
  }

  async update(id: number, data: Partial<OperatorDocument>): Promise<OperatorDocument | null> {
    await this.repository.update(id, data);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.update(id, {
      is_active: false,
      deleted_at: new Date()
    });
    return (result.affected || 0) > 0;
  }
}
