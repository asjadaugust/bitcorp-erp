import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './config/database.config';
import authRoutes from './api/auth/auth.routes';
import dashboardRoutes from './api/dashboard/dashboard.routes';
import projectRoutes from './api/projects/project.routes';
import providerRoutes from './api/providers/provider.routes';
import equipmentRoutes from './api/equipment/equipment.routes';
import operatorRoutes from './api/operators/operator.routes';
import reportRoutes from './api/reports/report.routes';
import reportingRoutes from './api/reporting/reporting.routes';
import contractRoutes from './api/contracts/contract.routes';
import notificationRoutes from './api/notifications/notification.routes';
import valuationRoutes from './api/valuations/valuation.routes';
import maintenanceRoutes from './api/maintenance/maintenance.routes';
import movementRoutes from './api/logistics/movement.routes';
import productRoutes from './api/logistics/product.routes';
import hrRoutes from './api/hr';
import schedulingRoutes from './api/scheduling';
import administrationRoutes from './api/administration/administration.routes';
import sstRoutes from './api/sst/sst.routes';
import sigRoutes from './api/sig/sig.routes';
import { createTenantRouter } from './api/tenant';
import tenderRoutes from './api/tenders/tender.routes';
import checklistRoutes from './api/checklists/checklist.routes';
import costCenterRoutes from './api/admin/cost-center.routes';
import accountsPayableRoutes from './api/accounts-payable/accounts-payable.routes';
import paymentScheduleRoutes from './api/payment-schedules/payment-schedule.routes';
import solicitudesEquipoRoutes from './api/solicitudes-equipo/solicitudes-equipo.routes';
import actasDevolucionRoutes from './api/actas-devolucion/actas-devolucion.routes';
import ordenesAlquilerRoutes from './api/ordenes-alquiler/ordenes-alquiler.routes';
import periodosInoperatividadRoutes from './api/periodos-inoperatividad/periodos-inoperatividad.routes';
import tiposEquipoRoutes from './api/tipos-equipo/tipos-equipo.routes';
import precalentamientoConfigRoutes from './api/precalentamiento-config/precalentamiento-config.routes';
import valesCombustibleRoutes from './api/vales-combustible/vales-combustible.routes';
import cotizacionesRoutes from './api/cotizaciones/cotizaciones.routes';
import analyticsRoutes from './api/analytics';
import testErrorRoutes from './api/test-errors/test-errors.routes';
import paymentRoutes from './api/payments/payment-record.routes';
import cronRoutes from './api/cron/cron.routes';
import userRoutes from './api/users/users.routes';
import cacheRoutes from './routes/cache.route';
import { errorHandler, notFound } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';
import { setupProcessErrorHandlers } from './middleware/error-handler.middleware';
import Logger from './utils/logger';
import { performanceMetrics } from './utils/performance-metrics.service';
import { performanceConfig } from './config/performance.config';
import { CronService } from './services/cron.service';
import swaggerUi from 'swagger-ui-express';
import * as fs from 'fs';
import * as path from 'path';

// Load auto-generated swagger documentation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let swaggerSpec: any;
try {
  const swaggerPath = path.resolve(process.cwd(), 'swagger-api.json');
  Logger.debug('Loading Swagger documentation', { path: swaggerPath, context: 'Server.startup' });
  if (fs.existsSync(swaggerPath)) {
    const content = fs.readFileSync(swaggerPath, 'utf8');
    if (content && content.trim()) {
      swaggerSpec = JSON.parse(content);
      Logger.info('Swagger documentation loaded successfully', { context: 'Server.startup' });
    } else {
      Logger.warn('Swagger documentation file is empty', { context: 'Server.startup' });
    }
  } else {
    Logger.warn('Swagger documentation file not found', {
      path: swaggerPath,
      context: 'Server.startup',
    });
  }
} catch (error) {
  Logger.error('Error loading swagger-api.json', {
    error: error instanceof Error ? error.message : String(error),
    context: 'Server.startup',
  });
}

// Setup process-level error handlers
setupProcessErrorHandlers();

// Global cron service instance for graceful shutdown
let cronService: CronService | null = null;

