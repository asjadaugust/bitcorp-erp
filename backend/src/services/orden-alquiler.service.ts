/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { OrdenAlquiler, EstadoOrden } from '../models/orden-alquiler.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import logger from '../utils/logger';

export interface CrearOrdenDto {
  solicitud_equipo_id?: number;
  proveedor_id: number;
  equipo_id?: number;
  proyecto_id?: number;
  descripcion_equipo: string;
  fecha_orden: string;
  fecha_inicio_estimada?: string;
  fecha_fin_estimada?: string;
  tarifa_acordada: number;
  tipo_tarifa?: 'HORA' | 'DIA' | 'MES';
  moneda?: 'PEN' | 'USD';
  tipo_cambio?: number;
  horas_incluidas?: number;
  penalidad_exceso?: number;
  condiciones_especiales?: string;
  observaciones?: string;
}

export interface ActualizarOrdenDto {
  equipo_id?: number;
  proyecto_id?: number;
  descripcion_equipo?: string;
  fecha_orden?: string;
  fecha_inicio_estimada?: string;
  fecha_fin_estimada?: string;
  tarifa_acordada?: number;
  tipo_tarifa?: 'HORA' | 'DIA' | 'MES';
  moneda?: 'PEN' | 'USD';
  tipo_cambio?: number;
  horas_incluidas?: number;
  penalidad_exceso?: number;
  condiciones_especiales?: string;
  observaciones?: string;
}

export interface OrdenAlquilerDto {
  id: number;
  codigo: string;
  solicitud_equipo_id: number | null;
  proveedor_id: number;
  proveedor_nombre: string | null;
  equipo_id: number | null;
  proyecto_id: number | null;
  descripcion_equipo: string;
  fecha_orden: string;
  fecha_inicio_estimada: string | null;
  fecha_fin_estimada: string | null;
  tarifa_acordada: number;
  tipo_tarifa: string;
  moneda: string;
  tipo_cambio: number | null;
  horas_incluidas: number | null;
  penalidad_exceso: number | null;
  condiciones_especiales: string | null;
  observaciones: string | null;
  estado: string;
  enviado_a: string | null;
  fecha_envio: string | null;
  confirmado_por: string | null;
  fecha_confirmacion: string | null;
  motivo_cancelacion: string | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function formatDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (d instanceof Date) return d.toISOString().split('T')[0];
  return String(d);
}

function toDto(o: OrdenAlquiler, proveedorNombre?: string | null): OrdenAlquilerDto {
  return {
    id: o.id,
    codigo: o.codigo,
    solicitud_equipo_id: o.solicitudEquipoId ?? null,
    proveedor_id: o.proveedorId,
    proveedor_nombre: proveedorNombre ?? null,
    equipo_id: o.equipoId ?? null,
    proyecto_id: o.proyectoId ?? null,
    descripcion_equipo: o.descripcionEquipo,
    fecha_orden: formatDate(o.fechaOrden)!,
    fecha_inicio_estimada: formatDate(o.fechaInicioEstimada),
    fecha_fin_estimada: formatDate(o.fechaFinEstimada),
    tarifa_acordada: Number(o.tarifaAcordada),
    tipo_tarifa: o.tipoTarifa,
    moneda: o.moneda,
    tipo_cambio: o.tipoCambio ? Number(o.tipoCambio) : null,
    horas_incluidas: o.horasIncluidas ? Number(o.horasIncluidas) : null,
    penalidad_exceso: o.penalidadExceso ? Number(o.penalidadExceso) : null,
    condiciones_especiales: o.condicionesEspeciales ?? null,
    observaciones: o.observaciones ?? null,
    estado: o.estado,
    enviado_a: o.enviadoA ?? null,
    fecha_envio: o.fechaEnvio ? o.fechaEnvio.toISOString() : null,
    confirmado_por: o.confirmadoPor ?? null,
    fecha_confirmacion: o.fechaConfirmacion ? o.fechaConfirmacion.toISOString() : null,
    motivo_cancelacion: o.motivoCancelacion ?? null,
    creado_por: o.creadoPor ?? null,
    is_active: o.isActive,
    created_at: o.createdAt.toISOString(),
    updated_at: o.updatedAt.toISOString(),
  };
}

async function generarCodigo(): Promise<string> {
  const repo = AppDataSource.getRepository(OrdenAlquiler);
  const count = await repo.count();
  const num = String(count + 1).padStart(4, '0');
  return `OAL-${num}`;
}

