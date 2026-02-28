import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPreWarmingToDailyReport1771400500000 implements MigrationInterface {
  name = 'AddPreWarmingToDailyReport1771400500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.parte_diario
        ADD COLUMN IF NOT EXISTS horas_precalentamiento DECIMAL(5,2) DEFAULT 0;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.parte_diario
        DROP COLUMN IF EXISTS horas_precalentamiento;
    `);
  }
}
