import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { AppDataSource } from '../src/config/database.config';
import { DashboardService } from '../src/services/dashboard.service';

async function checkAlerts() {
  await AppDataSource.initialize();
  const service = new DashboardService();
  const alerts = await service.getDocumentAlerts();
  console.log('Current Dashboard Alerts:', JSON.stringify(alerts, null, 2));
  await AppDataSource.destroy();
  process.exit(0);
}

checkAlerts().catch((err) => {
  console.error('Failed to check alerts', err);
  process.exit(1);
});
