import { Request, Response } from 'express';
import { DashboardService } from '../../services/dashboard.service';

export class DashboardController {
  private dashboardService = new DashboardService();

  /**
   * GET /api/dashboard/modules
   * Get all modules with permissions for current user
   */
  getModules = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const modules = await this.dashboardService.getModulesForUser(userId.toString());
      
      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      console.error('Error in getModules:', error);
      res.status(500).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  };

  /**
   * GET /api/dashboard/user-info
   * Get current user information with active project
   */
  getUserInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userInfo = await this.dashboardService.getUserInfo(userId.toString());
      
      res.json({
        success: true,
        data: userInfo
      });
    } catch (error) {
      console.error('Error in getUserInfo:', error);
      res.status(500).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  };

  /**
   * PUT /api/dashboard/switch-project
   * Switch user's active project
   */
  switchProject = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const { project_id } = req.body;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!project_id) {
        res.status(400).json({ 
          success: false,
          error: 'project_id is required' 
        });
        return;
      }

      const project = await this.dashboardService.switchProject(userId.toString(), project_id);
      
      res.json({
        success: true,
        message: 'Project switched successfully',
        data: { active_project: project }
      });
    } catch (error) {
      console.error('Error in switchProject:', error);
      res.status(400).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  };

  /**
   * GET /api/dashboard/stats
   * Get dashboard statistics
   */
  getStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.userId;
      const projectId = req.query.project_id as string | undefined;
      
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const stats = await this.dashboardService.getDashboardStats(userId.toString(), projectId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error in getStats:', error);
      res.status(500).json({ 
        success: false,
        error: (error as Error).message 
      });
    }
  };
}
