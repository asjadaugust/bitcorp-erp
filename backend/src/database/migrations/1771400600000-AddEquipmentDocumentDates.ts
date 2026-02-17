import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddEquipmentDocumentDates1771400600000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('equipo.equipo', [
      new TableColumn({
        name: 'fecha_venc_poliza',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fecha_venc_soat',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'fecha_venc_citv',
        type: 'date',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('equipo.equipo', 'fecha_venc_poliza');
    await queryRunner.dropColumn('equipo.equipo', 'fecha_venc_soat');
    await queryRunner.dropColumn('equipo.equipo', 'fecha_venc_citv');
  }
}
