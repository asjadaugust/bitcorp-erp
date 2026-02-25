/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { AppDataSource } from '../config/database.config';
import { Trabajador } from '../models/trabajador.model';
import { Repository, ILike } from 'typeorm';
import {
  toOperatorDto,
  fromOperatorDto,
  OperatorDto,
  OperatorCreateDto,
  OperatorUpdateDto,
  OperatorFiltersDto,
  CertificacionDto,
  CertificacionCreateDto,
  toCertificacionDto,
  HabilidadDto,
  HabilidadCreateDto,
  toHabilidadDto,
  DisponibilidadDto,
  RendimientoDto,
  DisponibilidadProgramadaDto,
  toDisponibilidadProgramadaDto,
} from '../types/dto/operator.dto';
import { CertificacionOperador } from '../models/operador-certificacion.model';
import { HabilidadOperador } from '../models/operador-habilidad.model';
import { DisponibilidadOperador } from '../models/disponibilidad-operador.model';
import { ParteDiario } from '../models/daily-report-typeorm.model';
import Logger from '../utils/logger';
import { NotFoundError, ConflictError } from '../errors/http.errors';
import { DashboardService } from './dashboard.service';

export class OperatorService {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  private get repository(): Repository<Trabajador> {
    if (!AppDataSource.isInitialized) {
      throw new Error('Database not initialized');
    }
    return AppDataSource.getRepository(Trabajador);
  }

  private get certRepository(): Repository<CertificacionOperador> {
    if (!AppDataSource.isInitialized) throw new Error('Database not initialized');
    return AppDataSource.getRepository(CertificacionOperador);
  }

  private get habRepository(): Repository<HabilidadOperador> {
    if (!AppDataSource.isInitialized) throw new Error('Database not initialized');
    return AppDataSource.getRepository(HabilidadOperador);
  }

  private get dispRepository(): Repository<DisponibilidadOperador> {
    if (!AppDataSource.isInitialized) throw new Error('Database not initialized');
    return AppDataSource.getRepository(DisponibilidadOperador);
  }

  private get parteDiarioRepository(): Repository<ParteDiario> {
    if (!AppDataSource.isInitialized) throw new Error('Database not initialized');
    return AppDataSource.getRepository(ParteDiario);
  }

