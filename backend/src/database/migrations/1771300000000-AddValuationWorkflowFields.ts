import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddValuationWorkflowFields1771300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new workflow columns
    await queryRunner.query(`
      ALTER TABLE "equipo"."valorizacion_equipo"
        ADD COLUMN IF NOT EXISTS "validado_por" integer REFERENCES "sistema"."usuario"(id),
        ADD COLUMN IF NOT EXISTS "validado_en" timestamp,
        ADD COLUMN IF NOT EXISTS "conformidad_proveedor" boolean DEFAULT false,
        ADD COLUMN IF NOT EXISTS "conformidad_fecha" timestamp,
        ADD COLUMN IF NOT EXISTS "conformidad_observaciones" text
    `);

    // Update existing PENDIENTE records with zero financials to BORRADOR
    // (preserves existing reviewed/approved records)
    await queryRunner.query(`
      UPDATE "equipo"."valorizacion_equipo"
      SET estado = 'BORRADOR'
      WHERE estado = 'PENDIENTE'
        AND COALESCE(total_valorizado, 0) = 0
        AND COALESCE(costo_base, 0) = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert BORRADOR records back to PENDIENTE
    await queryRunner.query(`
      UPDATE "equipo"."valorizacion_equipo"
      SET estado = 'PENDIENTE'
      WHERE estado = 'BORRADOR'
    `);

    // Remove new columns
    await queryRunner.query(`
      ALTER TABLE "equipo"."valorizacion_equipo"
        DROP COLUMN IF EXISTS "validado_por",
        DROP COLUMN IF EXISTS "validado_en",
        DROP COLUMN IF EXISTS "conformidad_proveedor",
        DROP COLUMN IF EXISTS "conformidad_fecha",
        DROP COLUMN IF EXISTS "conformidad_observaciones"
    `);
  }
}
