import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * WS-35: Flexible Approval System
 *
 * Creates the `aprobaciones` schema with a Microsoft Teams-style approval engine:
 * configurable per-project/module templates, sequential multi-step flows,
 * OR logic within steps, an immutable audit trail, ad-hoc requests,
 * and a unified Recibidos/Enviados dashboard.
 *
 * Also adds nullable `solicitud_aprobacion_id` FK to:
 *   - equipo.parte_diario
 *   - equipo.valorizacion_equipo
 *   - equipo.solicitud_equipo
 */
export class CreateAprobacionesSchema1771965600000 implements MigrationInterface {
  name = 'CreateAprobacionesSchema1771965600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE SCHEMA IF NOT EXISTS aprobaciones;

      -- plantilla_aprobacion: reusable approval workflow templates
      CREATE TABLE aprobaciones.plantilla_aprobacion (
        id          SERIAL PRIMARY KEY,
        tenant_id   INTEGER,
        nombre      VARCHAR(200) NOT NULL,
        module_name VARCHAR(50)  NOT NULL,
        proyecto_id INTEGER,
        version     INTEGER      NOT NULL DEFAULT 1,
        estado      VARCHAR(20)  NOT NULL DEFAULT 'ACTIVO',
        descripcion TEXT,
        created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
        created_by  INTEGER
      );
      CREATE INDEX idx_plantilla_module ON aprobaciones.plantilla_aprobacion(module_name);
      CREATE INDEX idx_plantilla_tenant ON aprobaciones.plantilla_aprobacion(tenant_id);
      CREATE INDEX idx_plantilla_estado ON aprobaciones.plantilla_aprobacion(estado);