const app = express();
const port = process.env.PORT || 3400;

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (photos, documents, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging with correlation IDs
app.use(requestLogger);

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the status of the server and the current timestamp
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/operators', operatorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/valuations', valuationRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/solicitudes-equipo', solicitudesEquipoRoutes);
app.use('/api/actas-devolucion', actasDevolucionRoutes);
app.use('/api/ordenes-alquiler', ordenesAlquilerRoutes);
app.use('/api/periodos-inoperatividad', periodosInoperatividadRoutes);
app.use('/api/tipos-equipo', tiposEquipoRoutes);
app.use('/api/precalentamiento-config', precalentamientoConfigRoutes);
app.use('/api/vales-combustible', valesCombustibleRoutes);
app.use('/api/logistics/movements', movementRoutes);
app.use('/api/logistics/products', productRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/administration', administrationRoutes);
app.use('/api/sst', sstRoutes);
app.use('/api/sig', sigRoutes);
app.use('/api/tenant', createTenantRouter());
app.use('/api/tenders', tenderRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/admin/cost-centers', costCenterRoutes);
app.use('/api/accounts-payable', accountsPayableRoutes);
app.use('/api/payment-schedules', paymentScheduleRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cache', cacheRoutes);

// Swagger Documentation
if (swaggerSpec) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Cron job management endpoints (development/staging only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/cron', cronRoutes);
}

// Test error endpoints (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/test-errors', testErrorRoutes);
}

// 404 handler for undefined routes (must be before error handler)
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    Logger.info('Initializing database connections', { context: 'Server.startup' });
    await initializeDatabase(); // TypeORM for new entities
    Logger.info('Database connections established successfully', {
      database: 'TypeORM',
      context: 'Server.startup',
    });

    // Auto-run migrations (TypeORM)
    if (process.env.NODE_ENV !== 'test') {
      try {
        Logger.info('Checking for pending migrations', {
          context: 'Server.startup.migrations',
        });
        const { AppDataSource } = await import('./config/database.config');
        const pendingMigrations = await AppDataSource.showMigrations();

        if (pendingMigrations) {
          Logger.info('Running pending migrations', { context: 'Server.startup.migrations' });
          await AppDataSource.runMigrations();
          Logger.info('Database migrations completed successfully', {
            context: 'Server.startup.migrations',
          });
        } else {
          Logger.info('Database schema is up to date', { context: 'Server.startup.migrations' });
        }
      } catch (error) {
        Logger.error('Migration check/run failed', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          context: 'Server.startup.migrations',
        });
        // Don't crash on migration errors in development
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      }
    }

    // Note: To seed the database, run: npm run seed:typeorm

    // Initialize cron jobs for automated notifications
    Logger.info('Initializing cron jobs for automated notifications', {
      context: 'Server.startup.cron',
    });
    try {
      cronService = new CronService();
      cronService.startAllJobs();
      Logger.info('Cron jobs started successfully', {
        jobs: ['maintenance-check', 'contract-expiration-check', 'certification-expiry-check'],
        schedule: 'Daily at 8:00 AM (0 8 * * *)',
        context: 'Server.startup.cron',
      });
    } catch (error) {
      Logger.error('Failed to start cron jobs', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'Server.startup.cron',
        note: 'Server will continue without automated notifications',
      });
      // Don't crash the server if cron jobs fail to start
    }

    // Load routes
    Logger.info('Loading API routes', { context: 'Server.startup' });
    Logger.info('API routes loaded successfully', {
      routeCount: 25,
      context: 'Server.startup',
    });

    app.listen(port, () => {
      Logger.info('Bitcorp ERP Backend Server started', {
        version: '2.0',
        port,
        environment: process.env.NODE_ENV || 'development',
        healthCheck: `http://localhost:${port}/health`,
        swaggerDocs: `http://localhost:${port}/api-docs`,
        authEndpoint: `http://localhost:${port}/api/auth`,
        performanceMonitoring: {
          enabled: performanceConfig.metrics.enabled,
          slowQueryThreshold: `${performanceConfig.database.slowQueryWarning}ms`,
          slowEndpointThreshold: `${performanceConfig.http.slowEndpointWarning}ms`,
        },
        context: 'Server.startup',
      });
    });
  } catch (error) {
    Logger.error('Server startup failed', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      port,
      environment: process.env.NODE_ENV,
      context: 'Server.startup',
    });
    process.exit(1);
  }
};

// Graceful shutdown handlers
const shutdownHandler = (signal: string) => {
  Logger.info(`${signal} received, starting graceful shutdown`, {
    context: 'Server.shutdown',
  });

  // Stop cron jobs to prevent new job executions
  if (cronService) {
    Logger.info('Stopping cron jobs', { context: 'Server.shutdown.cron' });
    try {
      cronService.stopAllJobs();
      Logger.info('Cron jobs stopped successfully', { context: 'Server.shutdown.cron' });
    } catch (error) {
      Logger.error('Failed to stop cron jobs', {
        error: error instanceof Error ? error.message : String(error),
        context: 'Server.shutdown.cron',
      });
    }
  }

  // Log final performance metrics
  performanceMetrics.shutdown();

  // Give time for in-flight requests to complete
  setTimeout(() => {
    Logger.info('Graceful shutdown complete', { context: 'Server.shutdown' });
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
process.on('SIGINT', () => shutdownHandler('SIGINT'));

startServer();
