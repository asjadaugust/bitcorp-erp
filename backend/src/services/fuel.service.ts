import { AppDataSource } from '../config/database.config';
import { FuelRecord } from '../models/fuel-record.model';
import { Repository } from 'typeorm';
import {
  FuelRecordDto,
  CreateFuelRecordDto,
  UpdateFuelRecordDto,
  toFuelRecordDto,
  fromFuelRecordDto,
  mapCreateFuelRecordDto,
} from '../types/dto/fuel-record.dto';

export class FuelService {
  private fuelRepository: Repository<FuelRecord>;

  constructor() {
    this.fuelRepository = AppDataSource.getRepository(FuelRecord);
  }

  async getAllFuelRecords(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    filters?: any
  ): Promise<{
    data: FuelRecordDto[];
    total: number;
  }> {
    const page = parseInt(filters?.page) || 1;
    const limit = parseInt(filters?.limit) || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.fuelRepository
      .createQueryBuilder('fuel')
      .leftJoinAndSelect('fuel.valorizacion', 'val');

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

    // Sorting with whitelist
    const sortableFields: Record<string, string> = {
      fecha: 'fuel.fecha',
      cantidad: 'fuel.cantidad',
      precio_unitario: 'fuel.precioUnitario',
      monto_total: 'fuel.montoTotal',
      tipo_combustible: 'fuel.tipoCombustible',
      proveedor: 'fuel.proveedor',
      numero_documento: 'fuel.numeroDocumento',
      created_at: 'fuel.createdAt',
    };

    const sortBy =
      filters?.sort_by && sortableFields[filters.sort_by]
        ? sortableFields[filters.sort_by]
        : 'fuel.fecha';
    const sortOrder = filters?.sort_order === 'ASC' ? 'ASC' : 'DESC';

    queryBuilder.orderBy(sortBy, sortOrder);

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const records = await queryBuilder.skip(skip).take(limit).getMany();

    return {
      data: records.map((r) => toFuelRecordDto(r)),
      total,
    };
  }

  async getFuelRecordById(id: number): Promise<FuelRecordDto | null> {
    const record = await this.fuelRepository.findOne({
      where: { id },
      relations: ['valorizacion'],
    });
    return record ? toFuelRecordDto(record) : null;
  }

  async createFuelRecord(data: CreateFuelRecordDto): Promise<FuelRecordDto> {
    // Map dual input format to DTO
    const dtoData = mapCreateFuelRecordDto(data);

    // Calculate monto_total if cantidad and precio_unitario are provided
    if (dtoData.cantidad && dtoData.precio_unitario && !dtoData.monto_total) {
      dtoData.monto_total = dtoData.cantidad * dtoData.precio_unitario;
    }

    const fuelRecord = this.fuelRepository.create(fromFuelRecordDto(dtoData));
    const saved = await this.fuelRepository.save(fuelRecord);

    // Reload with relations to transform
    const withRelations = await this.fuelRepository.findOne({
      where: { id: saved.id },
      relations: ['valorizacion'],
    });

    return toFuelRecordDto(withRelations!);
  }

  async updateFuelRecord(id: number, data: UpdateFuelRecordDto): Promise<FuelRecordDto | null> {
    const existing = await this.fuelRepository.findOne({
      where: { id },
      relations: ['valorizacion'],
    });
    if (!existing) return null;

    // Map dual input format to DTO
    const dtoData = mapCreateFuelRecordDto(data);

    // Recalculate monto_total if cantidad or precio_unitario changed
    const newCantidad = dtoData.cantidad ?? existing.cantidad;
    const newPrecioUnitario = dtoData.precio_unitario ?? existing.precioUnitario;
    if (newCantidad && newPrecioUnitario) {
      dtoData.monto_total = newCantidad * newPrecioUnitario;
    }

    Object.assign(existing, fromFuelRecordDto(dtoData));
    const saved = await this.fuelRepository.save(existing);

    // Reload with relations
    const withRelations = await this.fuelRepository.findOne({
      where: { id: saved.id },
      relations: ['valorizacion'],
    });

    return toFuelRecordDto(withRelations!);
  }

  async deleteFuelRecord(id: number): Promise<boolean> {
    const result = await this.fuelRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // Additional helper methods
  async getFuelRecordsByValorizacion(valorizacionId: number): Promise<FuelRecordDto[]> {
    const records = await this.fuelRepository.find({
      where: { valorizacionId },
      relations: ['valorizacion'],
      order: { fecha: 'DESC' },
    });
    return records.map((r) => toFuelRecordDto(r));
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
