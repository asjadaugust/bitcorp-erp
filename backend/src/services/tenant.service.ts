import { Pool } from 'pg';
import { Company, CreateCompanyDto, UpdateCompanyDto } from '../models/company.model';

export class TenantService {
  constructor(private pool: Pool) {}

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyDto): Promise<Company> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const result = await client.query(
        `
        INSERT INTO administracion.empresa (
          name, subdomain, status, settings, subscription, contact_info, billing_info
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
        [
          data.name,
          data.subdomain,
          'active',
          JSON.stringify(data.settings || {}),
          JSON.stringify(data.subscription || { plan: 'trial', maxProjects: 1, maxUsers: 10 }),
          JSON.stringify(data.contactInfo || {}),
          JSON.stringify(data.billingInfo || {}),
        ]
      );

      await client.query('COMMIT');
      return this.mapCompany(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all companies
   */
  async getAllCompanies(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT * FROM administracion.empresa 
      WHERE is_active = true
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get company by ID
   */
  async getCompanyById(id: string): Promise<Company | null> {
    const result = await this.pool.query(
      `
      SELECT * FROM administracion.empresa 
      WHERE id = $1 AND is_active = true
    `,
      [id]
    );

    return result.rows.length > 0 ? this.mapCompany(result.rows[0]) : null;
  }

  /**
   * Get company by subdomain
   */
  async getCompanyBySubdomain(subdomain: string): Promise<Company | null> {
    const result = await this.pool.query(
      `
      SELECT * FROM administracion.empresa 
      WHERE subdomain = $1 AND is_active = true
    `,
      [subdomain]
    );

    return result.rows.length > 0 ? this.mapCompany(result.rows[0]) : null;
  }

  /**
   * Update company
   */
  async updateCompany(id: string, data: UpdateCompanyDto): Promise<Company> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.subdomain) {
      updates.push(`subdomain = $${paramCount++}`);
      values.push(data.subdomain);
    }
    if (data.status) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.settings) {
      updates.push(`settings = $${paramCount++}`);
      values.push(JSON.stringify(data.settings));
    }
    if (data.subscription) {
      updates.push(`subscription = $${paramCount++}`);
      values.push(JSON.stringify(data.subscription));
    }
    if (data.contactInfo) {
      updates.push(`contact_info = $${paramCount++}`);
      values.push(JSON.stringify(data.contactInfo));
    }
    if (data.billingInfo) {
      updates.push(`billing_info = $${paramCount++}`);
      values.push(JSON.stringify(data.billingInfo));
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await this.pool.query(
      `
      UPDATE companies 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Compañía no encontrada');
    }

    return this.mapCompany(result.rows[0]);
  }

  /**
   * Get projects for a company
   */
  async getCompanyProjects(companyId: string): Promise<any[]> {
    const result = await this.pool.query(
      `
      SELECT * FROM proyectos.edt 
      WHERE company_id = $1 AND status = 'active'
      ORDER BY created_at DESC
    `,
      [companyId]
    );

    return result.rows;
  }

  /**
   * Get users for a company (through projects)
   */
  async getCompanyUsers(companyId: string): Promise<any[]> {
    const result = await this.pool.query(
      `
      SELECT DISTINCT u.*
      FROM sistema.usuario u
      JOIN user_projects up ON up.user_id = u.id
      JOIN proyectos.edt p ON p.id = up.project_id
      WHERE p.company_id = $1 AND p.status = 'active'
      ORDER BY u.username
    `,
      [companyId]
    );

    return result.rows;
  }

  /**
   * Assign user to project
   */
  async assignUserToProject(
    userId: string,
    projectId: string,
    roleInProject: string = 'user'
  ): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO sistema.user_projects (user_id, project_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, project_id) 
      DO NOTHING
    `,
      [userId, projectId]
    );
  }

  /**
   * Remove user from project
   */
  async removeUserFromProject(userId: string, projectId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM sistema.user_projects 
      WHERE user_id = $1 AND project_id = $2
    `,
      [userId, projectId]
    );
  }

  /**
   * Get user's projects
   */
  async getUserProjects(userId: string): Promise<any[]> {
    console.log('Fetching projects for user:', userId);
    try {
    const result = await this.pool.query(
      `
      SELECT p.*
      FROM proyectos.edt p
      JOIN user_projects up ON up.project_id = p.id
      WHERE up.user_id = $1 AND p.status = 'active'
      ORDER BY p.name ASC
    `,
      [userId]
    );
     return result.rows.map((row) => this.mapToProject(row));
    } catch (err) {
        console.error('DB Error in getUserProjects:', err);
        // Return empty array instead of throwing to prevent login failures
        return [];
    }
  }

  /**
   * Switch user's active project
   */
  async switchUserProject(userId: string, projectId: string): Promise<void> {
    // Update user's active project
    await this.pool.query(
      `
      UPDATE sistema.usuario SET active_project_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [projectId, userId]
    );
  }

  private mapToProject(row: any): any {
    return {
      id: row.id,
      name: row.nombre || row.name,
      code: row.codigo_proyecto || row.code,
      description: row.description,
      status: row.estado || row.status || 'active',
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  private mapCompany(row: any): Company {
    return {
      id: row.id,
      name: row.name,
      subdomain: row.subdomain,
      status: row.status,
      settings: row.settings || {},
      subscription: row.subscription || {},
      contactInfo: row.contact_info || {},
      billingInfo: row.billing_info || {},
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
