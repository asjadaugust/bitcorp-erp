import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIdToRemainingTables1771964000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tenant_id to remaining tables
        await queryRunner.query(`ALTER TABLE "proveedores"."proveedor" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."contrato_adenda" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."valorizacion_equipo" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);

        // Create indexes
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_proveedor_tenant" ON "proveedores"."proveedor" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_contrato_tenant" ON "equipo"."contrato_adenda" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_valorizacion_tenant" ON "equipo"."valorizacion_equipo" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_valorizacion_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_contrato_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "proveedores"."idx_proveedor_tenant"`);

        await queryRunner.query(`ALTER TABLE "equipo"."valorizacion_equipo" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."contrato_adenda" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "proveedores"."proveedor" DROP COLUMN IF EXISTS "tenant_id"`);
    }

}
