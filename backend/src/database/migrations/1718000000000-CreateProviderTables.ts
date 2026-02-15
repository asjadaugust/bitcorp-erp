import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateProviderTables1718000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if tables allow for safe re-run
    const hasAuditLog = await queryRunner.hasTable('proveedores.provider_audit_log');
    const hasDocuments = await queryRunner.hasTable('proveedores.provider_document');

    if (!hasAuditLog) {
      await queryRunner.createTable(
        new Table({
          name: 'provider_audit_log',
          schema: 'proveedores',
          columns: [
            {
              name: 'id',
              type: 'serial',
              isPrimary: true,
            },
            {
              name: 'provider_id',
              type: 'integer',
            },
            {
              name: 'action',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'field',
              type: 'varchar',
              length: '100',
              isNullable: true,
            },
            {
              name: 'old_value',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'new_value',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'observations',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'user_id',
              type: 'integer',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true
      );

      await queryRunner.createForeignKey(
        'proveedores.provider_audit_log',
        new TableForeignKey({
          columnNames: ['provider_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'proveedores.proveedor',
          onDelete: 'CASCADE',
        })
      );
    }

    if (!hasDocuments) {
      await queryRunner.createTable(
        new Table({
          name: 'provider_document',
          schema: 'proveedores',
          columns: [
            {
              name: 'id',
              type: 'serial',
              isPrimary: true,
            },
            {
              name: 'provider_id',
              type: 'integer',
            },
            {
              name: 'tipo_documento',
              type: 'varchar',
              length: '50',
            },
            {
              name: 'numero_documento',
              type: 'varchar',
              length: '50',
              isNullable: true,
            },
            {
              name: 'fecha_emision',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'fecha_vencimiento',
              type: 'date',
              isNullable: true,
            },
            {
              name: 'archivo_url',
              type: 'varchar',
              length: '500',
            },
            {
              name: 'observaciones',
              type: 'text',
              isNullable: true,
            },
            {
              name: 'created_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
            {
              name: 'updated_at',
              type: 'timestamp',
              default: 'CURRENT_TIMESTAMP',
            },
          ],
        }),
        true
      );

      await queryRunner.createForeignKey(
        'proveedores.provider_document',
        new TableForeignKey({
          columnNames: ['provider_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'proveedores.proveedor',
          onDelete: 'CASCADE',
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('proveedores.provider_document');
    await queryRunner.dropTable('proveedores.provider_audit_log');
  }
}
