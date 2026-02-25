/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { DailyReport } from './daily-report-typeorm.model';
import { DailyReportRawRow } from '../types/daily-report-raw.interface';
import { Repository } from 'typeorm';

/**
 * Daily Report Model - Migrated to TypeORM from raw SQL
 * Uses Spanish column names matching database schema
 * Returns raw entities - transformation to DTO happens in controller/service
 *
 * @deprecated This class is provided for backward compatibility.
 * New code should use DailyReport entity with TypeORM Repository directly.
 *
 * Migration completed: backend/src/models/daily-report.model.ts
 * - Replaced 15 raw SQL queries with TypeORM repository methods
 * - Uses QueryBuilder for complex queries with LEFT JOINs
 * - Maintains backward compatibility with legacy DailyReportRawRow interface
 */

/**
 * Helper function to convert Date or string to YYYY-MM-DD format
 * Handles both Date objects and ISO string inputs from TypeORM
 */
function toDateString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
}

/**
 * Helper function to convert Date or string to ISO string format
 * Handles both Date objects and ISO string inputs from TypeORM
 */
function toISOString(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
}

export class DailyReportModel {
  private static getRepository(): Repository<DailyReport> {
    return AppDataSource.getRepository(DailyReport);
  }

  /**
   * Find all daily reports with optional filters and LEFT JOIN relations
   * Migrated from raw SQL to TypeORM QueryBuilder
   */
  static async findAll(
    tenantId: number,
    filters?: {
      estado?: string;
      fecha?: string;
      fechaInicio?: string;
      fechaFin?: string;
      trabajadorId?: string;
      equipoId?: string;
      proyectoId?: string;
    }
  ): Promise<DailyReportRawRow[]> {
    const repository = this.getRepository();
    const queryBuilder = repository
      .createQueryBuilder('dr')
      .leftJoinAndSelect('dr.trabajador', 'o')
      .leftJoinAndSelect('dr.equipo', 'e')
      .leftJoinAndSelect('dr.proyecto', 'p')
      .where('dr.tenantId = :tenantId', { tenantId })
      .select([
        'dr',
        // Computed fields for backward compatibility
        "o.nombres || ' ' || o.apellidoPaterno || ' ' || COALESCE(o.apellidoMaterno, '') as trabajador_nombre",
        'e.codigo_equipo as equipo_codigo',
        "e.marca || ' ' || e.modelo as equipo_nombre",
        'p.nombre as proyecto_nombre',
      ]);

    // Apply filters
    if (filters?.estado) {
      queryBuilder.andWhere('dr.estado = :estado', { estado: filters.estado });
    }

    if (filters?.fecha) {
      queryBuilder.andWhere('dr.fecha = :fecha', { fecha: filters.fecha });
    }

    if (filters?.fecha_inicio) {
      queryBuilder.andWhere('dr.fecha >= :fechaInicio', { fechaInicio: filters.fecha_inicio });
    }

    if (filters?.fecha_fin) {
      queryBuilder.andWhere('dr.fecha <= :fechaFin', { fechaFin: filters.fecha_fin });
    }

    if (filters?.trabajador_id) {
      queryBuilder.andWhere('dr.trabajadorId = :trabajadorId', {
        trabajadorId: parseInt(filters.trabajador_id),
      });
    }

    if (filters?.equipo_id) {
      queryBuilder.andWhere('dr.equipoId = :equipoId', { equipoId: parseInt(filters.equipo_id) });
    }

    if (filters?.proyecto_id) {
      queryBuilder.andWhere('dr.proyectoId = :proyectoId', {
        proyectoId: parseInt(filters.proyecto_id),
      });
    }

    // Order by date desc, created_at desc
    queryBuilder.orderBy('dr.fecha', 'DESC').addOrderBy('dr.createdAt', 'DESC');

    const results = await queryBuilder.getRawAndEntities();

    // Map to legacy DailyReportRawRow format
    return results.entities.map((entity, index) => this.mapToRawRow(entity, results.raw[index]));
  }

  /**
   * Find daily report by ID with relations
   * Migrated from raw SQL JOIN to TypeORM QueryBuilder
   */
  static async findById(tenantId: number, id: string): Promise<DailyReportRawRow | null> {
    const repository = this.getRepository();
    const result = await repository
      .createQueryBuilder('dr')
      .leftJoinAndSelect('dr.trabajador', 'o')
      .leftJoinAndSelect('dr.equipo', 'e')
      .leftJoinAndSelect('dr.proyecto', 'p')
      .where('dr.id = :id', { id: parseInt(id) })
      .andWhere('dr.tenantId = :tenantId', { tenantId })
      .getRawAndEntities();

    if (result.entities.length === 0) return null;

    return this.mapToRawRow(result.entities[0], result.raw[0]);
  }

