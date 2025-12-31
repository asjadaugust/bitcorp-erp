import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

export interface TenantRequest extends Request {
  tenant?: {
    companyId: string;
    projectId: string;
    projectCode: string;
  };
}

/**
 * Multi-tenancy middleware
 * Extracts tenant context from authenticated user and sets it in request
 * NOTE: This should be applied AFTER authentication middleware
 */
export const tenantMiddleware = (pool: Pool) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // If no user, skip tenant context (will be handled by auth middleware)
      if (!user) {
        return next();
      }

      // Get user's primary (active) project
      const result = await pool.query(
        `
        SELECT 
          up.project_id,
          p.codigo_proyecto,
          p.company_id
        FROM user_projects up
        JOIN projects p ON p.id = up.project_id
        WHERE up.user_id = $1 AND up.is_primary = true
        LIMIT 1
      `,
        [user.id]
      );

      if (result.rows.length === 0) {
        // User has no primary project - just continue without tenant context
        return next();
      }

      const projectData = result.rows[0];

      // Set tenant context
      req.tenant = {
        companyId: projectData.company_id,
        projectId: projectData.project_id,
        projectCode: projectData.codigo_proyecto,
      };

      // Add tenant filter to all queries by default
      (req as any).tenantFilter = {
        company_id: projectData.company_id,
        project_id: projectData.project_id,
      };

      next();
    } catch (error) {
      console.error('Tenant middleware error:', error);
      // Don't fail - just continue without tenant context
      next();
    }
  };
};

/**
 * Optional tenant middleware for endpoints that don't require tenant context
 */
export const optionalTenantMiddleware = (pool: Pool) => {
  return async (req: TenantRequest, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (user) {
        const result = await pool.query(
          `
          SELECT 
            up.project_id,
            p.codigo_proyecto,
            p.company_id
          FROM user_projects up
          JOIN projects p ON p.id = up.project_id
          WHERE up.user_id = $1 AND up.is_primary = true
          LIMIT 1
        `,
          [user.id]
        );

        if (result.rows.length > 0) {
          const projectData = result.rows[0];
          req.tenant = {
            companyId: projectData.company_id,
            projectId: projectData.project_id,
            projectCode: projectData.codigo_proyecto,
          };
        }
      }

      next();
    } catch (error) {
      console.error('Optional tenant middleware error:', error);
      next(); // Continue even if error
    }
  };
};

/**
 * Developer-only middleware
 * Allows access only to users with developer role
 */
export const developerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'developer') {
    return res.status(403).json({
      error: 'Acceso denegado. Solo desarrolladores pueden acceder a este recurso.',
    });
  }

  next();
};

/**
 * Super admin middleware
 * Allows cross-tenant access for super admins
 */
export const superAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'super_admin') {
    return res.status(403).json({
      error: 'Acceso denegado. Solo super administradores pueden acceder a este recurso.',
    });
  }

  next();
};
