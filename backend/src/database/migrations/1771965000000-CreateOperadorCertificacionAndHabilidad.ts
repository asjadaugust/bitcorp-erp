import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOperadorCertificacionAndHabilidad1771965000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE rrhh.operador_certificacion (
        id                    SERIAL PRIMARY KEY,
        trabajador_id         INTEGER NOT NULL REFERENCES rrhh.trabajador(id) ON DELETE CASCADE,
        nombre_certificacion  VARCHAR(200) NOT NULL,
        numero_certificacion  VARCHAR(100),
        fecha_emision         DATE,
        fecha_vencimiento     DATE,
        entidad_emisora       VARCHAR(200),
        estado                VARCHAR(20) NOT NULL DEFAULT 'VIGENTE'
                              CHECK (estado IN ('VIGENTE', 'VENCIDO', 'POR_VENCER')),
        tenant_id             INTEGER,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_op_cert_trabajador ON rrhh.operador_certificacion(trabajador_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_op_cert_tenant    ON rrhh.operador_certificacion(tenant_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_op_cert_venc      ON rrhh.operador_certificacion(fecha_vencimiento)`
    );

    await queryRunner.query(`
      CREATE TABLE rrhh.operador_habilidad (
        id                   SERIAL PRIMARY KEY,
        trabajador_id        INTEGER NOT NULL REFERENCES rrhh.trabajador(id) ON DELETE CASCADE,
        tipo_equipo          VARCHAR(100) NOT NULL,
        nivel_habilidad      VARCHAR(20) NOT NULL DEFAULT 'PRINCIPIANTE'
                             CHECK (nivel_habilidad IN ('PRINCIPIANTE','INTERMEDIO','AVANZADO','EXPERTO')),
        anios_experiencia    DECIMAL(4,1) NOT NULL DEFAULT 0,
        ultima_verificacion  DATE,
        tenant_id            INTEGER,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_op_hab_trabajador ON rrhh.operador_habilidad(trabajador_id)`
    );
    await queryRunner.query(
      `CREATE INDEX idx_op_hab_tenant     ON rrhh.operador_habilidad(tenant_id)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS rrhh.operador_habilidad;
      DROP TABLE IF EXISTS rrhh.operador_certificacion;
    `);
  }
}
