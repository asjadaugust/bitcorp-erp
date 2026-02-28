/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { CotizacionProveedor, EstadoCotizacion } from '../models/cotizacion-proveedor.model';
import { SolicitudEquipo } from '../models/solicitud-equipo.model';
import { OrdenAlquiler } from '../models/orden-alquiler.model';
import { NotFoundError, ConflictError, ValidationError, BusinessRuleError } from '../errors';
import logger from '../utils/logger';

// ─── DTOs ────────────────────────────────────────────────────

export interface CrearCotizacionDto {
  solicitud_equipo_id: number;
  proveedor_id: number;
  descripcion_equipo?: string;
  tarifa_propuesta: number;
  tipo_tarifa?: 'HORA' | 'DIA' | 'MES';
  moneda?: 'PEN' | 'USD';
  horas_incluidas?: number;
  penalidad_exceso?: number;
  plazo_entrega_dias?: number;
  condiciones_pago?: string;
  condiciones_especiales?: string;
  garantia?: string;
  disponibilidad?: string;
  observaciones?: string;
}

export interface ActualizarCotizacionDto {
  descripcion_equipo?: string;
  tarifa_propuesta?: number;
  tipo_tarifa?: 'HORA' | 'DIA' | 'MES';
  moneda?: 'PEN' | 'USD';
  horas_incluidas?: number;
  penalidad_exceso?: number;
  plazo_entrega_dias?: number;
  condiciones_pago?: string;
  condiciones_especiales?: string;
  garantia?: string;
  disponibilidad?: string;
  observaciones?: string;
}

