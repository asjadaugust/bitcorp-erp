import { Router, Request, Response } from 'express';
import { equipmentAnalyticsService } from '../services/equipment-analytics.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/analytics/equipment/:id/utilization
 * Get equipment utilization metrics for a period
 */
router.get(
  '/equipment/:id/utilization',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const metrics = await equipmentAnalyticsService.getEquipmentUtilization(
        equipmentId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching equipment utilization:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch equipment utilization'
      });
    }
  }
);

/**
 * GET /api/analytics/equipment/:id/utilization-trend
 * Get equipment utilization trend over time
 */
router.get(
  '/equipment/:id/utilization-trend',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const trend = await equipmentAnalyticsService.getUtilizationTrend(
        equipmentId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: trend
      });
    } catch (error: any) {
      console.error('Error fetching utilization trend:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch utilization trend'
      });
    }
  }
);

/**
 * GET /api/analytics/fleet/utilization
 * Get fleet-wide utilization metrics
 */
router.get(
  '/fleet/utilization',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();
      const projectId = req.query.projectId
        ? parseInt(req.query.projectId as string)
        : undefined;

      const metrics = await equipmentAnalyticsService.getFleetUtilization(
        startDate,
        endDate,
        projectId
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching fleet utilization:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch fleet utilization'
      });
    }
  }
);

/**
 * GET /api/analytics/equipment/:id/fuel
 * Get fuel consumption metrics
 */
router.get(
  '/equipment/:id/fuel',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const metrics = await equipmentAnalyticsService.getFuelMetrics(
        equipmentId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching fuel metrics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch fuel metrics'
      });
    }
  }
);

/**
 * GET /api/analytics/equipment/:id/fuel-trend
 * Get fuel consumption trend over time
 */
router.get(
  '/equipment/:id/fuel-trend',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const trend = await equipmentAnalyticsService.getFuelTrend(
        equipmentId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: trend
      });
    } catch (error: any) {
      console.error('Error fetching fuel trend:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch fuel trend'
      });
    }
  }
);

/**
 * GET /api/analytics/equipment/:id/maintenance
 * Get maintenance metrics
 */
router.get(
  '/equipment/:id/maintenance',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: last 90 days
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const metrics = await equipmentAnalyticsService.getMaintenanceMetrics(
        equipmentId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: metrics
      });
    } catch (error: any) {
      console.error('Error fetching maintenance metrics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch maintenance metrics'
      });
    }
  }
);

export default router;
