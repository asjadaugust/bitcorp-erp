import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractObligacion1771401600000 implements MigrationInterface {
  name = 'CreateContractObligacion1771401600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.contrato_obligacion (
        id            SERIAL PRIMARY KEY,
        contrato_id   INTEGER NOT NULL
                        REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
        tipo_obligacion VARCHAR(50) NOT NULL,
        estado        VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        fecha_compromiso DATE,
        observaciones TEXT,
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_tipo_obligacion CHECK (tipo_obligacion IN (
          'CONDICIONES_OPERATIVAS', 'REPRESENTANTE_FRENTE', 'POLIZA_TREC',
          'NORMAS_SEGURIDAD', 'SOAT', 'REPARACION_REEMPLAZO',
          'KIT_ANTIDERRAME', 'DOCUMENTOS_VALIDOS', 'REEMPLAZO_OPERADOR'
        )),
        CONSTRAINT chk_estado_obligacion CHECK (
          estado IN ('PENDIENTE', 'CUMPLIDA', 'INCUMPLIDA')
        )
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contrato_obligacion_contrato_id
        ON equipo.contrato_obligacion(contrato_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.contrato_obligacion CASCADE;`);
  }
}