export class OrdenAlquilerService {
  private get repo() {
    return AppDataSource.getRepository(OrdenAlquiler);
  }

  async listar(filtros: {
    estado?: EstadoOrden;
    proveedor_id?: number;
    proyecto_id?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: OrdenAlquilerDto[]; total: number }> {
    const { estado, proveedor_id, proyecto_id, page = 1, limit = 20 } = filtros;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE o.is_active = true';
    const params: any[] = [];

    if (estado) {
      params.push(estado);
      whereClause += ` AND o.estado = $${params.length}`;
    }
    if (proveedor_id) {
      params.push(proveedor_id);
      whereClause += ` AND o.proveedor_id = $${params.length}`;
    }
    if (proyecto_id) {
      params.push(proyecto_id);
      whereClause += ` AND o.proyecto_id = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*) as total FROM equipo.orden_alquiler o ${whereClause}`;
    const dataSql = `
      SELECT 
        o.id, o.codigo, o.solicitud_equipo_id as "solicitudEquipoId", 
        o.proveedor_id as "proveedorId", o.equipo_id as "equipoId", 
        o.proyecto_id as "proyectoId", o.descripcion_equipo as "descripcionEquipo", 
        o.fecha_orden as "fechaOrden", o.fecha_inicio_estimada as "fechaInicioEstimada", 
        o.fecha_fin_estimada as "fechaFinEstimada", o.tarifa_acordada as "tarifaAcordada", 
        o.tipo_tarifa as "tipoTarifa", o.moneda, o.tipo_cambio as "tipoCambio", 
        o.horas_incluidas as "horasIncluidas", o.penalidad_exceso as "penalidadExceso", 
        o.condiciones_especiales as "condicionesEspeciales", o.observaciones, 
        o.estado, o.enviado_a as "enviadoA", o.fecha_envio as "fechaEnvio", 
        o.confirmado_por as "confirmadoPor", o.fecha_confirmacion as "fechaConfirmacion", 
        o.motivo_cancelacion as "motivoCancelacion", o.creado_por as "creadoPor", 
        o.is_active as "isActive", o.created_at as "createdAt", o.updated_at as "updatedAt",
        p.razon_social as p_razon_social 
      FROM equipo.orden_alquiler o 
      LEFT JOIN proveedores.proveedor p ON p.id = o.proveedor_id
      ${whereClause}
      ORDER BY o.fecha_orden DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      this.repo.manager.query(countSql, params),
      this.repo.manager.query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult[0].total);
    const data = rawData.map((o: any) => toDto(o, o.p_razon_social));
    return { data, total };
  }

  async obtenerPorId(id: number): Promise<OrdenAlquilerDto> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    return toDto(o);
  }

  async crear(dto: CrearOrdenDto, usuarioId: number): Promise<OrdenAlquilerDto> {
    if (!dto.proveedor_id) {
      throw new ValidationError('El proveedor es requerido');
    }
    if (!dto.descripcion_equipo?.trim()) {
      throw new ValidationError('La descripción del equipo es requerida');
    }
    if (!dto.fecha_orden) {
      throw new ValidationError('La fecha de orden es obligatoria');
    }
    if (!dto.tarifa_acordada || dto.tarifa_acordada <= 0) {
      throw new ValidationError('La tarifa acordada debe ser mayor a cero');
    }

    const codigo = await generarCodigo();
    const o = this.repo.create({
      codigo,
      solicitudEquipoId: dto.solicitud_equipo_id,
      proveedorId: dto.proveedor_id,
      equipoId: dto.equipo_id,
      proyectoId: dto.proyecto_id,
      descripcionEquipo: dto.descripcion_equipo.trim(),
      fechaOrden: new Date(dto.fecha_orden),
      fechaInicioEstimada: dto.fecha_inicio_estimada
        ? new Date(dto.fecha_inicio_estimada)
        : undefined,
      fechaFinEstimada: dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined,
      tarifaAcordada: dto.tarifa_acordada,
      tipoTarifa: dto.tipo_tarifa ?? 'HORA',
      moneda: dto.moneda ?? 'PEN',
      tipoCambio: dto.tipo_cambio,
      horasIncluidas: dto.horas_incluidas,
      penalidadExceso: dto.penalidad_exceso,
      condicionesEspeciales: dto.condiciones_especiales,
      observaciones: dto.observaciones,
      estado: 'BORRADOR',
      creadoPor: usuarioId,
    });

    const saved = await this.repo.save(o);
    logger.info(`Orden de alquiler creada: ${codigo} por usuario ${usuarioId}`);
    return toDto(saved);
  }

  async actualizar(id: number, dto: ActualizarOrdenDto): Promise<OrdenAlquilerDto> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    if (!['BORRADOR', 'ENVIADO'].includes(o.estado)) {
      throw new ConflictError('Solo se pueden editar órdenes en estado BORRADOR o ENVIADO');
    }

    if (dto.equipo_id !== undefined) o.equipoId = dto.equipo_id;
    if (dto.proyecto_id !== undefined) o.proyectoId = dto.proyecto_id;
    if (dto.descripcion_equipo !== undefined) o.descripcionEquipo = dto.descripcion_equipo.trim();
    if (dto.fecha_orden !== undefined) o.fechaOrden = new Date(dto.fecha_orden);
    if (dto.fecha_inicio_estimada !== undefined)
      o.fechaInicioEstimada = dto.fecha_inicio_estimada
        ? new Date(dto.fecha_inicio_estimada)
        : undefined;
    if (dto.fecha_fin_estimada !== undefined)
      o.fechaFinEstimada = dto.fecha_fin_estimada ? new Date(dto.fecha_fin_estimada) : undefined;
    if (dto.tarifa_acordada !== undefined) o.tarifaAcordada = dto.tarifa_acordada;
    if (dto.tipo_tarifa !== undefined) o.tipoTarifa = dto.tipo_tarifa;
    if (dto.moneda !== undefined) o.moneda = dto.moneda;
    if (dto.tipo_cambio !== undefined) o.tipoCambio = dto.tipo_cambio;
    if (dto.horas_incluidas !== undefined) o.horasIncluidas = dto.horas_incluidas;
    if (dto.penalidad_exceso !== undefined) o.penalidadExceso = dto.penalidad_exceso;
    if (dto.condiciones_especiales !== undefined)
      o.condicionesEspeciales = dto.condiciones_especiales;
    if (dto.observaciones !== undefined) o.observaciones = dto.observaciones;

    const saved = await this.repo.save(o);
    return toDto(saved);
  }

  async enviar(id: number, enviadoA?: string): Promise<OrdenAlquilerDto> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    if (o.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden enviar órdenes en estado BORRADOR');
    }
    o.estado = 'ENVIADO';
    o.fechaEnvio = new Date();
    if (enviadoA) o.enviadoA = enviadoA;
    const saved = await this.repo.save(o);
    logger.info(`Orden de alquiler ${o.codigo} enviada al proveedor`);
    return toDto(saved);
  }

  async confirmar(id: number, confirmadoPor?: string): Promise<OrdenAlquilerDto> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    if (o.estado !== 'ENVIADO') {
      throw new ConflictError('Solo se pueden confirmar órdenes en estado ENVIADO');
    }
    o.estado = 'CONFIRMADO';
    o.fechaConfirmacion = new Date();
    if (confirmadoPor) o.confirmadoPor = confirmadoPor;
    const saved = await this.repo.save(o);
    logger.info(`Orden de alquiler ${o.codigo} confirmada`);
    return toDto(saved);
  }

  async cancelar(id: number, motivoCancelacion?: string): Promise<OrdenAlquilerDto> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    if (!['BORRADOR', 'ENVIADO'].includes(o.estado)) {
      throw new ConflictError(
        `No se puede cancelar una orden en estado ${o.estado}. Solo se pueden cancelar órdenes en BORRADOR o ENVIADO.`
      );
    }
    o.estado = 'CANCELADO';
    o.motivoCancelacion = motivoCancelacion ?? null;
    const saved = await this.repo.save(o);
    logger.info(`Orden de alquiler ${o.codigo} cancelada`);
    return toDto(saved);
  }

  async eliminar(id: number): Promise<void> {
    const o = await this.repo.findOne({ where: { id, isActive: true } });
    if (!o) throw new NotFoundError(`Orden de alquiler #${id} no encontrada`);
    if (o.estado !== 'BORRADOR') {
      throw new ConflictError('Solo se pueden eliminar órdenes en estado BORRADOR');
    }
    o.isActive = false;
    await this.repo.save(o);
  }
}
