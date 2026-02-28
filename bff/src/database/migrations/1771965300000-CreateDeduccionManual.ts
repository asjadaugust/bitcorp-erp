import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeduccionManual1771965300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.deduccion_manual (
        id SERIAL PRIMARY KEY,
        valorizacion_id INTEGER NOT NULL,

        -- Deduction type
        tipo VARCHAR(50) NOT NULL,
        -- Types: REPUESTOS, MANIPULEO_COMBUSTIBLE, AMORTIZACION_ADELANTO,
        --        PENALIDAD, RETENCION, OTRO

        -- Description & document reference
        concepto VARCHAR(500) NOT NULL,
        num_documento VARCHAR(50),
        fecha DATE,

        -- Financial
        monto NUMERIC(15, 2) NOT NULL DEFAULT 0.00,

        -- Metadata
        observaciones TEXT,
        creado_por INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        -- Foreign keys
        CONSTRAINT fk_deduccion_manual_valorizacion FOREIGN KEY (valorizacion_id)
          REFERENCES equipo.valorizacion_equipo(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_deduccion_manual_valorizacion ON equipo.deduccion_manual(valorizacion_id);
      CREATE INDEX idx_deduccion_manual_tipo ON equipo.deduccion_manual(tipo);

      COMMENT ON TABLE equipo.deduccion_manual IS 'Manual deduction line items for valuations (spare parts, fuel handling, advances, penalties, etc.)';
      COMMENT ON COLUMN equipo.deduccion_manual.tipo IS 'Deduction category: REPUESTOS, MANIPULEO_COMBUSTIBLE, AMORTIZACION_ADELANTO, PENALIDAD, RETENCION, OTRO';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS equipo.deduccion_manual;
    `);
  }
}
