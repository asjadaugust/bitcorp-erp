import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddTimesheetTables1768616921637 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tareo (timesheet) table
    await queryRunner.createTable(
      new Table({
        name: 'tareo',
        schema: 'rrhh',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'legacy_id',
            type: 'varchar',
            length: '50',
            isNullable: true,
            isUnique: true,
          },
          {
            name: 'trabajador_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'periodo',
            type: 'varchar',
            length: '7',
            isNullable: false,
          },
          {
            name: 'total_dias_trabajados',
            type: 'integer',
            default: 0,
          },
          {
            name: 'total_horas',
            type: 'decimal',
            precision: 8,
            scale: 2,
            default: 0,
          },
          {
            name: 'monto_calculado',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'estado',
            type: 'varchar',
            length: '50',
            default: "'BORRADOR'",
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'creado_por',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'aprobado_por',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'aprobado_en',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Create detalle_tareo (timesheet detail) table
    await queryRunner.createTable(
      new Table({
        name: 'detalle_tareo',
        schema: 'rrhh',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'tareo_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'proyecto_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'fecha',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'horas_trabajadas',
            type: 'decimal',
            precision: 5,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'tarifa_hora',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'monto',
            type: 'decimal',
            precision: 12,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true
    );

    // Add foreign keys for tareo table
    await queryRunner.createForeignKey(
      'rrhh.tareo',
      new TableForeignKey({
        columnNames: ['trabajador_id'],
        referencedTableName: 'trabajador',
        referencedSchema: 'rrhh',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      })
    );

    await queryRunner.createForeignKey(
      'rrhh.tareo',
      new TableForeignKey({
        columnNames: ['creado_por'],
        referencedTableName: 'usuario',
        referencedSchema: 'sistema',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      })
    );

    await queryRunner.createForeignKey(
      'rrhh.tareo',
      new TableForeignKey({
        columnNames: ['aprobado_por'],
        referencedTableName: 'usuario',
        referencedSchema: 'sistema',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      })
    );

    // Add foreign keys for detalle_tareo table
    await queryRunner.createForeignKey(
      'rrhh.detalle_tareo',
      new TableForeignKey({
        columnNames: ['tareo_id'],
        referencedTableName: 'tareo',
        referencedSchema: 'rrhh',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'rrhh.detalle_tareo',
      new TableForeignKey({
        columnNames: ['proyecto_id'],
        referencedTableName: 'edt',
        referencedSchema: 'proyectos',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    const tareoTable = await queryRunner.getTable('rrhh.tareo');
    if (tareoTable) {
      const foreignKeys = tareoTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('rrhh.tareo', fk);
      }
    }

    const detalleTareoTable = await queryRunner.getTable('rrhh.detalle_tareo');
    if (detalleTareoTable) {
      const foreignKeys = detalleTareoTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey('rrhh.detalle_tareo', fk);
      }
    }

    // Drop tables
    await queryRunner.dropTable('rrhh.detalle_tareo', true);
    await queryRunner.dropTable('rrhh.tareo', true);
  }
}
