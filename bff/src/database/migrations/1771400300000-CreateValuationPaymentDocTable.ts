import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateValuationPaymentDocTable1771400300000 implements MigrationInterface {
  name = 'CreateValuationPaymentDocTable1771400300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.valorizacion_documento_pago (
        id SERIAL PRIMARY KEY,
        valorizacion_id integer NOT NULL REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE,
        tipo_documento varchar(50) NOT NULL,
        numero varchar(100),
        fecha_documento date,
        archivo_url text,
        estado varchar(20) NOT NULL DEFAULT 'PENDIENTE',
        observaciones text,
        created_at timestamp DEFAULT CURRENT_TIMESTAMP,
        updated_at timestamp DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE INDEX idx_val_doc_pago_valorizacion ON equipo.valorizacion_documento_pago(valorizacion_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.valorizacion_documento_pago`);
  }
}
