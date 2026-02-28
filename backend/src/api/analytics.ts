/* eslint-disable @typescript-eslint/no-explicit-any */
import { Router, Request, Response } from 'express';
import { EquipmentAnalyticsService } from '../services/equipment-analytics.service';
import { AppDataSource } from '../config/database.config';
import {
  toUtilizacionDto,
  toTendenciaUtilizacionDto,
  toFlotaUtilizacionDto,
  toCombustibleDto,
  toTendenciaCombustibleDto,
} from '../types/dto/analitica.dto';
import { sendSuccess, sendError } from '../utils/api-response';
import { authenticate } from '../middleware/auth.middleware';
import Logger from '../utils/logger';

const router = Router();

/**
 * GET /api/analytics/equipment/:id/utilization
 * Get equipment utilization metrics for a period
 */
router.get('/equipment/:id/utilization', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user!.id_empresa;
    const service = new EquipmentAnalyticsService(AppDataSource);
    const equipmentId = parseInt(req.params.id);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const metrics = await service.getEquipmentUtilization(
      tenantId,
      equipmentId,
      startDate,
      endDate
    );
    sendSuccess(res, toUtilizacionDto(metrics as any));
  } catch (error: any) {
    Logger.error('Error fetching equipment utilization', {
      error: error instanceof Error ? error.message : String(error),
      equipmentId: req.params.id,
      context: 'Analytics.equipmentUtilization',
    });
    sendError(
      res,
      500,
      'ANALYTICS_ERROR',
      error.message || 'Error al obtener utilización del equipo'
    );
  }
});

/**
 * GET /api/analytics/equipment/:id/utilization-trend
 * Get equipment utilization trend over time
 */
router.get(
  '/equipment/:id/utilization-trend',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user!.id_empresa;
      const service = new EquipmentAnalyticsService(AppDataSource);
      const equipmentId = parseInt(req.params.id);
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const trend = await service.getUtilizationTrend(tenantId, equipmentId, startDate, endDate);
      sendSuccess(res, (trend as any[]).map(toTendenciaUtilizacionDto));
    } catch (error: any) {
      Logger.error('Error fetching utilization trend', {
        error: error instanceof Error ? error.message : String(error),
        equipmentId: req.params.id,
        context: 'Analytics.utilizationTrend',
      });
      sendError(
        res,
        500,
        'ANALYTICS_ERROR',
        error.message || 'Error al obtener tendencia de utilización'
      );
    }
  }
);

/**
 * GET /api/analytics/fleet/utilization
 * Get fleet-wide utilization metrics
 */
router.get('/fleet/utilization', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user!.id_empresa;
    const service = new EquipmentAnalyticsService(AppDataSource);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;

    const metrics = await service.getFleetUtilization(tenantId, startDate, endDate, projectId);
    sendSuccess(res, toFlotaUtilizacionDto(metrics as any));
  } catch (error: any) {
    Logger.error('Error fetching fleet utilization', {
      error: error instanceof Error ? error.message : String(error),
      context: 'Analytics.fleetUtilization',
    });
    sendError(
      res,
      500,
      'ANALYTICS_ERROR',
      error.message || 'Error al obtener utilización de flota'
    );
  }
});

/**
 * GET /api/analytics/equipment/:id/fuel
 * Get fuel consumption metrics
 */
router.get('/equipment/:id/fuel', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user!.id_empresa;
    const service = new EquipmentAnalyticsService(AppDataSource);
    const equipmentId = parseInt(req.params.id);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const metrics = await service.getFuelMetrics(tenantId, equipmentId, startDate, endDate);
    sendSuccess(res, toCombustibleDto(metrics as any));
  } catch (error: any) {
    Logger.error('Error fetching fuel metrics', {
      error: error instanceof Error ? error.message : String(error),
      equipmentId: req.params.id,
      context: 'Analytics.fuelMetrics',
    });
    sendError(
      res,
      500,
      'ANALYTICS_ERROR',
      error.message || 'Error al obtener métricas de combustible'
    );
  }
});

/**
 * GET /api/analytics/equipment/:id/fuel-trend
 * Get fuel consumption trend over time
 */
router.get('/equipment/:id/fuel-trend', authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user!.id_empresa;
    const service = new EquipmentAnalyticsService(AppDataSource);
    const equipmentId = parseInt(req.params.id);
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const trend = await service.getFuelTrend(tenantId, equipmentId, startDate, endDate);
    sendSuccess(res, (trend as any[]).map(toTendenciaCombustibleDto));
  } catch (error: any) {
    Logger.error('Error fetching fuel trend', {
      error: error instanceof Error ? error.message : String(error),
      equipmentId: req.params.id,
      context: 'Analytics.fuelTrend',
    });
    sendError(
      res,
      500,
      'ANALYTICS_ERROR',
      error.message || 'Error al obtener tendencia de combustible'
    );
  }
});

/**
 * GET /api/analytics/equipment/:id/maintenance
 * Get maintenance metrics
 */
router.get('/equipment/:id/maintenance', authenticate, async (req: Request, res: Response) => {
  try {
    const service = new EquipmentAnalyticsService(AppDataSource);
    const equipmentId = parseInt(req.params.id);
    // Note: maintenance is a stub method, no tenantId filtering needed yet
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // Default: last 90 days
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    const metrics = await service.getMaintenanceMetrics(equipmentId, startDate, endDate);

    sendSuccess(res, metrics);
  } catch (error: any) {
    Logger.error('Error fetching maintenance metrics', {
      error: error instanceof Error ? error.message : String(error),
      equipmentId: req.params.id,
      context: 'Analytics.maintenanceMetrics',
    });
    sendError(
      res,
      500,
      'ANALYTICS_ERROR',
      error.message || 'Error al obtener métricas de mantenimiento'
    );
  }
});

export default router;
