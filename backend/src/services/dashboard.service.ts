import db from '../config/database.config';
import { ModuleWithPermissions, Module, UserModulePermission, ModulePage } from '../models/module.model';
import { Project, UserProject } from '../models/project.model';

export class DashboardService {
  /**
   * Get all modules with permissions for a specific user
   */
  async getModulesForUser(userId: string): Promise<ModuleWithPermissions[]> {
    try {
      const query = `
        SELECT 
          m.*,
          ump.puede_ver,
          ump.puede_crear,
          ump.puede_editar,
          ump.puede_eliminar,
          ump.puede_aprobar
        FROM modules m
        LEFT JOIN user_module_permissions ump 
          ON m.id = ump.module_id AND ump.user_id = $1
        WHERE m.is_active = true
        ORDER BY m.nivel, m.orden
      `;
      
      const result = await db.query(query, [userId]);
      
      const modules: ModuleWithPermissions[] = result.rows.map(row => ({
        id: row.id,
        codigo: row.codigo,
        nombre_es: row.nombre_es,
        nombre_en: row.nombre_en,
        descripcion: row.descripcion,
        icono: row.icono,
        ruta: row.ruta,
        nivel: row.nivel,
        orden: row.orden,
        parent_id: row.parent_id,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        permissions: {
          puede_ver: row.puede_ver || false,
          puede_crear: row.puede_crear || false,
          puede_editar: row.puede_editar || false,
          puede_eliminar: row.puede_eliminar || false,
          puede_aprobar: row.puede_aprobar || false,
        }
      }));

      // Get pages for each module
      for (const module of modules) {
        if (module.permissions.puede_ver) {
          const pagesQuery = `
            SELECT * FROM module_pages 
            WHERE module_id = $1 AND is_active = true 
            ORDER BY orden
          `;
          const pagesResult = await db.query(pagesQuery, [module.id]);
          module.pages = pagesResult.rows;
        }
      }

      return modules;
    } catch (error) {
      console.error('Error fetching modules for user:', error);
      throw new Error('Failed to fetch user modules');
    }
  }

  /**
   * Get user information with active project
   */
  async getUserInfo(userId: string) {
    try {
      const userQuery = `
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          u.email,
          u.active_project_id
        FROM sistema.usuario u
        WHERE u.id = $1
      `;
      
      console.log('getUserInfo - userId:', userId, 'type:', typeof userId);
      const userResult = await db.query(userQuery, [userId]);
      console.log('getUserInfo - userResult rows:', userResult.rows.length);
      
      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }
      
      const user = userResult.rows[0];
      
      // Get user roles
      const rolesQuery = `
        SELECT r.name 
        FROM sistema.user_roles ur
        JOIN sistema.rol r ON ur.role_id = r.id
        WHERE ur.user_id = $1
      `;
      const rolesResult = await db.query(rolesQuery, [userId]);
      const roles = rolesResult.rows.map(r => r.name);
      
      // Get active project if set
      let active_project = null;
      if (user.active_project_id) {
        const projectQuery = `
          SELECT id, code as codigo_proyecto, name as nombre, description as descripcion, status as estado
          FROM projects
          WHERE id = $1
        `;
        const projectResult = await db.query(projectQuery, [user.active_project_id]);
        if (projectResult.rows.length > 0) {
          active_project = projectResult.rows[0];
        }
      }
      
      // Get all assigned projects
      const assignedProjectsQuery = `
        SELECT 
          p.id, 
          p.code as codigo_proyecto, 
          p.name as nombre, 
          p.description as descripcion, 
          p.status as estado,
          up.created_at as assigned_date
        FROM sistema.user_projects up
        JOIN proyectos.edt p ON up.project_id = p.id
        WHERE up.user_id = $1
        ORDER BY p.name
      `;
      
      const assignedProjectsResult = await db.query(assignedProjectsQuery, [userId]);
      
      return {
        user: {
          id: user.id,
          username: user.username,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          roles: roles
        },
        active_project,
        assigned_projects: assignedProjectsResult.rows
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to fetch user information');
    }
  }

  /**
   * Switch user's active project
   */
  async switchProject(userId: string, projectId: string): Promise<Project> {
    try {
      // Verify user has access to the project
      const accessQuery = `
        SELECT 1 FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2 AND is_active = true
      `;
      
      const accessResult = await db.query(accessQuery, [userId, projectId]);
      
      if (accessResult.rows.length === 0) {
        throw new Error('User does not have access to this project');
      }
      
      // Update user's active project
      const updateQuery = `
        UPDATE sistema.usuario 
        SET active_project_id = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING active_project_id
      `;
      
      await db.query(updateQuery, [projectId, userId]);
      
      // Get project details
      const projectQuery = `
        SELECT * FROM proyectos.edt WHERE id = $1
      `;
      
      const projectResult = await db.query(projectQuery, [projectId]);
      
      if (projectResult.rows.length === 0) {
        throw new Error('Project not found');
      }
      
      return projectResult.rows[0];
    } catch (error) {
      console.error('Error switching project:', error);
      throw error;
    }
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(userId: string, projectId?: string) {
    try {
      const stats: any = {
        total_equipment: 0,
        active_equipment: 0,
        total_operators: 0,
        pending_reports: 0,
      };

      // Equipment stats
      let equipmentQuery = 'SELECT COUNT(*) as total FROM equipo.equipo WHERE is_active = true';
      const equipmentParams: any[] = [];

      if (projectId) {
        equipmentQuery += ' AND project_id = $1';
        equipmentParams.push(projectId);
      }

      const equipmentResult = await db.query(equipmentQuery, equipmentParams);
      stats.total_equipment = parseInt(equipmentResult.rows[0].total);

      // Active equipment (in use or available)
      let activeEquipmentQuery = 
        "SELECT COUNT(*) as total FROM equipo.equipo WHERE is_active = true AND status IN ('available', 'in_use')";
      const activeEquipmentParams: any[] = [];

      if (projectId) {
        activeEquipmentQuery += ' AND project_id = $1';
        activeEquipmentParams.push(projectId);
      }

      const activeEquipmentResult = await db.query(activeEquipmentQuery, activeEquipmentParams);
      stats.active_equipment = parseInt(activeEquipmentResult.rows[0].total);

      // Operators count
      const operatorsQuery = 'SELECT COUNT(*) as total FROM rrhh.trabajador WHERE is_active = true';
      const operatorsResult = await db.query(operatorsQuery);
      stats.total_operators = parseInt(operatorsResult.rows[0].total);

      // Pending reports (from today)
      const pendingReportsQuery = `
        SELECT COUNT(*) as total FROM equipo.parte_diario 
        WHERE DATE(created_at) = CURRENT_DATE
      `;
      const pendingReportsResult = await db.query(pendingReportsQuery);
      stats.pending_reports = parseInt(pendingReportsResult.rows[0].total);

      return stats;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}
