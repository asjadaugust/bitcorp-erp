import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDisponibilidadOperador1771965100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rrhh.disponibilidad_operador (
        id              SERIAL PRIMARY KEY,
        trabajador_id   INTEGER NOT NULL REFERENCES rrhh.trabajador(id) ON DELETE CASCADE,
        fecha           DATE NOT NULL,
        disponible      BOOLEAN NOT NULL DEFAULT TRUE,
        observacion     TEXT,
        tenant_id       INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_disp_op_fecha UNIQUE (trabajador_id, fecha, tenant_id)
      );

      CREATE INDEX idx_disp_op_trabajador ON rrhh.disponibilidad_operador(trabajador_id);
      CREATE INDEX idx_disp_op_tenant     ON rrhh.disponibilidad_operador(tenant_id);
      CREATE INDEX idx_disp_op_fecha      ON rrhh.disponibilidad_operador(fecha);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS rrhh.disponibilidad_operador;
    `);
  }
}
