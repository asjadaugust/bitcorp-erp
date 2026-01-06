/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { ChecklistTemplate } from '../models/checklist-template.model';
import { ChecklistItem } from '../models/checklist-item.model';
import { ChecklistInspection } from '../models/checklist-inspection.model';
import { ChecklistResult } from '../models/checklist-result.model';
import { Repository } from 'typeorm';

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
  async getAllTemplates(filters?: any) {
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
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      return templates.filter(
        (t) =>
          t.nombre.toLowerCase().includes(searchLower) ||
          t.codigo.toLowerCase().includes(searchLower)
      );
    }

    return templates;
  }

  async getTemplateById(id: number) {
    const template = await this.templateRepository.findOne({ where: { id } });
    if (template) {
      template.items = await this.itemRepository.find({
        where: { plantillaId: id },
        order: { orden: 'ASC' },
      });
    }
    return template;
  }

  async createTemplate(data: Partial<ChecklistTemplate>, userId: number) {
    const template = this.templateRepository.create({
      ...data,
      createdBy: userId,
    });
    return this.templateRepository.save(template);
  }

  async updateTemplate(id: number, data: Partial<ChecklistTemplate>) {
    await this.templateRepository.update(id, data);
    return this.getTemplateById(id);
  }

  async deleteTemplate(id: number) {
    const result = await this.templateRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ===== ITEMS =====
  async createItem(data: Partial<ChecklistItem>) {
    const item = this.itemRepository.create(data);
    return this.itemRepository.save(item);
  }

  async updateItem(id: number, data: Partial<ChecklistItem>) {
    await this.itemRepository.update(id, data);
    return this.itemRepository.findOne({ where: { id } });
  }

  async deleteItem(id: number) {
    const result = await this.itemRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  async getItemsByTemplate(plantillaId: number) {
    return this.itemRepository.find({
      where: { plantillaId },
      order: { orden: 'ASC' },
    });
  }

  // ===== INSPECTIONS =====
  async getAllInspections(filters?: any) {
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
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInspectionById(id: number) {
    return this.inspectionRepository.findOne({
      where: { id },
      relations: ['plantilla', 'equipo', 'trabajador'],
    });
  }

  async getInspectionWithResults(id: number) {
    const inspection = await this.getInspectionById(id);
    if (!inspection) return null;

    const results = await this.resultRepository.find({
      where: { inspeccionId: id },
      order: { createdAt: 'ASC' },
    });

    // Load item details for each result
    for (const result of results) {
      result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
    }

    return {
      ...inspection,
      resultados: results,
    };
  }

  async createInspection(data: Partial<ChecklistInspection>) {
    const year = new Date().getFullYear();
    const count = await this.inspectionRepository.count();
    const codigo = `INS-${year}-${String(count + 1).padStart(4, '0')}`;

    const template = await this.getTemplateById(data.plantillaId!);
    const itemsTotal = template?.items?.length || 0;

    const inspection = this.inspectionRepository.create({
      ...data,
      codigo,
      itemsTotal,
      fechaInspeccion: data.fechaInspeccion || new Date(),
    });

    return this.inspectionRepository.save(inspection);
  }

  async updateInspection(id: number, data: Partial<ChecklistInspection>) {
    await this.inspectionRepository.update(id, data);
    return this.getInspectionById(id);
  }

  async completeInspection(id: number) {
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

  async cancelInspection(id: number) {
    await this.inspectionRepository.update(id, { estado: 'CANCELADO' });
    return this.getInspectionById(id);
  }

  // ===== RESULTS =====
  async saveResult(data: Partial<ChecklistResult>) {
    const existing = await this.resultRepository.findOne({
      where: {
        inspeccionId: data.inspeccionId!,
        itemId: data.itemId!,
      },
    });

    if (existing) {
      await this.resultRepository.update(existing.id, data);
      return this.resultRepository.findOne({ where: { id: existing.id } });
    } else {
      const result = this.resultRepository.create(data);
      return this.resultRepository.save(result);
    }
  }

  async getResultsByInspection(inspeccionId: number) {
    return this.resultRepository.find({
      where: { inspeccionId },
      order: { createdAt: 'ASC' },
    });
  }

  // ===== STATS =====
  async getInspectionStats(filters?: any) {
    const where: any = {};
    if (filters?.startDate || filters?.endDate) {
      // For date range, we'd need to use QueryBuilder
    }

    const total = await this.inspectionRepository.count({ where });
    const aprobadas = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'APROBADO' },
    });
    const conObservaciones = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'APROBADO_CON_OBSERVACIONES' },
    });
    const rechazadas = await this.inspectionRepository.count({
      where: { ...where, resultadoGeneral: 'RECHAZADO' },
    });

    return {
      total,
      aprobadas,
      conObservaciones,
      rechazadas,
      tasaAprobacion: total > 0 ? ((aprobadas + conObservaciones) / total) * 100 : 0,
    };
  }
}
