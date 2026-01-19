import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Equipment } from '../models/equipment.model';
import { Trabajador } from '../models/trabajador.model';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { Project } from '../models/project.model';
import { Repository } from 'typeorm';
import { ModuleWithPermissions } from '../models/module.model';
import Logger from '../utils/logger';
import { NotFoundError } from '../errors/http.errors';
import {
  UserInfoDto,
  DashboardStatsDto,
  ProjectSwitchResponseDto,
} from '../types/dto/dashboard.dto';

/**
 * Dashboard Service
 * Refactored to follow SERVICE_LAYER_STANDARDS.md
 *
 * Standards Applied:
 * - ✅ Custom error classes (NotFoundError)
 * - ✅ Return DTOs (not raw objects)
 * - ✅ Comprehensive logging (info + error)
 * - ⚠️ Tenant context: DEFERRED (schema lacks tenant_id fields)
 * - ✅ Business rule documentation
 *
 * TODO: Add tenant isolation when schema migration is complete
 * Required: Add tenant_id to User, Equipment, Trabajador, DailyReport, Project models
 *
 * Note: Module-related methods (getModulesForUser) are marked as not implemented
 * because the required tables (sistema.modulo, usuario_modulo_permiso, module_pages)
 * do not exist in the database. These are planned features.
 */
export class DashboardService {
  private get userRepository(): Repository<User> {
    return AppDataSource.getRepository(User);
  }

  private get equipmentRepository(): Repository<Equipment> {
    return AppDataSource.getRepository(Equipment);
  }

  private get trabajadorRepository(): Repository<Trabajador> {
    return AppDataSource.getRepository(Trabajador);
  }

  private get dailyReportRepository(): Repository<DailyReport> {
    return AppDataSource.getRepository(DailyReport);
  }

  private get projectRepository(): Repository<Project> {
    return AppDataSource.getRepository(Project);
  }

  /**
   * Helper: Get date range for today (midnight to midnight)
   */
  private getTodayDateRange(): { start: Date; end: Date } {
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return { start, end };
  }

  /**
   * Get all modules with permissions for a specific user
   *
   * @deprecated NOT IMPLEMENTED - Required tables do not exist
   * Tables needed: sistema.modulo, sistema.usuario_modulo_permiso, sistema.module_pages
   *
   * Returns empty array until module system is implemented
   *
   * TODO: Add tenantId parameter when implemented
   */
  async getModulesForUser(userId: string): Promise<ModuleWithPermissions[]> {
    Logger.warn('Module system not implemented', {
      message:
        'Required tables (sistema.modulo, usuario_modulo_permiso, module_pages) do not exist',
      userId,
      context: 'DashboardService.getModulesForUser',
    });

    // Return empty array instead of throwing error for graceful degradation
    return [];
  }

