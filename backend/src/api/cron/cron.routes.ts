import { Router, Request, Response } from 'express';
import { CronService } from '../../services/cron.service';
import Logger from '../../utils/logger';

const router = Router();

/**
 * POST /api/cron/trigger/:jobName
 *
 * Manually trigger a cron job for testing purposes.
 * Development/staging only - should be disabled in production.
 *
 * @param jobName - One of: maintenance, contracts, certifications, all
 */
router.post('/trigger/:jobName', async (req: Request, res: Response) => {
  try {
    const { jobName } = req.params;

    // Security: Only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Manual cron triggers are disabled in production',
        },
      });
    }

    Logger.info('Manual cron job trigger requested', {
      jobName,
      triggeredBy: req.user?.id_usuario || 'unknown',
      context: 'CronController.trigger',
    });

    const cronService = new CronService();

    switch (jobName) {
      case 'maintenance':
        await cronService.checkMaintenanceDue();
        break;

      case 'contracts':
        await cronService.checkContractExpirations();
        break;

      case 'certifications':
        await cronService.checkCertificationExpiry();
        break;

      case 'all':
        await cronService.checkMaintenanceDue();
        await cronService.checkContractExpirations();
        await cronService.checkCertificationExpiry();
        break;

      default:
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_JOB_NAME',
            message: 'Invalid job name. Valid options: maintenance, contracts, certifications, all',
          },
        });
    }

    Logger.info('Manual cron job completed successfully', {
      jobName,
      context: 'CronController.trigger',
    });

    return res.json({
      success: true,
      data: {
        message: `Cron job '${jobName}' executed successfully`,
        jobName,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    Logger.error('Manual cron job trigger failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      jobName: req.params.jobName,
      context: 'CronController.trigger',
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'CRON_EXECUTION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to execute cron job',
      },
    });
  }
});

/**
 * GET /api/cron/status
 *
 * Get information about scheduled cron jobs.
 * Development/staging only.
 */
router.get('/status', (req: Request, res: Response) => {
  try {
    // Security: Only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cron status endpoint is disabled in production',
        },
      });
    }

    return res.json({
      success: true,
      data: {
        jobs: [
          {
            name: 'maintenance-check',
            description: 'Check for equipment maintenance due within 7 days',
            schedule: '0 8 * * *',
            nextRun: 'Daily at 8:00 AM',
          },
          {
            name: 'contract-expiration-check',
            description: 'Check for contracts expiring within 30 days',
            schedule: '0 8 * * *',
            nextRun: 'Daily at 8:00 AM',
          },
          {
            name: 'certification-expiry-check',
            description: 'Check for operator certifications expiring within 30 days',
            schedule: '0 8 * * *',
            nextRun: 'Daily at 8:00 AM',
          },
        ],
        serverTime: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    Logger.error('Failed to get cron status', {
      error: error instanceof Error ? error.message : String(error),
      context: 'CronController.status',
    });

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve cron job status',
      },
    });
  }
});

export default router;
