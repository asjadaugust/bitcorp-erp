import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContractRequiredDocTable1771400200000 implements MigrationInterface {
  name = 'CreateContractRequiredDocTable1771400200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.contrato_documento_requerido (
        id SERIAL PRIMARY KEY,
        contrato_id integer NOT NULL REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
        tipo_documento varchar(50) NOT NULL,
        provider_document_id integer,
        estado varchar(20) NOT NULL DEFAULT 'PENDIENTE',
        fecha_vencimiento date,
        observaciones text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_contrato_doc_req_contrato ON equipo.contrato_documento_requerido(contrato_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.contrato_documento_requerido`);
  }
}