  async findAll(
    tenantId: number,
    filters?: OperatorFiltersDto,
    page = 1,
    limit = 10
  ): Promise<{
    data: OperatorDto[];
    total: number;
  }> {
    try {
      Logger.info('Fetching operators', {
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorService.findAll',
      });

      const skip = (page - 1) * limit;

      const queryBuilder = this.repository
        .createQueryBuilder('t')
        .where('t.tenantId = :tenantId', { tenantId })
        .andWhere('t.isActive = :isActive', { isActive: filters?.is_active ?? true });

      // Filter by cargo
      if (filters?.cargo) {
        queryBuilder.andWhere('t.cargo = :cargo', { cargo: filters.cargo });
      }

      // Filter by especialidad
      if (filters?.especialidad) {
        queryBuilder.andWhere('t.especialidad = :especialidad', {
          especialidad: filters.especialidad,
        });
      }

      // Filter by unidad operativa
      if (filters?.unidad_operativa_id) {
        queryBuilder.andWhere('t.operating_unit_id = :unitId', {
          unitId: filters.unidad_operativa_id,
        });
      }

      // Search across multiple fields
      if (filters?.search) {
        queryBuilder.andWhere(
          '(t.nombres ILIKE :search OR t.apellido_paterno ILIKE :search OR t.apellido_materno ILIKE :search OR t.dni ILIKE :search OR t.email ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Sorting with whitelist
      const sortableFields: Record<string, string> = {
        nombres: 't.nombres',
        apellido_paterno: 't.apellidoPaterno',
        apellido_materno: 't.apellidoMaterno',
        dni: 't.dni',
        email: 't.email',
        telefono: 't.telefono',
        cargo: 't.cargo',
        especialidad: 't.especialidad',
        fecha_ingreso: 't.fechaIngreso',
        fecha_nacimiento: 't.fechaNacimiento',
        created_at: 't.createdAt',
        updated_at: 't.updatedAt',
      };

      const sortBy =
        filters?.sort_by && sortableFields[filters.sort_by]
          ? sortableFields[filters.sort_by]
          : 't.apellido_paterno';
      const sortOrder = filters?.sort_order === 'DESC' ? 'DESC' : 'ASC';

      queryBuilder.orderBy(sortBy, sortOrder);
      if (sortBy !== 't.apellido_paterno') {
        queryBuilder.addOrderBy('t.apellido_paterno', 'ASC');
      }
      queryBuilder.addOrderBy('t.nombres', 'ASC');

      // Get total count
      const total = await queryBuilder.getCount();

      // Paginate
      queryBuilder.skip(skip).take(limit);

      const trabajadores = await queryBuilder.getMany();

      // Map to DTO format
      const data = trabajadores.map((t) => toOperatorDto(t));

      Logger.info('Operators fetched successfully', {
        tenantId,
        count: trabajadores.length,
        total,
        context: 'OperatorService.findAll',
      });

      return { data, total };
    } catch (error) {
      Logger.error('Error finding operators', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        filters,
        page,
        limit,
        context: 'OperatorService.findAll',
      });
      throw error;
    }
  }

  async findById(tenantId: number, id: number): Promise<OperatorDto> {
    try {
      Logger.info('Fetching operator by ID', {
        tenantId,
        id,
        context: 'OperatorService.findById',
      });

      const trabajador = await this.repository.findOne({
        where: { id, tenantId },
      });

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      Logger.info('Operator fetched successfully', {
        tenantId,
        id,
        context: 'OperatorService.findById',
      });

      return toOperatorDto(trabajador);
    } catch (error) {
      Logger.error('Error finding operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorService.findById',
      });
      throw error;
    }
  }

