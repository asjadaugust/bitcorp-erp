import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddConfiguracionCombustible1771965700000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS equipo.configuracion_combustible (
        id SERIAL PRIMARY KEY,
        precio_manipuleo DECIMAL(10,2) NOT NULL DEFAULT 0.80,
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by INTEGER REFERENCES sistema.usuarios(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryRunner.query(`
      INSERT INTO equipo.configuracion_combustible (precio_manipuleo, activo)
      VALUES (0.80, TRUE)
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS equipo.configuracion_combustible;`);
  }
}
