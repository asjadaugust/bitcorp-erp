import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './database/connection';
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
import fuelRoutes from './api/fuel/fuel.routes';
import checklistRoutes from './api/checklists/checklist.routes';
import costCenterRoutes from './api/admin/cost-center.routes';
import accountsPayableRoutes from './api/accounts-payable/accounts-payable.routes';
import analyticsRoutes from './api/analytics';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

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

// Request logging with correlation IDs
app.use(requestLogger);

// Health check
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
app.use('/api/logistics/movements', movementRoutes);
app.use('/api/logistics/products', productRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/scheduling', schedulingRoutes);
app.use('/api/administration', administrationRoutes);
app.use('/api/sst', sstRoutes);
app.use('/api/sig', sigRoutes);
app.use('/api/tenant', createTenantRouter());
app.use('/api/tenders', tenderRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/checklists', checklistRoutes);
app.use('/api/admin/cost-centers', costCenterRoutes);
app.use('/api/accounts-payable', accountsPayableRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    console.log('Initializing databases...');
    await connectDatabase(); // Sequelize for legacy tables
    await initializeDatabase(); // TypeORM for new entities
    console.log('✅ All database connections established');

    // Auto-run migrations (TypeORM)
    if (process.env.NODE_ENV !== 'test') {
      try {
        console.log('🔄 Checking for pending migrations...');
        const { AppDataSource } = await import('./config/database.config');
        const pendingMigrations = await AppDataSource.showMigrations();

        if (pendingMigrations) {
          console.log('📝 Running pending migrations...');
          await AppDataSource.runMigrations();
          console.log('✅ Migrations completed successfully');
        } else {
          console.log('✅ Database schema is up to date');
        }
      } catch (error) {
        console.error('⚠️ Migration check/run failed:', error);
        // Don't crash on migration errors in development
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
      }
    }

    // Note: To seed the database, run: npm run seed:typeorm

    // Load routes
    console.log('Loading API routes...');
    console.log('✅ API routes loaded');

    app.listen(port, () => {
      console.log(`🚀 Bitcorp ERP Backend Server v2.0`);
      console.log(`📍 Server running on port ${port}`);
      console.log(`📍 Health check: http://localhost:${port}/health`);
      console.log(`🔐 Auth API: http://localhost:${port}/api/auth`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
