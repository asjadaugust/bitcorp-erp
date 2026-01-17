import { AppDataSource } from '../config/database.config';
import { User } from '../models/user.model';
import { Equipment } from '../models/equipment.model';
import { Trabajador } from '../models/trabajador.model';
import { DailyReport } from '../models/daily-report-typeorm.model';
import { Project } from '../models/project.model';
import { Repository } from 'typeorm';
import { ModuleWithPermissions } from '../models/module.model';
import Logger from '../utils/logger';

/**
 * Dashboard Service
 * Migrated from raw SQL to TypeORM
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
   * Get all modules with permissions for a specific user
   *
   * @deprecated NOT IMPLEMENTED - Required tables do not exist
   * Tables needed: sistema.modulo, sistema.usuario_modulo_permiso, sistema.module_pages
   *
   * Returns empty array until module system is implemented
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
   * Migrated to TypeORM
   */
  async getUserInfo(userId: string) {
    try {
      const user = await this.userRepository.findOne({
        where: { id: parseInt(userId) },
        relations: ['roles', 'rol', 'unidadOperativa'],
      });

      if (!user) {
        throw new Error('User not found');
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
      const assignedProjects = await this.projectRepository
        .createQueryBuilder('p')
        .where('p.createdBy = :userId OR p.updatedBy = :userId', {
          userId: parseInt(userId),
        })
        .andWhere('p.isActive = :isActive', { isActive: true })
        .orderBy('p.nombre', 'ASC')
        .select([
          'p.id as id',
          'p.codigo as codigo_proyecto',
          'p.nombre as nombre',
          'p.descripcion as descripcion',
          'p.estado as estado',
          'p.createdAt as assigned_date',
        ])
        .getRawMany();

      // Note: active_project_id field doesn't exist in sistema.usuario table
      // This is a planned feature. For now, return null for active_project
      const active_project = null;

      return {
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
    } catch (error) {
      Logger.error('Error fetching user info', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'DashboardService.getUserInfo',
      });
      throw new Error('Failed to fetch user information');
    }
  }

  /**
   * Switch user's active project
   *
   * @deprecated NOT IMPLEMENTED - Required fields/tables do not exist
   * The sistema.usuario table does not have an active_project_id column
   * The sistema.user_projects table does not exist
   *
   * This is a planned feature.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async switchProject(userId: string, projectId: string): Promise<any> {
    Logger.warn('Active project switching not implemented', {
      message: 'Required: sistema.usuario.active_project_id column and sistema.user_projects table',
      userId,
      projectId,
      context: 'DashboardService.switchProject',
    });

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Return project but don't actually switch (field doesn't exist)
    return {
      id: project.id,
      codigo: project.codigo,
      nombre: project.nombre,
      descripcion: project.descripcion,
      estado: project.estado,
      message: 'Project switching not yet implemented. Feature requires database schema updates.',
    };
  }

  /**
   * Get dashboard statistics
   * Fully migrated to TypeORM - ELIMINATED 4 RAW SQL QUERIES
   *
   * Note: projectId filter is ignored as equipo.equipo table doesn't have a project_id column.
   * Equipment-project relationships are managed through equipo.equipo_edt (EquipmentAssignment).
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getDashboardStats(userId: string, _projectId?: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stats: any = {
        total_equipment: 0,
        active_equipment: 0,
        total_operators: 0,
        pending_reports: 0,
      };

      // Equipment stats - using TypeORM simple count
      // Note: Project filtering not implemented as equipment table lacks project_id
      stats.total_equipment = await this.equipmentRepository.count({
        where: { is_active: true },
      });

      // Active equipment (in use or available) - using TypeORM QueryBuilder
      const activeEquipmentQuery = this.equipmentRepository
        .createQueryBuilder('e')
        .where('e.is_active = :isActive', { isActive: true })
        .andWhere('e.estado IN (:...statuses)', {
          statuses: ['disponible', 'en_uso', 'operativo'],
        });

      stats.active_equipment = await activeEquipmentQuery.getCount();

      // Operators count - using TypeORM simple count
      stats.total_operators = await this.trabajadorRepository.count({
        where: { isActive: true },
      });

      // Pending reports (from today) - using TypeORM QueryBuilder with date
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      stats.pending_reports = await this.dailyReportRepository
        .createQueryBuilder('dr')
        .where('dr.createdAt >= :today', { today })
        .andWhere('dr.createdAt < :tomorrow', { tomorrow })
        .getCount();

      return stats;
    } catch (error) {
      Logger.error('Error fetching dashboard stats', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        context: 'DashboardService.getDashboardStats',
      });
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}