  async findByDni(tenantId: number, dni: string): Promise<OperatorDto> {
    try {
      Logger.info('Fetching operator by DNI', {
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });

      const trabajador = await this.repository.findOne({
        where: { dni, tenantId },
      });

      if (!trabajador) {
        throw new NotFoundError('Operator', dni, { tenantId });
      }

      Logger.info('Operator fetched successfully', {
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });

      return toOperatorDto(trabajador);
    } catch (error) {
      Logger.error('Error finding operator by DNI', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni,
        context: 'OperatorService.findByDni',
      });
      throw error;
    }
  }

  async create(tenantId: number, data: OperatorCreateDto): Promise<OperatorDto> {
    try {
      Logger.info('Creating operator', {
        tenantId,
        dni: data.dni,
        context: 'OperatorService.create',
      });

      // Check for duplicate DNI within the same tenant
      const existing = await this.repository.findOne({ where: { dni: data.dni, tenantId } });
      if (existing) {
        throw new ConflictError('Operator', { dni: data.dni, tenantId });
      }

      // Create entity using DTO transformer
      const operatorDto: Partial<OperatorDto> = {
        ...data,
        tenant_id: tenantId,
        is_active: true,
      };
      const entity = this.repository.create(fromOperatorDto(operatorDto));
      const saved = await this.repository.save(entity);

      Logger.info('Operator created successfully', {
        tenantId,
        id: saved.id,
        context: 'OperatorService.create',
      });

      // Invalidate dashboard cache (operator count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after operator create', {
        tenantId,
        id: saved.id,
        context: 'OperatorService.create',
      });

      return toOperatorDto(saved);
    } catch (error) {
      Logger.error('Error creating operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        dni: data.dni,
        context: 'OperatorService.create',
      });
      throw error;
    }
  }

  async update(tenantId: number, id: number, data: OperatorUpdateDto): Promise<OperatorDto> {
    try {
      Logger.info('Updating operator', {
        tenantId,
        id,
        data,
        context: 'OperatorService.update',
      });

      const trabajador = await this.repository.findOne({ where: { id, tenantId } });

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      // Check for duplicate DNI (if DNI is being updated)
      if (data.dni && data.dni !== trabajador.dni) {
        const existing = await this.repository.findOne({ where: { dni: data.dni, tenantId } });
        if (existing) {
          throw new ConflictError('Operator', { dni: data.dni, tenantId });
        }
      }

      // Merge changes using DTO transformer
      const entityChanges = fromOperatorDto(data);
      Object.assign(trabajador, entityChanges);

      const saved = await this.repository.save(trabajador);

      Logger.info('Operator updated successfully', {
        tenantId,
        id,
        context: 'OperatorService.update',
      });

      // Invalidate dashboard cache (operator data changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after operator update', {
        tenantId,
        id,
        context: 'OperatorService.update',
      });

      return toOperatorDto(saved);
    } catch (error) {
      Logger.error('Error updating operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        data,
        context: 'OperatorService.update',
      });
      throw error;
    }
  }

  async delete(tenantId: number, id: number): Promise<void> {
    try {
      Logger.info('Deleting operator', {
        tenantId,
        id,
        context: 'OperatorService.delete',
      });

      // Verify operator exists within tenant
      const trabajador = await this.repository.findOne({ where: { id, tenantId } });

      if (!trabajador) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      // TODO: Business rule - check for active assignments
      // const activeAssignments = await this.assignmentRepository.count({
      //   where: { operator_id: id, status: 'ACTIVE' }
      // });
      // if (activeAssignments > 0) {
      //   throw new BusinessRuleError('Cannot delete operator with active assignments', {
      //     operator_id: id,
      //     active_assignments: activeAssignments
      //   });
      // }

      // Soft delete
      const result = await this.repository.update({ id, tenantId }, { isActive: false });

      if (!result.affected || result.affected === 0) {
        throw new NotFoundError('Operator', id, { tenantId });
      }

      Logger.info('Operator deleted successfully', {
        tenantId,
        id,
        context: 'OperatorService.delete',
      });

      // Invalidate dashboard cache (operator count changed)
      await this.dashboardService.invalidateDashboardCache();
      Logger.info('Dashboard cache invalidated after operator delete', {
        tenantId,
        id,
        context: 'OperatorService.delete',
      });
    } catch (error) {
      Logger.error('Error deleting operator', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        id,
        context: 'OperatorService.delete',
      });
      throw error;
    }
  }

  async getStats(tenantId: number): Promise<{
    total: number;
    activos: number;
    porCargo: Record<string, number>;
    porEspecialidad: Record<string, number>;
  }> {
    try {
      Logger.info('Fetching operator statistics', {
        tenantId,
        context: 'OperatorService.getStats',
      });

      // TODO: Add tenant_id filter when column exists in rrhh.trabajador table
      const total = await this.repository.count({ where: { tenantId } });
      const activos = await this.repository.count({ where: { isActive: true, tenantId } });

      // Get count by cargo
      const cargoResult = await this.repository
        .createQueryBuilder('t')
        .select('t.cargo', 'cargo')
        .addSelect('COUNT(*)', 'count')
        .where('t.isActive = true')
        .andWhere('t.tenantId = :tenantId', { tenantId })
        .groupBy('t.cargo')
        .getRawMany();

      const porCargo: Record<string, number> = {};
      cargoResult.forEach((r) => {
        if (r.cargo) porCargo[r.cargo] = parseInt(r.count);
      });

      // Get count by especialidad
      const espResult = await this.repository
        .createQueryBuilder('t')
        .select('t.especialidad', 'especialidad')
        .addSelect('COUNT(*)', 'count')
        .where('t.isActive = true')
        .andWhere('t.tenantId = :tenantId', { tenantId })
        .groupBy('t.especialidad')
        .getRawMany();

      const porEspecialidad: Record<string, number> = {};
      espResult.forEach((r) => {
        if (r.especialidad) porEspecialidad[r.especialidad] = parseInt(r.count);
      });

      Logger.info('Operator statistics fetched successfully', {
        tenantId,
        total,
        activos,
        context: 'OperatorService.getStats',
      });

      return { total, activos, porCargo, porEspecialidad };
    } catch (error) {
      Logger.error('Error getting operator stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        tenantId,
        context: 'OperatorService.getStats',
      });
      throw error;
    }
  }

  async searchBySkill(tenantId: number, skill: string): Promise<OperatorDto[]> {
    try {
      Logger.info('Searching operators by skill', { tenantId, skill });

      const trabajadores = await this.repository.find({
        where: [
          { especialidad: ILike(`%${skill}%`), tenantId, isActive: true },
          { cargo: ILike(`%${skill}%`), tenantId, isActive: true },
        ],
      });

      return trabajadores.map((t) => toOperatorDto(t));
    } catch (error) {
      Logger.error('Error searching operators by skill', { error, tenantId, skill });
      throw error;
    }
  }

  async getAvailability(tenantId: number, id: number): Promise<DisponibilidadDto> {
    try {
      await this.findById(tenantId, id);

      const parteHoy = await this.parteDiarioRepository
        .createQueryBuilder('p')
        .where('p.trabajador_id = :id', { id })
        .andWhere('p.tenant_id = :tenantId', { tenantId })
        .andWhere('DATE(p.fecha) = CURRENT_DATE')
        .andWhere("p.estado NOT IN ('RECHAZADO')")
        .getOne();

      return {
        operador_id: id,
        estado: parteHoy ? 'ASIGNADO' : 'DISPONIBLE',
        parte_diario_hoy: parteHoy
          ? {
              id: parteHoy.id,
              fecha_parte:
                parteHoy.fecha instanceof Date
                  ? parteHoy.fecha.toISOString().slice(0, 10)
                  : String(parteHoy.fecha),
              equipo_id: parteHoy.equipoId!,
            }
          : null,
      };
    } catch (error) {
      Logger.error('Error getting operator availability', { error, tenantId, id });
      throw error;
    }
  }

  async getPerformance(tenantId: number, id: number, dias = 30): Promise<RendimientoDto> {
    try {
      await this.findById(tenantId, id);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - dias);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

      const raw = await this.parteDiarioRepository
        .createQueryBuilder('p')
        .select([
          'COUNT(*) AS total',
          "SUM(CASE WHEN p.estado = 'APROBADO' THEN 1 ELSE 0 END) AS aprobados",
          "SUM(CASE WHEN p.estado = 'RECHAZADO' THEN 1 ELSE 0 END) AS rechazados",
          "SUM(CASE WHEN p.estado IN ('BORRADOR','ENVIADO') THEN 1 ELSE 0 END) AS pendientes",
          'SUM(GREATEST(COALESCE(p.horometro_final, 0) - COALESCE(p.horometro_inicial, 0), 0)) AS horas',
        ])
        .where('p.trabajador_id = :id', { id })
        .andWhere('p.tenant_id = :tenantId', { tenantId })
        .andWhere('p.fecha >= :cutoffDate', { cutoffDate: cutoffDateStr })
        .getRawOne();

      const total = parseInt(raw?.total ?? '0') || 0;
      const aprobados = parseInt(raw?.aprobados ?? '0') || 0;
      const rechazados = parseInt(raw?.rechazados ?? '0') || 0;
      const pendientes = parseInt(raw?.pendientes ?? '0') || 0;
      const horas = parseFloat(raw?.horas ?? '0') || 0;

      return {
        operador_id: id,
        periodo_dias: dias,
        total_partes: total,
        horas_totales: Math.round(horas * 10) / 10,
        partes_aprobados: aprobados,
        partes_rechazados: rechazados,
        partes_pendientes: pendientes,
        eficiencia: total > 0 ? Math.round((aprobados / total) * 10000) / 100 : 0,
      };
    } catch (error) {
      Logger.error('Error getting operator performance', { error, tenantId, id });
      throw error;
    }
  }

  async getCertifications(tenantId: number, operadorId: number): Promise<CertificacionDto[]> {
    await this.findById(tenantId, operadorId);
    const certs = await this.certRepository.find({
      where: { trabajadorId: operadorId, tenantId },
      order: { fechaVencimiento: 'ASC' },
    });
    return certs.map(toCertificacionDto);
  }

  async addCertification(
    tenantId: number,
    operadorId: number,
    data: CertificacionCreateDto
  ): Promise<CertificacionDto> {
    await this.findById(tenantId, operadorId);
    const entity = this.certRepository.create({
      trabajadorId: operadorId,
      tenantId,
      nombreCertificacion: data.nombre_certificacion,
      numeroCertificacion: data.numero_certificacion,
      fechaEmision: data.fecha_emision ? new Date(data.fecha_emision) : undefined,
      fechaVencimiento: data.fecha_vencimiento ? new Date(data.fecha_vencimiento) : undefined,
      entidadEmisora: data.entidad_emisora,
      estado: 'VIGENTE',
    });
    const saved = await this.certRepository.save(entity);
    return toCertificacionDto(saved);
  }

  async deleteCertification(tenantId: number, certId: number): Promise<void> {
    const result = await this.certRepository.delete({ id: certId, tenantId });
    if (!result.affected) {
      throw new NotFoundError(`Certificación ${certId} no encontrada`);
    }
  }

  async getSkills(tenantId: number, operadorId: number): Promise<HabilidadDto[]> {
    await this.findById(tenantId, operadorId);
    const skills = await this.habRepository.find({
      where: { trabajadorId: operadorId, tenantId },
      order: { tipoEquipo: 'ASC' },
    });
    return skills.map(toHabilidadDto);
  }

  async addSkill(
    tenantId: number,
    operadorId: number,
    data: HabilidadCreateDto
  ): Promise<HabilidadDto> {
    await this.findById(tenantId, operadorId);
    const entity = this.habRepository.create({
      trabajadorId: operadorId,
      tenantId,
      tipoEquipo: data.tipo_equipo,
      nivelHabilidad: data.nivel_habilidad ?? 'PRINCIPIANTE',
      aniosExperiencia: data.anios_experiencia ?? 0,
      ultimaVerificacion: data.ultima_verificacion ? new Date(data.ultima_verificacion) : undefined,
    });
    const saved = await this.habRepository.save(entity);
    return toHabilidadDto(saved);
  }

  async getDisponibilidadMensual(
    tenantId: number,
    mesAnio: string // format: YYYY-MM
  ): Promise<DisponibilidadProgramadaDto[]> {
    const [year, month] = mesAnio.split('-').map(Number);
    const fechaInicio = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const fechaFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const records = await this.dispRepository.find({
      where: { tenantId },
      order: { trabajadorId: 'ASC', fecha: 'ASC' },
    });

    // Filter to the requested month in JS (avoids TypeORM date range complexity)
    const filtered = records.filter((r) => r.fecha >= fechaInicio && r.fecha <= fechaFin);

    return filtered.map(toDisponibilidadProgramadaDto);
  }

  async setDisponibilidad(
    tenantId: number,
    operadorId: number,
    fecha: string,
    disponible: boolean,
    observacion?: string
  ): Promise<DisponibilidadProgramadaDto> {
    // Upsert: find existing or create new
    let record = await this.dispRepository.findOne({
      where: { trabajadorId: operadorId, fecha, tenantId },
    });

    if (record) {
      record.disponible = disponible;
      record.observacion = observacion;
    } else {
      record = this.dispRepository.create({
        trabajadorId: operadorId,
        fecha,
        disponible,
        observacion,
        tenantId,
      });
    }

    const saved = await this.dispRepository.save(record);
    return toDisponibilidadProgramadaDto(saved);
  }
}

// Note: Do not export singleton - causes "Database not initialized" error
// The controller instantiates the service directly: const operatorService = new OperatorService();
