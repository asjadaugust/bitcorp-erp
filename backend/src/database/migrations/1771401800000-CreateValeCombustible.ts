import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateValeCombustible1771401800000 implements MigrationInterface {
  name = 'CreateValeCombustible1771401800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.vale_combustible (
        id                SERIAL PRIMARY KEY,
        codigo            VARCHAR(20) NOT NULL UNIQUE,
        parte_diario_id   INTEGER REFERENCES equipo.parte_diario(id) ON DELETE SET NULL,
        equipo_id         INTEGER NOT NULL REFERENCES equipo.equipo(id) ON DELETE RESTRICT,
        proyecto_id       INTEGER REFERENCES proyectos.edt(id) ON DELETE SET NULL,
        fecha             DATE NOT NULL,
        numero_vale       VARCHAR(50) NOT NULL,
        tipo_combustible  VARCHAR(20) NOT NULL DEFAULT 'DIESEL'
                            CHECK (tipo_combustible IN ('DIESEL','GASOLINA_90','GASOLINA_95','GLP','GNV')),
        cantidad_galones  DECIMAL(8,2) NOT NULL,
        precio_unitario   DECIMAL(10,2),
        monto_total       DECIMAL(12,2),
        proveedor         VARCHAR(150),
        observaciones     TEXT,
        estado            VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (estado IN ('PENDIENTE','REGISTRADO','ANULADO')),
        creado_por        INTEGER REFERENCES sistema.usuario(id) ON DELETE SET NULL,
        created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vale_combustible_equipo
        ON equipo.vale_combustible(equipo_id)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vale_combustible_parte_diario
        ON equipo.vale_combustible(parte_diario_id)
      WHERE parte_diario_id IS NOT NULL
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_vale_combustible_fecha
        ON equipo.vale_combustible(fecha)
    `);

    await queryRunner.query(`
      COMMENT ON TABLE equipo.vale_combustible IS
        'Vales de combustible registrados por operadores — WS-23 (CORP-GEM-F-007)'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.vale_combustible`);
  }
}
