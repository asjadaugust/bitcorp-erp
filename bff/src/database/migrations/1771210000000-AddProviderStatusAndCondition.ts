import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProviderStatusAndCondition1771210000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "proveedores"."proveedor" 
      ADD COLUMN "estado_contribuyente" varchar(100),
      ADD COLUMN "condicion_contribuyente" varchar(100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "proveedores"."proveedor" 
      DROP COLUMN "estado_contribuyente",
      DROP COLUMN "condicion_contribuyente";
    `);
  }
}
