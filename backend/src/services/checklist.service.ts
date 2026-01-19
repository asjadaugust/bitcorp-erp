/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { ChecklistTemplate } from '../models/checklist-template.model';
import { ChecklistItem } from '../models/checklist-item.model';
import { ChecklistInspection } from '../models/checklist-inspection.model';
import { ChecklistResult } from '../models/checklist-result.model';
import { Repository, QueryRunner } from 'typeorm';
import { NotFoundError, ValidationError, DatabaseError, DatabaseErrorType } from '../errors';
import logger from '../config/logger.config';
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

/**
 * ====================================================================================================
 * CHECKLIST SERVICE - Equipment Inspection Management (Safety-Critical)
 * ====================================================================================================
 *
 * This service manages equipment inspection checklists and safety compliance workflows for BitCorp ERP.
 * It is **safety-critical** - inspection results determine equipment operability and worker safety.
 *
 * Core responsibilities include template management, inspection execution, critical failure detection,
 * and conformity reporting. All inspection operations are logged and auditable.
 *
 * Related services: Equipment, Maintenance, Scheduling, Operator, SST
 *
 * For detailed documentation on entities, workflows, business rules, and usage examples,
 * see the audit document: backend/scripts/audits/checklist.service.audit.md
 */
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

  /**
   * Get all checklist templates with optional filtering
   *
   * Note: This method performs N+1 queries (loads items per template in a loop).
   * This is acceptable because N is typically small (< 20 templates).
   *
   * @param filters - Optional filters (activo, tipoEquipo, search)
   * @returns Array of template list DTOs with items
   * @throws {DatabaseError} If database query fails
   */
  async getAllTemplates(filters?: any): Promise<ChecklistTemplateListDto[]> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
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

      // Manually load items for each template (N+1 query pattern - acceptable)
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

      logger.info('Retrieved checklist templates', {
        count: filteredTemplates.length,
        filters: {
          activo: filters?.activo,
          tipo_equipo: filters?.tipoEquipo,
          search: filters?.search,
        },
        context: 'ChecklistService.getAllTemplates',
      });

      return toChecklistTemplateListDtoArray(filteredTemplates);
    } catch (error) {
      logger.error('Error retrieving checklist templates', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ChecklistService.getAllTemplates',
      });
      throw new DatabaseError(
        'Failed to retrieve checklist templates',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get a single template by ID with all its items
   *
   * @param id - Template ID
   * @returns Template detail DTO with items
   * @throws {NotFoundError} If template does not exist
   * @throws {DatabaseError} If database query fails
   */
  async getTemplateById(id: number): Promise<ChecklistTemplateDetailDto | null> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      const template = await this.templateRepository.findOne({ where: { id } });

      if (!template) {
        throw new NotFoundError('ChecklistTemplate', id);
      }

      template.items = await this.itemRepository.find({
        where: { plantillaId: id },
        order: { orden: 'ASC' },
      });

      logger.info('Retrieved checklist template', {
        id,
        codigo: template.codigo,
        nombre: template.nombre,
        items_count: template.items.length,
        context: 'ChecklistService.getTemplateById',
      });

      return toChecklistTemplateDetailDto(template);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving checklist template', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.getTemplateById',
      });
      throw new DatabaseError(
        `Failed to retrieve checklist template with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Create a new checklist template
   *
   * @param data - Template data (nombre, codigo required)
   * @param userId - ID of user creating the template
   * @returns Created template detail DTO
   * @throws {ValidationError} If required fields are missing
   * @throws {DatabaseError} If database operation fails
   */
  async createTemplate(
    data: Partial<ChecklistTemplate>,
    userId: number
  ): Promise<ChecklistTemplateDetailDto> {
    try {
      // Validate required fields
      if (!data.nombre || !data.codigo) {
        throw new ValidationError('Missing required fields for template creation', [
          { field: 'nombre', rule: 'required', message: 'Template name is required' },
          { field: 'codigo', rule: 'required', message: 'Template code is required' },
        ]);
      }

      // TODO: [Phase 21 - Tenant Context] Add tenant assignment

      const template = this.templateRepository.create({
        ...data,
        createdBy: userId,
      });
      const saved = await this.templateRepository.save(template);

      logger.info('Created checklist template', {
        id: saved.id,
        codigo: saved.codigo,
        nombre: saved.nombre,
        tipo_equipo: saved.tipoEquipo,
        created_by: userId,
        context: 'ChecklistService.createTemplate',
      });

      return this.getTemplateById(saved.id) as Promise<ChecklistTemplateDetailDto>;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating checklist template', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        user_id: userId,
        context: 'ChecklistService.createTemplate',
      });
      throw new DatabaseError(
        'Failed to create checklist template',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update an existing checklist template
   *
   * @param id - Template ID
   * @param data - Fields to update
   * @returns Updated template detail DTO
   * @throws {NotFoundError} If template does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async updateTemplate(
    id: number,
    data: Partial<ChecklistTemplate>
  ): Promise<ChecklistTemplateDetailDto | null> {
    try {
      // Check if template exists
      const existing = await this.templateRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistTemplate', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      await this.templateRepository.update(id, data);

      logger.info('Updated checklist template', {
        id,
        codigo: existing.codigo,
        updated_fields: Object.keys(data),
        context: 'ChecklistService.updateTemplate',
      });

      return this.getTemplateById(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating checklist template', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'ChecklistService.updateTemplate',
      });
      throw new DatabaseError(
        `Failed to update checklist template with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Delete a checklist template (HARD DELETE)
   *
   * ⚠️ WARNING: Physical deletion - data permanently removed
   * RECOMMENDATION: Use soft delete (activo = false) instead
   *
   * @param id - Template ID
   * @returns true if deleted, false otherwise
   * @throws {NotFoundError} If template does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async deleteTemplate(id: number) {
    try {
      // Check if template exists
      const existing = await this.templateRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistTemplate', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      const result = await this.templateRepository.delete(id);

      logger.warn('Hard deleted checklist template', {
        id,
        codigo: existing.codigo,
        nombre: existing.nombre,
        affected_rows: result.affected,
        warning: 'Physical deletion - data permanently removed',
        context: 'ChecklistService.deleteTemplate',
      });

      return (result.affected ?? 0) > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting checklist template', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.deleteTemplate',
      });
      throw new DatabaseError(
        `Failed to delete checklist template with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ===== ITEMS =====

  /**
   * Create a new checklist item
   *
   * @param data - Item data (plantillaId, descripcion required)
   * @returns Created item DTO
   * @throws {ValidationError} If required fields are missing
   * @throws {DatabaseError} If database operation fails
   */
  async createItem(data: Partial<ChecklistItem>): Promise<ChecklistItemDto> {
    try {
      // Validate required fields
      if (!data.plantillaId || !data.descripcion) {
        throw new ValidationError('Missing required fields for item creation', [
          { field: 'plantillaId', rule: 'required', message: 'Template ID is required' },
          { field: 'descripcion', rule: 'required', message: 'Item description is required' },
        ]);
      }

      // TODO: [Phase 21 - Tenant Context] Add tenant assignment

      const item = this.itemRepository.create(data);
      const saved = await this.itemRepository.save(item);

      logger.info('Created checklist item', {
        id: saved.id,
        plantilla_id: saved.plantillaId,
        descripcion: saved.descripcion,
        es_critico: saved.esCritico,
        orden: saved.orden,
        context: 'ChecklistService.createItem',
      });

      return toChecklistItemDto(saved);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating checklist item', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ChecklistService.createItem',
      });
      throw new DatabaseError(
        'Failed to create checklist item',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update an existing checklist item
   *
   * @param id - Item ID
   * @param data - Fields to update
   * @returns Updated item DTO
   * @throws {NotFoundError} If item does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async updateItem(id: number, data: Partial<ChecklistItem>): Promise<ChecklistItemDto | null> {
    try {
      // Check if item exists
      const existing = await this.itemRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistItem', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      await this.itemRepository.update(id, data);
      const item = await this.itemRepository.findOne({ where: { id } });

      logger.info('Updated checklist item', {
        id,
        updated_fields: Object.keys(data),
        context: 'ChecklistService.updateItem',
      });

      return item ? toChecklistItemDto(item) : null;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating checklist item', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'ChecklistService.updateItem',
      });
      throw new DatabaseError(
        `Failed to update checklist item with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Delete a checklist item (HARD DELETE)
   *
   * ⚠️ WARNING: Physical deletion - data permanently removed
   * RECOMMENDATION: Use soft delete instead
   *
   * @param id - Item ID
   * @returns true if deleted, false otherwise
   * @throws {NotFoundError} If item does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async deleteItem(id: number) {
    try {
      // Check if item exists
      const existing = await this.itemRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistItem', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      const result = await this.itemRepository.delete(id);

      logger.warn('Hard deleted checklist item', {
        id,
        affected_rows: result.affected,
        warning: 'Physical deletion - data permanently removed',
        context: 'ChecklistService.deleteItem',
      });

      return (result.affected ?? 0) > 0;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error deleting checklist item', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.deleteItem',
      });
      throw new DatabaseError(
        `Failed to delete checklist item with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get all items for a template
   *
   * @param plantillaId - Template ID
   * @returns Array of item DTOs ordered by sequence
   * @throws {DatabaseError} If database query fails
   */
  async getItemsByTemplate(plantillaId: number): Promise<ChecklistItemDto[]> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      const items = await this.itemRepository.find({
        where: { plantillaId },
        order: { orden: 'ASC' },
      });

      logger.info('Retrieved checklist items by template', {
        plantilla_id: plantillaId,
        count: items.length,
        context: 'ChecklistService.getItemsByTemplate',
      });

      return items.map(toChecklistItemDto);
    } catch (error) {
      logger.error('Error retrieving checklist items', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        plantilla_id: plantillaId,
        context: 'ChecklistService.getItemsByTemplate',
      });
      throw new DatabaseError(
        `Failed to retrieve items for template ${plantillaId}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ===== INSPECTIONS =====

  /**
   * Get all inspections with pagination and filters
   *
   * @param filters - Optional filters (equipoId, trabajadorId, estado, pagination, sorting)
   * @returns Paginated inspection list
   * @throws {DatabaseError} If database query fails
   */
  async getAllInspections(filters?: any): Promise<{
    data: ChecklistInspectionListDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const page = parseInt(filters?.page) || 1;
      const limit = parseInt(filters?.limit) || 20;
      const skip = (page - 1) * limit;

      // Parse sorting parameters
      const sortBy = filters?.sort_by || 'fecha_inspeccion';
      const sortOrder = filters?.sort_order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

      const where: any = {};

      // TODO: [Phase 21 - Tenant Context] Add tenant filtering

      if (filters?.equipoId) where.equipoId = filters.equipoId;
      if (filters?.trabajadorId) where.trabajadorId = filters.trabajadorId;
      if (filters?.estado) where.estado = filters.estado;
      if (filters?.resultadoGeneral) where.resultadoGeneral = filters.resultadoGeneral;

      // Valid sortable fields (snake_case API → entity property)
      const validSortFields: Record<string, string> = {
        fecha_inspeccion: 'fechaInspeccion',
        estado: 'estado',
        resultado_general: 'resultadoGeneral',
        created_at: 'createdAt',
        updated_at: 'updatedAt',
      };

      const entitySortField = validSortFields[sortBy] || 'fechaInspeccion';

      // Build order clause
      const order: any = {};
      order[entitySortField] = sortOrder;
      // Add secondary sort by createdAt for consistency
      if (entitySortField !== 'createdAt') {
        order['createdAt'] = 'DESC';
      }

      const [data, total] = await this.inspectionRepository.findAndCount({
        where,
        relations: ['plantilla', 'equipo', 'trabajador'],
        order,
        skip,
        take: limit,
      });

      logger.info('Retrieved checklist inspections', {
        count: data.length,
        total,
        page,
        limit,
        filters: {
          equipo_id: filters?.equipoId,
          trabajador_id: filters?.trabajadorId,
          estado: filters?.estado,
          resultado_general: filters?.resultadoGeneral,
        },
        sort: { sort_by: sortBy, sort_order: sortOrder },
        context: 'ChecklistService.getAllInspections',
      });

      return {
        data: toChecklistInspectionListDtoArray(data),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error retrieving checklist inspections', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ChecklistService.getAllInspections',
      });
      throw new DatabaseError(
        'Failed to retrieve checklist inspections',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get a single inspection by ID
   *
   * @param id - Inspection ID
   * @returns Inspection detail DTO
   * @throws {NotFoundError} If inspection does not exist
   * @throws {DatabaseError} If database query fails
   */
  async getInspectionById(id: number): Promise<ChecklistInspectionDetailDto | null> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      const inspection = await this.inspectionRepository.findOne({
        where: { id },
        relations: ['plantilla', 'equipo', 'trabajador'],
      });

      if (!inspection) {
        throw new NotFoundError('ChecklistInspection', id);
      }

      logger.info('Retrieved checklist inspection', {
        id,
        codigo: inspection.codigo,
        estado: inspection.estado,
        resultado_general: inspection.resultadoGeneral,
        equipo_operativo: inspection.equipoOperativo,
        context: 'ChecklistService.getInspectionById',
      });

      return toChecklistInspectionDetailDto(inspection);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving checklist inspection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.getInspectionById',
      });
      throw new DatabaseError(
        `Failed to retrieve checklist inspection with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get inspection with all results and item details
   *
   * Note: This method performs N+1 queries (loads items per result in a loop).
   * This is acceptable because result count is typically small (< 50 items per inspection).
   *
   * @param id - Inspection ID
   * @returns Inspection with results DTO
   * @throws {NotFoundError} If inspection does not exist
   * @throws {DatabaseError} If database query fails
   */
  async getInspectionWithResults(id: number): Promise<ChecklistInspectionWithResultsDto | null> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      const inspection = await this.inspectionRepository.findOne({
        where: { id },
        relations: ['plantilla', 'equipo', 'trabajador'],
      });

      if (!inspection) {
        throw new NotFoundError('ChecklistInspection', id);
      }

      const results = await this.resultRepository.find({
        where: { inspeccionId: id },
        order: { createdAt: 'ASC' },
      });

      // Load item details for each result (N+1 query pattern - acceptable)
      for (const result of results) {
        result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
      }

      logger.info('Retrieved checklist inspection with results', {
        id,
        codigo: inspection.codigo,
        results_count: results.length,
        context: 'ChecklistService.getInspectionWithResults',
      });

      return toChecklistInspectionWithResultsDto(inspection, results);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error retrieving checklist inspection with results', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.getInspectionWithResults',
      });
      throw new DatabaseError(
        `Failed to retrieve inspection with results for ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Create a new inspection
   *
   * Auto-generates codigo (INS-YYYY-NNNN) and counts total items from template.
   *
   * @param data - Inspection data (plantillaId, equipoId, trabajadorId required)
   * @returns Created inspection detail DTO
   * @throws {ValidationError} If required fields are missing
   * @throws {DatabaseError} If database operation fails
   */
  async createInspection(
    data: Partial<ChecklistInspection>
  ): Promise<ChecklistInspectionDetailDto> {
    try {
      // Validate required fields
      if (!data.plantillaId || !data.equipoId || !data.trabajadorId) {
        throw new ValidationError('Missing required fields for inspection creation', [
          { field: 'plantillaId', rule: 'required', message: 'Template ID is required' },
          { field: 'equipoId', rule: 'required', message: 'Equipment ID is required' },
          { field: 'trabajadorId', rule: 'required', message: 'Worker ID is required' },
        ]);
      }

      // TODO: [Phase 21 - Tenant Context] Add tenant assignment

      // Generate codigo
      const year = new Date().getFullYear();
      const count = await this.inspectionRepository.count();
      const codigo = `INS-${year}-${String(count + 1).padStart(4, '0')}`;

      // Count items from template
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

      logger.info('Created checklist inspection', {
        id: saved.id,
        codigo: saved.codigo,
        plantilla_id: saved.plantillaId,
        equipo_id: saved.equipoId,
        trabajador_id: saved.trabajadorId,
        items_total: itemsTotal,
        context: 'ChecklistService.createInspection',
      });

      return this.getInspectionById(saved.id) as Promise<ChecklistInspectionDetailDto>;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error creating checklist inspection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ChecklistService.createInspection',
      });
      throw new DatabaseError(
        'Failed to create checklist inspection',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Update an existing inspection
   *
   * @param id - Inspection ID
   * @param data - Fields to update
   * @returns Updated inspection detail DTO
   * @throws {NotFoundError} If inspection does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async updateInspection(
    id: number,
    data: Partial<ChecklistInspection>
  ): Promise<ChecklistInspectionDetailDto | null> {
    try {
      // Check if inspection exists
      const existing = await this.inspectionRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistInspection', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      await this.inspectionRepository.update(id, data);

      logger.info('Updated checklist inspection', {
        id,
        codigo: existing.codigo,
        updated_fields: Object.keys(data),
        context: 'ChecklistService.updateInspection',
      });

      return this.getInspectionById(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error updating checklist inspection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        data,
        context: 'ChecklistService.updateInspection',
      });
      throw new DatabaseError(
        `Failed to update checklist inspection with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Complete inspection and calculate results (SAFETY-CRITICAL)
   *
   * This method calculates conformity, detects critical failures, determines equipment
   * operability, and updates inspection state to COMPLETADO.
   *
   * ⚠️ CRITICAL: This operation is wrapped in a transaction to ensure atomicity.
   * If any step fails, the entire operation is rolled back.
   *
   * Business logic:
   * - Count conforme/no_conforme items
   * - Check for critical failures (conforme=false AND item.esCritico=true)
   * - Calculate resultado_general:
   *   - RECHAZADO: If critical failures exist
   *   - APROBADO_CON_OBSERVACIONES: If non-critical failures exist
   *   - APROBADO: If all items passed
   * - Set equipo_operativo flag (false if critical failures, true otherwise)
   *
   * @param id - Inspection ID
   * @returns Completed inspection detail DTO
   * @throws {NotFoundError} If inspection does not exist
   * @throws {DatabaseError} If transaction fails
   */
  async completeInspection(id: number): Promise<ChecklistInspectionDetailDto | null> {
    const queryRunner: QueryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if inspection exists
      const existing = await queryRunner.manager.findOne(ChecklistInspection, { where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistInspection', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      // Fetch results within transaction
      const results = await queryRunner.manager.find(ChecklistResult, {
        where: { inspeccionId: id },
      });

      const itemsConforme = results.filter((r) => r.conforme === true).length;
      const itemsNoConforme = results.filter((r) => r.conforme === false).length;

      // Check for critical failures
      let hasCriticalFailures = false;
      for (const result of results) {
        if (result.conforme === false) {
          const item = await queryRunner.manager.findOne(ChecklistItem, {
            where: { id: result.itemId },
          });
          if (item?.esCritico) {
            hasCriticalFailures = true;
            break;
          }
        }
      }

      // Calculate resultado_general and equipoOperativo
      let resultadoGeneral: any = 'APROBADO';
      let equipoOperativo = true;

      if (hasCriticalFailures) {
        resultadoGeneral = 'RECHAZADO';
        equipoOperativo = false;
      } else if (itemsNoConforme > 0) {
        resultadoGeneral = 'APROBADO_CON_OBSERVACIONES';
      }

      // Update inspection (atomic)
      await queryRunner.manager.update(ChecklistInspection, id, {
        estado: 'COMPLETADO',
        itemsConforme,
        itemsNoConforme,
        resultadoGeneral,
        equipoOperativo,
        completadoEn: new Date(),
      });

      await queryRunner.commitTransaction();

      logger.info('Completed checklist inspection', {
        id,
        codigo: existing.codigo,
        estado: 'COMPLETADO',
        resultado_general: resultadoGeneral,
        items_conforme: itemsConforme,
        items_no_conforme: itemsNoConforme,
        equipo_operativo: equipoOperativo,
        critical_failures: hasCriticalFailures,
        context: 'ChecklistService.completeInspection',
      });

      return this.getInspectionById(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error completing checklist inspection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.completeInspection',
      });
      throw new DatabaseError(
        `Failed to complete checklist inspection with ID ${id}`,
        DatabaseErrorType.TRANSACTION,
        error as Error
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Cancel inspection (soft delete)
   *
   * Sets estado to CANCELADO. Data is retained for audit.
   *
   * @param id - Inspection ID
   * @returns Cancelled inspection detail DTO
   * @throws {NotFoundError} If inspection does not exist
   * @throws {DatabaseError} If database operation fails
   */
  async cancelInspection(id: number): Promise<ChecklistInspectionDetailDto | null> {
    try {
      // Check if inspection exists
      const existing = await this.inspectionRepository.findOne({ where: { id } });
      if (!existing) {
        throw new NotFoundError('ChecklistInspection', id);
      }

      // TODO: [Phase 21 - Tenant Context] Verify tenant ownership

      await this.inspectionRepository.update(id, { estado: 'CANCELADO' });

      logger.info('Cancelled checklist inspection', {
        id,
        codigo: existing.codigo,
        estado: 'CANCELADO',
        context: 'ChecklistService.cancelInspection',
      });

      return this.getInspectionById(id);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error cancelling checklist inspection', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id,
        context: 'ChecklistService.cancelInspection',
      });
      throw new DatabaseError(
        `Failed to cancel checklist inspection with ID ${id}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ===== RESULTS =====

  /**
   * Save inspection result (upsert pattern)
   *
   * Creates new result if not exists, updates if exists (idempotent).
   * Composite key: inspeccionId + itemId.
   *
   * @param data - Result data (inspeccionId, itemId, conforme required)
   * @returns Saved result DTO
   * @throws {ValidationError} If required fields are missing
   * @throws {DatabaseError} If database operation fails
   */
  async saveResult(data: Partial<ChecklistResult>): Promise<ChecklistResultDto> {
    try {
      // Validate required fields
      if (!data.inspeccionId || !data.itemId) {
        throw new ValidationError('Missing required fields for result', [
          { field: 'inspeccionId', rule: 'required', message: 'Inspection ID is required' },
          { field: 'itemId', rule: 'required', message: 'Item ID is required' },
        ]);
      }

      // TODO: [Phase 21 - Tenant Context] Add tenant assignment

      // Upsert logic
      const existing = await this.resultRepository.findOne({
        where: {
          inspeccionId: data.inspeccionId,
          itemId: data.itemId,
        },
      });

      let result: ChecklistResult;
      let action: string;

      if (existing) {
        await this.resultRepository.update(existing.id, data);
        const updated = await this.resultRepository.findOne({ where: { id: existing.id } });
        if (!updated) {
          throw new DatabaseError('Failed to retrieve updated result', DatabaseErrorType.QUERY);
        }
        result = updated;
        action = 'updated';
      } else {
        result = this.resultRepository.create(data);
        result = await this.resultRepository.save(result);
        action = 'created';
      }

      // Load item details
      result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });

      logger.info('Saved checklist result', {
        id: result.id,
        inspeccion_id: result.inspeccionId,
        item_id: result.itemId,
        conforme: result.conforme,
        action,
        context: 'ChecklistService.saveResult',
      });

      return toChecklistResultDtoArray([result])[0];
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Error saving checklist result', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ChecklistService.saveResult',
      });
      throw new DatabaseError(
        'Failed to save checklist result',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  /**
   * Get all results for an inspection
   *
   * Note: This method performs N+1 queries (loads items per result in a loop).
   * This is acceptable because result count is typically small (< 50 items per inspection).
   *
   * @param inspeccionId - Inspection ID
   * @returns Array of result DTOs with item details
   * @throws {DatabaseError} If database query fails
   */
  async getResultsByInspection(inspeccionId: number): Promise<ChecklistResultDto[]> {
    try {
      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      const results = await this.resultRepository.find({
        where: { inspeccionId },
        order: { createdAt: 'ASC' },
      });

      // Load item details for each result (N+1 query pattern - acceptable)
      for (const result of results) {
        result.item = await this.itemRepository.findOne({ where: { id: result.itemId } });
      }

      logger.info('Retrieved checklist results by inspection', {
        inspeccion_id: inspeccionId,
        count: results.length,
        context: 'ChecklistService.getResultsByInspection',
      });

      return toChecklistResultDtoArray(results);
    } catch (error) {
      logger.error('Error retrieving checklist results', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        inspeccion_id: inspeccionId,
        context: 'ChecklistService.getResultsByInspection',
      });
      throw new DatabaseError(
        `Failed to retrieve results for inspection ${inspeccionId}`,
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }

  // ===== STATS =====

  /**
   * Get inspection statistics (KPIs)
   *
   * Calculates aggregated metrics including conformity rate, completion rate,
   * and equipment operability status.
   *
   * TODO: Add date range filtering using QueryBuilder
   *
   * @param filters - Optional filters (startDate, endDate not yet implemented)
   * @returns Inspection statistics DTO
   * @throws {DatabaseError} If database query fails
   */
  async getInspectionStats(filters?: any): Promise<ChecklistInspectionStatsDto> {
    try {
      const where: any = {};

      // TODO: [Phase 21 - Tenant Context] Add tenant filtering
      // TODO: Implement date range filtering with QueryBuilder
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

      const stats = {
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

      logger.info('Retrieved checklist inspection statistics', {
        ...stats,
        filters,
        context: 'ChecklistService.getInspectionStats',
      });

      return stats;
    } catch (error) {
      logger.error('Error retrieving checklist inspection statistics', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ChecklistService.getInspectionStats',
      });
      throw new DatabaseError(
        'Failed to retrieve checklist inspection statistics',
        DatabaseErrorType.QUERY,
        error as Error
      );
    }
  }
}
