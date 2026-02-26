import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateParteDiarioFoto1771965200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE equipo.parte_diario_foto (
        id              SERIAL PRIMARY KEY,
        parte_diario_id INTEGER NOT NULL REFERENCES equipo.parte_diario(id) ON DELETE CASCADE,
        filename        VARCHAR(255) NOT NULL,
        original_name   VARCHAR(255),
        mime_type       VARCHAR(100) DEFAULT 'image/jpeg',
        size            INTEGER,
        orden           INTEGER DEFAULT 0,
        tenant_id       INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_foto_parte_diario ON equipo.parte_diario_foto(parte_diario_id);
      CREATE INDEX idx_foto_tenant       ON equipo.parte_diario_foto(tenant_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS equipo.parte_diario_foto;
    `);
  }
}
