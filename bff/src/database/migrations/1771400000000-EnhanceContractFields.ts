import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceContractFields1771400000000 implements MigrationInterface {
  name = 'EnhanceContractFields1771400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.contrato_adenda
        ADD COLUMN IF NOT EXISTS documento_acredita varchar(200),
        ADD COLUMN IF NOT EXISTS fecha_acreditada date,
        ADD COLUMN IF NOT EXISTS jurisdiccion varchar(200),
        ADD COLUMN IF NOT EXISTS plazo_texto varchar(200),
        ADD COLUMN IF NOT EXISTS motivo_resolucion text,
        ADD COLUMN IF NOT EXISTS fecha_resolucion date,
        ADD COLUMN IF NOT EXISTS monto_liquidacion decimal(12,2)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.contrato_adenda
        DROP COLUMN IF EXISTS documento_acredita,
        DROP COLUMN IF EXISTS fecha_acreditada,
        DROP COLUMN IF EXISTS jurisdiccion,
        DROP COLUMN IF EXISTS plazo_texto,
        DROP COLUMN IF EXISTS motivo_resolucion,
        DROP COLUMN IF EXISTS fecha_resolucion,
        DROP COLUMN IF EXISTS monto_liquidacion
    `);
  }
}