  /**
   * Find daily reports by operator/worker ID
   * Migrated from raw SQL JOIN to TypeORM QueryBuilder
   */
  static async findByOperator(tenantId: number, operatorId: string): Promise<DailyReportRawRow[]> {
    const repository = this.getRepository();
    const result = await repository
      .createQueryBuilder('dr')
      .leftJoinAndSelect('dr.trabajador', 'o')
      .leftJoinAndSelect('dr.equipo', 'e')
      .leftJoinAndSelect('dr.proyecto', 'p')
      .where('dr.trabajadorId = :trabajadorId', { trabajadorId: parseInt(operatorId) })
      .andWhere('dr.tenantId = :tenantId', { tenantId })
      .orderBy('dr.fecha', 'DESC')
      .getRawAndEntities();

    return result.entities.map((entity, index) => this.mapToRawRow(entity, result.raw[index]));
  }

  /**
   * Create new daily report
   * Migrated from raw INSERT to TypeORM save
   */
  static async create(tenantId: number, data: any): Promise<DailyReportRawRow> {
    const repository = this.getRepository();

    // Calculate hours worked if hourmeter data is provided
    const horasTrabajadas =
      data.horometro_inicial !== undefined && data.horometro_final !== undefined
        ? data.horometro_final - data.horometro_inicial
        : null;

    const dailyReport = repository.create({
      fecha: data.fecha,
      trabajadorId: data.trabajador_id || null,
      equipoId: data.equipo_id || null,
      proyectoId: data.proyecto_id || null,
      horaInicio: data.hora_inicio,
      horaFin: data.hora_fin,
      horometroInicial: data.horometro_inicial,
      horometroFinal: data.horometro_final,
      odometroInicial: data.odometro_inicial || null,
      odometroFinal: data.odometro_final || null,
      combustibleInicial: data.combustible_inicial || null,
      combustibleConsumido: data.combustible_consumido || null,
      horasTrabajadas,
      observaciones: data.observaciones,
      observacionesCorrecciones: data.observaciones_correcciones || null,
      estado: data.estado || 'BORRADOR',
      lugarSalida: data.lugar_salida,
      tenantId,
    });

    const saved = await repository.save(dailyReport);
    return this.mapToRawRow(saved);
  }

  /**
   * Update daily report
   * Migrated from dynamic SQL UPDATE to TypeORM save
   */
  static async update(tenantId: number, id: string, data: any): Promise<DailyReportRawRow | null> {
    const repository = this.getRepository();
    const dailyReport = await repository.findOne({ where: { id: parseInt(id), tenantId } });

    if (!dailyReport) return null;

    // Update only provided fields
    if (data.fecha !== undefined) dailyReport.fecha = data.fecha;
    if (data.trabajador_id !== undefined) dailyReport.trabajadorId = data.trabajador_id || null;
    if (data.equipo_id !== undefined) dailyReport.equipoId = data.equipo_id || null;
    if (data.proyecto_id !== undefined) dailyReport.proyectoId = data.proyecto_id || null;
    if (data.hora_inicio !== undefined) dailyReport.horaInicio = data.hora_inicio;
    if (data.hora_fin !== undefined) dailyReport.horaFin = data.hora_fin;
    if (data.horometro_inicial !== undefined) dailyReport.horometroInicial = data.horometro_inicial;
    if (data.horometro_final !== undefined) dailyReport.horometroFinal = data.horometro_final;
    if (data.odometro_inicial !== undefined)
      dailyReport.odometroInicial = data.odometro_inicial === '' ? null : data.odometro_inicial;
    if (data.odometro_final !== undefined)
      dailyReport.odometroFinal = data.odometro_final === '' ? null : data.odometro_final;
    if (data.combustible_inicial !== undefined)
      dailyReport.combustibleInicial =
        data.combustible_inicial === '' ? null : data.combustible_inicial;
    if (data.combustible_consumido !== undefined)
      dailyReport.combustibleConsumido =
        data.combustible_consumido === '' ? null : data.combustible_consumido;
    if (data.lugar_salida !== undefined) dailyReport.lugarSalida = data.lugar_salida;
    if (data.observaciones !== undefined) dailyReport.observaciones = data.observaciones;
    if (data.observaciones_correcciones !== undefined)
      dailyReport.observacionesCorrecciones = data.observaciones_correcciones;
    if (data.estado !== undefined) dailyReport.estado = data.estado;

    // Recalculate hours worked if hourmeter data changed
    if (data.horometro_inicial !== undefined || data.horometro_final !== undefined) {
      const hourStart =
        data.horometro_inicial !== undefined
          ? data.horometro_inicial
          : dailyReport.horometroInicial;
      const hourEnd =
        data.horometro_final !== undefined ? data.horometro_final : dailyReport.horometroFinal;
      if (hourStart !== null && hourEnd !== null) {
        dailyReport.horasTrabajadas = hourEnd - hourStart;
      }
    }

    await repository.save(dailyReport);
    return this.findById(tenantId, id);
  }

