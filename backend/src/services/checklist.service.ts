/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { ChecklistTemplate } from '../models/checklist-template.model';
import { ChecklistItem } from '../models/checklist-item.model';
import { ChecklistInspection } from '../models/checklist-inspection.model';
import { ChecklistResult } from '../models/checklist-result.model';
import { Repository } from 'typeorm';
import {
  ChecklistTemplateListDto,
  ChecklistTemplateDetailDto,
  ChecklistItemDto,
  ChecklistInspectionListDto,
  ChecklistInspectionDetailDto,
  ChecklistInspectionWithResultsDto,
  ChecklistResultDto,
  ChecklistInspectionStatsDto,
  toChecklistTemplateListDtoArray,
  toChecklistTemplateDetailDto,
  toChecklistItemDto,
  toChecklistInspectionListDtoArray,
  toChecklistInspectionDetailDto,
  toChecklistInspectionWithResultsDto,
  toChecklistResultDtoArray,
} from '../types/dto/checklist.dto';

export class ChecklistService {
  private templateRepository: Repository<ChecklistTemplate>;
  private itemRepository: Repository<ChecklistItem>;
  private inspectionRepository: Repository<ChecklistInspection>;
  private resultRepository: Repository<ChecklistResult>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(ChecklistTemplate);
    this.itemRepository = AppDataSource.getRepository(ChecklistItem);
    this.inspectionRepository = AppDataSource.getRepository(ChecklistInspection);
    this.resultRepository = AppDataSource.getRepository(ChecklistResult);
  }

  // ===== TEMPLATES =====
  async getAllTemplates(filters?: any): Promise<ChecklistTemplateListDto[]> {
    const where: any = {};

    if (filters?.activo !== undefined) {
      where.activo = filters.activo;
    }

    if (filters?.tipoEquipo) {
      where.tipoEquipo = filters.tipoEquipo;
    }

    const templates = await this.templateRepository.find({
      where,
      order: { nombre: 'ASC' },
    });

    // Manually load items for each template
    for (const template of templates) {
      template.items = await this.itemRepository.find({
        where: { plantillaId: template.id },
        order: { orden: 'ASC' },
      });
    }

    // Apply search filter if provided
    let filteredTemplates = templates;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filteredTemplates = templates.filter(
        (t) =>
          t.nombre.toLowerCase().includes(searchLower) ||
          t.codigo.toLowerCase().includes(searchLower)
      );
    }

    return toChecklistTemplateListDtoArray(filteredTemplates);
  }

  async getTemplateById(id: number): Promise<ChecklistTemplateDetailDto | null> {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (!template) {
      return null;
    }

    template.items = await this.itemRepository.find({
      where: { plantillaId: id },
      order: { orden: 'ASC' },
    });

    return toChecklistTemplateDetailDto(template);
  }

  async createTemplate(
    data: Partial<ChecklistTemplate>,
    userId: number
  ): Promise<ChecklistTemplateDetailDto> {
    const template = this.templateRepository.create({
      ...data,
      createdBy: userId,
    });
    const saved = await this.templateRepository.save(template);
    return this.getTemplateById(saved.id) as Promise<ChecklistTemplateDetailDto>;
  }

  async updateTemplate(
    id: number,
    data: Partial<ChecklistTemplate>
  ): Promise<ChecklistTemplateDetailDto | null> {
    await this.templateRepository.update(id, data);
    return this.getTemplateById(id);
  }

  async deleteTemplate(id: number) {
    const result = await this.templateRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ===== ITEMS =====
  async createItem(data: Partial<ChecklistItem>): Promise<ChecklistItemDto> {
    const item = this.itemRepository.create(data);
    const saved = await this.itemRepository.save(item);
    return toChecklistItemDto(saved);
  }

  async updateItem(id: number, data: Partial<ChecklistItem>): Promise<ChecklistItemDto | null> {
    await this.itemRepository.update(id, data);
    const item = await this.itemRepository.findOne({ where: { id } });
    return item ? toChecklistItemDto(item) : null;
  }

  async deleteItem(id: number) {
    const result = await this.itemRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getItemsByTemplate(plantillaId: number): Promise<ChecklistItemDto[]> {
    const items = await this.itemRepository.find({
      where: { plantillaId },
      order: { orden: 'ASC' },
    });
    return items.map(toChecklistItemDto);
  }

  // ===== INSPECTIONS =====
  async getAllInspections(filters?: any): Promise<{
    data: ChecklistInspectionListDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = parseInt(filters?.page) || 1;
    const limit = parseInt(filters?.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.equipoId) where.equipoId = filters.equipoId;
    if (filters?.trabajadorId) where.trabajadorId = filters.trabajadorId;
    if (filters?.estado) where.estado = filters.estado;
    if (filters?.resultadoGeneral) where.resultadoGeneral = filters.resultadoGeneral;

    const [data, total] = await this.inspectionRepository.findAndCount({
      where,
      relations: ['plantilla', 'equipo', 'trabajador'],
      order: { fechaInspeccion: 'DESC', createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: toChecklistInspectionListDtoArray(data),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInspectionById(id: number): Promise<ChecklistInspectionDetailDto | null> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['plantilla', 'equipo', 'trabajador'],
    });
    return inspection ? toChecklistInspectionDetailDto(inspection) : null;
  }

  async getInspectionWithResults(id: number): Promise<ChecklistInspectionWithResultsDto | null> {
    const inspection = await this.inspectionRepository.findOne({
      where: { id },
      relations: ['plantilla', 'equipo', 'trabajador'],
    });
    if (!inspection) return null;

    const results = await this.resultRepository.find({
      where: { inspeccionId: id },
      order: { createdAt: 'ASC' },
    });

    // Load item details for each result
    for (const result of results) {
      result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
    }

    return toChecklistInspectionWithResultsDto(inspection, results);
  }

  async createInspection(
    data: Partial<ChecklistInspection>
  ): Promise<ChecklistInspectionDetailDto> {
    const year = new Date().getFullYear();
    const count = await this.inspectionRepository.count();
    const codigo = `INS-${year}-${String(count + 1).padStart(4, '0')}`;

    const template = await this.templateRepository.findOne({ where: { id: data.plantillaId } });
    if (template) {
      template.items = await this.itemRepository.find({
        where: { plantillaId: template.id },
        order: { orden: 'ASC' },
      });
    }
    const itemsTotal = template?.items?.length || 0;

    const inspection = this.inspectionRepository.create({
      ...data,
      codigo,
      itemsTotal,
      fechaInspeccion: data.fechaInspeccion || new Date(),
    });

    const saved = await this.inspectionRepository.save(inspection);
    return this.getInspectionById(saved.id) as Promise<ChecklistInspectionDetailDto>;
  }

  async updateInspection(
    id: number,
    data: Partial<ChecklistInspection>
  ): Promise<ChecklistInspectionDetailDto | null> {
    await this.inspectionRepository.update(id, data);
    return this.getInspectionById(id);
  }

  async completeInspection(id: number): Promise<ChecklistInspectionDetailDto | null> {
    const results = await this.resultRepository.find({ where: { inspeccionId: id } });

    const itemsConforme = results.filter((r) => r.conforme === true).length;
    const itemsNoConforme = results.filter((r) => r.conforme === false).length;

    // Check for critical failures
    let hasCriticalFailures = false;
    for (const result of results) {
      if (result.conforme === false) {
        const item = await this.itemRepository.findOne({ where: { id: result.itemId } });
        if (item?.esCritico) {
          hasCriticalFailures = true;
          break;
        }
      }
    }

    let resultadoGeneral: any = 'APROBADO';
    let equipoOperativo = true;

    if (hasCriticalFailures) {
      resultadoGeneral = 'RECHAZADO';
      equipoOperativo = false;
    } else if (itemsNoConforme > 0) {
      resultadoGeneral = 'APROBADO_CON_OBSERVACIONES';
    }

    await this.inspectionRepository.update(id, {
      estado: 'COMPLETADO',
      itemsConforme,
      itemsNoConforme,
      resultadoGeneral,
      equipoOperativo,
      completadoEn: new Date(),
    });

    return this.getInspectionById(id);
  }

  async cancelInspection(id: number): Promise<ChecklistInspectionDetailDto | null> {
    await this.inspectionRepository.update(id, { estado: 'CANCELADO' });
    return this.getInspectionById(id);
  }

  // ===== RESULTS =====
  async saveResult(data: Partial<ChecklistResult>): Promise<ChecklistResultDto> {
    const existing = await this.resultRepository.findOne({
      where: {
        inspeccionId: data.inspeccionId!,
        itemId: data.itemId!,
      },
    });

    let result: ChecklistResult;
    if (existing) {
      await this.resultRepository.update(existing.id, data);
      result = (await this.resultRepository.findOne({ where: { id: existing.id } }))!;
    } else {
      result = this.resultRepository.create(data);
      result = await this.resultRepository.save(result);
    }

    // Load item details
    result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
    return toChecklistResultDtoArray([result])[0];
  }

  async getResultsByInspection(inspeccionId: number): Promise<ChecklistResultDto[]> {
    const results = await this.resultRepository.find({
      where: { inspeccionId },
      order: { createdAt: 'ASC' },
    });

    // Load item details for each result
    for (const result of results) {
      result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
    }

    return toChecklistResultDtoArray(results);
  }

  // ===== STATS =====
  async getInspectionStats(filters?: any): Promise<ChecklistInspectionStatsDto> {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      // For date range, we'd need to use QueryBuilder
    }

    const total = await this.inspectionRepository.count({ where });

    // Count by estado
    const completadas = await this.inspectionRepository.count({
      where: { ...where, estado: 'COMPLETADO' },
    });
    const enProgreso = await this.inspectionRepository.count({
      where: { ...where, estado: 'EN_PROGRESO' },
    });
    const rechazadas = await this.inspectionRepository.count({
      where: { ...where, estado: 'RECHAZADO' },
    });
    const canceladas = await this.inspectionRepository.count({
      where: { ...where, estado: 'CANCELADO' },
    });

    // Count by resultado_general
    const aprobadas = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'APROBADO' },
    });
    const aprobadasConObservaciones = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'APROBADO_CON_OBSERVACIONES' },
    });
    const rechazadasPorResultado = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'RECHAZADO' },
    });

    // Count equipment conditions
    const equiposRequierenMantenimiento = await this.inspectionRepository.count({
      where: { ...where, requiereMantenimiento: true },
    });
    const equiposNoOperativos = await this.inspectionRepository.count({
      where: { ...where, equipoOperativo: false },
    });

    return {
      total_inspecciones: total,
      en_progreso: enProgreso,
      completadas,
      rechazadas,
      canceladas,
      aprobadas,
      aprobadas_con_observaciones: aprobadasConObservaciones,
      rechazadas_por_resultado: rechazadasPorResultado,
      tasa_conformidad: total > 0 ? ((aprobadas + aprobadasConObservaciones) / total) * 100 : 0,
      equipos_requieren_mantenimiento: equiposRequierenMantenimiento,
      equipos_no_operativos: equiposNoOperativos,
    };
  }
}
