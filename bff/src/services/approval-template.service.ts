/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { PlantillaAprobacion, ModuleName } from '../models/plantilla-aprobacion.model';
import { PlantillaPaso } from '../models/plantilla-paso.model';
import { NotFoundError, ConflictError, ValidationError } from '../errors';
import {
  PlantillaAprobacionDto,
  CrearPlantillaDto,
  toPlantillaDto,
} from '../types/dto/approval.dto';
import logger from '../utils/logger';

export class ApprovalTemplateService {
  private get repo() {
    return AppDataSource.getRepository(PlantillaAprobacion);
  }

  private get pasoRepo() {
    return AppDataSource.getRepository(PlantillaPaso);
  }

  async crearPlantilla(dto: CrearPlantillaDto, usuarioId: number): Promise<PlantillaAprobacionDto> {
    if (!dto.pasos || dto.pasos.length === 0) {
      throw new ValidationError('La plantilla debe tener al menos un paso de aprobación');
    }

    // Check for existing ACTIVO template for same module/project
    const existing = await this.repo.findOne({
      where: {
        moduleName: dto.module_name as ModuleName,
        proyectoId: dto.proyecto_id ?? undefined,
        estado: 'ACTIVO',
      } as any,
    });

    if (existing) {
      throw new ConflictError(
        `Ya existe una plantilla activa para el módulo '${dto.module_name}'. Desactívela primero.`
      );
    }

    const plantilla = this.repo.create({
      nombre: dto.nombre,
      moduleName: dto.module_name as ModuleName,
      proyectoId: dto.proyecto_id,
      descripcion: dto.descripcion,
      estado: 'ACTIVO',
      version: 1,
      createdBy: usuarioId,
    });

    const saved = await this.repo.save(plantilla);

    const pasos = dto.pasos.map((p) =>
      this.pasoRepo.create({
        plantillaId: saved.id,
        pasoNumero: p.paso_numero,
        nombrePaso: p.nombre_paso,
        tipoAprobador: p.tipo_aprobador,
        rol: p.rol,
        usuarioId: p.usuario_id,
        logicaAprobacion: p.logica_aprobacion,
        esOpcional: p.es_opcional ?? false,
      })
    );

    const savedPasos = await this.pasoRepo.save(pasos);
    saved.pasos = savedPasos;

    logger.info('ApprovalTemplate: created', { id: saved.id, module: dto.module_name });
    return toPlantillaDto(saved);
  }

  async obtenerPlantillaActiva(
    moduleName: ModuleName,
    proyectoId?: number
  ): Promise<PlantillaAprobacion | null> {
    const plantilla = await this.repo.findOne({
      where: { moduleName, estado: 'ACTIVO', proyectoId: proyectoId ?? undefined } as any,
      relations: ['pasos'],
      order: { id: 'DESC' } as any,
    });

    if (!plantilla) {
      // Try without project-specific (fallback to global template)
      if (proyectoId) {
        return this.repo.findOne({
          where: { moduleName, estado: 'ACTIVO', proyectoId: undefined } as any,
          relations: ['pasos'],
          order: { id: 'DESC' } as any,
        });
      }
      return null;
    }

    return plantilla;
  }

  async listar(): Promise<PlantillaAprobacionDto[]> {
    const plantillas = await this.repo.find({
      relations: ['pasos'],
      order: { id: 'DESC' } as any,
    });
    return plantillas.map(toPlantillaDto);
  }

  async obtenerPorId(id: number): Promise<PlantillaAprobacionDto> {
    const plantilla = await this.repo.findOne({
      where: { id },
      relations: ['pasos'],
    });
    if (!plantilla) throw new NotFoundError('PlantillaAprobacion', id);
    return toPlantillaDto(plantilla);
  }

  async actualizar(
    id: number,
    dto: CrearPlantillaDto,
    usuarioId: number
  ): Promise<PlantillaAprobacionDto> {
    const plantilla = await this.repo.findOne({ where: { id }, relations: ['pasos'] });
    if (!plantilla) throw new NotFoundError('PlantillaAprobacion', id);

    if (!dto.pasos || dto.pasos.length === 0) {
      throw new ValidationError('La plantilla debe tener al menos un paso de aprobación');
    }

    // Increment version, set old as INACTIVO, create new
    await this.repo.update(id, { estado: 'INACTIVO' } as any);

    const nueva = this.repo.create({
      nombre: dto.nombre,
      moduleName: dto.module_name as ModuleName,
      proyectoId: dto.proyecto_id,
      descripcion: dto.descripcion,
      estado: 'ACTIVO',
      version: plantilla.version + 1,
      createdBy: usuarioId,
    });
    const savedNueva = await this.repo.save(nueva);

    const pasos = dto.pasos.map((p) =>
      this.pasoRepo.create({
        plantillaId: savedNueva.id,
        pasoNumero: p.paso_numero,
        nombrePaso: p.nombre_paso,
        tipoAprobador: p.tipo_aprobador,
        rol: p.rol,
        usuarioId: p.usuario_id,
        logicaAprobacion: p.logica_aprobacion,
        esOpcional: p.es_opcional ?? false,
      })
    );
    const savedPasos = await this.pasoRepo.save(pasos);
    savedNueva.pasos = savedPasos;

    logger.info('ApprovalTemplate: updated', { oldId: id, newId: savedNueva.id });
    return toPlantillaDto(savedNueva);
  }

  async activar(id: number, _usuarioId: number): Promise<PlantillaAprobacionDto> {
    const plantilla = await this.repo.findOne({ where: { id } });
    if (!plantilla) throw new NotFoundError('PlantillaAprobacion', id);

    // Deactivate existing ACTIVO templates for same module/project
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ estado: 'INACTIVO' } as any)
      .where(
        'module_name = :m AND proyecto_id IS NOT DISTINCT FROM :p AND estado = :e AND id != :id',
        {
          m: plantilla.moduleName,
          p: plantilla.proyectoId ?? null,
          e: 'ACTIVO',
          id,
        }
      )
      .execute();

    await this.repo.update(id, { estado: 'ACTIVO' } as any);
    return this.obtenerPorId(id);
  }

  async archivar(id: number, _usuarioId: number): Promise<PlantillaAprobacionDto> {
    const plantilla = await this.repo.findOne({ where: { id } });
    if (!plantilla) throw new NotFoundError('PlantillaAprobacion', id);
    await this.repo.update(id, { estado: 'ARCHIVADO' } as any);
    return this.obtenerPorId(id);
  }
}