  /**
   * Approve daily report
   * Migrated from raw UPDATE to TypeORM save
   */
  static async approve(
    tenantId: number,
    id: string,
    approvedBy: string
  ): Promise<DailyReportRawRow | null> {
    const repository = this.getRepository();
    const dailyReport = await repository.findOne({ where: { id: parseInt(id), tenantId } });

    if (!dailyReport) return null;

    dailyReport.estado = 'APROBADO';
    dailyReport.aprobadoPor = parseInt(approvedBy);
    dailyReport.aprobadoEn = new Date();

    await repository.save(dailyReport);
    return this.findById(tenantId, id);
  }

  /**
   * Reject daily report with reason
   * Migrated from raw UPDATE to TypeORM save
   */
  static async reject(
    tenantId: number,
    id: string,
    reason: string
  ): Promise<DailyReportRawRow | null> {
    const repository = this.getRepository();
    const dailyReport = await repository.findOne({ where: { id: parseInt(id), tenantId } });

    if (!dailyReport) return null;

    dailyReport.estado = 'RECHAZADO';
    dailyReport.observacionesCorrecciones = reason;

    await repository.save(dailyReport);
    return this.findById(tenantId, id);
  }

  /**
   * Record resident signature on daily report
   * Sets firma_residente field with the provided signature value (name or base64)
   */
  static async firmarResidente(
    tenantId: number,
    id: string,
    firmaResidente: string
  ): Promise<DailyReportRawRow | null> {
    const repository = this.getRepository();
    const dailyReport = await repository.findOne({ where: { id: parseInt(id), tenantId } });

    if (!dailyReport) return null;

    dailyReport.firmaResidente = firmaResidente;

    await repository.save(dailyReport);
    return this.findById(tenantId, id);
  }

  /**
   * Hard delete daily report
   * Migrated from raw DELETE to TypeORM remove
   */
  static async delete(tenantId: number, id: string): Promise<boolean> {
    const repository = this.getRepository();
    const result = await repository.delete({ id: parseInt(id), tenantId });
    return result.affected !== null && result.affected > 0;
  }

  /**
   * Helper method to map DailyReport entity to legacy DailyReportRawRow interface
   * Includes computed fields from joins for backward compatibility
   */
  private static mapToRawRow(entity: DailyReport, rawData?: any): DailyReportRawRow {
    return {
      id: entity.id,
      equipo_id: entity.equipoId,
      trabajador_id: entity.trabajadorId || null,
      proyecto_id: entity.proyectoId || null,
      valorizacion_id: entity.valorizacionId || null,
      fecha: toDateString(entity.fecha)!, // Convert Date to 'YYYY-MM-DD' string
      hora_inicio: entity.horaInicio || null,
      hora_fin: entity.horaFin || null,
      horas_trabajadas: entity.horasTrabajadas || null,
      horometro_inicial: entity.horometroInicial || null,
      horometro_final: entity.horometroFinal || null,
      odometro_inicial: entity.odometroInicial || null,
      odometro_final: entity.odometroFinal || null,
      km_recorridos: entity.kmRecorridos || null,
      combustible_inicial: entity.combustibleInicial || null,
      combustible_final: null, // Not in current schema
      combustible_consumido: entity.combustibleConsumido || null,
      observaciones: entity.observaciones || null,
      estado: entity.estado,
      lugar_salida: entity.lugarSalida || null,
      lugar_llegada: entity.lugarLlegada || null,
      creado_por: entity.creadoPor || null,
      aprobado_por: entity.aprobadoPor || null,
      aprobado_en: toISOString(entity.aprobadoEn),
      created_at: toISOString(entity.createdAt)!,
      updated_at: toISOString(entity.updatedAt)!,
      codigo: entity.codigo || null,
      empresa: entity.empresa || null,
      placa: entity.placa || null,
      responsable_frente: entity.responsableFrente || null,
      turno: entity.turno || null,
      numero_parte: entity.numeroParte || null,
      petroleo_gln: entity.petroleoGln || null,
      gasolina_gln: entity.gasolinaGln || null,
      hora_abastecimiento: entity.horaAbastecimiento || null,
      num_vale_combustible: entity.numValeCombustible || null,
      horometro_kilometraje: entity.horometroKilometraje || null,
      observaciones_correcciones: entity.observacionesCorrecciones || null,
      firma_operador: entity.firmaOperador || null,
      firma_supervisor: entity.firmaSupervisor || null,
      firma_jefe_equipos: entity.firmaJefeEquipos || null,
      firma_residente: entity.firmaResidente || null,
      firma_planeamiento_control: entity.firmaPlaneamientoControl || null,
      // Computed fields from joins (if available from rawData)
      trabajador_nombre: rawData?.trabajador_nombre || entity.trabajador?.nombreCompleto,
      equipo_codigo: rawData?.equipo_codigo || entity.equipo?.codigoEquipo,
      equipo_nombre:
        rawData?.equipo_nombre ||
        (entity.equipo ? `${entity.equipo.marca} ${entity.equipo.modelo}` : undefined),
      proyecto_nombre: rawData?.proyecto_nombre || entity.proyecto?.nombre,
    };
  }
}
