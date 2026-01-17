import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class AddMaintenanceSchedulesTable1768618185998 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create maintenance_schedules table for recurring maintenance scheduling
    // This is separate from equipo.programa_mantenimiento which tracks one-time maintenance work orders
    await queryRunner.createTable(
      new Table({
        name: 'maintenance_schedules',
        schema: 'equipo',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'equipment_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'project_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'maintenance_type',
            type: 'varchar',
            length: '50',
            default: "'preventive'",
            comment: 'Type: preventive, corrective, predictive, etc.',
          },
          {
            name: 'interval_type',
            type: 'varchar',
            length: '20',
            default: "'hours'",
            comment: 'Interval unit: hours, days, weeks, months',
          },
          {
            name: 'interval_value',
            type: 'integer',
            isNullable: false,
            comment: 'Interval quantity (e.g., 250 hours, 30 days)',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'notes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'active'",
            comment: 'Status: active, inactive, suspended',
          },
          {
            name: 'auto_generate_tasks',
            type: 'boolean',
            default: true,
            comment: 'Auto-generate scheduled tasks when due',
          },
          {
            name: 'last_completed_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'last_completed_hours',
            type: 'integer',
            isNullable: true,
            comment: 'Equipment hours when last completed',
          },
          {
            name: 'next_due_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'next_due_hours',
            type: 'integer',
            isNullable: true,
            comment: 'Equipment hours when next due',
          },
          {
            name: 'created_by',
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

    // Add foreign key to equipment
    await queryRunner.createForeignKey(
      'equipo.maintenance_schedules',
      new TableForeignKey({
        columnNames: ['equipment_id'],
        referencedTableName: 'equipo',
        referencedSchema: 'equipo',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      })
    );

    // Add foreign key to projects
    await queryRunner.createForeignKey(
      'equipo.maintenance_schedules',
      new TableForeignKey({
        columnNames: ['project_id'],
        referencedTableName: 'edt',
        referencedSchema: 'proyectos',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Add foreign key to users (created_by)
    await queryRunner.createForeignKey(
      'equipo.maintenance_schedules',
      new TableForeignKey({
        columnNames: ['created_by'],
        referencedTableName: 'usuario',
        referencedSchema: 'sistema',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      })
    );

    // Create indexes for common queries
    await queryRunner.query(`
            CREATE INDEX idx_maintenance_schedules_equipment 
            ON equipo.maintenance_schedules(equipment_id);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_maintenance_schedules_status 
            ON equipo.maintenance_schedules(status);
        `);

    await queryRunner.query(`
            CREATE INDEX idx_maintenance_schedules_next_due 
            ON equipo.maintenance_schedules(next_due_date) 
            WHERE status = 'active';
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS equipo.idx_maintenance_schedules_next_due;`);
    await queryRunner.query(`DROP INDEX IF EXISTS equipo.idx_maintenance_schedules_status;`);
    await queryRunner.query(`DROP INDEX IF EXISTS equipo.idx_maintenance_schedules_equipment;`);

    // Drop table (foreign keys will be dropped automatically)
    await queryRunner.dropTable('equipo.maintenance_schedules', true);
  }
}
