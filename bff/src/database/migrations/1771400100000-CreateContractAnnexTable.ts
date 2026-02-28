import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractAnnexTable1771400100000 implements MigrationInterface {
  name = 'CreateContractAnnexTable1771400100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.contrato_anexo (
        id SERIAL PRIMARY KEY,
        contrato_id integer NOT NULL REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
        tipo_anexo varchar(1) NOT NULL CHECK (tipo_anexo IN ('A', 'B')),
        orden integer NOT NULL DEFAULT 0,
        concepto varchar(500) NOT NULL,
        incluido boolean NOT NULL DEFAULT false,
        observaciones text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contrato_anexo_contrato ON equipo.contrato_anexo(contrato_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.contrato_anexo`);
  }
}
