import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1768607735763 implements MigrationInterface {
  name = 'InitialSchema1768607735763';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create schemas first
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sistema`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS proyectos`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS proveedores`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS administracion`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS rrhh`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS logistica`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS equipo`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sst`);
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sig`);

    // Create extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create tables
    await queryRunner.query(
      `CREATE TABLE "sistema"."permiso" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "nombre" character varying(100) NOT NULL, "descripcion" text, "recurso" character varying(50) NOT NULL, "accion" character varying(50) NOT NULL, CONSTRAINT "UQ_b8524c8076c24c9b9a6c6490a4b" UNIQUE ("legacy_id"), CONSTRAINT "UQ_2872e88f9bcfc7ecadccd1f07da" UNIQUE ("nombre"), CONSTRAINT "PK_8f675309c577bd8f4d826994e95" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sistema"."rol" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "codigo" character varying(50) NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "is_system" boolean NOT NULL DEFAULT false, "permissions" jsonb, CONSTRAINT "UQ_d447bdea37d0183546e41282a99" UNIQUE ("legacy_id"), CONSTRAINT "UQ_59960bb0e72a21e5c347566fb4a" UNIQUE ("codigo"), CONSTRAINT "PK_c93a22388638fac311781c7f2dd" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sistema"."unidad_operativa" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(20) NOT NULL, "nombre" character varying(100) NOT NULL, "descripcion" text, "ubicacion" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_29ef8cc5325ce85868cd5526809" UNIQUE ("legacy_id"), CONSTRAINT "UQ_a5c37704a280e06df747e08e975" UNIQUE ("codigo"), CONSTRAINT "PK_a1481c82a25ba2dec3a3ec127ae" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sistema"."usuario" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "nombre_usuario" character varying(100) NOT NULL, "contrasena" character varying(255) NOT NULL, "nombres" character varying(100), "apellidos" character varying(100), "correo_electronico" character varying(100) NOT NULL, "dni" character varying(20), "telefono" character varying(20), "rol_id" integer, "unidad_operativa_id" integer, "ultimo_acceso" TIMESTAMP, CONSTRAINT "UQ_b610044f050cd03a249d681e59a" UNIQUE ("legacy_id"), CONSTRAINT "UQ_478a50149cbb7366c7d2aab8ea3" UNIQUE ("nombre_usuario"), CONSTRAINT "UQ_656a48ae9eacaf9e820af18d24c" UNIQUE ("correo_electronico"), CONSTRAINT "PK_a56c58e5cabaa04fb2c98d2d7e2" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "proyectos"."edt" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "ubicacion" character varying(255), "fecha_inicio" date, "fecha_fin" date, "presupuesto" numeric(15,2), "estado" character varying(50) NOT NULL DEFAULT 'PLANIFICACION', "empresa_id" integer, "unidad_operativa_id" integer, "cliente" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "creado_por" integer, "actualizado_por" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e5c5d52183bd7fa931ee463b57f" UNIQUE ("legacy_id"), CONSTRAINT "UQ_9a3a4746b5a0bf259c6e59a909c" UNIQUE ("codigo"), CONSTRAINT "PK_47d08a158462c7b6f618cb3a45d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_edt_codigo" ON "proyectos"."edt" ("codigo") `);
    await queryRunner.query(`CREATE INDEX "idx_edt_estado" ON "proyectos"."edt" ("estado") `);
    await queryRunner.query(`CREATE INDEX "idx_edt_company" ON "proyectos"."edt" ("empresa_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_edt_unidad_operativa" ON "proyectos"."edt" ("unidad_operativa_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "proveedores"."proveedor" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "ruc" character varying(11) NOT NULL, "razon_social" character varying(255) NOT NULL, "nombre_comercial" character varying(255), "tipo_proveedor" character varying(50), "direccion" text, "telefono" character varying(20), "correo_electronico" character varying(255), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_d5ce5b3ce4f1cf154c9f8c34e50" UNIQUE ("legacy_id"), CONSTRAINT "UQ_35fb818af5797ff22207322b342" UNIQUE ("ruc"), CONSTRAINT "PK_405f60886417ece76cb5681550a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."equipo" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo_equipo" character varying(50) NOT NULL, "tipo_equipo_id" integer, "proveedor_id" integer, "tipo_proveedor" character varying(50), "categoria" character varying(50), "placa" character varying(20), "marca" character varying(100), "modelo" character varying(100), "numero_serie_equipo" character varying(100), "numero_chasis" character varying(100), "numero_serie_motor" character varying(100), "anio_fabricacion" integer, "potencia_neta" numeric(10,2), "tipo_motor" character varying(50), "medidor_uso" character varying(20), "estado" character varying(50) NOT NULL DEFAULT 'disponible', "is_active" boolean NOT NULL DEFAULT true, "creado_por" integer, "actualizado_por" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_37f3be147f53ec377e1e323fadf" UNIQUE ("legacy_id"), CONSTRAINT "UQ_c580b323a718d7f28454a98a221" UNIQUE ("codigo_equipo"), CONSTRAINT "PK_a545d29b4870688c462189447da" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."contrato_adenda" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "equipo_id" integer NOT NULL, "numero_contrato" character varying(50) NOT NULL, "tipo" character varying(50) NOT NULL DEFAULT 'CONTRATO', "contrato_padre_id" integer, "fecha_contrato" date NOT NULL, "fecha_inicio" date NOT NULL, "fecha_fin" date NOT NULL, "moneda" character varying(3) NOT NULL DEFAULT 'PEN', "tipo_tarifa" character varying(50), "tarifa" numeric(12,2), "modalidad" character varying(100), "minimo_por" character varying(20), "incluye_motor" boolean NOT NULL DEFAULT false, "incluye_operador" boolean NOT NULL DEFAULT false, "costo_adicional_motor" numeric(12,2), "horas_incluidas" integer, "penalidad_exceso" numeric(12,2), "condiciones_especiales" text, "documento_url" text, "estado" character varying(50) NOT NULL DEFAULT 'ACTIVO', "creado_por" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_53cd4f280a204163a9c713ccc10" UNIQUE ("legacy_id"), CONSTRAINT "UQ_f0ea6e659404cd2c0ea820c5174" UNIQUE ("numero_contrato"), CONSTRAINT "PK_9c37b49f5b62fd9013349a8b859" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."valorizacion_equipo" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "equipo_id" integer NOT NULL, "contrato_id" integer, "proyecto_id" integer, "periodo" character varying(7) NOT NULL, "fecha_inicio" date NOT NULL, "fecha_fin" date NOT NULL, "dias_trabajados" integer, "horas_trabajadas" numeric(10,2), "combustible_consumido" numeric(10,2), "costo_base" numeric(15,2), "costo_combustible" numeric(15,2), "cargos_adicionales" numeric(15,2), "total_valorizado" numeric(15,2), "numero_valorizacion" character varying(20), "tipo_cambio" numeric(10,4), "descuento_porcentaje" numeric(5,2) NOT NULL DEFAULT '0', "descuento_monto" numeric(15,2) NOT NULL DEFAULT '0', "igv_porcentaje" numeric(5,2) NOT NULL DEFAULT '18', "igv_monto" numeric(15,2) NOT NULL DEFAULT '0', "total_con_igv" numeric(15,2) NOT NULL DEFAULT '0', "estado" character varying(50) NOT NULL DEFAULT 'PENDIENTE', "observaciones" text, "creado_por" integer, "aprobado_por" integer, "aprobado_en" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0ffebd5626c1b9cb44a93ba4b27" UNIQUE ("legacy_id"), CONSTRAINT "PK_c602353bcc78e3111392963be9b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_equipo" ON "equipo"."valorizacion_equipo" ("equipo_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_contrato" ON "equipo"."valorizacion_equipo" ("contrato_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_proyecto" ON "equipo"."valorizacion_equipo" ("proyecto_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_periodo" ON "equipo"."valorizacion_equipo" ("periodo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_numero" ON "equipo"."valorizacion_equipo" ("numero_valorizacion") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_valorizacion_equipo_estado" ON "equipo"."valorizacion_equipo" ("estado") `
    );
    await queryRunner.query(
      `CREATE TABLE "logistica"."producto" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "categoria" character varying(100), "unidad_medida" character varying(20), "stock_actual" numeric(12,3) NOT NULL DEFAULT '0', "stock_minimo" numeric(12,3), "precio_unitario" numeric(12,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_57c0efa5597d1c7cac9b4919fb2" UNIQUE ("legacy_id"), CONSTRAINT "UQ_4ecaa777d3efc10b5a6327cfe42" UNIQUE ("codigo"), CONSTRAINT "PK_5be023b11909fe103e24c740c7d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_producto_codigo" ON "logistica"."producto" ("codigo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_producto_categoria" ON "logistica"."producto" ("categoria") `
    );
    await queryRunner.query(
      `CREATE TABLE "logistica"."movimiento" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "proyecto_id" integer, "fecha" date NOT NULL, "tipo_movimiento" character varying(50) NOT NULL, "numero_documento" character varying(50), "observaciones" text, "estado" character varying(20) NOT NULL DEFAULT 'pendiente', "creado_por" integer, "aprobado_por" integer, "aprobado_en" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a9698824b2fa294727f76e15b75" UNIQUE ("legacy_id"), CONSTRAINT "PK_809988d143ce94a95f3d30164ab" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movements_project" ON "logistica"."movimiento" ("proyecto_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movements_fecha" ON "logistica"."movimiento" ("fecha") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movements_tipo" ON "logistica"."movimiento" ("tipo_movimiento") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movements_status" ON "logistica"."movimiento" ("estado") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movements_created_by" ON "logistica"."movimiento" ("creado_por") `
    );
    await queryRunner.query(
      `CREATE TABLE "logistica"."detalle_movimiento" ("id" SERIAL NOT NULL, "movimiento_id" integer NOT NULL, "producto_id" integer NOT NULL, "cantidad" numeric(12,3) NOT NULL, "precio_unitario" numeric(12,2) NOT NULL, "monto_total" numeric(15,2), "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f37024c12613dc109b475cbfc36" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movement_details_movement" ON "logistica"."detalle_movimiento" ("movimiento_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_movement_details_product" ON "logistica"."detalle_movimiento" ("producto_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."programa_mantenimiento" ("id" SERIAL NOT NULL, "equipo_id" integer NOT NULL, "tipo_mantenimiento" character varying(50) NOT NULL, "descripcion" text, "fecha_programada" date, "fecha_realizada" date, "costo_estimado" numeric(12,2), "costo_real" numeric(12,2), "tecnico_responsable" character varying(100), "estado" character varying(50) NOT NULL DEFAULT 'PROGRAMADO', "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9a97adf4cf1e694eb1e528fa760" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."tarea_programada" ("id" SERIAL NOT NULL, "programa_mantenimiento_id" integer, "equipo_id" integer NOT NULL, "trabajador_id" integer, "task_type" character varying(50) NOT NULL DEFAULT 'maintenance', "title" character varying(255) NOT NULL, "description" text, "start_date" date NOT NULL, "end_date" date, "start_time" TIME, "end_time" TIME, "all_day" boolean NOT NULL DEFAULT false, "recurrence" character varying(50), "duration_minutes" integer NOT NULL DEFAULT '120', "priority" character varying(20) NOT NULL DEFAULT 'medium', "status" character varying(20) NOT NULL DEFAULT 'pending', "completion_date" TIMESTAMP, "completion_notes" text, "maintenance_record_id" integer, "creado_por" integer, "asignado_por" integer, "proyecto_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7b88ba99029d225346b80704492" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "rrhh"."trabajador" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "dni" character varying(20) NOT NULL, "nombres" character varying(100) NOT NULL, "apellido_paterno" character varying(100) NOT NULL, "apellido_materno" character varying(100), "fecha_nacimiento" date, "telefono" character varying(20), "correo_electronico" character varying(255), "direccion" text, "tipo_contrato" character varying(50), "fecha_ingreso" date, "fecha_cese" date, "cargo" character varying(100), "especialidad" character varying(100), "licencia_conducir" character varying(50), "unidad_operativa_id" integer, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_eb050a90a0f6f3905a90cbfbfe5" UNIQUE ("legacy_id"), CONSTRAINT "UQ_03377b09a6267c14d5bd07f963f" UNIQUE ("dni"), CONSTRAINT "PK_a2b50dcc1e7664c6f6b791cfb73" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_trabajador_dni" ON "rrhh"."trabajador" ("dni") `);
    await queryRunner.query(
      `CREATE INDEX "idx_trabajador_apellido" ON "rrhh"."trabajador" ("apellido_paterno") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trabajador_cargo" ON "rrhh"."trabajador" ("cargo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_trabajador_unidad_operativa" ON "rrhh"."trabajador" ("unidad_operativa_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "rrhh"."disponibilidad_trabajador" ("id" SERIAL NOT NULL, "trabajador_id" integer NOT NULL, "fecha_inicio" date NOT NULL, "fecha_fin" date NOT NULL, "disponible" boolean NOT NULL DEFAULT true, "motivo" character varying(255), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ac5e84c0979ec30775433d31e5a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "notificaciones" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "usuario_id" integer NOT NULL, "tipo" character varying(50) NOT NULL, "titulo" character varying(255) NOT NULL, "mensaje" text NOT NULL, "leido" boolean NOT NULL DEFAULT false, "data" jsonb, CONSTRAINT "UQ_759ce51b86df66e4c0597299e53" UNIQUE ("legacy_id"), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sig"."documento" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(50) NOT NULL, "titulo" character varying(255) NOT NULL, "tipo_documento" character varying(100), "iso_standard" character varying(50), "version" character varying(20), "fecha_emision" date, "fecha_revision" date, "archivo_url" text, "estado" character varying(50) NOT NULL DEFAULT 'VIGENTE', "creado_por" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f51c6f68c65e6b44f77aabcaee5" UNIQUE ("legacy_id"), CONSTRAINT "UQ_7d7338129a99912503045a3ce82" UNIQUE ("codigo"), CONSTRAINT "PK_14a00534ba5a1136f420342c965" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "licitaciones" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "entidad_convocante" character varying(255), "monto_referencial" numeric(15,2), "fecha_convocatoria" date, "fecha_presentacion" date, "estado" character varying(50) NOT NULL DEFAULT 'PUBLICADO', "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_408deb12640c6ed7c4364b58140" UNIQUE ("legacy_id"), CONSTRAINT "UQ_06bf71819155fb317ca91536196" UNIQUE ("codigo"), CONSTRAINT "PK_378bbe0c37e96cf8297fb0efa68" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_licitaciones_codigo" ON "licitaciones" ("codigo") `);
    await queryRunner.query(`CREATE INDEX "idx_licitaciones_estado" ON "licitaciones" ("estado") `);
    await queryRunner.query(
      `CREATE TABLE "sst"."incidente" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "fecha_incidente" TIMESTAMP NOT NULL, "tipo_incidente" character varying(100), "severidad" character varying(50), "ubicacion" text, "descripcion" text, "acciones_tomadas" text, "proyecto_id" integer, "reportado_por" integer, "estado" character varying(50) NOT NULL DEFAULT 'ABIERTO', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_956ba2e20f5f738de77a64f69d9" UNIQUE ("legacy_id"), CONSTRAINT "PK_120302b156eb344d2897e03b319" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidente_fecha" ON "sst"."incidente" ("fecha_incidente") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidente_tipo" ON "sst"."incidente" ("tipo_incidente") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_incidente_proyecto" ON "sst"."incidente" ("proyecto_id") `
    );
    await queryRunner.query(`CREATE INDEX "idx_incidente_estado" ON "sst"."incidente" ("estado") `);
    await queryRunner.query(
      `CREATE TABLE "administracion"."centro_costo" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "codigo" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "descripcion" text, "proyecto_id" integer, "presupuesto" numeric(15,2), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8a877544ce0d9651e91255f6560" UNIQUE ("legacy_id"), CONSTRAINT "UQ_7b405706aab67857f348415a61c" UNIQUE ("codigo"), CONSTRAINT "PK_bbee34516db18c818cb72d13399" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_centro_costo_codigo" ON "administracion"."centro_costo" ("codigo") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_centro_costo_project" ON "administracion"."centro_costo" ("proyecto_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "administracion"."cuenta_por_pagar" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "proveedor_id" integer NOT NULL, "numero_factura" character varying(50) NOT NULL, "fecha_emision" date NOT NULL, "fecha_vencimiento" date NOT NULL, "monto_total" numeric(15,2) NOT NULL, "monto_pagado" numeric(15,2) NOT NULL DEFAULT '0', "saldo" numeric(15,2), "moneda" character varying(3) NOT NULL DEFAULT 'PEN', "estado" character varying(50) NOT NULL DEFAULT 'PENDIENTE', "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9d2394ee48ca20b18ecdd2ab851" UNIQUE ("legacy_id"), CONSTRAINT "PK_024d5aebbbda6341b9fd465d11a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "administracion"."detalle_programacion_pago" ("id" SERIAL NOT NULL, "programacion_pago_id" integer NOT NULL, "valorizacion_id" integer, "concepto" character varying(255), "monto" numeric(15,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_46856a2b5e2708785b01c1a7568" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "administracion"."programacion_pago" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "proveedor_id" integer NOT NULL, "proyecto_id" integer, "periodo" character varying(7) NOT NULL, "fecha_programada" date, "monto_total" numeric(15,2), "estado" character varying(50) NOT NULL DEFAULT 'PROGRAMADO', "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_aed4a70fcd56c22b8acf9eea514" UNIQUE ("legacy_id"), CONSTRAINT "PK_05fd1bd24d119c9eb9484ee0891" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "rrhh"."documento_trabajador" ("id" SERIAL NOT NULL, "trabajador_id" integer NOT NULL, "tipo_documento" character varying(50) NOT NULL, "numero_documento" character varying(100), "fecha_emision" date, "fecha_vencimiento" date, "archivo_url" text, "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1aaa9f7a262a19ac92ab109913a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."equipo_edt" ("id" SERIAL NOT NULL, "equipo_id" integer NOT NULL, "proyecto_id" integer NOT NULL, "fecha_asignacion" date NOT NULL, "fecha_liberacion" date, "observaciones" text, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c5969796fa365bdd9336042028c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."equipo_combustible" ("id" SERIAL NOT NULL, "valorizacion_id" integer NOT NULL, "fecha" date NOT NULL, "cantidad" numeric(10,2), "precio_unitario" numeric(10,2), "monto_total" numeric(12,2), "tipo_combustible" character varying(50), "proveedor" character varying(100), "numero_documento" character varying(50), "observaciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f8b9999bc7f8d0a33cdb14ff08c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipo_combustible_valorizacion" ON "equipo"."equipo_combustible" ("valorizacion_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_equipo_combustible_fecha" ON "equipo"."equipo_combustible" ("fecha") `
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."checklist_item" ("id" SERIAL NOT NULL, "plantilla_id" integer NOT NULL, "orden" integer NOT NULL, "categoria" character varying(100), "descripcion" text NOT NULL, "tipo_verificacion" character varying(50) NOT NULL DEFAULT 'VISUAL', "valor_esperado" character varying(100), "es_critico" boolean NOT NULL DEFAULT false, "requiere_foto" boolean NOT NULL DEFAULT false, "instrucciones" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0c52d9590c766a9ae718e16cebf" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."checklist_plantilla" ("id" SERIAL NOT NULL, "codigo" character varying(50) NOT NULL, "nombre" character varying(255) NOT NULL, "tipo_equipo" character varying(100), "descripcion" text, "frecuencia" character varying(50), "activo" boolean NOT NULL DEFAULT true, "created_by" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a73aeb7c4079e6ce6b90d45f42e" UNIQUE ("codigo"), CONSTRAINT "PK_1a8f47614598ea99a7c7ecc1bec" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."checklist_inspeccion" ("id" SERIAL NOT NULL, "codigo" character varying(50) NOT NULL, "plantilla_id" integer NOT NULL, "equipo_id" integer NOT NULL, "trabajador_id" integer NOT NULL, "fecha_inspeccion" date NOT NULL, "hora_inicio" TIME, "hora_fin" TIME, "ubicacion" character varying(255), "horometro_inicial" numeric(10,2), "odometro_inicial" numeric(10,2), "estado" character varying(50) NOT NULL DEFAULT 'EN_PROGRESO', "resultado_general" character varying(50), "items_conforme" integer NOT NULL DEFAULT '0', "items_no_conforme" integer NOT NULL DEFAULT '0', "items_total" integer NOT NULL DEFAULT '0', "observaciones_generales" text, "requiere_mantenimiento" boolean NOT NULL DEFAULT false, "equipo_operativo" boolean NOT NULL DEFAULT true, "completado_en" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f7a7caff14e6bd6f7ca89aafe77" UNIQUE ("codigo"), CONSTRAINT "PK_7a5f0d611d20367413df79a6f70" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."checklist_resultado" ("id" SERIAL NOT NULL, "inspeccion_id" integer NOT NULL, "item_id" integer NOT NULL, "conforme" boolean, "valor_medido" character varying(100), "observaciones" text, "accion_requerida" character varying(50), "foto_url" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9a940238db91b3dc3b66269591a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."exceso_combustible" ("id" SERIAL NOT NULL, "valorizacion_id" integer NOT NULL, "consumo_combustible" numeric(10,2) NOT NULL DEFAULT '0', "tipo_horo_odo" character varying(20), "inicio" numeric(10,2) NOT NULL DEFAULT '0', "final" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "rendimiento" numeric(10,4) NOT NULL DEFAULT '0', "ratio_control" numeric(10,4) NOT NULL DEFAULT '0', "diferencia" numeric(10,2) NOT NULL DEFAULT '0', "exceso_combustible" numeric(10,2) NOT NULL DEFAULT '0', "precio_unitario" numeric(10,4) NOT NULL DEFAULT '0', "importe_exceso_combustible" numeric(15,2) NOT NULL DEFAULT '0', "observaciones" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_ecfe3437c297fec81ed6dac8473" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_exceso_combustible_valorizacion" ON "equipo"."exceso_combustible" ("valorizacion_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."gasto_obra" ("id" SERIAL NOT NULL, "valorizacion_id" integer NOT NULL, "fecha_operacion" date NOT NULL, "proveedor" character varying(200), "concepto" character varying(500), "tipo_documento" character varying(50), "num_documento" character varying(50), "importe" numeric(15,2) NOT NULL DEFAULT '0', "incluye_igv" character varying(2) NOT NULL DEFAULT 'SI', "importe_sin_igv" numeric(15,2) NOT NULL DEFAULT '0', "observaciones" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1820c79e02f8a0954dcd9b99097" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_gasto_obra_fecha" ON "equipo"."gasto_obra" ("fecha_operacion") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_gasto_obra_valorizacion" ON "equipo"."gasto_obra" ("valorizacion_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."adelanto_amortizacion" ("id" SERIAL NOT NULL, "valorizacion_id" integer NOT NULL, "equipo_id" integer NOT NULL, "fecha_operacion" date NOT NULL, "tipo_operacion" character varying(50) NOT NULL, "num_documento" character varying(50), "concepto" character varying(500), "num_cuota" character varying(20), "monto" numeric(15,2) NOT NULL DEFAULT '0', "observaciones" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_991d341cacb07cc356e15017082" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "idx_adelanto_tipo" ON "equipo"."adelanto_amortizacion" ("tipo_operacion") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_adelanto_fecha" ON "equipo"."adelanto_amortizacion" ("fecha_operacion") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_adelanto_equipo" ON "equipo"."adelanto_amortizacion" ("equipo_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "idx_adelanto_valorizacion" ON "equipo"."adelanto_amortizacion" ("valorizacion_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario" ("id" SERIAL NOT NULL, "legacy_id" character varying(50), "equipo_id" integer NOT NULL, "trabajador_id" integer, "proyecto_id" integer, "valorizacion_id" integer, "fecha" date NOT NULL, "hora_inicio" TIME, "hora_fin" TIME, "horas_trabajadas" numeric(5,2), "horometro_inicial" numeric(10,2), "horometro_final" numeric(10,2), "odometro_inicial" numeric(10,2), "odometro_final" numeric(10,2), "km_recorridos" numeric(10,2), "combustible_inicial" numeric(10,2), "combustible_consumido" numeric(10,2), "observaciones" text, "estado" character varying(50) NOT NULL DEFAULT 'BORRADOR', "creado_por" integer, "aprobado_por" integer, "aprobado_en" TIMESTAMP, "codigo" character varying(50), "empresa" character varying(100), "placa" character varying(20), "responsable_frente" character varying(100), "turno" character varying(20), "numero_parte" integer, "petroleo_gln" numeric(10,2), "gasolina_gln" numeric(10,2), "hora_abastecimiento" TIME, "num_vale_combustible" character varying(50), "horometro_kilometraje" character varying(100), "lugar_salida" character varying(200), "lugar_llegada" character varying(200), "observaciones_correcciones" text, "firma_operador" text, "firma_supervisor" text, "firma_jefe_equipos" text, "firma_residente" text, "firma_planeamiento_control" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f5095a5f761710d1de539ea8b2e" UNIQUE ("legacy_id"), CONSTRAINT "PK_a39c1757094887a7bce0ef8300d" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario_produccion" ("id" SERIAL NOT NULL, "parte_diario_id" integer NOT NULL, "numero" smallint NOT NULL, "ubicacion_labores_prog_ini" character varying(100), "ubicacion_labores_prog_fin" character varying(100), "hora_ini" TIME, "hora_fin" TIME, "material_trabajado_descripcion" text, "metrado" character varying(50), "edt" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fd775e6719c007c42dc707817cc" UNIQUE ("parte_diario_id", "numero"), CONSTRAINT "PK_505441b10d03ccf705ecd03fb66" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario_actividad_produccion" ("id" SERIAL NOT NULL, "parte_diario_id" integer NOT NULL, "codigo" character varying(10) NOT NULL, "descripcion" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_2c64eeb5bf6ac97d72474b2fb2e" UNIQUE ("parte_diario_id", "codigo"), CONSTRAINT "PK_34d812132a81ad1d68d4d48f838" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario_demora_operativa" ("id" SERIAL NOT NULL, "parte_diario_id" integer NOT NULL, "codigo" character varying(10) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_151e1f4a4a5eb0e5ac3e3b9f7ff" UNIQUE ("parte_diario_id", "codigo"), CONSTRAINT "PK_30c24e4de9493dea96be0eb0f4c" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario_otro_evento" ("id" SERIAL NOT NULL, "parte_diario_id" integer NOT NULL, "codigo" character varying(10) NOT NULL, "descripcion" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_035240269480c311586438e001b" UNIQUE ("parte_diario_id", "codigo"), CONSTRAINT "PK_df57232c6ce810b2bd8613a50d4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "equipo"."parte_diario_demora_mecanica" ("id" SERIAL NOT NULL, "parte_diario_id" integer NOT NULL, "codigo" character varying(10) NOT NULL, "descripcion" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_172ba33d6c38faac3f791fd7bd5" UNIQUE ("parte_diario_id", "codigo"), CONSTRAINT "PK_365572e94d45cc9e0ab93a86ae1" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sistema"."rol_permiso" ("rol_id" integer NOT NULL, "permiso_id" integer NOT NULL, CONSTRAINT "PK_256c1f4f9321263545469f2aff0" PRIMARY KEY ("rol_id", "permiso_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c59b6b0fee02257a3e1ca75c47" ON "sistema"."rol_permiso" ("rol_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c476728351cd2f8f875ceb32e" ON "sistema"."rol_permiso" ("permiso_id") `
    );
    await queryRunner.query(
      `CREATE TABLE "sistema"."usuario_rol" ("usuario_id" integer NOT NULL, "rol_id" integer NOT NULL, CONSTRAINT "PK_40b321ebb932d588934043a2639" PRIMARY KEY ("usuario_id", "rol_id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_29e9a9079c7ba01c1b301cf555" ON "sistema"."usuario_rol" ("usuario_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac8911cd54a61461c992654140" ON "sistema"."usuario_rol" ("rol_id") `
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario" ADD CONSTRAINT "FK_6c336b0a51b5c4d22614cb02533" FOREIGN KEY ("rol_id") REFERENCES "sistema"."rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario" ADD CONSTRAINT "FK_fcd78e6580d769b90686d703a51" FOREIGN KEY ("unidad_operativa_id") REFERENCES "sistema"."unidad_operativa"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos"."edt" ADD CONSTRAINT "FK_abc142e3983a810533a25b0506b" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos"."edt" ADD CONSTRAINT "FK_4fe63deeb33246b9ac2376c674e" FOREIGN KEY ("actualizado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo" ADD CONSTRAINT "FK_1d9cbd19726c458fd878246b473" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"."proveedor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD CONSTRAINT "FK_0e00c812813a16dbc7b573a7212" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD CONSTRAINT "FK_457141a173c7141c4b8b152b2b9" FOREIGN KEY ("contrato_padre_id") REFERENCES "equipo"."contrato_adenda"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" ADD CONSTRAINT "FK_458c021e1e101b5875e9b262c25" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD CONSTRAINT "FK_11585d3ebb0ccfb9de52d1b5d8d" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" ADD CONSTRAINT "FK_e94f72bac52f533acef49720afd" FOREIGN KEY ("aprobado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" ADD CONSTRAINT "FK_b2963265154f933e5edb0280ea5" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"."edt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" ADD CONSTRAINT "FK_4f219be2b8a8767c990af36a1a6" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" ADD CONSTRAINT "FK_5e05847599fcae86572c6d7791b" FOREIGN KEY ("aprobado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."detalle_movimiento" ADD CONSTRAINT "FK_642cd895af27e2319b868318d81" FOREIGN KEY ("movimiento_id") REFERENCES "logistica"."movimiento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."detalle_movimiento" ADD CONSTRAINT "FK_90231e6c91dcc0423c39b03d68f" FOREIGN KEY ("producto_id") REFERENCES "logistica"."producto"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."programa_mantenimiento" ADD CONSTRAINT "FK_05d4b9c649e5531b0c32549ef51" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" ADD CONSTRAINT "FK_837e737ab7fc4c4c554b2497873" FOREIGN KEY ("programa_mantenimiento_id") REFERENCES "equipo"."programa_mantenimiento"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" ADD CONSTRAINT "FK_273c2da03bb0a5bf1d8413bdcb5" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" ADD CONSTRAINT "FK_db30599a6c341bac952ccb6d946" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" ADD CONSTRAINT "FK_5ba7a3cd4d4d13938df0faf2139" FOREIGN KEY ("asignado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" ADD CONSTRAINT "FK_e06bb7212f9bdca611249bfde85" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"."edt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rrhh"."disponibilidad_trabajador" ADD CONSTRAINT "FK_81c1ef41db612c0d681e76ab990" FOREIGN KEY ("trabajador_id") REFERENCES "rrhh"."trabajador"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" ADD CONSTRAINT "FK_2c6341d5bd206ff522b35aa6b69" FOREIGN KEY ("usuario_id") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sig"."documento" ADD CONSTRAINT "FK_1198da19d24e6e533b03e27baea" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sst"."incidente" ADD CONSTRAINT "FK_97b128e4c3000efc7a0710e4142" FOREIGN KEY ("reportado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "administracion"."cuenta_por_pagar" ADD CONSTRAINT "FK_8a397e37dbf56a12e5b6bb6e7e9" FOREIGN KEY ("proveedor_id") REFERENCES "proveedores"."proveedor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "administracion"."detalle_programacion_pago" ADD CONSTRAINT "FK_8f4147f9755b91541fd73e6497a" FOREIGN KEY ("programacion_pago_id") REFERENCES "administracion"."programacion_pago"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "rrhh"."documento_trabajador" ADD CONSTRAINT "FK_878344b09653fa65417652c6896" FOREIGN KEY ("trabajador_id") REFERENCES "rrhh"."trabajador"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_edt" ADD CONSTRAINT "FK_fd8a0772fb47d3381ff4957cf1a" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_edt" ADD CONSTRAINT "FK_73d0f6cb053c85c50899dc1cbe5" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"."edt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_combustible" ADD CONSTRAINT "FK_aa696e625a40470b51178446e87" FOREIGN KEY ("valorizacion_id") REFERENCES "equipo"."valorizacion_equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_plantilla" ADD CONSTRAINT "FK_a75026c532d0b9322b129a81049" FOREIGN KEY ("created_by") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" ADD CONSTRAINT "FK_2009007f79b027b553d2eeca207" FOREIGN KEY ("plantilla_id") REFERENCES "equipo"."checklist_plantilla"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" ADD CONSTRAINT "FK_73e23f446e1f13b588bb30f7aaf" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" ADD CONSTRAINT "FK_ae296833fb35164e72133aece5c" FOREIGN KEY ("trabajador_id") REFERENCES "rrhh"."trabajador"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_resultado" ADD CONSTRAINT "FK_697f76a721bc70c9432626813a8" FOREIGN KEY ("inspeccion_id") REFERENCES "equipo"."checklist_inspeccion"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_resultado" ADD CONSTRAINT "FK_1440f4ae8a0527889f9fe2b768a" FOREIGN KEY ("item_id") REFERENCES "equipo"."checklist_item"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."exceso_combustible" ADD CONSTRAINT "FK_e6fc6b3dda215331354e7824a6c" FOREIGN KEY ("valorizacion_id") REFERENCES "equipo"."valorizacion_equipo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."gasto_obra" ADD CONSTRAINT "FK_450412dc13191316302f6aae319" FOREIGN KEY ("valorizacion_id") REFERENCES "equipo"."valorizacion_equipo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."adelanto_amortizacion" ADD CONSTRAINT "FK_a15419a9a675bc59a6fb92267d8" FOREIGN KEY ("valorizacion_id") REFERENCES "equipo"."valorizacion_equipo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."adelanto_amortizacion" ADD CONSTRAINT "FK_6082ab1c3aea25416582617e291" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" ADD CONSTRAINT "FK_9ca4924807479c67278c807cb2c" FOREIGN KEY ("equipo_id") REFERENCES "equipo"."equipo"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" ADD CONSTRAINT "FK_19c6ee3361c0ec645181b0b5de3" FOREIGN KEY ("trabajador_id") REFERENCES "rrhh"."trabajador"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" ADD CONSTRAINT "FK_bda93f29b5993016bb345e9967c" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"."edt"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" ADD CONSTRAINT "FK_236a361854da67e66ba54892782" FOREIGN KEY ("creado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" ADD CONSTRAINT "FK_9d0dcad019e2e162258c8e6ac1d" FOREIGN KEY ("aprobado_por") REFERENCES "sistema"."usuario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_produccion" ADD CONSTRAINT "FK_86a0684afe1cbead2bc775621fd" FOREIGN KEY ("parte_diario_id") REFERENCES "equipo"."parte_diario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_actividad_produccion" ADD CONSTRAINT "FK_9db6e4a9ee2a6a2c13bf400c940" FOREIGN KEY ("parte_diario_id") REFERENCES "equipo"."parte_diario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_demora_operativa" ADD CONSTRAINT "FK_7bec53cefd178a89ee790e312cb" FOREIGN KEY ("parte_diario_id") REFERENCES "equipo"."parte_diario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_otro_evento" ADD CONSTRAINT "FK_0e487c902b4f11e0cbbb9e2a452" FOREIGN KEY ("parte_diario_id") REFERENCES "equipo"."parte_diario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_demora_mecanica" ADD CONSTRAINT "FK_bd2f65f0ec719c5b3756baee5aa" FOREIGN KEY ("parte_diario_id") REFERENCES "equipo"."parte_diario"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."rol_permiso" ADD CONSTRAINT "FK_c59b6b0fee02257a3e1ca75c47b" FOREIGN KEY ("rol_id") REFERENCES "sistema"."rol"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."rol_permiso" ADD CONSTRAINT "FK_3c476728351cd2f8f875ceb32ee" FOREIGN KEY ("permiso_id") REFERENCES "sistema"."permiso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario_rol" ADD CONSTRAINT "FK_29e9a9079c7ba01c1b301cf5555" FOREIGN KEY ("usuario_id") REFERENCES "sistema"."usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario_rol" ADD CONSTRAINT "FK_ac8911cd54a61461c9926541401" FOREIGN KEY ("rol_id") REFERENCES "sistema"."rol"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario_rol" DROP CONSTRAINT "FK_ac8911cd54a61461c9926541401"`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario_rol" DROP CONSTRAINT "FK_29e9a9079c7ba01c1b301cf5555"`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."rol_permiso" DROP CONSTRAINT "FK_3c476728351cd2f8f875ceb32ee"`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."rol_permiso" DROP CONSTRAINT "FK_c59b6b0fee02257a3e1ca75c47b"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_demora_mecanica" DROP CONSTRAINT "FK_bd2f65f0ec719c5b3756baee5aa"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_otro_evento" DROP CONSTRAINT "FK_0e487c902b4f11e0cbbb9e2a452"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_demora_operativa" DROP CONSTRAINT "FK_7bec53cefd178a89ee790e312cb"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_actividad_produccion" DROP CONSTRAINT "FK_9db6e4a9ee2a6a2c13bf400c940"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario_produccion" DROP CONSTRAINT "FK_86a0684afe1cbead2bc775621fd"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" DROP CONSTRAINT "FK_9d0dcad019e2e162258c8e6ac1d"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" DROP CONSTRAINT "FK_236a361854da67e66ba54892782"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" DROP CONSTRAINT "FK_bda93f29b5993016bb345e9967c"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" DROP CONSTRAINT "FK_19c6ee3361c0ec645181b0b5de3"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."parte_diario" DROP CONSTRAINT "FK_9ca4924807479c67278c807cb2c"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."adelanto_amortizacion" DROP CONSTRAINT "FK_6082ab1c3aea25416582617e291"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."adelanto_amortizacion" DROP CONSTRAINT "FK_a15419a9a675bc59a6fb92267d8"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."gasto_obra" DROP CONSTRAINT "FK_450412dc13191316302f6aae319"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."exceso_combustible" DROP CONSTRAINT "FK_e6fc6b3dda215331354e7824a6c"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_resultado" DROP CONSTRAINT "FK_1440f4ae8a0527889f9fe2b768a"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_resultado" DROP CONSTRAINT "FK_697f76a721bc70c9432626813a8"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" DROP CONSTRAINT "FK_ae296833fb35164e72133aece5c"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" DROP CONSTRAINT "FK_73e23f446e1f13b588bb30f7aaf"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_inspeccion" DROP CONSTRAINT "FK_2009007f79b027b553d2eeca207"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."checklist_plantilla" DROP CONSTRAINT "FK_a75026c532d0b9322b129a81049"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_combustible" DROP CONSTRAINT "FK_aa696e625a40470b51178446e87"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_edt" DROP CONSTRAINT "FK_73d0f6cb053c85c50899dc1cbe5"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo_edt" DROP CONSTRAINT "FK_fd8a0772fb47d3381ff4957cf1a"`
    );
    await queryRunner.query(
      `ALTER TABLE "rrhh"."documento_trabajador" DROP CONSTRAINT "FK_878344b09653fa65417652c6896"`
    );
    await queryRunner.query(
      `ALTER TABLE "administracion"."detalle_programacion_pago" DROP CONSTRAINT "FK_8f4147f9755b91541fd73e6497a"`
    );
    await queryRunner.query(
      `ALTER TABLE "administracion"."cuenta_por_pagar" DROP CONSTRAINT "FK_8a397e37dbf56a12e5b6bb6e7e9"`
    );
    await queryRunner.query(
      `ALTER TABLE "sst"."incidente" DROP CONSTRAINT "FK_97b128e4c3000efc7a0710e4142"`
    );
    await queryRunner.query(
      `ALTER TABLE "sig"."documento" DROP CONSTRAINT "FK_1198da19d24e6e533b03e27baea"`
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_2c6341d5bd206ff522b35aa6b69"`
    );
    await queryRunner.query(
      `ALTER TABLE "rrhh"."disponibilidad_trabajador" DROP CONSTRAINT "FK_81c1ef41db612c0d681e76ab990"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" DROP CONSTRAINT "FK_e06bb7212f9bdca611249bfde85"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" DROP CONSTRAINT "FK_5ba7a3cd4d4d13938df0faf2139"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" DROP CONSTRAINT "FK_db30599a6c341bac952ccb6d946"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" DROP CONSTRAINT "FK_273c2da03bb0a5bf1d8413bdcb5"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."tarea_programada" DROP CONSTRAINT "FK_837e737ab7fc4c4c554b2497873"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."programa_mantenimiento" DROP CONSTRAINT "FK_05d4b9c649e5531b0c32549ef51"`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."detalle_movimiento" DROP CONSTRAINT "FK_90231e6c91dcc0423c39b03d68f"`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."detalle_movimiento" DROP CONSTRAINT "FK_642cd895af27e2319b868318d81"`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" DROP CONSTRAINT "FK_5e05847599fcae86572c6d7791b"`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" DROP CONSTRAINT "FK_4f219be2b8a8767c990af36a1a6"`
    );
    await queryRunner.query(
      `ALTER TABLE "logistica"."movimiento" DROP CONSTRAINT "FK_b2963265154f933e5edb0280ea5"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP CONSTRAINT "FK_e94f72bac52f533acef49720afd"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."valorizacion_equipo" DROP CONSTRAINT "FK_11585d3ebb0ccfb9de52d1b5d8d"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP CONSTRAINT "FK_458c021e1e101b5875e9b262c25"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP CONSTRAINT "FK_457141a173c7141c4b8b152b2b9"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."contrato_adenda" DROP CONSTRAINT "FK_0e00c812813a16dbc7b573a7212"`
    );
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo" DROP CONSTRAINT "FK_1d9cbd19726c458fd878246b473"`
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos"."edt" DROP CONSTRAINT "FK_4fe63deeb33246b9ac2376c674e"`
    );
    await queryRunner.query(
      `ALTER TABLE "proyectos"."edt" DROP CONSTRAINT "FK_abc142e3983a810533a25b0506b"`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario" DROP CONSTRAINT "FK_fcd78e6580d769b90686d703a51"`
    );
    await queryRunner.query(
      `ALTER TABLE "sistema"."usuario" DROP CONSTRAINT "FK_6c336b0a51b5c4d22614cb02533"`
    );
    await queryRunner.query(`DROP INDEX "sistema"."IDX_ac8911cd54a61461c992654140"`);
    await queryRunner.query(`DROP INDEX "sistema"."IDX_29e9a9079c7ba01c1b301cf555"`);
    await queryRunner.query(`DROP TABLE "sistema"."usuario_rol"`);
    await queryRunner.query(`DROP INDEX "sistema"."IDX_3c476728351cd2f8f875ceb32e"`);
    await queryRunner.query(`DROP INDEX "sistema"."IDX_c59b6b0fee02257a3e1ca75c47"`);
    await queryRunner.query(`DROP TABLE "sistema"."rol_permiso"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario_demora_mecanica"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario_otro_evento"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario_demora_operativa"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario_actividad_produccion"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario_produccion"`);
    await queryRunner.query(`DROP TABLE "equipo"."parte_diario"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_adelanto_valorizacion"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_adelanto_equipo"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_adelanto_fecha"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_adelanto_tipo"`);
    await queryRunner.query(`DROP TABLE "equipo"."adelanto_amortizacion"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_gasto_obra_valorizacion"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_gasto_obra_fecha"`);
    await queryRunner.query(`DROP TABLE "equipo"."gasto_obra"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_exceso_combustible_valorizacion"`);
    await queryRunner.query(`DROP TABLE "equipo"."exceso_combustible"`);
    await queryRunner.query(`DROP TABLE "equipo"."checklist_resultado"`);
    await queryRunner.query(`DROP TABLE "equipo"."checklist_inspeccion"`);
    await queryRunner.query(`DROP TABLE "equipo"."checklist_plantilla"`);
    await queryRunner.query(`DROP TABLE "equipo"."checklist_item"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_equipo_combustible_fecha"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_equipo_combustible_valorizacion"`);
    await queryRunner.query(`DROP TABLE "equipo"."equipo_combustible"`);
    await queryRunner.query(`DROP TABLE "equipo"."equipo_edt"`);
    await queryRunner.query(`DROP TABLE "rrhh"."documento_trabajador"`);
    await queryRunner.query(`DROP TABLE "administracion"."programacion_pago"`);
    await queryRunner.query(`DROP TABLE "administracion"."detalle_programacion_pago"`);
    await queryRunner.query(`DROP TABLE "administracion"."cuenta_por_pagar"`);
    await queryRunner.query(`DROP INDEX "administracion"."idx_centro_costo_project"`);
    await queryRunner.query(`DROP INDEX "administracion"."idx_centro_costo_codigo"`);
    await queryRunner.query(`DROP TABLE "administracion"."centro_costo"`);
    await queryRunner.query(`DROP INDEX "sst"."idx_incidente_estado"`);
    await queryRunner.query(`DROP INDEX "sst"."idx_incidente_proyecto"`);
    await queryRunner.query(`DROP INDEX "sst"."idx_incidente_tipo"`);
    await queryRunner.query(`DROP INDEX "sst"."idx_incidente_fecha"`);
    await queryRunner.query(`DROP TABLE "sst"."incidente"`);
    await queryRunner.query(`DROP INDEX "public"."idx_licitaciones_estado"`);
    await queryRunner.query(`DROP INDEX "public"."idx_licitaciones_codigo"`);
    await queryRunner.query(`DROP TABLE "licitaciones"`);
    await queryRunner.query(`DROP TABLE "sig"."documento"`);
    await queryRunner.query(`DROP TABLE "notificaciones"`);
    await queryRunner.query(`DROP TABLE "rrhh"."disponibilidad_trabajador"`);
    await queryRunner.query(`DROP INDEX "rrhh"."idx_trabajador_unidad_operativa"`);
    await queryRunner.query(`DROP INDEX "rrhh"."idx_trabajador_cargo"`);
    await queryRunner.query(`DROP INDEX "rrhh"."idx_trabajador_apellido"`);
    await queryRunner.query(`DROP INDEX "rrhh"."idx_trabajador_dni"`);
    await queryRunner.query(`DROP TABLE "rrhh"."trabajador"`);
    await queryRunner.query(`DROP TABLE "equipo"."tarea_programada"`);
    await queryRunner.query(`DROP TABLE "equipo"."programa_mantenimiento"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movement_details_product"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movement_details_movement"`);
    await queryRunner.query(`DROP TABLE "logistica"."detalle_movimiento"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movements_created_by"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movements_status"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movements_tipo"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movements_fecha"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_movements_project"`);
    await queryRunner.query(`DROP TABLE "logistica"."movimiento"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_producto_categoria"`);
    await queryRunner.query(`DROP INDEX "logistica"."idx_producto_codigo"`);
    await queryRunner.query(`DROP TABLE "logistica"."producto"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_estado"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_numero"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_periodo"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_proyecto"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_contrato"`);
    await queryRunner.query(`DROP INDEX "equipo"."idx_valorizacion_equipo_equipo"`);
    await queryRunner.query(`DROP TABLE "equipo"."valorizacion_equipo"`);
    await queryRunner.query(`DROP TABLE "equipo"."contrato_adenda"`);
    await queryRunner.query(`DROP TABLE "equipo"."equipo"`);
    await queryRunner.query(`DROP TABLE "proveedores"."proveedor"`);
    await queryRunner.query(`DROP INDEX "proyectos"."idx_edt_unidad_operativa"`);
    await queryRunner.query(`DROP INDEX "proyectos"."idx_edt_company"`);
    await queryRunner.query(`DROP INDEX "proyectos"."idx_edt_estado"`);
    await queryRunner.query(`DROP INDEX "proyectos"."idx_edt_codigo"`);
    await queryRunner.query(`DROP TABLE "proyectos"."edt"`);
    await queryRunner.query(`DROP TABLE "sistema"."usuario"`);
    await queryRunner.query(`DROP TABLE "sistema"."unidad_operativa"`);
    await queryRunner.query(`DROP TABLE "sistema"."rol"`);
    await queryRunner.query(`DROP TABLE "sistema"."permiso"`);

    // Drop schemas
    await queryRunner.query(`DROP SCHEMA IF EXISTS sig CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS sst CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS equipo CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS logistica CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS rrhh CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS administracion CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS proveedores CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS proyectos CASCADE`);
    await queryRunner.query(`DROP SCHEMA IF EXISTS sistema CASCADE`);
  }
}
