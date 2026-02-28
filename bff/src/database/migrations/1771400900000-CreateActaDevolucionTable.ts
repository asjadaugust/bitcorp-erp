import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateActaDevolucionTable1771400900000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'acta_devolucion',
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
            name: 'equipo_id',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'contrato_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'proyecto_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'fecha_devolucion',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'tipo',
            type: 'varchar',
            length: '30',
            default: "'DEVOLUCION'",
            comment: 'DEVOLUCION | DESMOBILIZACION | TRANSFERENCIA',
          },
          {
            name: 'estado',
            type: 'varchar',
            length: '20',
            default: "'BORRADOR'",
            comment: 'BORRADOR | PENDIENTE | FIRMADO | ANULADO',
          },
          {
            name: 'condicion_equipo',
            type: 'varchar',
            length: '20',
            default: "'BUENO'",
            comment: 'BUENO | REGULAR | MALO | CON_OBSERVACIONES',
          },
          {
            name: 'horometro_devolucion',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'kilometraje_devolucion',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'observaciones_fisicas',
            type: 'text',
            isNullable: true,
            comment: 'Daños físicos o faltantes observados',
          },
          {
            name: 'recibido_por',
            type: 'integer',
            isNullable: true,
            comment: 'Usuario que recibe el equipo',
          },
          {
            name: 'entregado_por',
            type: 'integer',
            isNullable: true,
            comment: 'Usuario que entrega el equipo',
          },
          {
            name: 'firma_recibido',
            type: 'text',
            isNullable: true,
            comment: 'Base64 firma del receptor',
          },
          {
            name: 'firma_entregado',
            type: 'text',
            isNullable: true,
            comment: 'Base64 firma del entregador',
          },
          {
            name: 'fecha_firma',
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
      'equipo.acta_devolucion',
      new TableIndex({ name: 'idx_acta_devolucion_equipo', columnNames: ['equipo_id'] })
    );
    await queryRunner.createIndex(
      'equipo.acta_devolucion',
      new TableIndex({ name: 'idx_acta_devolucion_estado', columnNames: ['estado'] })
    );
    await queryRunner.createIndex(
      'equipo.acta_devolucion',
      new TableIndex({ name: 'idx_acta_devolucion_fecha', columnNames: ['fecha_devolucion'] })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('equipo.acta_devolucion');
  }
}
