import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class AddProviderFinancialInfoTable1768625000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'provider_financial_info',
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
            isNullable: false,
          },
          {
            name: 'bank_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'account_number',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'cci',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'account_holder_name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'account_type',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            default: "'PEN'",
          },
          {
            name: 'is_primary',
            type: 'boolean',
            default: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
          },
          {
            name: 'tenant_id',
            type: 'integer',
            default: 1,
          },
          {
            name: 'created_by',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'integer',
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

    // Create indexes
    await queryRunner.createIndex(
      'proveedores.provider_financial_info',
      new TableIndex({
        name: 'idx_provider_financial_info_provider_id',
        columnNames: ['provider_id'],
      })
    );

    await queryRunner.createIndex(
      'proveedores.provider_financial_info',
      new TableIndex({
        name: 'idx_provider_financial_info_is_primary',
        columnNames: ['is_primary'],
      })
    );

    // Create foreign key to proveedor table
    await queryRunner.createForeignKey(
      'proveedores.provider_financial_info',
      new TableForeignKey({
        name: 'fk_provider_financial_info_provider',
        columnNames: ['provider_id'],
        referencedSchema: 'proveedores',
        referencedTableName: 'proveedor',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    await queryRunner.dropForeignKey(
      'proveedores.provider_financial_info',
      'fk_provider_financial_info_provider'
    );

    // Drop indexes
    await queryRunner.dropIndex(
      'proveedores.provider_financial_info',
      'idx_provider_financial_info_is_primary'
    );
    await queryRunner.dropIndex(
      'proveedores.provider_financial_info',
      'idx_provider_financial_info_provider_id'
    );

    // Drop table
    await queryRunner.dropTable('proveedores.provider_financial_info', true);
  }
}
