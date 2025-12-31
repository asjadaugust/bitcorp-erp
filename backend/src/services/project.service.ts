import db from '../config/database.config';
import { Project } from '../models/project.model';

export interface CreateProjectDto {
  code: string;
  name: string;
  description?: string;
  location?: string;
  start_date?: Date;
  end_date?: Date;
  status?: 'planning' | 'active' | 'suspended' | 'completed';
  settings?: any;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {}

export class ProjectService {
  /**
   * Get all projects (optionally filtered by user)
   */
  async findAll(filters?: string | { status?: string; search?: string }): Promise<any[]> {
    // Handle both old string userId format and new filter object format
    if (typeof filters === 'string') {
      return this.findAllByUser(filters);
    }
    return this.findAllWithFilters(filters);
  }

  async findAllByUser(userId?: string): Promise<any[]> {
    try {
      let query: string;
      let params: any[] = [];

      if (userId) {
        // Get only projects assigned to the user
        query = `
          SELECT DISTINCT p.* 
          FROM proyectos.edt p
          INNER JOIN sistema.user_projects up ON p.id = up.project_id
          WHERE up.user_id = $1 AND p.is_active = true
          ORDER BY p.nombre
        `;
        params = [userId];
      } else {
        // Get all active projects
        query = `
          SELECT * FROM proyectos.edt 
          WHERE is_active = true 
          ORDER BY nombre
        `;
      }

      const result = await db.query(query, params);
      return result.rows.map((row) => this.mapToProject(row));
    } catch (error) {
      console.error('Error finding projects:', error);
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  async findAllWithFilters(filters?: { status?: string; search?: string }): Promise<any[]> {
    try {
      let query = `
        SELECT * FROM proyectos.edt 
        WHERE is_active = true
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters?.status) {
        query += ` AND estado = $${paramIndex++}`;
        params.push(filters.status);
      }

      if (filters?.search) {
        query += ` AND (nombre ILIKE $${paramIndex} OR codigo ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      query += ` ORDER BY nombre`;

      const result = await db.query(query, params);
      return result.rows.map((row) => this.mapToProject(row));
    } catch (error) {
      console.error('Error finding projects with filters:', error);
      // Return empty array instead of throwing to prevent login failures
      return [];
    }
  }

  /**
   * Get project by ID
   */
  async findById(projectId: string): Promise<any> {
    try {
      const query = 'SELECT * FROM proyectos.edt WHERE id = $1 AND is_active = true';
      const result = await db.query(query, [projectId]);

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      return this.mapToProject(result.rows[0]);
    } catch (error) {
      console.error('Error finding project:', error);
      throw error;
    }
  }

  /**
   * Get project by code
   */
  async findByCode(code: string): Promise<any> {
    try {
      const query = 'SELECT * FROM proyectos.edt WHERE codigo = $1 AND is_active = true';
      const result = await db.query(query, [code]);

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      return this.mapToProject(result.rows[0]);
    } catch (error) {
      console.error('Error finding project:', error);
      throw error;
    }
  }

  /**
   * Create new project
   */
  async create(data: CreateProjectDto): Promise<any> {
    try {
      const query = `
        INSERT INTO proyectos.edt (
          code, name, description, location, 
          start_date, end_date, status, settings
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const values = [
        data.code,
        data.name,
        data.description || null,
        data.location || null,
        data.start_date || null,
        data.end_date || null,
        data.status || 'planning',
        data.settings || {},
      ];

      const result = await db.query(query, values);
      return this.mapToProject(result.rows[0]);
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }

  /**
   * Update project
   */
  async update(projectId: string, data: UpdateProjectDto): Promise<any> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      const fields = ['code', 'name', 'description', 'location', 'start_date', 'end_date', 'status', 'settings'];

      // Build dynamic update query
      for (const field of fields) {
        if ((data as any)[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex}`);
          values.push((data as any)[field]);
          paramIndex++;
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(projectId);

      const query = `
        UPDATE proyectos.edt 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Project not found');
      }

      return this.mapToProject(result.rows[0]);
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  }

  /**
   * Soft delete project
   */
  async delete(projectId: string): Promise<void> {
    try {
      const query = `
        UPDATE proyectos.edt 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await db.query(query, [projectId]);
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Assign user to project
   */
  async assignUser(projectId: string, userId: string, rolEnProyecto?: string): Promise<void> {
    try {
      // Check if assignment already exists
      const checkQuery = `
        SELECT user_id FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      const checkResult = await db.query(checkQuery, [userId, projectId]);

      if (checkResult.rows.length > 0) {
        throw new Error('User already assigned to this project');
      }

      const insertQuery = `
        INSERT INTO sistema.user_projects (user_id, project_id, is_default)
        VALUES ($1, $2, false)
      `;

      await db.query(insertQuery, [userId, projectId]);
    } catch (error) {
      console.error('Error assigning user to project:', error);
      throw error;
    }
  }

  /**
   * Unassign user from project
   */
  async unassignUser(projectId: string, userId: string): Promise<void> {
    try {
      const query = `
        DELETE FROM sistema.user_projects 
        WHERE user_id = $1 AND project_id = $2
      `;

      await db.query(query, [userId, projectId]);
    } catch (error) {
      console.error('Error unassigning user from project:', error);
      throw new Error('Failed to unassign user from project');
    }
  }

  /**
   * Get users assigned to a project
   */
  async getProjectUsers(projectId: string) {
    try {
      const query = `
        SELECT 
          u.id, u.username, u.first_name, u.last_name, u.email,
          r.name as role,
          up.is_default
        FROM sistema.user_projects up
        JOIN sistema.usuario u ON up.user_id = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN sistema.rol r ON ur.role_id = r.id
        WHERE up.project_id = $1
        ORDER BY u.last_name, u.first_name
      `;

      const result = await db.query(query, [projectId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting project users:', error);
      throw new Error('Failed to fetch project users');
    }
  }

  private mapToProject(row: any): any {
    return {
      id: row.id,
      project_code: row.codigo,
      project_name: row.nombre,
      code: row.codigo,
      name: row.nombre,
      description: row.descripcion,
      location: row.ubicacion,
      start_date: row.fecha_inicio,
      end_date: row.fecha_fin,
      status: row.estado,
      budget: row.presupuesto,
      client: row.cliente,
      is_active: row.is_active,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
