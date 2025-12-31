import { Request, Response } from 'express';
import { ProjectService, CreateProjectDto, UpdateProjectDto } from '../../services/project.service';

export class ProjectController {
  private projectService = new ProjectService();

  /**
   * GET /api/projects
   * Get all projects (filtered by user if query param present)
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { user_filter } = req.query;

      // If user_filter is true, filter by authenticated user
      const filterByUser = user_filter === 'true' ? userId : undefined;

      const projects = await this.projectService.findAll(filterByUser);

      res.json({
        success: true,
        data: projects
      });
    } catch (error) {
      console.error('Error in findAll projects:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * GET /api/projects/:id
   * Get project by ID
   */
  findById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const project = await this.projectService.findById(id);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error in findById project:', error);
      res.status(404).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * GET /api/projects/code/:code
   * Get project by code
   */
  findByCode = async (req: Request, res: Response): Promise<void> => {
    try {
      const { code } = req.params;
      const project = await this.projectService.findByCode(code);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error in findByCode project:', error);
      res.status(404).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * POST /api/projects
   * Create new project
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data: CreateProjectDto = req.body;
      const project = await this.projectService.create(data);

      res.status(201).json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error in create project:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * PUT /api/projects/:id
   * Update project
   */
  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data: UpdateProjectDto = req.body;
      const project = await this.projectService.update(id, data);

      res.json({
        success: true,
        data: project
      });
    } catch (error) {
      console.error('Error in update project:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * DELETE /api/projects/:id
   * Soft delete project
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.projectService.delete(id);

      res.json({
        success: true,
        message: 'Project deleted successfully'
      });
    } catch (error) {
      console.error('Error in delete project:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * POST /api/projects/:id/users
   * Assign user to project
   */
  assignUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { user_id, rol_en_proyecto } = req.body;

      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'user_id is required'
        });
        return;
      }

      await this.projectService.assignUser(id, user_id, rol_en_proyecto);

      res.json({
        success: true,
        message: 'User assigned to project successfully'
      });
    } catch (error) {
      console.error('Error in assignUser:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * DELETE /api/projects/:id/users/:userId
   * Unassign user from project
   */
  unassignUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, userId } = req.params;
      await this.projectService.unassignUser(id, userId);

      res.json({
        success: true,
        message: 'User unassigned from project successfully'
      });
    } catch (error) {
      console.error('Error in unassignUser:', error);
      res.status(400).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  /**
   * GET /api/projects/:id/users
   * Get users assigned to project
   */
  getProjectUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const users = await this.projectService.getProjectUsers(id);

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error in getProjectUsers:', error);
      res.status(500).json({
        success: false,
        error: (error as Error).message
      });
    }
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { status, search } = req.query;
      
      const projects = await this.projectService.findAll({
        status: status as string,
        search: search as string,
      });

      const data = projects.map((p: any) => ({
        codigo: p.project_code,
        nombre: p.project_name,
        cliente: p.client_name || '',
        ubicacion: p.location || '',
        estado: p.status,
        fecha_inicio: ExportUtil.formatDate(p.start_date),
        fecha_fin: ExportUtil.formatDate(p.end_date),
        presupuesto: p.budget ? ExportUtil.formatCurrency(p.budget, p.currency) : '',
      }));

      const columns = [
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Nombre Proyecto', key: 'nombre', width: 30 },
        { header: 'Cliente', key: 'cliente', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 25 },
        { header: 'Estado', key: 'estado', width: 15 },
        { header: 'Fecha Inicio', key: 'fecha_inicio', width: 15 },
        { header: 'Fecha Fin', key: 'fecha_fin', width: 15 },
        { header: 'Presupuesto', key: 'presupuesto', width: 15 },
      ];

      await ExportUtil.exportToExcel(res, data, columns, `proyectos_${Date.now()}`);
    } catch (error) {
      console.error('Error in exportExcel:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportCSV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { status, search } = req.query;
      
      const projects = await this.projectService.findAll({
        status: status as string,
        search: search as string,
      });

      const data = projects.map((p: any) => ({
        codigo: p.project_code,
        nombre: p.project_name,
        cliente: p.client_name || '',
        ubicacion: p.location || '',
        estado: p.status,
        fecha_inicio: ExportUtil.formatDate(p.start_date),
        fecha_fin: ExportUtil.formatDate(p.end_date),
        presupuesto: p.budget ? ExportUtil.formatCurrency(p.budget, p.currency) : '',
      }));

      const fields = [
        { label: 'Código', value: 'codigo' },
        { label: 'Nombre Proyecto', value: 'nombre' },
        { label: 'Cliente', value: 'cliente' },
        { label: 'Ubicación', value: 'ubicacion' },
        { label: 'Estado', value: 'estado' },
        { label: 'Fecha Inicio', value: 'fecha_inicio' },
        { label: 'Fecha Fin', value: 'fecha_fin' },
        { label: 'Presupuesto', value: 'presupuesto' },
      ];

      ExportUtil.exportToCSV(res, data, fields, `proyectos_${Date.now()}`);
    } catch (error) {
      console.error('Error in exportCSV:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  };
}
