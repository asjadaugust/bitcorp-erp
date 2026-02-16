import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureSchemasExist1700000000000 implements MigrationInterface {
    name = 'EnsureSchemasExist1700000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sistema`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS proyectos`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS proveedores`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS administracion`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS rrhh`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS logistica`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS equipo`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sst`);
        await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sig`);

        // Also ensure uuid-ossp extension exists as it's used by multiple tables
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We generally don't drop schemas in down migrations unless we are sure
        // it's a destructive rollback, as they might contain other non-managed data.
    }
}
