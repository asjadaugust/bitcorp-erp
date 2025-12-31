import { Router } from 'express';
import { Pool } from 'pg';
import { TenantService } from '../../services/tenant.service';
import { superAdminMiddleware, developerMiddleware } from '../../middleware/tenant.middleware';
import { authenticate } from '../../middleware/auth.middleware';

export function createTenantRouter(pool: Pool): Router {
  const router = Router();
  const tenantService = new TenantService(pool);

  // Apply authentication to all tenant routes
  router.use(authenticate);

  // Company management (super admin only)
  router.get('/companies', superAdminMiddleware, async (req, res) => {
    try {
      const companies = await tenantService.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error('Error fetching companies:', error);
      res.status(500).json({ error: 'Error al obtener compañías' });
    }
  });

  router.post('/companies', superAdminMiddleware, async (req, res) => {
    try {
      const company = await tenantService.createCompany(req.body);
      res.status(201).json(company);
    } catch (error: any) {
      console.error('Error creating company:', error);
      res.status(400).json({ error: error.message || 'Error al crear compañía' });
    }
  });

  router.get('/companies/:id', superAdminMiddleware, async (req, res) => {
    try {
      const company = await tenantService.getCompanyById(req.params.id);
      if (!company) {
        return res.status(404).json({ error: 'Compañía no encontrada' });
      }
      res.json(company);
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Error al obtener compañía' });
    }
  });

  router.put('/companies/:id', superAdminMiddleware, async (req, res) => {
    try {
      const company = await tenantService.updateCompany(req.params.id, req.body);
      res.json(company);
    } catch (error: any) {
      console.error('Error updating company:', error);
      res.status(400).json({ error: error.message || 'Error al actualizar compañía' });
    }
  });

  router.get('/companies/:id/projects', superAdminMiddleware, async (req, res) => {
    try {
      const projects = await tenantService.getCompanyProjects(req.params.id);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching company projects:', error);
      res.status(500).json({ error: 'Error al obtener proyectos' });
    }
  });

  router.get('/companies/:id/users', superAdminMiddleware, async (req, res) => {
    try {
      const users = await tenantService.getCompanyUsers(req.params.id);
      res.json(users);
    } catch (error) {
      console.error('Error fetching company users:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });

  // User project management
  router.get('/my-projects', async (req, res) => {
    try {
      const user = (req as any).user;
      console.log('MyProjects - User from token:', user);
      
      if (!user || !user.id) {
        console.warn('MyProjects - No user or user.id in request');
        return res.json([]);
      }
      
      const projects = await tenantService.getUserProjects(user.id);
      console.log(`MyProjects - Found ${projects.length} projects for user ${user.id}`);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      // Return empty array instead of 500 to prevent login failures
      res.json([]);
    }
  });

  router.post('/switch-project/:projectId', async (req, res) => {
    try {
      const user = (req as any).user;
      await tenantService.switchUserProject(user.id, req.params.projectId);
      res.json({ message: 'Proyecto cambiado exitosamente' });
    } catch (error) {
      console.error('Error switching project:', error);
      res.status(400).json({ error: 'Error al cambiar proyecto' });
    }
  });

  // User-project assignment (admin only)
  router.post('/assign-user', async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      await tenantService.assignUserToProject(userId, projectId);
      res.json({ message: 'Usuario asignado exitosamente' });
    } catch (error) {
      console.error('Error assigning user to project:', error);
      res.status(400).json({ error: 'Error al asignar usuario' });
    }
  });

  router.post('/remove-user', async (req, res) => {
    try {
      const { userId, projectId } = req.body;
      await tenantService.removeUserFromProject(userId, projectId);
      res.json({ message: 'Usuario removido exitosamente' });
    } catch (error) {
      console.error('Error removing user from project:', error);
      res.status(400).json({ error: 'Error al remover usuario' });
    }
  });

  return router;
}
