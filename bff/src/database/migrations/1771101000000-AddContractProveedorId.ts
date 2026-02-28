import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractProveedorId1771101000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD "proveedor_id" integer`
    );
     await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD CONSTRAINT "FK_contrato_proveedor" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"."proveedor"("id")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP CONSTRAINT "FK_contrato_proveedor"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP COLUMN "proveedor_id"`
    );
  }
}
