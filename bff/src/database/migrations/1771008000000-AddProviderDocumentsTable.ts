import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProviderDocumentsTable1771008000000 implements MigrationInterface {
    name = 'AddProviderDocumentsTable1771008000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "proveedores"."proveedor_documento" (
                "id" SERIAL NOT NULL,
                "proveedor_id" integer NOT NULL,
                "tipo_documento" character varying(50) NOT NULL,
                "numero_documento" character varying(100),
                "fecha_emision" date,
                "fecha_vencimiento" date,
                "archivo_url" text,
                "observaciones" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_proveedor_documento" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            ALTER TABLE "proveedores"."proveedor_documento" 
            ADD CONSTRAINT "FK_proveedor_documento_proveedor" 
            FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"."proveedor"("id") 
            ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_proveedor_documento_proveedor" ON "proveedores"."proveedor_documento" ("proveedor_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "proveedores"."idx_proveedor_documento_proveedor"`);
        await queryRunner.query(`ALTER TABLE "proveedores"."proveedor_documento" DROP CONSTRAINT "FK_proveedor_documento_proveedor"`);
        await queryRunner.query(`DROP TABLE "proveedores"."proveedor_documento"`);
    }
}