  /**
   * Get user information with roles and projects
   *
   * Business Rules:
   * - User must exist in database
   * - Returns roles from many-to-many relationship (usuario_rol)
   * - Falls back to single rol relationship if no many-to-many roles
   * - Returns projects where user is creator or updater (workaround - no junction table)
   * - active_project is always null (field doesn't exist yet in schema)
   *
   * TODO: Add tenantId parameter and filter by tenant_id when schema is updated
   *
   * @param userId - User ID to fetch info for
   * @returns User info with roles and assigned projects
   * @throws NotFoundError if user doesn't exist
   */
  async getUserInfo(userId: string): Promise<UserInfoDto> {
    Logger.info('Fetching user info', {
      userId,
      context: 'DashboardService.getUserInfo',
    });

    try {
      // TODO: Add tenant_id filter when User model has tenant_id field
      const user = await this.userRepository.findOne({
        where: { id: parseInt(userId) },
        relations: ['roles', 'rol', 'unidadOperativa'],
      });

      if (!user) {
        throw new NotFoundError('User', userId);
      }

      // Get role names
      const roles = user.roles?.map((r) => r.name) || [];

      // If no roles in many-to-many, use the single rol relationship
      if (roles.length === 0 && user.rol) {
        roles.push(user.rol.name);
      }

      // Get all assigned projects from proyectos.edt where user is related
      // Note: There's no user_projects junction table, so we'll query projects
      // where the user is creator or updater
      // TODO: Add tenant_id filter when Project model has tenant_id field
      const assignedProjects = await this.projectRepository
        .createQueryBuilder('p')
        .where('p.createdBy = :userId OR p.updatedBy = :userId', {
          userId: parseInt(userId),
        })
        .andWhere('p.isActive = :isActive', { isActive: true })
        .orderBy('p.nombre', 'ASC')
        .select([
          'p.id as id',
          'p.codigo as codigo',
          'p.nombre as nombre',
          'p.descripcion as descripcion',
          'p.estado as estado',
          'p.createdAt as assigned_date',
        ])
        .getRawMany();

      // Note: active_project_id field doesn't exist in sistema.usuario table
      // This is a planned feature. For now, return null for active_project
      const active_project = null;

      const result: UserInfoDto = {
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          roles: roles,
        },
        active_project,
        assigned_projects: assignedProjects,
      };

      Logger.info('User info fetched successfully', {
        userId,
        roleCount: roles.length,
        projectCount: assignedProjects.length,
        context: 'DashboardService.getUserInfo',
      });

      return result;
    } catch (error) {
      // Re-throw NotFoundError as-is
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and re-throw unexpected errors
      Logger.error('Error fetching user info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'DashboardService.getUserInfo',
      });
      throw error;
    }
  }

  /**
   * Switch user's active project
   *
   * Business Rules:
   * - Project must exist
   * - Returns project info but doesn't update user record (field doesn't exist)
   * - TODO: Verify user has access to project when user_projects table exists
   * - TODO: Update user.active_project_id when field is added
   *
   * @deprecated NOT IMPLEMENTED - Required fields/tables do not exist
   * The sistema.usuario table does not have an active_project_id column
   * The sistema.user_projects table does not exist
   *
   * This is a planned feature.
   *
   * TODO: Add tenantId parameter and verify project belongs to tenant
   *
   * @param userId - User ID requesting switch
   * @param projectId - Project ID to switch to
   * @returns Project info with not-implemented message
   * @throws NotFoundError if project doesn't exist
   */
  async switchProject(userId: string, projectId: string): Promise<ProjectSwitchResponseDto> {
    Logger.warn('Active project switching not implemented', {
      message: 'Required: sistema.usuario.active_project_id column and sistema.user_projects table',
      userId,
      projectId,
      context: 'DashboardService.switchProject',
    });

    try {
      // TODO: Add tenant_id filter when Project model has tenant_id field
      const project = await this.projectRepository.findOne({
        where: { id: parseInt(projectId) },
      });

      if (!project) {
        throw new NotFoundError('Project', projectId);
      }

      // Return project but don't actually switch (field doesn't exist)
      const result: ProjectSwitchResponseDto = {
        id: project.id,
        codigo: project.codigo,
        nombre: project.nombre,
        descripcion: project.descripcion,
        estado: project.estado,
        message: 'Project switching not yet implemented. Feature requires database schema updates.',
      };

      Logger.info('Project switch requested (not implemented)', {
        userId,
        projectId,
        projectName: project.nombre,
        context: 'DashboardService.switchProject',
      });

      return result;
    } catch (error) {
      // Re-throw NotFoundError as-is
      if (error instanceof NotFoundError) {
        throw error;
      }

      // Log and re-throw unexpected errors
      Logger.error('Error switching project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        projectId,
        context: 'DashboardService.switchProject',
      });
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   *
   * Business Rules:
   * - Counts only active equipment (is_active = true)
   * - Active equipment: status in ['disponible', 'en_uso', 'operativo']
   * - Counts only active operators (isActive = true)
   * - Pending reports: reports created today (midnight to midnight)
   * - projectId filter ignored (equipment table lacks project_id column)
   *
   * TODO: Add tenantId parameter and filter all queries by tenant_id
   * TODO: Implement project filtering when equipment-project relationships are clarified
   *
   * Fully migrated to TypeORM - ELIMINATED 4 RAW SQL QUERIES
   *
   * Note: projectId filter is ignored as equipo.equipo table doesn't have a project_id column.
   * Equipment-project relationships are managed through equipo.equipo_edt (EquipmentAssignment).
   *
   * @param userId - User ID requesting stats (for logging)
   * @param _projectId - Project ID filter (currently ignored - see note above)
   * @returns Dashboard statistics
   */
  async getDashboardStats(userId: string, _projectId?: string): Promise<DashboardStatsDto> {
    Logger.info('Fetching dashboard stats', {
      userId,
      projectId: _projectId,
      context: 'DashboardService.getDashboardStats',
    });

    try {
      const stats: DashboardStatsDto = {
        total_equipment: 0,
        active_equipment: 0,
        total_operators: 0,
        pending_reports: 0,
      };

      // Equipment stats - using TypeORM simple count
      // Note: Project filtering not implemented as equipment table lacks project_id
      // TODO: Add tenant_id filter when Equipment model has tenant_id field
      stats.total_equipment = await this.equipmentRepository.count({
        where: { is_active: true },
      });

      // Active equipment (in use or available) - using TypeORM QueryBuilder
      // TODO: Add tenant_id filter when Equipment model has tenant_id field
      const activeEquipmentQuery = this.equipmentRepository
        .createQueryBuilder('e')
        .where('e.is_active = :isActive', { isActive: true })
        .andWhere('e.estado IN (:...statuses)', {
          statuses: ['disponible', 'en_uso', 'operativo'],
        });

      stats.active_equipment = await activeEquipmentQuery.getCount();

      // Operators count - using TypeORM simple count
      // TODO: Add tenant_id filter when Trabajador model has tenant_id field
      stats.total_operators = await this.trabajadorRepository.count({
        where: { isActive: true },
      });

      // Pending reports (from today) - using TypeORM QueryBuilder with date
      const { start, end } = this.getTodayDateRange();

      // TODO: Add tenant_id filter when DailyReport model has tenant_id field
      stats.pending_reports = await this.dailyReportRepository
        .createQueryBuilder('dr')
        .where('dr.createdAt >= :start', { start })
        .andWhere('dr.createdAt < :end', { end })
        .getCount();

      Logger.info('Dashboard stats fetched successfully', {
        userId,
        stats,
        context: 'DashboardService.getDashboardStats',
      });

      return stats;
    } catch (error) {
      Logger.error('Error fetching dashboard stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'DashboardService.getDashboardStats',
      });
      throw error;
    }
  }
}
