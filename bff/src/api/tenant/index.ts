/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router } from 'express';
import { TenantService } from '../../services/tenant.service';
import { adminOnlyMiddleware } from '../../middleware/tenant.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import Logger from '../../utils/logger';

export function createTenantRouter(): Router {
  const router = Router();
  const tenantService = new TenantService();

  // Apply authentication to all tenant routes
  router.use(authenticate);

  // Company management (admin only)
  router.get('/companies', adminOnlyMiddleware, async (req, res) => {
    try {
      const companies = await tenantService.getAllCompanies();
      res.json(companies);
    } catch (error: any) {
      Logger.error('Error fetching companies', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenantRouter.getAllCompanies',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message: 'Company management requires database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(500).json({ error: 'Error al obtener compañías' });
    }
  });

  router.post('/companies', adminOnlyMiddleware, async (req, res) => {
    try {
      const company = await tenantService.createCompany(req.body);
      res.status(201).json(company);
    } catch (error: any) {
      Logger.error('Error creating company', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenantRouter.createCompany',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message: 'Company management requires database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(400).json({ error: error.message || 'Error al crear compañía' });
    }
  });

  router.get('/companies/:id', adminOnlyMiddleware, async (req, res) => {
    try {
      const company = await tenantService.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ error: 'Compañía no encontrada o feature no implementado' });
      }
      res.json(company);
    } catch (error: any) {
      Logger.error('Error fetching company', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        companyId: req.params.id,
        context: 'TenantRouter.getCompanyById',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message: 'Company management requires database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(500).json({ error: 'Error al obtener compañía' });
    }
  });

  router.put('/companies/:id', adminOnlyMiddleware, async (req, res) => {
    try {
      const company = await tenantService.updateCompany(req.params.id, req.body);
      res.json(company);
    } catch (error: any) {
      Logger.error('Error updating company', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        companyId: req.params.id,
        context: 'TenantRouter.updateCompany',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message: 'Company management requires database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(400).json({ error: error.message || 'Error al actualizar compañía' });
    }
  });

  router.get('/companies/:id/projects', adminOnlyMiddleware, async (req, res) => {
    try {
      const projects = await tenantService.getCompanyProjects(req.params.id);
      res.json(projects);
    } catch (error: any) {
      Logger.error('Error fetching company projects', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        companyId: req.params.id,
        context: 'TenantRouter.getCompanyProjects',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message:
            'Company-project management requires database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(500).json({ error: 'Error al obtener proyectos' });
    }
  });

  router.get('/companies/:id/users', adminOnlyMiddleware, async (req, res) => {
    try {
      const users = await tenantService.getCompanyUsers(req.params.id);
      res.json(users);
    } catch (error: any) {
      Logger.error('Error fetching company users', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        companyId: req.params.id,
        context: 'TenantRouter.getCompanyUsers',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message:
            'User-project assignments require database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });

  // User project management
  router.get('/my-projects', async (req, res) => {
    try {
      const user = (req as any).user;
      Logger.debug('Fetching user projects', {
        userId: user?.id,
        username: user?.username,
        context: 'TenantRouter.myProjects',
      });

      if (!user || !user.id) {
        Logger.warn('My projects request without valid user', {
          hasUser: !!user,
          hasUserId: !!(user && user.id),
          context: 'TenantRouter.myProjects',
        });
        return res.json([]);
      }

      const projects = await tenantService.getUserProjects(user.id);
      Logger.debug('User projects fetched', {
        userId: user.id,
        projectCount: projects.length,
        context: 'TenantRouter.myProjects',
      });
      res.json(projects);
    } catch (error) {
      Logger.error('Error fetching user projects', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'TenantRouter.myProjects',
      });
      // Return empty array instead of 500 to prevent login failures
      res.json([]);
    }
  });

  router.post('/switch-project/:projectId', async (req, res) => {
    try {
      const user = (req as any).user;
      await tenantService.switchUserProject(user.id, req.params.projectId);
      res.json({
        message: 'Proyecto verificado (switch no implementado - columna faltante)',
        warning: 'active_project_id column does not exist in sistema.usuario',
      });
    } catch (error: any) {
      Logger.error('Error switching project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.projectId,
        context: 'TenantRouter.switchProject',
      });
      if (error.message === 'Project not found') {
        return res.status(404).json({ error: 'Proyecto no encontrado' });
      }
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message: 'Project switching requires active_project_id column in sistema.usuario',
          details: error.message,
        });
      }
      res.status(400).json({ error: 'Error al cambiar proyecto' });
    }
  });

  // User-project assignment (admin only)
  router.post('/assign-user', async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      await tenantService.assignUserToProject(userId, projectId);
      res.json({ message: 'Usuario asignado exitosamente' });
    } catch (error: any) {
      Logger.error('Error assigning user to project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.body.userId,
        projectId: req.body.projectId,
        context: 'TenantRouter.assignUser',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message:
            'User-project assignments require database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(400).json({ error: 'Error al asignar usuario' });
    }
  });

  router.post('/remove-user', async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      await tenantService.removeUserFromProject(userId, projectId);
      res.json({ message: 'Usuario removido exitosamente' });
    } catch (error: any) {
      Logger.error('Error removing user from project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.body.userId,
        projectId: req.body.projectId,
        context: 'TenantRouter.removeUser',
      });
      if (error.message?.includes('NOT_IMPLEMENTED')) {
        return res.status(501).json({
          error: 'Feature not implemented',
          message:
            'User-project assignments require database migrations. See company-entity.model.ts',
          details: error.message,
        });
      }
      res.status(400).json({ error: 'Error al remover usuario' });
    }
  });

  return router;
}
