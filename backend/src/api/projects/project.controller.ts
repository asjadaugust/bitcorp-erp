/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Request, Response } from 'express';
import { ProjectService, CreateProjectDto, UpdateProjectDto } from '../../services/project.service';
import Logger from '../../utils/logger';
import { sendSuccess, sendPaginatedSuccess, sendError } from '../../utils/api-response';

export class ProjectController {
  private projectService: ProjectService;

  constructor() {
    this.projectService = new ProjectService();
  }

  /**
   * GET /api/projects
   * Get all projects (filtered by user if query param present)
   */
  findAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      const { user_filter, status, search, page, limit, sort_by, sort_order } = req.query;

      // If user_filter is true, filter by authenticated user (legacy support)
      const filterByUser = user_filter === 'true' ? userId : undefined;

      if (filterByUser) {
        // Legacy path - return as array without pagination
        const projects = await this.projectService.findAll(filterByUser);
        sendSuccess(res, projects);
        return;
      }

      // New path with pagination and sorting
      const filters: any = {};
      if (status) filters.status = String(status);
      if (search) filters.search = String(search);
      if (sort_by) filters.sort_by = String(sort_by);
      if (sort_order)
        filters.sort_order = (String(sort_order).toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as
          | 'ASC'
          | 'DESC';

      const pageNum = parseInt(page as string) || 1;
      const limitNum = Math.min(parseInt(limit as string) || 10, 100);

      const result = await this.projectService.findAll(filters, pageNum, limitNum);

      // Check if result has pagination (new format)
      if ('data' in result && 'total' in result) {
        sendPaginatedSuccess(res, result.data, {
          page: pageNum,
          limit: limitNum,
          total: result.total,
        });
      } else {
        // Legacy format - array without pagination
        sendSuccess(res, result);
      }
    } catch (error) {
      Logger.error('Error in findAll projects', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProjectController.findAll',
      });
      sendError(
        res,
        500,
        'PROJECT_FETCH_FAILED',
        'Failed to fetch projects',
        (error as Error).message
      );
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
        data: project,
      });
    } catch (error) {
      Logger.error('Error in findById project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        context: 'ProjectController.findById',
      });
      res.status(404).json({
        success: false,
        error: (error as Error).message,
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
        data: project,
      });
    } catch (error) {
      Logger.error('Error in findByCode project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectCode: req.params.code,
        context: 'ProjectController.findByCode',
      });
      res.status(404).json({
        success: false,
        error: (error as Error).message,
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
        data: project,
      });
    } catch (error) {
      Logger.error('Error in create project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'ProjectController.create',
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message,
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
        data: project,
      });
    } catch (error) {
      Logger.error('Error in update project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        context: 'ProjectController.update',
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message,
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
        message: 'Project deleted successfully',
      });
    } catch (error) {
      Logger.error('Error in delete project', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        context: 'ProjectController.delete',
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message,
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
          error: 'user_id is required',
        });
        return;
      }

      await this.projectService.assignUser(id, user_id, rol_en_proyecto);

      res.json({
        success: true,
        message: 'User assigned to project successfully',
      });
    } catch (error) {
      Logger.error('Error in assignUser', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        userId: req.body.user_id,
        context: 'ProjectController.assignUser',
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message,
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
        message: 'User unassigned from project successfully',
      });
    } catch (error) {
      Logger.error('Error in unassignUser', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        userId: req.params.userId,
        context: 'ProjectController.unassignUser',
      });
      res.status(400).json({
        success: false,
        error: (error as Error).message,
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
        data: users,
      });
    } catch (error) {
      Logger.error('Error in getProjectUsers', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        projectId: req.params.id,
        context: 'ProjectController.getProjectUsers',
      });
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  };

  exportExcel = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { status, search } = req.query;

      const result = await this.projectService.findAll(
        {
          status: status as string,
          search: search as string,
        },
        1,
        9999
      ); // Get all records for export

      const projects = 'data' in result ? result.data : result;

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
      Logger.error('Error in exportExcel', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: req.query.status,
        search: req.query.search,
        context: 'ProjectController.exportExcel',
      });
      res.status(500).json({ error: (error as Error).message });
    }
  };

  exportCSV = async (req: Request, res: Response): Promise<void> => {
    try {
      const { ExportUtil } = await import('../../utils/export.util');
      const { status, search } = req.query;

      const result = await this.projectService.findAll(
        {
          status: status as string,
          search: search as string,
        },
        1,
        9999
      ); // Get all records for export

      const projects = 'data' in result ? result.data : result;

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
      Logger.error('Error in exportCSV', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        status: req.query.status,
        search: req.query.search,
        context: 'ProjectController.exportCSV',
      });
      res.status(500).json({ error: (error as Error).message });
    }
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const { startDate, endDate } = req.query;
      const stats = await this.projectService.getStats({
        startDate: startDate as string,
        endDate: endDate as string,
      });
      sendSuccess(res, stats);
    } catch (error) {
      Logger.error('Error in getStats projects', {
        error: error instanceof Error ? error.message : String(error),
        context: 'ProjectController.getStats',
      });
      sendError(res, 500, 'PROJECT_STATS_FAILED', 'Failed to fetch project statistics');
    }
  };
}
