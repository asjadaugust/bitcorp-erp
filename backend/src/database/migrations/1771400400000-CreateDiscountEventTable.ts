import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscountEventTable1771400400000 implements MigrationInterface {
  name = 'CreateDiscountEventTable1771400400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.evento_descuento (
        id SERIAL PRIMARY KEY,
        valorizacion_id INTEGER NOT NULL REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        horas_descuento DECIMAL(5,2) DEFAULT 0,
        dias_descuento DECIMAL(5,2) DEFAULT 0,
        descripcion TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_evento_descuento_valorizacion
      ON equipo.evento_descuento (valorizacion_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.evento_descuento;`);
  }
}
