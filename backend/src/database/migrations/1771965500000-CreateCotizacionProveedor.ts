import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WS-34: Provider Comparison Matrix (PRD P-001 §4.1.2, CORP-GEM-F-009)
 *
 * Tracks provider quotations for equipment requests. The comparison matrix
 * lets administrators compare ≥2 provider quotes side-by-side before
 * issuing an Orden de Alquiler (OAL).
 */
export class CreateCotizacionProveedor1771965500000 implements MigrationInterface {
  name = 'CreateCotizacionProveedor1771965500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE equipo.cotizacion_proveedor (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(20) NOT NULL UNIQUE,
        solicitud_equipo_id INTEGER NOT NULL,
        proveedor_id INTEGER NOT NULL,
        descripcion_equipo VARCHAR(255),
        tarifa_propuesta NUMERIC(12,2) NOT NULL,
        tipo_tarifa VARCHAR(10) NOT NULL DEFAULT 'HORA',
        moneda VARCHAR(5) NOT NULL DEFAULT 'PEN',
        horas_incluidas NUMERIC(8,2),
        penalidad_exceso NUMERIC(10,2),
        plazo_entrega_dias INTEGER,
        condiciones_pago TEXT,
        condiciones_especiales TEXT,
        garantia TEXT,
        disponibilidad VARCHAR(50),
        observaciones TEXT,
        puntaje INTEGER CHECK (puntaje BETWEEN 0 AND 100),
        motivo_seleccion TEXT,
        estado VARCHAR(20) NOT NULL DEFAULT 'REGISTRADA',
        evaluado_por INTEGER,
        fecha_evaluacion TIMESTAMP,
        orden_alquiler_id INTEGER,
        creado_por INTEGER,
        tenant_id INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT fk_cotizacion_solicitud
          FOREIGN KEY (solicitud_equipo_id) REFERENCES equipo.solicitud_equipo(id),
        CONSTRAINT fk_cotizacion_proveedor
          FOREIGN KEY (proveedor_id) REFERENCES proveedores.proveedor(id),
        CONSTRAINT fk_cotizacion_evaluador
          FOREIGN KEY (evaluado_por) REFERENCES sistema.usuario(id),
        CONSTRAINT fk_cotizacion_orden
          FOREIGN KEY (orden_alquiler_id) REFERENCES equipo.orden_alquiler(id),
        CONSTRAINT uq_cotizacion_solicitud_proveedor
          UNIQUE (solicitud_equipo_id, proveedor_id)
      );

      CREATE INDEX idx_cotizacion_solicitud ON equipo.cotizacion_proveedor(solicitud_equipo_id);
      CREATE INDEX idx_cotizacion_proveedor ON equipo.cotizacion_proveedor(proveedor_id);
      CREATE INDEX idx_cotizacion_estado ON equipo.cotizacion_proveedor(estado);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.cotizacion_proveedor;`);
  }
}
