import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddNotificationUrlAndReadAt1768620557762 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add url column
    await queryRunner.addColumn(
      'notificaciones',
      new TableColumn({
        name: 'url',
        type: 'varchar',
        length: '500',
        isNullable: true,
      })
    );

    // Add leido_at (read_at) column
    await queryRunner.addColumn(
      'notificaciones',
      new TableColumn({
        name: 'leido_at',
        type: 'timestamp',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('notificaciones', 'leido_at');
    await queryRunner.dropColumn('notificaciones', 'url');
  }
}