      -- plantilla_paso: sequential steps within a template
      CREATE TABLE aprobaciones.plantilla_paso (
        id                SERIAL PRIMARY KEY,
        tenant_id         INTEGER,
        plantilla_id      INTEGER NOT NULL REFERENCES aprobaciones.plantilla_aprobacion(id) ON DELETE CASCADE,
        paso_numero       INTEGER NOT NULL,
        nombre_paso       VARCHAR(200) NOT NULL,
        tipo_aprobador    VARCHAR(20)  NOT NULL DEFAULT 'ROLE',
        rol               VARCHAR(50),
        usuario_id        INTEGER,
        logica_aprobacion VARCHAR(30)  NOT NULL DEFAULT 'ALL_MUST_APPROVE',
        es_opcional       BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at        TIMESTAMP    NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_plantilla_paso_plantilla ON aprobaciones.plantilla_paso(plantilla_id);

      -- solicitud_aprobacion: individual approval request instances
      CREATE TABLE aprobaciones.solicitud_aprobacion (
        id                     SERIAL PRIMARY KEY,
        tenant_id              INTEGER,
        plantilla_id           INTEGER REFERENCES aprobaciones.plantilla_aprobacion(id),
        plantilla_version      INTEGER,
        module_name            VARCHAR(50)  NOT NULL,
        entity_id              INTEGER      NOT NULL,
        proyecto_id            INTEGER,
        usuario_solicitante_id INTEGER      NOT NULL,
        titulo                 VARCHAR(400) NOT NULL,
        descripcion            TEXT,
        estado                 VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
        paso_actual            INTEGER      NOT NULL DEFAULT 1,
        fecha_creacion         TIMESTAMP    NOT NULL DEFAULT NOW(),
        fecha_completado       TIMESTAMP,
        completado_por_id      INTEGER
      );
      CREATE INDEX idx_solicitud_entity  ON aprobaciones.solicitud_aprobacion(entity_id, module_name);
      CREATE INDEX idx_solicitud_estado  ON aprobaciones.solicitud_aprobacion(estado);
      CREATE INDEX idx_solicitud_tenant  ON aprobaciones.solicitud_aprobacion(tenant_id);
      CREATE INDEX idx_solicitud_solicit ON aprobaciones.solicitud_aprobacion(usuario_solicitante_id);

      -- paso_solicitud: step-level completion tracking per request
      CREATE TABLE aprobaciones.paso_solicitud (
        id           SERIAL PRIMARY KEY,
        tenant_id    INTEGER,
        solicitud_id INTEGER NOT NULL REFERENCES aprobaciones.solicitud_aprobacion(id) ON DELETE CASCADE,
        paso_numero  INTEGER NOT NULL,
        aprobador_id INTEGER,
        estado_paso  VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
        accion_fecha TIMESTAMP,
        comentario   TEXT
      );
      CREATE INDEX idx_paso_solicitud ON aprobaciones.paso_solicitud(solicitud_id);
      CREATE INDEX idx_paso_aprobador ON aprobaciones.paso_solicitud(aprobador_id);
      CREATE INDEX idx_paso_estado    ON aprobaciones.paso_solicitud(estado_paso);

      -- solicitud_adhoc: free-form ad-hoc approval requests
      CREATE TABLE aprobaciones.solicitud_adhoc (
        id                     SERIAL PRIMARY KEY,
        tenant_id              INTEGER,
        usuario_solicitante_id INTEGER      NOT NULL,
        titulo                 VARCHAR(400) NOT NULL,
        descripcion            TEXT,
        aprobadores            JSONB        NOT NULL DEFAULT '[]',
        usuarios_cc            JSONB        NOT NULL DEFAULT '[]',
        logica_aprobacion      VARCHAR(30)  NOT NULL DEFAULT 'ALL_MUST_APPROVE',
        estado                 VARCHAR(20)  NOT NULL DEFAULT 'PENDIENTE',
        fecha_creacion         TIMESTAMP    NOT NULL DEFAULT NOW(),
        fecha_completado       TIMESTAMP,
        archivos_adjuntos      JSONB
      );
      CREATE INDEX idx_adhoc_solicitante ON aprobaciones.solicitud_adhoc(usuario_solicitante_id);
      CREATE INDEX idx_adhoc_estado      ON aprobaciones.solicitud_adhoc(estado);

      -- respuesta_adhoc: individual responses to ad-hoc requests
      CREATE TABLE aprobaciones.respuesta_adhoc (
        id                 SERIAL PRIMARY KEY,
        tenant_id          INTEGER,
        solicitud_adhoc_id INTEGER     NOT NULL REFERENCES aprobaciones.solicitud_adhoc(id) ON DELETE CASCADE,
        aprobador_id       INTEGER     NOT NULL,
        respuesta          VARCHAR(20) NOT NULL,
        comentario         TEXT,
        fecha_respuesta    TIMESTAMP   NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_respuesta_adhoc ON aprobaciones.respuesta_adhoc(solicitud_adhoc_id);

      -- auditoria_aprobacion: immutable audit trail (never UPDATE/DELETE)
      CREATE TABLE aprobaciones.auditoria_aprobacion (
        id                 SERIAL PRIMARY KEY,
        tenant_id          INTEGER,
        solicitud_id       INTEGER,
        solicitud_adhoc_id INTEGER,
        plantilla_version  INTEGER,
        accion             VARCHAR(30) NOT NULL,
        usuario_id         INTEGER     NOT NULL,
        paso_numero        INTEGER,
        comentario         TEXT,
        timestamp          TIMESTAMP   NOT NULL DEFAULT NOW(),
        metadata           JSONB
      );
      CREATE INDEX idx_auditoria_solicitud ON aprobaciones.auditoria_aprobacion(solicitud_id);
      CREATE INDEX idx_auditoria_usuario   ON aprobaciones.auditoria_aprobacion(usuario_id);

      -- FK columns on existing entity tables (nullable for backward compat)
      ALTER TABLE equipo.parte_diario        ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER;
      ALTER TABLE equipo.valorizacion_equipo ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER;
      ALTER TABLE equipo.solicitud_equipo    ADD COLUMN IF NOT EXISTS solicitud_aprobacion_id INTEGER;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE equipo.solicitud_equipo    DROP COLUMN IF EXISTS solicitud_aprobacion_id;
      ALTER TABLE equipo.valorizacion_equipo DROP COLUMN IF EXISTS solicitud_aprobacion_id;
      ALTER TABLE equipo.parte_diario        DROP COLUMN IF EXISTS solicitud_aprobacion_id;
      DROP TABLE IF EXISTS aprobaciones.auditoria_aprobacion;
      DROP TABLE IF EXISTS aprobaciones.respuesta_adhoc;
      DROP TABLE IF EXISTS aprobaciones.solicitud_adhoc;
      DROP TABLE IF EXISTS aprobaciones.paso_solicitud;
      DROP TABLE IF EXISTS aprobaciones.solicitud_aprobacion;
      DROP TABLE IF EXISTS aprobaciones.plantilla_paso;
      DROP TABLE IF EXISTS aprobaciones.plantilla_aprobacion;
      DROP SCHEMA IF EXISTS aprobaciones;
    `);
  }
}
