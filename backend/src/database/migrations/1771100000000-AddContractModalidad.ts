import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddContractModalidad1771100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD "modalidad" character varying(50)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP COLUMN "modalidad"`
    );
  }
}
