import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ValeCombustible } from '../models/vale-combustible.model';
import { CreateValeDto, UpdateValeDto } from '../types/dto/vale-combustible.dto';

export interface ValeFilters {
  equipo_id?: number;
  proyecto_id?: number;
  parte_diario_id?: number;
  estado?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_combustible?: string;
  limit?: number;
  offset?: number;
}

export class ValesCombustibleService {
  private get repo(): Repository<ValeCombustible> {
    return AppDataSource.getRepository(ValeCombustible);
  }

  /** Generate next VCB-NNNN code */
  private async generarCodigo(): Promise<string> {
    const last = await this.repo.createQueryBuilder('v').orderBy('v.id', 'DESC').getOne();

    if (!last || !last.codigo) return 'VCB-0001';
    const num = parseInt(last.codigo.split('-')[1] || '0', 10);
    return `VCB-${String(num + 1).padStart(4, '0')}`;
  }

  async listar(filters: ValeFilters = {}): Promise<ValeCombustible[]> {
    const qb = this.repo
      .createQueryBuilder('v')
      .orderBy('v.fecha', 'DESC')
      .addOrderBy('v.id', 'DESC');

    if (filters.equipo_id) qb.andWhere('v.equipoId = :eq', { eq: filters.equipo_id });
    if (filters.proyecto_id) qb.andWhere('v.proyectoId = :proy', { proy: filters.proyecto_id });
    if (filters.parte_diario_id)
      qb.andWhere('v.parteDiarioId = :pd', { pd: filters.parte_diario_id });
    if (filters.estado) qb.andWhere('v.estado = :est', { est: filters.estado });
    if (filters.tipo_combustible)
      qb.andWhere('v.tipoCombustible = :tc', { tc: filters.tipo_combustible });
    if (filters.fecha_desde) qb.andWhere('v.fecha >= :fd', { fd: filters.fecha_desde });
    if (filters.fecha_hasta) qb.andWhere('v.fecha <= :fh', { fh: filters.fecha_hasta });

    if (filters.limit) qb.limit(filters.limit);
    if (filters.offset) qb.offset(filters.offset);

    return qb.getMany();
  }

  async obtener(id: number): Promise<ValeCombustible | null> {
    return this.repo.findOne({ where: { id } });
  }

  async crear(
    data: CreateValeDto,
    userId: number | undefined = undefined
  ): Promise<ValeCombustible> {
    const codigo = await this.generarCodigo();

    const montoTotal =
      data.cantidad_galones && data.precio_unitario
        ? parseFloat((data.cantidad_galones * data.precio_unitario).toFixed(2))
        : null;

    const vale = this.repo.create({
      codigo,
      parteDiarioId: data.parte_diario_id ?? null,
      equipoId: data.equipo_id,
      proyectoId: data.proyecto_id ?? null,
      fecha: new Date(data.fecha),
      numeroVale: data.numero_vale,
      tipoCombustible: data.tipo_combustible,
      cantidadGalones: data.cantidad_galones,
      precioUnitario: data.precio_unitario ?? null,
      montoTotal,
      proveedor: data.proveedor ?? null,
      observaciones: data.observaciones ?? null,
      estado: 'PENDIENTE',
      creadoPor: userId ?? null,
    });

    return this.repo.save(vale);
  }

  async actualizar(id: number, data: UpdateValeDto): Promise<ValeCombustible | null> {
    const vale = await this.obtener(id);
    if (!vale) return null;

    if (data.fecha !== undefined) vale.fecha = new Date(data.fecha);
    if (data.numero_vale !== undefined) vale.numeroVale = data.numero_vale;
    if (data.tipo_combustible !== undefined) vale.tipoCombustible = data.tipo_combustible;
    if (data.cantidad_galones !== undefined) vale.cantidadGalones = data.cantidad_galones;
    if (data.precio_unitario !== undefined) vale.precioUnitario = data.precio_unitario;
    if (data.proveedor !== undefined) vale.proveedor = data.proveedor;
    if (data.observaciones !== undefined) vale.observaciones = data.observaciones;
    if (data.parte_diario_id !== undefined) vale.parteDiarioId = data.parte_diario_id;

    // Recalculate monto if both values present
    if (vale.cantidadGalones && vale.precioUnitario) {
      vale.montoTotal = parseFloat((vale.cantidadGalones * vale.precioUnitario).toFixed(2));
    }

    return this.repo.save(vale);
  }

  async eliminar(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

  /** PENDIENTE → REGISTRADO */
  async registrar(id: number): Promise<ValeCombustible | null> {
    const vale = await this.obtener(id);
    if (!vale) return null;
    vale.estado = 'REGISTRADO';
    return this.repo.save(vale);
  }

  /** → ANULADO */
  async anular(id: number): Promise<ValeCombustible | null> {
    const vale = await this.obtener(id);
    if (!vale) return null;
    vale.estado = 'ANULADO';
    return this.repo.save(vale);
  }
}
