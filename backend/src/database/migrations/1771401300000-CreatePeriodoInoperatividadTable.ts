import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePeriodoInoperatividadTable1771401300000 implements MigrationInterface {
  name = 'CreatePeriodoInoperatividadTable1771401300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.periodo_inoperatividad (
        id                    SERIAL PRIMARY KEY,
        equipo_id             INTEGER NOT NULL,
        contrato_id           INTEGER NULL,
        fecha_inicio          DATE NOT NULL,
        fecha_fin             DATE NULL,
        dias_inoperativo      INTEGER NOT NULL DEFAULT 0,
        motivo                TEXT NOT NULL,
        estado                VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
        excede_plazo          BOOLEAN NOT NULL DEFAULT FALSE,
        dias_plazo            INTEGER NOT NULL DEFAULT 5,
        penalidad_aplicada    BOOLEAN NOT NULL DEFAULT FALSE,
        monto_penalidad       DECIMAL(12,2) NULL,
        observaciones_penalidad TEXT NULL,
        resuelto_por          INTEGER NULL,
        creado_por            INTEGER NULL,
        created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_periodo_inoperatividad_equipo
      ON equipo.periodo_inoperatividad (equipo_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_periodo_inoperatividad_estado
      ON equipo.periodo_inoperatividad (estado);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_periodo_inoperatividad_contrato
      ON equipo.periodo_inoperatividad (contrato_id)
      WHERE contrato_id IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.periodo_inoperatividad;`);
  }
}
