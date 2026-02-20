import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePrecalentamientoConfig1771401500000 implements MigrationInterface {
  name = 'CreatePrecalentamientoConfig1771401500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Create precalentamiento_config table ───────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "equipo"."precalentamiento_config" (
        "id"                     SERIAL        NOT NULL,
        "tipo_equipo_id"         INTEGER       NOT NULL,
        "horas_precalentamiento" DECIMAL(4,2)  NOT NULL DEFAULT 0,
        "activo"                 BOOLEAN       NOT NULL DEFAULT TRUE,
        "updated_at"             TIMESTAMP     NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_precalentamiento_config"          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_precalentamiento_tipo_equipo"     UNIQUE ("tipo_equipo_id"),
        CONSTRAINT "FK_precalentamiento_tipo_equipo_id"  FOREIGN KEY ("tipo_equipo_id")
          REFERENCES "equipo"."tipo_equipo"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_precalentamiento_tipo_equipo" ON "equipo"."precalentamiento_config" ("tipo_equipo_id")`
    );

    // ─── 2. Seed PRD-default hours per category ────────────────────────────────
    // Annexo B:  MAQUINARIA_PESADA = 0.50 h
    //            VEHICULOS_PESADOS = 0.25 h
    //            VEHICULOS_LIVIANOS / EQUIPOS_MENORES = 0.00 h
    await queryRunner.query(`
      INSERT INTO "equipo"."precalentamiento_config" ("tipo_equipo_id", "horas_precalentamiento")
      SELECT
        t.id,
        CASE t.categoria_prd
          WHEN 'MAQUINARIA_PESADA' THEN 0.50
          WHEN 'VEHICULOS_PESADOS' THEN 0.25
          ELSE 0.00
        END
      FROM "equipo"."tipo_equipo" t
      ON CONFLICT ("tipo_equipo_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "equipo"."precalentamiento_config" CASCADE`);
  }
}
