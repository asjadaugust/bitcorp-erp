import { Router } from 'express';
import { cacheService } from '../services/cache.service';
import Logger from '../utils/logger';

const router = Router();

/**
 * GET /api/cache/status
 * Returns cache health and metrics
 *
 * Response:
 * {
 *   connected: boolean,
 *   total_keys: number,
 *   dashboard_keys: number,
 *   memory_used: string,
 *   memory_peak: string,
 *   uptime_seconds: number,
 *   redis_version: string
 * }
 */
router.get('/status', async (req, res) => {
  try {
    const status = await cacheService.getStatus();

    Logger.info('Cache status retrieved', {
      connected: status.connected,
      total_keys: status.total_keys,
      dashboard_keys: status.dashboard_keys,
      context: 'CacheRoute.status',
    });

    res.json(status);
  } catch (error) {
    Logger.error('Error getting cache status', {
      error: error instanceof Error ? error.message : String(error),
      context: 'CacheRoute.status',
    });

    res.status(500).json({
      error: 'Failed to get cache status',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