export interface CotizacionDto {
  id: number;
  codigo: string;
  solicitud_equipo_id: number;
  proveedor_id: number;
  proveedor_nombre: string | null;
  proveedor_ruc: string | null;
  descripcion_equipo: string | null;
  tarifa_propuesta: number;
  tipo_tarifa: string;
  moneda: string;
  horas_incluidas: number | null;
  penalidad_exceso: number | null;
  plazo_entrega_dias: number | null;
  condiciones_pago: string | null;
  condiciones_especiales: string | null;
  garantia: string | null;
  disponibilidad: string | null;
  observaciones: string | null;
  puntaje: number | null;
  motivo_seleccion: string | null;
  estado: string;
  evaluado_por: number | null;
  fecha_evaluacion: string | null;
  orden_alquiler_id: number | null;
  creado_por: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ComparacionDto {
  solicitud: {
    id: number;
    codigo: string;
    tipo_equipo: string;
    cantidad: number;
    fecha_requerida: string;
    prioridad: string;
    estado: string;
  };
  cotizaciones: CotizacionDto[];
  resumen: {
    total_cotizaciones: number;
    cotizaciones_evaluadas: number;
    cotizacion_seleccionada: number | null;
    tarifa_minima: number | null;
    tarifa_maxima: number | null;
    tarifa_promedio: number | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function toDto(c: any): CotizacionDto {
  return {
    id: c.id,
    codigo: c.codigo,
    solicitud_equipo_id: c.solicitudEquipoId ?? c.solicitud_equipo_id,
    proveedor_id: c.proveedorId ?? c.proveedor_id,
    proveedor_nombre: c.p_razon_social ?? c.proveedor?.razonSocial ?? null,
    proveedor_ruc: c.p_ruc ?? c.proveedor?.ruc ?? null,
    descripcion_equipo: c.descripcionEquipo ?? c.descripcion_equipo ?? null,
    tarifa_propuesta: Number(c.tarifaPropuesta ?? c.tarifa_propuesta),
    tipo_tarifa: c.tipoTarifa ?? c.tipo_tarifa,
    moneda: c.moneda,
    horas_incluidas:
      (c.horasIncluidas ?? c.horas_incluidas)
        ? Number(c.horasIncluidas ?? c.horas_incluidas)
        : null,
    penalidad_exceso:
      (c.penalidadExceso ?? c.penalidad_exceso)
        ? Number(c.penalidadExceso ?? c.penalidad_exceso)
        : null,
    plazo_entrega_dias: c.plazoEntregaDias ?? c.plazo_entrega_dias ?? null,
    condiciones_pago: c.condicionesPago ?? c.condiciones_pago ?? null,
    condiciones_especiales: c.condicionesEspeciales ?? c.condiciones_especiales ?? null,
    garantia: c.garantia ?? null,
    disponibilidad: c.disponibilidad ?? null,
    observaciones: c.observaciones ?? null,
    puntaje: c.puntaje ?? null,
    motivo_seleccion: c.motivoSeleccion ?? c.motivo_seleccion ?? null,
    estado: c.estado,
    evaluado_por: c.evaluadoPor ?? c.evaluado_por ?? null,
    fecha_evaluacion:
      (c.fechaEvaluacion ?? c.fecha_evaluacion)
        ? new Date(c.fechaEvaluacion ?? c.fecha_evaluacion).toISOString()
        : null,
    orden_alquiler_id: c.ordenAlquilerId ?? c.orden_alquiler_id ?? null,
    creado_por: c.creadoPor ?? c.creado_por ?? null,
    is_active: c.isActive ?? c.is_active,
    created_at: new Date(c.createdAt ?? c.created_at).toISOString(),
    updated_at: new Date(c.updatedAt ?? c.updated_at).toISOString(),
  };
}

async function generarCodigo(): Promise<string> {
  const repo = AppDataSource.getRepository(CotizacionProveedor);
  const count = await repo.count();
  const num = String(count + 1).padStart(4, '0');
  return `COT-${num}`;
}

// ─── Service ─────────────────────────────────────────────────

export class CotizacionService {
  private get repo() {
    return AppDataSource.getRepository(CotizacionProveedor);
  }

  private get solicitudRepo() {
    return AppDataSource.getRepository(SolicitudEquipo);
  }

  private get oalRepo() {
    return AppDataSource.getRepository(OrdenAlquiler);
  }

  /**
   * List cotizaciones with optional filters.
   */
  async listar(filtros: {
    solicitud_equipo_id?: number;
    proveedor_id?: number;
    estado?: EstadoCotizacion;
    page?: number;
    limit?: number;
  }): Promise<{ data: CotizacionDto[]; total: number }> {
    const { solicitud_equipo_id, proveedor_id, estado, page = 1, limit = 20 } = filtros;
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE c.is_active = true';
    const params: any[] = [];

    if (solicitud_equipo_id) {
      params.push(solicitud_equipo_id);
      whereClause += ` AND c.solicitud_equipo_id = $${params.length}`;
    }
    if (proveedor_id) {
      params.push(proveedor_id);
      whereClause += ` AND c.proveedor_id = $${params.length}`;
    }
    if (estado) {
      params.push(estado);
      whereClause += ` AND c.estado = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*) as total FROM equipo.cotizacion_proveedor c ${whereClause}`;
    const dataSql = `
      SELECT
        c.*,
        p.razon_social as p_razon_social,
        p.ruc as p_ruc
      FROM equipo.cotizacion_proveedor c
      LEFT JOIN proveedores.proveedor p ON p.id = c.proveedor_id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, rawData] = await Promise.all([
      this.repo.manager.query(countSql, params),
      this.repo.manager.query(dataSql, [...params, limit, offset]),
    ]);

    const total = parseInt(countResult[0].total);
    const data = rawData.map((c: any) => toDto(c));
    return { data, total };
  }

  /**
   * Get a single cotización by ID.
   */
  async obtenerPorId(id: number): Promise<CotizacionDto> {
    const raw = await this.repo.manager.query(
      `SELECT c.*, p.razon_social as p_razon_social, p.ruc as p_ruc
       FROM equipo.cotizacion_proveedor c
       LEFT JOIN proveedores.proveedor p ON p.id = c.proveedor_id
       WHERE c.id = $1 AND c.is_active = true`,
      [id]
    );
    if (!raw.length) throw new NotFoundError('Cotización', id);
    return toDto(raw[0]);
  }

  /**
   * Get the comparison matrix for a solicitud.
   * Returns all cotizaciones side-by-side with summary stats.
   */
  async obtenerComparacion(solicitudId: number): Promise<ComparacionDto> {
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: solicitudId, isActive: true },
    });
    if (!solicitud) throw new NotFoundError('Solicitud de equipo', solicitudId);

    const rawCotizaciones = await this.repo.manager.query(
      `SELECT c.*, p.razon_social as p_razon_social, p.ruc as p_ruc
       FROM equipo.cotizacion_proveedor c
       LEFT JOIN proveedores.proveedor p ON p.id = c.proveedor_id
       WHERE c.solicitud_equipo_id = $1 AND c.is_active = true
       ORDER BY c.puntaje DESC NULLS LAST, c.tarifa_propuesta ASC`,
      [solicitudId]
    );

    const cotizaciones = rawCotizaciones.map((c: any) => toDto(c));
    const tarifas = cotizaciones.map((c: CotizacionDto) => c.tarifa_propuesta);
    const seleccionada = cotizaciones.find((c: CotizacionDto) => c.estado === 'SELECCIONADA');

    return {
      solicitud: {
        id: solicitud.id,
        codigo: solicitud.codigo,
        tipo_equipo: solicitud.tipoEquipo,
        cantidad: solicitud.cantidad,
        fecha_requerida:
          solicitud.fechaRequerida instanceof Date
            ? solicitud.fechaRequerida.toISOString().split('T')[0]
            : String(solicitud.fechaRequerida),
        prioridad: solicitud.prioridad,
        estado: solicitud.estado,
      },
      cotizaciones,
      resumen: {
        total_cotizaciones: cotizaciones.length,
        cotizaciones_evaluadas: cotizaciones.filter((c: CotizacionDto) => c.puntaje !== null)
          .length,
        cotizacion_seleccionada: seleccionada?.id ?? null,
        tarifa_minima: tarifas.length ? Math.min(...tarifas) : null,
        tarifa_maxima: tarifas.length ? Math.max(...tarifas) : null,
        tarifa_promedio: tarifas.length
          ? Math.round(
              (tarifas.reduce((a: number, b: number) => a + b, 0) / tarifas.length) * 100
            ) / 100
          : null,
      },
    };
  }

  /**
   * Create a new cotización for a solicitud.
   */
  async crear(dto: CrearCotizacionDto, usuarioId: number): Promise<CotizacionDto> {
    if (!dto.solicitud_equipo_id) throw new ValidationError('La solicitud de equipo es requerida');
    if (!dto.proveedor_id) throw new ValidationError('El proveedor es requerido');
    if (!dto.tarifa_propuesta || dto.tarifa_propuesta <= 0)
      throw new ValidationError('La tarifa propuesta debe ser mayor a cero');

    // Verify solicitud exists and is APROBADO
    const solicitud = await this.solicitudRepo.findOne({
      where: { id: dto.solicitud_equipo_id, isActive: true },
    });
    if (!solicitud) throw new NotFoundError('Solicitud de equipo', dto.solicitud_equipo_id);
    if (solicitud.estado !== 'APROBADO') {
      throw new BusinessRuleError(
        'Solo se pueden agregar cotizaciones a solicitudes en estado APROBADO.',
        'COTIZACION_SOLICITUD_NO_APROBADA'
      );
    }

    // Check for duplicate (same solicitud + proveedor)
    const existing = await this.repo.findOne({
      where: {
        solicitudEquipoId: dto.solicitud_equipo_id,
        proveedorId: dto.proveedor_id,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictError(
        `Ya existe una cotización del proveedor #${dto.proveedor_id} para la solicitud ${solicitud.codigo}.`
      );
    }

    // Check if a cotización was already selected for this solicitud
    const seleccionada = await this.repo.findOne({
      where: {
        solicitudEquipoId: dto.solicitud_equipo_id,
        estado: 'SELECCIONADA' as EstadoCotizacion,
        isActive: true,
      },
    });
    if (seleccionada) {
      throw new BusinessRuleError(
        'Ya existe una cotización seleccionada para esta solicitud. No se pueden agregar más.',
        'COTIZACION_YA_SELECCIONADA'
      );
    }

    const codigo = await generarCodigo();
    const entity = this.repo.create({
      codigo,
      solicitudEquipoId: dto.solicitud_equipo_id,
      proveedorId: dto.proveedor_id,
      descripcionEquipo: dto.descripcion_equipo?.trim(),
      tarifaPropuesta: dto.tarifa_propuesta,
      tipoTarifa: dto.tipo_tarifa ?? 'HORA',
      moneda: dto.moneda ?? 'PEN',
      horasIncluidas: dto.horas_incluidas,
      penalidadExceso: dto.penalidad_exceso,
      plazoEntregaDias: dto.plazo_entrega_dias,
      condicionesPago: dto.condiciones_pago,
      condicionesEspeciales: dto.condiciones_especiales,
      garantia: dto.garantia,
      disponibilidad: dto.disponibilidad,
      observaciones: dto.observaciones,
      estado: 'REGISTRADA',
      creadoPor: usuarioId,
    });

    const saved = await this.repo.save(entity);
    logger.info(`Cotización creada: ${codigo} para solicitud ${solicitud.codigo}`);
    return this.obtenerPorId(saved.id);
  }

  /**
   * Update a cotización (only REGISTRADA state).
   */
  async actualizar(id: number, dto: ActualizarCotizacionDto): Promise<CotizacionDto> {
    const c = await this.repo.findOne({ where: { id, isActive: true } });
    if (!c) throw new NotFoundError('Cotización', id);
    if (c.estado !== 'REGISTRADA') {
      throw new ConflictError('Solo se pueden editar cotizaciones en estado REGISTRADA.');
    }

    if (dto.descripcion_equipo !== undefined) c.descripcionEquipo = dto.descripcion_equipo?.trim();
    if (dto.tarifa_propuesta !== undefined) {
      if (dto.tarifa_propuesta <= 0) throw new ValidationError('La tarifa debe ser mayor a cero');
      c.tarifaPropuesta = dto.tarifa_propuesta;
    }
    if (dto.tipo_tarifa !== undefined) c.tipoTarifa = dto.tipo_tarifa;
    if (dto.moneda !== undefined) c.moneda = dto.moneda;
    if (dto.horas_incluidas !== undefined) c.horasIncluidas = dto.horas_incluidas;
    if (dto.penalidad_exceso !== undefined) c.penalidadExceso = dto.penalidad_exceso;
    if (dto.plazo_entrega_dias !== undefined) c.plazoEntregaDias = dto.plazo_entrega_dias;
    if (dto.condiciones_pago !== undefined) c.condicionesPago = dto.condiciones_pago;
    if (dto.condiciones_especiales !== undefined)
      c.condicionesEspeciales = dto.condiciones_especiales;
    if (dto.garantia !== undefined) c.garantia = dto.garantia;
    if (dto.disponibilidad !== undefined) c.disponibilidad = dto.disponibilidad;
    if (dto.observaciones !== undefined) c.observaciones = dto.observaciones;

    await this.repo.save(c);
    return this.obtenerPorId(id);
  }

  /**
   * Evaluate (score) a cotización.
   */
  async evaluar(
    id: number,
    puntaje: number,
    observaciones: string | undefined,
    usuarioId: number
  ): Promise<CotizacionDto> {
    const c = await this.repo.findOne({ where: { id, isActive: true } });
    if (!c) throw new NotFoundError('Cotización', id);
    if (!['REGISTRADA', 'EVALUADA'].includes(c.estado)) {
      throw new ConflictError(
        'Solo se pueden evaluar cotizaciones en estado REGISTRADA o EVALUADA.'
      );
    }
    if (puntaje < 0 || puntaje > 100) {
      throw new ValidationError('El puntaje debe estar entre 0 y 100.');
    }

    c.puntaje = puntaje;
    c.estado = 'EVALUADA';
    c.evaluadoPor = usuarioId;
    c.fechaEvaluacion = new Date();
    if (observaciones !== undefined) c.observaciones = observaciones;

    await this.repo.save(c);
    logger.info(`Cotización ${c.codigo} evaluada con puntaje ${puntaje}`);
    return this.obtenerPorId(id);
  }

  /**
   * Select a cotización as the winner and auto-create an OAL.
   * PRD: minimum 2 cotizaciones required (unless sole provider documented).
   */
  async seleccionar(
    id: number,
    motivoSeleccion: string | undefined,
    usuarioId: number,
    proveedorUnico: boolean = false
  ): Promise<{ cotizacion: CotizacionDto; orden_alquiler_id: number }> {
    const c = await this.repo.findOne({ where: { id, isActive: true } });
    if (!c) throw new NotFoundError('Cotización', id);
    if (!['REGISTRADA', 'EVALUADA'].includes(c.estado)) {
      throw new ConflictError(
        'Solo se pueden seleccionar cotizaciones en estado REGISTRADA o EVALUADA.'
      );
    }

    // Check: already selected for this solicitud?
    const existingSelection = await this.repo.findOne({
      where: {
        solicitudEquipoId: c.solicitudEquipoId,
        estado: 'SELECCIONADA' as EstadoCotizacion,
        isActive: true,
      },
    });
    if (existingSelection) {
      throw new BusinessRuleError(
        `Ya existe una cotización seleccionada (${existingSelection.codigo}) para esta solicitud.`,
        'COTIZACION_YA_SELECCIONADA'
      );
    }

    // PRD rule: minimum 2 cotizaciones unless proveedor único
    if (!proveedorUnico) {
      const totalCotizaciones = await this.repo.count({
        where: { solicitudEquipoId: c.solicitudEquipoId, isActive: true },
      });
      if (totalCotizaciones < 2) {
        throw new BusinessRuleError(
          'Se requieren al menos 2 cotizaciones para seleccionar una. Marque "proveedor único" si solo existe 1 proveedor.',
          'COTIZACION_MINIMO_DOS'
        );
      }
    }

    // Mark as SELECCIONADA
    c.estado = 'SELECCIONADA';
    c.motivoSeleccion = motivoSeleccion ?? null;
    c.evaluadoPor = usuarioId;
    c.fechaEvaluacion = new Date();
    await this.repo.save(c);

    // Reject all other cotizaciones for this solicitud
    await this.repo.manager.query(
      `UPDATE equipo.cotizacion_proveedor
       SET estado = 'RECHAZADA', updated_at = NOW()
       WHERE solicitud_equipo_id = $1 AND id != $2 AND is_active = true AND estado != 'RECHAZADA'`,
      [c.solicitudEquipoId, c.id]
    );

    // Auto-create OAL from selected cotización
    const solicitud = await this.solicitudRepo.findOne({ where: { id: c.solicitudEquipoId } });
    const oalCount = await this.oalRepo.count();
    const oalCodigo = `OAL-${String(oalCount + 1).padStart(4, '0')}`;

    const oal = this.oalRepo.create({
      codigo: oalCodigo,
      solicitudEquipoId: c.solicitudEquipoId,
      proveedorId: c.proveedorId,
      descripcionEquipo: c.descripcionEquipo ?? solicitud?.tipoEquipo ?? '',
      fechaOrden: new Date(),
      tarifaAcordada: c.tarifaPropuesta,
      tipoTarifa: c.tipoTarifa,
      moneda: c.moneda,
      horasIncluidas: c.horasIncluidas,
      penalidadExceso: c.penalidadExceso,
      condicionesEspeciales: c.condicionesEspeciales,
      observaciones: `Generada desde cotización ${c.codigo}. ${motivoSeleccion ?? ''}`.trim(),
      estado: 'BORRADOR',
      creadoPor: usuarioId,
    });
    const savedOal = await this.oalRepo.save(oal);

    // Link OAL to cotización
    c.ordenAlquilerId = savedOal.id;
    await this.repo.save(c);

    logger.info(
      `Cotización ${c.codigo} seleccionada → OAL ${oalCodigo} creada para solicitud ${solicitud?.codigo}`
    );

    return {
      cotizacion: await this.obtenerPorId(id),
      orden_alquiler_id: savedOal.id,
    };
  }

  /**
   * Reject a cotización.
   */
  async rechazar(id: number, motivo: string | undefined): Promise<CotizacionDto> {
    const c = await this.repo.findOne({ where: { id, isActive: true } });
    if (!c) throw new NotFoundError('Cotización', id);
    if (c.estado === 'SELECCIONADA') {
      throw new ConflictError('No se puede rechazar una cotización ya seleccionada.');
    }
    if (c.estado === 'RECHAZADA') {
      throw new ConflictError('La cotización ya fue rechazada.');
    }

    c.estado = 'RECHAZADA';
    if (motivo) c.observaciones = motivo;
    await this.repo.save(c);
    logger.info(`Cotización ${c.codigo} rechazada`);
    return this.obtenerPorId(id);
  }

  /**
   * Soft-delete a cotización (only REGISTRADA state).
   */
  async eliminar(id: number): Promise<void> {
    const c = await this.repo.findOne({ where: { id, isActive: true } });
    if (!c) throw new NotFoundError('Cotización', id);
    if (c.estado !== 'REGISTRADA') {
      throw new ConflictError('Solo se pueden eliminar cotizaciones en estado REGISTRADA.');
    }
    c.isActive = false;
    await this.repo.save(c);
  }
}
