import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddUserProjectsTable1768700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create user_projects table
    await queryRunner.createTable(
      new Table({
        name: 'user_projects',
        schema: 'sistema',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'user_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'varchar',
            length: '50',
            default: "'user'",
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
          },
          {
            name: 'assigned_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign key constraints
    await queryRunner.createForeignKey(
      'sistema.user_projects',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedSchema: 'sistema',
        referencedTableName: 'usuario',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_user_projects_user',
      })
    );

    await queryRunner.createForeignKey(
      'sistema.user_projects',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedSchema: 'proyectos',
        referencedTableName: 'edt',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'fk_user_projects_project',
      })
    );

    // Add indexes
    await queryRunner.createIndex(
      'sistema.user_projects',
      new TableIndex({
        name: 'idx_user_projects_user',
        columnNames: ['user_id'],
      })
    );

    await queryRunner.createIndex(
      'sistema.user_projects',
      new TableIndex({
        name: 'idx_user_projects_project',
        columnNames: ['project_id'],
      })
    );

    // Add unique constraint for user-project combination
    await queryRunner.createIndex(
      'sistema.user_projects',
      new TableIndex({
        name: 'idx_user_projects_unique',
        columnNames: ['user_id', 'project_id'],
        isUnique: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sistema.user_projects', true);
  }
}
