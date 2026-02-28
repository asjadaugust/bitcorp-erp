import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSubtipoToEventoDescuento1771401100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add subtipo for discount rule classification per PRD Annex B
    await queryRunner.query(`
      ALTER TABLE equipo.evento_descuento
        ADD COLUMN IF NOT EXISTS subtipo VARCHAR(30) NULL,
        ADD COLUMN IF NOT EXISTS horas_horometro_mecanica DECIMAL(5,2) NULL,
        ADD COLUMN IF NOT EXISTS aplica_descuento BOOLEAN NULL,
        ADD COLUMN IF NOT EXISTS descuento_calculado_horas DECIMAL(5,2) NULL,
        ADD COLUMN IF NOT EXISTS descuento_calculado_dias DECIMAL(5,2) NULL
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN equipo.evento_descuento.subtipo IS
        'STAND_BY: DOMINGO|FERIADO|FALTA_DE_FRENTE; AVERIA: ARRENDADOR|ARRENDATARIO|MECANICA; CLIMATICO: TOTAL|PARCIAL'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.evento_descuento.horas_horometro_mecanica IS
        'Horas registradas en horómetro para averías mecánicas (subtipo MECANICA)'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.evento_descuento.aplica_descuento IS
        'Resultado de la regla: true=aplica descuento, false=no aplica, null=calculado manualmente'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.evento_descuento.descuento_calculado_horas IS
        'Horas de descuento calculadas automáticamente por regla PRD Anexo B'
    `);
    await queryRunner.query(`
      COMMENT ON COLUMN equipo.evento_descuento.descuento_calculado_dias IS
        'Días de descuento calculados automáticamente por regla PRD Anexo B'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.evento_descuento
        DROP COLUMN IF EXISTS subtipo,
        DROP COLUMN IF EXISTS horas_horometro_mecanica,
        DROP COLUMN IF EXISTS aplica_descuento,
        DROP COLUMN IF EXISTS descuento_calculado_horas,
        DROP COLUMN IF EXISTS descuento_calculado_dias
    `);
  }
}
