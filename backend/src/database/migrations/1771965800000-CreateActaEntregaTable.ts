import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateActaEntregaTable1771965800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.acta_entrega (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) NOT NULL UNIQUE,
        equipo_id INTEGER NOT NULL,
        contrato_id INTEGER,
        proyecto_id INTEGER,
        fecha_entrega DATE NOT NULL,
        tipo VARCHAR(30) NOT NULL DEFAULT 'ENTREGA',
        estado VARCHAR(20) NOT NULL DEFAULT 'BORRADOR',
        condicion_equipo VARCHAR(20) NOT NULL DEFAULT 'BUENO',
        horometro_entrega NUMERIC(10,2),
        kilometraje_entrega NUMERIC(10,2),
        observaciones TEXT,
        observaciones_fisicas TEXT,
        recibido_por INTEGER,
        entregado_por INTEGER,
        firma_recibido TEXT,
        firma_entregado TEXT,
        fecha_firma TIMESTAMP WITH TIME ZONE,
        creado_por INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        tenant_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_acta_entrega_equipo ON equipo.acta_entrega(equipo_id);
      CREATE INDEX IF NOT EXISTS idx_acta_entrega_estado ON equipo.acta_entrega(estado);
      CREATE INDEX IF NOT EXISTS idx_acta_entrega_fecha ON equipo.acta_entrega(fecha_entrega);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.acta_entrega;`);
  }
}
