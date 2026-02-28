import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToCentroCosto1771965900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "administracion"."centro_costo" ADD COLUMN IF NOT EXISTS "tenant_id" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "administracion"."centro_costo" DROP COLUMN IF EXISTS "tenant_id"`
    );
  }
}
