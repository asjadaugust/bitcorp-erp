import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTenantIdToChecklistTemplates1771963911435 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_plantilla" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_item" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_resultado" ADD COLUMN IF NOT EXISTS "tenant_id" integer`);

        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_checklist_plantilla_tenant" ON "equipo"."checklist_plantilla" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_checklist_item_tenant" ON "equipo"."checklist_item" ("tenant_id")`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_checklist_resultado_tenant" ON "equipo"."checklist_resultado" ("tenant_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_checklist_resultado_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_checklist_item_tenant"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "equipo"."idx_checklist_plantilla_tenant"`);

        await queryRunner.query(`ALTER TABLE "equipo"."checklist_resultado" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_item" DROP COLUMN IF EXISTS "tenant_id"`);
        await queryRunner.query(`ALTER TABLE "equipo"."checklist_plantilla" DROP COLUMN IF EXISTS "tenant_id"`);
    }

}
