import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOrdenAlquilerTable1771401000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orden_alquiler',
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
            name: 'solicitud_equipo_id',
            type: 'integer',
            isNullable: true,
            comment: 'Solicitud de equipo que originó esta orden (opcional)',
          },
          {
            name: 'proveedor_id',
            type: 'integer',
            isNullable: false,
            comment: 'Proveedor al que se emite la orden',
          },
          {
            name: 'equipo_id',
            type: 'integer',
            isNullable: true,
            comment: 'Equipo específico solicitado (puede definirse después)',
          },
          {
            name: 'proyecto_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'descripcion_equipo',
            type: 'varchar',
            length: '255',
            isNullable: false,
            comment: 'Descripción del equipo a alquilar (marca, modelo, tipo)',
          },
          {
            name: 'fecha_orden',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'fecha_inicio_estimada',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'fecha_fin_estimada',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'tarifa_acordada',
            type: 'numeric',
            precision: 12,
            scale: 2,
            isNullable: false,
          },
          {
            name: 'tipo_tarifa',
            type: 'varchar',
            length: '10',
            default: "'HORA'",
            comment: 'HORA | DIA | MES',
          },
          {
            name: 'moneda',
            type: 'varchar',
            length: '5',
            default: "'PEN'",
            comment: 'PEN | USD',
          },
          {
            name: 'tipo_cambio',
            type: 'numeric',
            precision: 8,
            scale: 4,
            isNullable: true,
            comment: 'Tipo de cambio aplicado para contratos USD',
          },
          {
            name: 'horas_incluidas',
            type: 'numeric',
            precision: 8,
            scale: 2,
            isNullable: true,
            comment: 'Horas incluidas en tarifa diaria/mensual',
          },
          {
            name: 'penalidad_exceso',
            type: 'numeric',
            precision: 10,
            scale: 2,
            isNullable: true,
            comment: 'Tarifa por hora adicional sobre las incluidas',
          },
          {
            name: 'condiciones_especiales',
            type: 'text',
            isNullable: true,
            comment: 'Cláusulas o condiciones especiales pactadas',
          },
          {
            name: 'observaciones',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'estado',
            type: 'varchar',
            length: '20',
            default: "'BORRADOR'",
            comment: 'BORRADOR | ENVIADO | CONFIRMADO | CANCELADO',
          },
          {
            name: 'enviado_a',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Email del contacto proveedor al que se envió la orden',
          },
          {
            name: 'fecha_envio',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'confirmado_por',
            type: 'varchar',
            length: '255',
            isNullable: true,
            comment: 'Nombre o referencia de quien confirmó por parte del proveedor',
          },
          {
            name: 'fecha_confirmacion',
            type: 'timestamp with time zone',
            isNullable: true,
          },
          {
            name: 'motivo_cancelacion',
            type: 'text',
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
      'equipo.orden_alquiler',
      new TableIndex({ name: 'idx_orden_alquiler_proveedor', columnNames: ['proveedor_id'] })
    );
    await queryRunner.createIndex(
      'equipo.orden_alquiler',
      new TableIndex({ name: 'idx_orden_alquiler_estado', columnNames: ['estado'] })
    );
    await queryRunner.createIndex(
      'equipo.orden_alquiler',
      new TableIndex({ name: 'idx_orden_alquiler_fecha', columnNames: ['fecha_orden'] })
    );
    await queryRunner.createIndex(
      'equipo.orden_alquiler',
      new TableIndex({
        name: 'idx_orden_alquiler_solicitud',
        columnNames: ['solicitud_equipo_id'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('equipo.orden_alquiler');
  }
}
