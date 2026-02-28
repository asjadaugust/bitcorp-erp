import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractObligacionArrendatario1771401700000 implements MigrationInterface {
  name = 'CreateContractObligacionArrendatario1771401700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.contrato_obligacion_arrendatario (
        id                SERIAL PRIMARY KEY,
        contrato_id       INTEGER NOT NULL REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
        tipo_obligacion   VARCHAR(50) NOT NULL,
        estado            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        fecha_compromiso  DATE,
        observaciones     TEXT,
        created_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at        TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT chk_tipo_obligacion_arrendatario CHECK (tipo_obligacion IN (
          'GUARDIANIA',
          'SENALIZACION_SEGURIDAD',
          'PAGOS_OPORTUNOS',
          'NO_TRASLADO_SIN_AUTORIZACION'
        )),
        CONSTRAINT chk_estado_obligacion_arrendatario CHECK (
          estado IN ('PENDIENTE', 'CUMPLIDA', 'INCUMPLIDA')
        )
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_contrato_obligacion_arrendatario_contrato
        ON equipo.contrato_obligacion_arrendatario(contrato_id);
    `);

    await queryRunner.query(`
      COMMENT ON TABLE equipo.contrato_obligacion_arrendatario IS
        'Tracking de obligaciones del arrendatario según Cláusula 8 de CORP-GEM-F-001';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS equipo.contrato_obligacion_arrendatario CASCADE;`
    );
  }
}
