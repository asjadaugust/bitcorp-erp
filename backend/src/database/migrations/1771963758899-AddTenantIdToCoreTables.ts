import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIdToCoreTables1771963758899 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tenant_id to core tables if they don't have it
        await queryRunner.query(`ALTER TABLE "sig"."documento" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_inspeccion" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."programa_mantenimiento" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "sst"."incidente" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "administracion"."cuenta_por_pagar" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."equipo" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."parte_diario" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "sistema"."usuario" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);

        // Create indexes for performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sig_documento_tenant" ON "sig"."documento" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_checklist_inspeccion_tenant" ON "equipo"."checklist_inspeccion" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_programa_mantenimiento_tenant" ON "equipo"."programa_mantenimiento" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_sst_incidente_tenant" ON "sst"."incidente" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_cuenta_pagar_tenant" ON "administracion"."cuenta_por_pagar" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_equipo_tenant" ON "equipo"."equipo" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_parte_diario_tenant" ON "equipo"."parte_diario" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_usuario_tenant" ON "sistema"."usuario" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "sistema"."idx_usuario_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_parte_diario_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_equipo_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "administracion"."idx_cuenta_pagar_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "sst"."idx_sst_incidente_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_programa_mantenimiento_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_checklist_inspeccion_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "sig"."idx_sig_documento_tenant"`);

        await queryRunner.query(`ALTER TABLE "sistema"."usuario" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."parte_diario" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."equipo" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "administracion"."cuenta_por_pagar" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "sst"."incidente" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."programa_mantenimiento" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_inspeccion" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "sig"."documento" DROP COLUMN IF EXISTS "tenant_id"`);
    }

}
