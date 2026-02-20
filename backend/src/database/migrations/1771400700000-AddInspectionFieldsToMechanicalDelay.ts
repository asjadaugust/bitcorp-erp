import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddInspectionFieldsToMechanicalDelay1771400700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('equipo.parte_diario_demora_mecanica', [
      new TableColumn({
        name: 'resuelta',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
      new TableColumn({
        name: 'fecha_resolucion',
        type: 'date',
        isNullable: true,
      }),
      new TableColumn({
        name: 'observacion_resolucion',
        type: 'text',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('equipo.parte_diario_demora_mecanica', 'observacion_resolucion');
    await queryRunner.dropColumn('equipo.parte_diario_demora_mecanica', 'fecha_resolucion');
    await queryRunner.dropColumn('equipo.parte_diario_demora_mecanica', 'resuelta');
  }
}
