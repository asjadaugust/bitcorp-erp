import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import {
  Company,
  CreateCompanyDto,
  UpdateCompanyDto,
  UserProject,
} from '../models/company-entity.model';
import { Proyecto } from '../models/project.model';
import Logger from '../utils/logger';

/**
 * TenantService - Multi-Tenancy and User-Project Management
 *
 * ⚠️ IMPLEMENTATION STATUS:
 * - Company management methods: NOT IMPLEMENTED (table doesn't exist)
 * - User-project assignments: NOT IMPLEMENTED (table doesn't exist)
 * - getUserProjects(): PARTIALLY WORKING (uses existing tables with fallback)
 * - switchUserProject(): NOT IMPLEMENTED (column doesn't exist)
 *
 * See company-entity.model.ts for required database migrations.
 */
export class TenantService {
  private get companyRepository(): Repository<Company> {
    return AppDataSource.getRepository(Company);
  }

  private get userProjectRepository(): Repository<UserProject> {
    return AppDataSource.getRepository(UserProject);
  }

  private get projectRepository(): Repository<Proyecto> {
    return AppDataSource.getRepository(Proyecto);
  }

  /**
   * Create a new company
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: administracion.empresa
   *
   * Returns 501 Not Implemented until table is created
   */
  async createCompany(_data: CreateCompanyDto): Promise<Company> {
    Logger.warn('createCompany called but table does not exist', {
      message: 'administracion.empresa table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      context: 'TenantService.createCompany',
    });

    throw new Error(
      'NOT_IMPLEMENTED: Company management requires administracion.empresa table. See company-entity.model.ts for migration.'
    );
  }

  /**
   * Get all companies
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: administracion.empresa
   *
   * Returns empty array until table is created
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllCompanies(): Promise<any[]> {
    Logger.warn('getAllCompanies called but table does not exist', {
      message: 'administracion.empresa table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      context: 'TenantService.getAllCompanies',
    });

    return [];
  }

  /**
   * Get company by ID
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: administracion.empresa
   *
   * Returns null until table is created
   */
  async getCompanyById(id: string): Promise<Company | null> {
    Logger.warn('getCompanyById called but table does not exist', {
      message: 'administracion.empresa table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      id,
      context: 'TenantService.getCompanyById',
    });

    return null;
  }

  /**
   * Get company by subdomain
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: administracion.empresa
   *
   * Returns null until table is created
   */
  async getCompanyBySubdomain(subdomain: string): Promise<Company | null> {
    Logger.warn('getCompanyBySubdomain called but table does not exist', {
      message: 'administracion.empresa table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      subdomain,
      context: 'TenantService.getCompanyBySubdomain',
    });

    return null;
  }

  /**
   * Update company
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: administracion.empresa
   *
   * Returns error until table is created
   */
  async updateCompany(id: string, _data: UpdateCompanyDto): Promise<Company> {
    Logger.warn('updateCompany called but table does not exist', {
      message: 'administracion.empresa table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      id,
      context: 'TenantService.updateCompany',
    });

    throw new Error(
      'NOT_IMPLEMENTED: Company management requires administracion.empresa table. See company-entity.model.ts for migration.'
    );
  }

  /**
   * Get projects for a company
   *
   * @deprecated NOT IMPLEMENTED - Required column does not exist
   * Column needed: proyectos.edt.company_id (exists but not used consistently)
   *
   * Returns empty array until company management is fully implemented
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCompanyProjects(companyId: string): Promise<any[]> {
    Logger.warn('getCompanyProjects called but not implemented', {
      message: 'Company management is not implemented',
      reference: 'Company-project associations need to be established',
      companyId,
      context: 'TenantService.getCompanyProjects',
    });

    return [];
  }

  /**
   * Get users for a company (through projects)
   *
   * @deprecated NOT IMPLEMENTED - Required tables do not exist
   * Tables needed: administracion.empresa, sistema.user_projects
   *
   * Returns empty array until tables are created
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCompanyUsers(companyId: string): Promise<any[]> {
    Logger.warn('getCompanyUsers called but table does not exist', {
      message: 'sistema.user_projects table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      companyId,
      context: 'TenantService.getCompanyUsers',
    });

    return [];
  }

  /**
   * Assign user to project
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: sistema.user_projects
   *
   * Returns error until table is created
   */
  async assignUserToProject(
    userId: string,
    projectId: string,
    roleInProject: string = 'user'
  ): Promise<void> {
    Logger.warn('assignUserToProject called but table does not exist', {
      message: 'sistema.user_projects table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      userId,
      projectId,
      roleInProject,
      context: 'TenantService.assignUserToProject',
    });

    throw new Error(
      'NOT_IMPLEMENTED: User-project assignments require sistema.user_projects table. See company-entity.model.ts for migration.'
    );
  }

