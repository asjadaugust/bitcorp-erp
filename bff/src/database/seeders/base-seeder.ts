import { DataSource } from 'typeorm';

/**
 * Base class for all seeders
 * Provides common functionality and structure
 */
export abstract class BaseSeeder {
  constructor(protected dataSource: DataSource) {}

  /**
   * Run the seeder
   */
  abstract run(): Promise<void>;

  /**
   * Get seeder name
   */
  get name(): string {
    return this.constructor.name;
  }
}
