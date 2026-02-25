import { Request, Response, NextFunction } from 'express';
import { SecurityUtil, JwtPayload } from '../utils/security.util';
import { Role } from '../types/roles';
import { asyncContext } from '../utils/async-context';

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    const payload = SecurityUtil.verifyAccessToken(token);

    req.user = payload;

    // Add user context to AsyncLocalStorage for logging
    asyncContext.updateContext({
      userId: payload.id_usuario,
      username: payload.username,
      tenantId: payload.id_empresa, // Add tenant context for multi-tenancy
    });

    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Authorization middleware - checks if user has one of the allowed roles
 *
 * NOTE: JWT payload now contains single 'rol' field (not 'roles' array)
 * This aligns with multi-tenant architecture where each user has ONE primary role
 *
 * @param allowedRoles - Array of Role constants that are allowed to access the endpoint
 *
 * @example
 * import { ROLES } from '../types/roles';
 * router.get('/admin-only', authorize(ROLES.ADMIN), handler);
 * router.get('/management', authorize(ROLES.ADMIN, ROLES.DIRECTOR), handler);
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Check if rol exists (new JWT structure has single rol field)
    if (!req.user.rol) {
      res.status(403).json({
        error: 'User role not found in token',
        required: allowedRoles,
      });
      return;
    }

    // Case-insensitive role comparison for backward compatibility
    const userRoleLower = req.user.rol.toLowerCase();
    const allowedRolesLower = allowedRoles.map((r) => r.toLowerCase());
    const hasRole = allowedRolesLower.includes(userRoleLower);

    if (!hasRole) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.rol,
      });
      return;
    }

    next();
  };
};
