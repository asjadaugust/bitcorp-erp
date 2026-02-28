import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WS-32b: Contract Notarial Legalization Flow (PRD P-001 §4.3.3)
 *
 * Tracks the 4-step notarial legalization process:
 *   Step 1: Envío al proveedor (send 2 copies to provider for notarial signature)
 *   Step 2: Envío a oficina central (send to Lima for legal rep signature)
 *   Step 3: Archivado (archive — 1 copy to provider, 1 stays with project)
 *   Step 4: Completado (legalization complete, contract ready for operation)
 */
export class CreateContratoLegalizacion1771965400000 implements MigrationInterface {
  name = 'CreateContratoLegalizacion1771965400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE equipo.contrato_legalizacion_paso (
        id SERIAL PRIMARY KEY,
        contrato_id INTEGER NOT NULL,
        numero_paso INTEGER NOT NULL CHECK (numero_paso BETWEEN 1 AND 4),
        tipo_paso VARCHAR(40) NOT NULL,
        completado BOOLEAN NOT NULL DEFAULT FALSE,
        fecha_completado TIMESTAMP,
        completado_por INTEGER,
        observaciones TEXT,
        tenant_id INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

        CONSTRAINT fk_legalizacion_contrato
          FOREIGN KEY (contrato_id) REFERENCES equipo.contrato_adenda(id) ON DELETE CASCADE,
        CONSTRAINT fk_legalizacion_usuario
          FOREIGN KEY (completado_por) REFERENCES sistema.usuario(id),
        CONSTRAINT uq_legalizacion_paso
          UNIQUE (contrato_id, numero_paso)
      );

      CREATE INDEX idx_legalizacion_contrato ON equipo.contrato_legalizacion_paso(contrato_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.contrato_legalizacion_paso;`);
  }
}
