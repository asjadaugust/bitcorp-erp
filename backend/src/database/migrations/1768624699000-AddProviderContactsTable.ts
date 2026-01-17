import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddProviderContactsTable1768624699000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create provider_contacts table
    await queryRunner.createTable(
      new Table({
        name: 'provider_contacts',
        schema: 'proveedores',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'provider_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'contact_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'position',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'primary_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'secondary_phone',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'secondary_email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'contact_type',
            type: 'varchar',
            length: '50',
            default: "'general'",
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
            name: 'notes',
            type: 'text',
            isNullable: true,
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

    // Add foreign key to provider table
    await queryRunner.createForeignKey(
      'proveedores.provider_contacts',
      new TableForeignKey({
        columnNames: ['provider_id'],
        referencedTableName: 'proveedor',
        referencedSchema: 'proveedores',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      })
    );

    // Create index on provider_id for faster queries
    await queryRunner.query(`
      CREATE INDEX idx_provider_contacts_provider_id 
      ON proveedores.provider_contacts(provider_id);
    `);

    // Create index on is_primary for faster primary contact queries
    await queryRunner.query(`
      CREATE INDEX idx_provider_contacts_is_primary 
      ON proveedores.provider_contacts(is_primary) 
      WHERE is_primary = true;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS proveedores.idx_provider_contacts_is_primary;`);
    await queryRunner.query(`DROP INDEX IF EXISTS proveedores.idx_provider_contacts_provider_id;`);

    // Drop table (foreign key will be dropped automatically)
    await queryRunner.dropTable('proveedores.provider_contacts', true);
  }
}
