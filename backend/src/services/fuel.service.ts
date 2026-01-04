import { AppDataSource } from '../config/database.config';
import { FuelRecord } from '../models/fuel-record.model';
import { Repository } from 'typeorm';

// DTO with snake_case fields for API responses
export interface FuelDto {
  id: number;
  valorizacion_id: number;
  fecha: Date;
  cantidad: number | null;
  precio_unitario: number | null;
  monto_total: number | null;
  tipo_combustible: string | null;
  proveedor: string | null;
  numero_documento: string | null;
  observaciones: string | null;
  created_at: Date;
  // Relation fields
  valorizacion_periodo: string | null;
  valorizacion_equipment_id: number | null;
}

export class FuelService {
  private fuelRepository: Repository<FuelRecord>;

  constructor() {
    this.fuelRepository = AppDataSource.getRepository(FuelRecord);
  }

  private transformToDto(record: FuelRecord): FuelDto {
    return {
      id: record.id,
      valorizacion_id: record.valorizacionId,
      fecha: record.fecha,
      cantidad: record.cantidad ? Number(record.cantidad) : null,
      precio_unitario: record.precioUnitario ? Number(record.precioUnitario) : null,
      monto_total: record.montoTotal ? Number(record.montoTotal) : null,
      tipo_combustible: record.tipoCombustible || null,
      proveedor: record.proveedor || null,
      numero_documento: record.numeroDocumento || null,
      observaciones: record.observaciones || null,
      created_at: record.createdAt,
      // Relation fields
      valorizacion_periodo: record.valorizacion?.periodo || null,
      valorizacion_equipment_id: record.valorizacion?.equipmentId || null,
    };
  }

  async getAllFuelRecords(
    filters?: any
  ): Promise<{ data: FuelDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = parseInt(filters?.page) || 1;
    const limit = parseInt(filters?.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.fuelRepository
      .createQueryBuilder('fuel')
      .leftJoinAndSelect('fuel.valorizacion', 'val')
      .orderBy('fuel.fecha', 'DESC');

    // Apply filters
    if (filters?.valorizacionId) {
      queryBuilder.andWhere('fuel.valorizacionId = :valorizacionId', {
        valorizacionId: filters.valorizacionId,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('fuel.fecha >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('fuel.fecha <= :endDate', { endDate: filters.endDate });
    }

    if (filters?.tipoCombustible) {
      queryBuilder.andWhere('fuel.tipoCombustible = :tipoCombustible', {
        tipoCombustible: filters.tipoCombustible,
      });
    }

    if (filters?.search) {
      queryBuilder.andWhere(
        '(fuel.proveedor ILIKE :search OR fuel.numeroDocumento ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const records = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data: records.map((r) => this.transformToDto(r)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFuelRecordById(id: number): Promise<FuelDto | null> {
    const record = await this.fuelRepository.findOne({
      where: { id },
      relations: ['valorizacion'],
    });
    return record ? this.transformToDto(record) : null;
  }

  async createFuelRecord(data: Partial<FuelRecord>): Promise<FuelDto> {
    // Calculate montoTotal if cantidad and precioUnitario are provided
    if (data.cantidad && data.precioUnitario && !data.montoTotal) {
      data.montoTotal = data.cantidad * data.precioUnitario;
    }

    const fuelRecord = this.fuelRepository.create(data);
    const saved = await this.fuelRepository.save(fuelRecord);

    // Reload with relations to transform
    const withRelations = await this.fuelRepository.findOne({
      where: { id: saved.id },
      relations: ['valorizacion'],
    });

    return this.transformToDto(withRelations!);
  }

  async updateFuelRecord(id: number, data: Partial<FuelRecord>): Promise<FuelDto | null> {
    const existing = await this.fuelRepository.findOne({
      where: { id },
      relations: ['valorizacion'],
    });
    if (!existing) return null;

    // Recalculate montoTotal if cantidad or precioUnitario changed
    const newCantidad = data.cantidad ?? existing.cantidad;
    const newPrecioUnitario = data.precioUnitario ?? existing.precioUnitario;
    if (newCantidad && newPrecioUnitario) {
      data.montoTotal = newCantidad * newPrecioUnitario;
    }

    Object.assign(existing, data);
    const saved = await this.fuelRepository.save(existing);

    // Reload with relations
    const withRelations = await this.fuelRepository.findOne({
      where: { id: saved.id },
      relations: ['valorizacion'],
    });

    return this.transformToDto(withRelations!);
  }

  async deleteFuelRecord(id: number): Promise<boolean> {
    const result = await this.fuelRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Additional helper methods
  async getFuelRecordsByValorizacion(valorizacionId: number): Promise<FuelDto[]> {
    const records = await this.fuelRepository.find({
      where: { valorizacionId },
      relations: ['valorizacion'],
      order: { fecha: 'DESC' },
    });
    return records.map((r) => this.transformToDto(r));
  }

  async getTotalFuelCostByValorizacion(valorizacionId: number): Promise<number> {
    const result = await this.fuelRepository
      .createQueryBuilder('fuel')
      .select('SUM(fuel.montoTotal)', 'total')
      .where('fuel.valorizacionId = :valorizacionId', { valorizacionId })
      .getRawOne();

    return parseFloat(result?.total || '0');
  }
}
