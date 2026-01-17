/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from '../config/database.config';
import { Proyecto } from '../models/project.model';
import { Repository } from 'typeorm';
import { toProjectDto, fromProjectDto, ProjectDto } from '../types/dto/project.dto';
import Logger from '../utils/logger';

export interface CreateProjectDto {
  // Frontend sends camelCase field names
  code: string;
  name: string;
  description?: string;
  location?: string;
  startDate?: string; // Frontend sends camelCase
  endDate?: string; // Frontend sends camelCase
  start_date?: string; // Also support snake_case
  end_date?: string; // Also support snake_case
  status?: string;
  client?: string;
  budget?: number;
  currency?: string;
  presupuesto?: number; // Also support Spanish
  cliente?: string; // Also support Spanish
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

export class ProjectService {
  private get repository(): Repository<Proyecto> {
    return AppDataSource.getRepository(Proyecto);
  }

  /**
   * Get all projects (optionally filtered by user)
   */
  async findAll(filters?: string | { status?: string; search?: string }): Promise<ProjectDto[]> {
    // Handle both old string userId format and new filter object format
    if (typeof filters === 'string') {
      return this.findAllByUser(filters);
    }
    return this.findAllWithFilters(filters);
  }

  async findAllByUser(userId?: string): Promise<ProjectDto[]> {
    try {
      let query = this.repository
        .createQueryBuilder('p')
        .where('p.isActive = :isActive', { isActive: true })
        .orderBy('p.nombre', 'ASC');

      if (userId) {
        // Get only projects assigned to the user
        query = query
          .innerJoin('sistema.user_projects', 'up', 'p.id = up.project_id')
          .andWhere('up.user_id = :userId', { userId: parseInt(userId) });
      }

      const projects = await query.getMany();
      return projects.map((p) => toProjectDto(p));
    } catch (error) {
      Logger.error('Error finding projects by user', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'ProjectService.findAllByUser',
      });
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  async findAllWithFilters(filters?: { status?: string; search?: string }): Promise<ProjectDto[]> {
    try {
      const query = this.repository
        .createQueryBuilder('p')
        .where('p.isActive = :isActive', { isActive: true });

      if (filters?.status) {
        query.andWhere('p.estado = :status', { status: filters.status });
      }

      if (filters?.search) {
        query.andWhere('(p.nombre ILIKE :search OR p.codigo ILIKE :search)', {
          search: `%${filters.search}%`,
        });
      }

      query.orderBy('p.nombre', 'ASC');

      const projects = await query.getMany();
      return projects.map((p) => toProjectDto(p));
    } catch (error) {
      Logger.error('Error finding projects with filters', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        filters,
        context: 'ProjectService.findAllWithFilters',
      });
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  /**
   * Get project by ID
   */
  async findById(projectId: string): Promise<ProjectDto | null> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId), isActive: true },
        relations: ['creator', 'updater'],
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return toProjectDto(project);
    } catch (error) {
      Logger.error('Error finding project by ID', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.findById',
      });
      throw error;
    }
  }

  /**
   * Get project by code
   */
  async findByCode(code: string): Promise<ProjectDto | null> {
    try {
      const project = await this.repository.findOne({
        where: { codigo: code, isActive: true },
        relations: ['creator', 'updater'],
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return toProjectDto(project);
    } catch (error) {
      Logger.error('Error finding project by code', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        code,
        context: 'ProjectService.findByCode',
      });
      throw error;
    }
  }

  /**
   * Create new project
   */
  async create(data: CreateProjectDto): Promise<ProjectDto> {
    try {
      // Map frontend camelCase fields to database snake_case Spanish columns
      // Support both English camelCase and Spanish snake_case input
      const projectData: Partial<ProjectDto> = {
        codigo: (data as any).codigo || data.code,
        nombre: (data as any).nombre || data.name,
        descripcion: (data as any).descripcion || data.description || null,
        ubicacion: (data as any).ubicacion || data.location || null,
        fecha_inicio: (data as any).fecha_inicio || data.startDate || data.start_date || null,
        fecha_fin: (data as any).fecha_fin || data.endDate || data.end_date || null,
        presupuesto: (data as any).presupuesto || data.budget || null,
        cliente: (data as any).cliente || data.client || null,
        estado: (data as any).estado || data.status || 'PLANIFICACION',
        is_active: true,
      };

      // Map status values from frontend display values to database values
      const statusMapping: { [key: string]: string } = {
        Planificación: 'PLANIFICACION',
        'En Ejecución': 'ACTIVO',
        Suspendido: 'PAUSADO',
        Finalizado: 'COMPLETADO',
        PLANIFICACION: 'PLANIFICACION',
        ACTIVO: 'ACTIVO',
        PAUSADO: 'PAUSADO',
        COMPLETADO: 'COMPLETADO',
        CANCELADO: 'CANCELADO',
      };
      projectData.estado = statusMapping[projectData.estado!] || projectData.estado;

      const entity = this.repository.create(fromProjectDto(projectData));
      const saved = await this.repository.save(entity);

      return toProjectDto(saved);
    } catch (error) {
      Logger.error('Error creating project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        data,
        context: 'ProjectService.create',
      });
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update project
   */
  async update(projectId: string, data: UpdateProjectDto): Promise<ProjectDto> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Map frontend camelCase and snake_case DTO fields to Spanish column names
      // Support both English camelCase and Spanish snake_case input
      const updateData: Partial<ProjectDto> = {};

      if (data.code !== undefined || (data as any).codigo !== undefined)
        updateData.codigo = (data as any).codigo || data.code;
      if (data.name !== undefined || (data as any).nombre !== undefined)
        updateData.nombre = (data as any).nombre || data.name;
      if (data.description !== undefined || (data as any).descripcion !== undefined)
        updateData.descripcion = (data as any).descripcion || data.description;
      if (data.location !== undefined || (data as any).ubicacion !== undefined)
        updateData.ubicacion = (data as any).ubicacion || data.location;
      if (
        data.startDate !== undefined ||
        data.start_date !== undefined ||
        (data as any).fecha_inicio !== undefined
      )
        updateData.fecha_inicio = (data as any).fecha_inicio || data.startDate || data.start_date;
      if (
        data.endDate !== undefined ||
        data.end_date !== undefined ||
        (data as any).fecha_fin !== undefined
      )
        updateData.fecha_fin = (data as any).fecha_fin || data.endDate || data.end_date;
      if (data.status !== undefined || (data as any).estado !== undefined)
        updateData.estado = (data as any).estado || data.status;
      if (data.client !== undefined || data.cliente !== undefined)
        updateData.cliente = data.cliente || data.client;
      if (data.budget !== undefined || data.presupuesto !== undefined)
        updateData.presupuesto = data.presupuesto || data.budget;

      // Map status values from frontend display values to database values
      const statusMapping: { [key: string]: string } = {
        Planificación: 'PLANIFICACION',
        'En Ejecución': 'ACTIVO',
        Suspendido: 'PAUSADO',
        Finalizado: 'COMPLETADO',
      };

      if (updateData.estado && statusMapping[updateData.estado]) {
        updateData.estado = statusMapping[updateData.estado];
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error('No fields to update');
      }

      // Merge changes
      const entityChanges = fromProjectDto(updateData);
      Object.assign(project, entityChanges);

      const saved = await this.repository.save(project);
      return toProjectDto(saved);
    } catch (error) {
      Logger.error('Error updating project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        data,
        context: 'ProjectService.update',
      });
      throw error;
    }
  }

  /**
   * Soft delete project
   */
  async delete(projectId: string): Promise<void> {
    try {
      const project = await this.repository.findOne({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      project.isActive = false;
      await this.repository.save(project);
    } catch (error) {
      Logger.error('Error deleting project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.delete',
      });
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Assign user to project
   *
   * ✅ MIGRATED: FROM pool.query to AppDataSource.query
   *
   * Note: sistema.user_projects table may not exist in legacy schema.
   * Returns success but doesn't persist (future enhancement).
   */
  async assignUser(projectId: string, userId: string, _rolEnProyecto?: string): Promise<void> {
    try {
      // Check if table exists first
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        Logger.warn('User assignment table missing - operation not persisted', {
          table: 'sistema.user_projects',
          operation: 'assign',
          projectId,
          userId,
          context: 'ProjectService.assignUser',
        });
        return; // Silently succeed without persisting
      }

      // Check if assignment already exists
      const checkQuery = `
        SELECT user_id FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      const checkResult = await AppDataSource.query(checkQuery, [userId, projectId]);

      if (checkResult.length > 0) {
        throw new Error('User already assigned to this project');
      }

      const insertQuery = `
        INSERT INTO sistema.user_projects (user_id, project_id, is_default)
        VALUES ($1, $2, false)
      `;

      await AppDataSource.query(insertQuery, [userId, projectId]);
    } catch (error) {
      Logger.error('Error assigning user to project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        userId,
        context: 'ProjectService.assignUser',
      });
      throw error;
    }
  }

  /**
   * Unassign user from project
   *
   * ✅ MIGRATED: FROM pool.query to AppDataSource.query
   *
   * Note: sistema.user_projects table may not exist in legacy schema.
   */
  async unassignUser(projectId: string, userId: string): Promise<void> {
    try {
      // Check if table exists first
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        Logger.warn('User assignment table missing - operation not persisted', {
          table: 'sistema.user_projects',
          operation: 'unassign',
          projectId,
          userId,
          context: 'ProjectService.unassignUser',
        });
        return; // Silently succeed
      }

      const query = `
        DELETE FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      await AppDataSource.query(query, [userId, projectId]);
    } catch (error) {
      Logger.error('Error unassigning user from project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        userId,
        context: 'ProjectService.unassignUser',
      });
      throw new Error('Failed to unassign user from project');
    }
  }

  /**
   * Get users assigned to a project
   *
   * ✅ MIGRATED: FROM pool.query to AppDataSource.query
   *
   * Note: sistema.user_projects table may not exist in legacy schema.
   * Returns empty array if table doesn't exist.
   */
  async getProjectUsers(projectId: string) {
    try {
      // Check if table exists first
      const tableCheck = await AppDataSource.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'sistema' AND table_name = 'user_projects'
        ) as table_exists
      `);

      if (!tableCheck[0]?.table_exists) {
        Logger.warn('User assignment table missing - returning empty array', {
          table: 'sistema.user_projects',
          operation: 'getProjectUsers',
          projectId,
          context: 'ProjectService.getProjectUsers',
        });
        return []; // Return empty array instead of error
      }

      const query = `
        SELECT 
          u.id, 
          u.nombre_usuario as username, 
          u.nombres as first_name, 
          u.apellidos as last_name, 
          u.correo_electronico as email,
          up.is_default
        FROM sistema.user_projects up
        JOIN sistema.usuario u ON up.user_id = u.id
        WHERE up.project_id = $1
        ORDER BY u.apellidos, u.nombres
      `;

      const results = await AppDataSource.query(query, [projectId]);
      return results;
    } catch (error) {
      Logger.error('Error getting project users', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId,
        context: 'ProjectService.getProjectUsers',
      });
      // Return empty array instead of throwing to prevent API failures
      return [];
    }
  }
}