  /**
   * Remove user from project
   *
   * @deprecated NOT IMPLEMENTED - Required table does not exist
   * Table needed: sistema.user_projects
   *
   * Returns error until table is created
   */
  async removeUserFromProject(userId: string, projectId: string): Promise<void> {
    Logger.warn('removeUserFromProject called but table does not exist', {
      message: 'sistema.user_projects table does not exist',
      reference: 'See models/company-entity.model.ts for required migration',
      userId,
      projectId,
      context: 'TenantService.removeUserFromProject',
    });

    throw new Error(
      'NOT_IMPLEMENTED: User-project assignments require sistema.user_projects table. See company-entity.model.ts for migration.'
    );
  }

  /**
   * Get user's projects
   *
   * ✅ MIGRATED TO TYPEORM - Using existing tables with fallback strategy
   *
   * Strategy: Query proyectos.edt where user is creator or updater
   * This provides basic project access until user_projects table is created
   *
   * @param userId - User ID to fetch projects for
   * @returns Array of projects the user has access to
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserProjects(userId: string): Promise<any[]> {
    Logger.debug('Fetching projects for user', {
      userId,
      context: 'TenantService.getUserProjects',
    });

    try {
      // Query projects where user is creator or updater (since user_projects table doesn't exist)
      const projects = await this.projectRepository
        .createQueryBuilder('p')
        .where('p.creado_por = :userId OR p.actualizado_por = :userId', {
          userId: parseInt(userId),
        })
        .andWhere('p.is_active = true')
        .andWhere('p.estado != :estado', { estado: 'CANCELADO' })
        .orderBy('p.nombre', 'ASC')
        .getMany();

      Logger.debug('Found projects for user', {
        userId,
        projectCount: projects.length,
        context: 'TenantService.getUserProjects',
      });

      // Map to expected format
      return projects.map((p) => this.mapToProject(p));
    } catch (err) {
      Logger.error('Error in getUserProjects', {
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
        userId,
        context: 'TenantService.getUserProjects',
      });
      // Return empty array to prevent login failures
      return [];
    }
  }

  /**
   * Switch user's active project
   *
   * @deprecated NOT IMPLEMENTED - Required column does not exist
   * Column needed: sistema.usuario.active_project_id
   *
   * Currently logs warning and does nothing
   */
  async switchUserProject(userId: string, projectId: string): Promise<void> {
    Logger.warn('switchUserProject called but column does not exist', {
      message: 'sistema.usuario.active_project_id column does not exist',
      reference: 'Add active_project_id column to sistema.usuario to enable this feature',
      userId,
      projectId,
      context: 'TenantService.switchUserProject',
    });

    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { id: parseInt(projectId) },
    });

    if (!project) {
      throw new Error('Project not found');
    }

    // Don't throw error, just log debug message (graceful degradation)
    Logger.debug('Project exists but cannot switch - column missing', {
      projectId,
      userId,
      context: 'TenantService.switchUserProject',
    });
  }

  /**
   * Map Proyecto entity to project DTO format
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToProject(project: Proyecto): any {
    return {
      id: project.id,
      name: project.nombre,
      code: project.codigo,
      description: project.descripcion,
      status: project.estado,
      start_date: project.fechaInicio,
      end_date: project.fechaFin,
      location: project.ubicacion,
      budget: project.presupuesto,
      client: project.cliente,
      is_active: project.isActive,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };
  }
}
