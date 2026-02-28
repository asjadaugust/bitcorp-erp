/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import { ROLES } from '../types/roles';
import Logger from '../utils/logger';

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
      Logger.error('Tenant middleware error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id,
        context: 'tenantMiddleware',
      });
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
      Logger.error('Optional tenant middleware error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: (req as any).user?.id,
        context: 'optionalTenantMiddleware',
      });
      next(); // Continue even if error
    }
  };
};

/**
 * Admin-only middleware
 * Allows access only to users with ADMIN role
 */
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || !user.roles || !Array.isArray(user.roles)) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo administradores pueden acceder a este recurso.',
    });
  }

  // Check if user has ADMIN role (case-insensitive for backward compatibility)
  const hasAdminRole = user.roles.some((role: string) => role.toUpperCase() === ROLES.ADMIN);

  if (!hasAdminRole) {
    return res.status(403).json({
      error: 'Acceso denegado. Solo administradores pueden acceder a este recurso.',
    });
  }

  next();
};
