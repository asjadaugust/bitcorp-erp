import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateSolicitudEquipoTable1771400800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'solicitud_equipo',
        schema: 'equipo',
        columns: [
          {
            name: 'id',
            type: 'serial',
            isPrimary: true,
          },
          {
            name: 'codigo',
            type: 'varchar',
            length: '20',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'proyecto_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'tipo_equipo',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'descripcion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'cantidad',
            type: 'integer',
            default: 1,
          },
          {
            name: 'fecha_requerida',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'justificacion',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'prioridad',
            type: 'varchar',
            length: '10',
            default: "'MEDIA'",
          },
          {
            name: 'estado',
            type: 'varchar',
            length: '20',
            default: "'BORRADOR'",
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'aprobado_por',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'fecha_aprobacion',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'creado_por',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'now()',
          },
        ],
      }),
      true
    );

    await queryRunner.createIndex(
      'equipo.solicitud_equipo',
      new TableIndex({ name: 'idx_solicitud_equipo_estado', columnNames: ['estado'] })
    );
    await queryRunner.createIndex(
      'equipo.solicitud_equipo',
      new TableIndex({ name: 'idx_solicitud_equipo_proyecto', columnNames: ['proyecto_id'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('equipo.solicitud_equipo');
  }
}
