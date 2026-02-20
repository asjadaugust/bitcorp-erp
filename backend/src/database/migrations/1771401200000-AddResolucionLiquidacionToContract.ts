import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WS-16: Contract Lifecycle — Resolución + Liquidación
 *
 * Adds formal resolution and liquidation fields to equipo.contrato_adenda.
 * The three existing fields (motivo_resolucion, fecha_resolucion, monto_liquidacion)
 * are already present. We extend with:
 *   - causal_resolucion: classifies the PRD clause 12.1–12.10
 *   - resuelto_por: FK to user who registered the resolution
 *   - fecha_liquidacion: when the contract was formally liquidated
 *   - liquidado_por: FK to user who signed off on liquidation
 *   - observaciones_liquidacion: free-text notes on the liquidation settlement
 */
export class AddResolucionLiquidacionToContract1771401200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.contrato_adenda
        ADD COLUMN IF NOT EXISTS causal_resolucion VARCHAR(30) NULL,
        ADD COLUMN IF NOT EXISTS resuelto_por INTEGER NULL,
        ADD COLUMN IF NOT EXISTS fecha_liquidacion DATE NULL,
        ADD COLUMN IF NOT EXISTS liquidado_por INTEGER NULL,
        ADD COLUMN IF NOT EXISTS observaciones_liquidacion TEXT NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN equipo.contrato_adenda.causal_resolucion IS
        'PRD §12 causal: MUTUO_ACUERDO | INCUMPLIMIENTO_ARRENDADOR | INCUMPLIMIENTO_ARRENDATARIO | FUERZA_MAYOR | VENCIMIENTO | DECISION_UNILATERAL | QUIEBRA | INCAPACIDAD | JUDICIAL | OTRO'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.contrato_adenda.fecha_liquidacion IS
        'Fecha en que se confirmó la liquidación final del contrato (todas las valorizaciones pagadas)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.contrato_adenda.observaciones_liquidacion IS
        'Notas de la liquidación: saldos, ajustes, condiciones de cierre'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.contrato_adenda
        DROP COLUMN IF EXISTS causal_resolucion,
        DROP COLUMN IF EXISTS resuelto_por,
        DROP COLUMN IF EXISTS fecha_liquidacion,
        DROP COLUMN IF EXISTS liquidado_por,
        DROP COLUMN IF EXISTS observaciones_liquidacion
    `);
  }
}
