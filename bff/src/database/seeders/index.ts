import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../../config/database.config';
import { BaseSeeder } from './base-seeder';
import { SistemaSeeder } from './001-sistema-seeder';
import { CoreEntitiesSeeder } from './002-core-entities-seeder';
import { SigSeeder } from './003-sig-seeder';
import { OperationsSeeder } from './004-operations-seeder';
import { EquipmentSeeder } from './005-equipment-seeder';
import { LogisticsSeeder } from './006-logistics-seeder';
import { HrSeeder } from './007-hr-seeder';
import { ChecklistsSeeder } from './008-checklists-seeder';
import { AdministrationSeeder } from './009-administration-seeder';
import { SstSeeder } from './010-sst-seeder';
import { ApprovalsSeeder } from './011-approvals-seeder';

/**
 * Main seeder runner
 * Executes all seeders in order
 */
export async function runSeeders(dataSource?: DataSource): Promise<void> {
  let ds = dataSource;
  let shouldCloseConnection = false;

  try {
    // Use provided DataSource or initialize AppDataSource
    if (!ds) {
      ds = AppDataSource;
      if (!ds.isInitialized) {
        console.log('🔌 Initializing database connection...');
        await ds.initialize();
        shouldCloseConnection = true;
      }
    }

    console.log('🌱 Starting database seeding...\n');

    // Define seeders in execution order
    const seeders: (new (dataSource: DataSource) => BaseSeeder)[] = [
      SistemaSeeder,
      CoreEntitiesSeeder,
      SigSeeder,
      OperationsSeeder,
      EquipmentSeeder,
      LogisticsSeeder,
      HrSeeder,
      ChecklistsSeeder,
      AdministrationSeeder,
      SstSeeder,
      ApprovalsSeeder,
    ];

    // Execute each seeder
    for (const SeederClass of seeders) {
      const seederName = SeederClass.name;
      console.log(`📦 Running ${seederName}...`);

      const seeder = new SeederClass(ds);
      await seeder.run();

      console.log(`   ✅ ${seederName} completed\n`);
    }

    console.log('✨ Database seeding completed successfully!');
    console.log('');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    // Close connection if we opened it
    if (shouldCloseConnection && ds?.isInitialized) {
      console.log('🔌 Closing database connection...');
      await ds.destroy();
    }
  }
}

// Run seeders if this file is executed directly
if (require.main === module) {
  runSeeders()
    .then(() => {
      console.log('👍 Seeding process finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}
