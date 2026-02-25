import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddTenantIdToTrabajador1771420000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'rrhh.trabajador',
      new TableColumn({
        name: 'tenant_id',
        type: 'integer',
        isNullable: true,
      })
    );

    await queryRunner.createIndex(
      'rrhh.trabajador',
      new TableIndex({
        name: 'idx_trabajador_tenant_id',
        columnNames: ['tenant_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('rrhh.trabajador', 'idx_trabajador_tenant_id');
    await queryRunner.dropColumn('rrhh.trabajador', 'tenant_id');
  }
}
