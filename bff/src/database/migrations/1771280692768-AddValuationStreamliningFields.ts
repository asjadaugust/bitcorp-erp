import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddValuationStreamliningFields1771280692768 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Contract fields
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD "minimo_por" character varying(20)`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD "cantidad_minima" numeric(10,2)`
    );

    // Valuation fields
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD "importe_manipuleo" numeric(15,2) DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD "importe_gasto_obra" numeric(15,2) DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD "importe_adelanto" numeric(15,2) DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD "importe_exceso_combustible" numeric(15,2) DEFAULT 0`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Validation fields
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP COLUMN "importe_exceso_combustible"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP COLUMN "importe_adelanto"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP COLUMN "importe_gasto_obra"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP COLUMN "importe_manipuleo"`
    );

    // Contract fields
    await queryRunner.query(`ALTER TABLE "equipo"."contrato_adenda" DROP COLUMN "cantidad_minima"`);
    await queryRunner.query(`ALTER TABLE "equipo"."contrato_adenda" DROP COLUMN "minimo_por"`);
  }
}
