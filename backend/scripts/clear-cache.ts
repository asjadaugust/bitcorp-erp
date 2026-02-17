import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../.env') });

import { cacheService } from '../src/services/cache.service';

async function clearDashboardCache() {
  console.log('Clearing dashboard cache...');
  const deletedCount = await cacheService.deletePattern('dashboard:*');
  console.log(`Deleted ${deletedCount} dashboard cache keys.`);
  process.exit(0);
}

clearDashboardCache().catch((err) => {
  console.error('Failed to clear cache', err);
  process.exit(1);
});
