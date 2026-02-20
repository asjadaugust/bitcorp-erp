import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTipoEquipoTable1771401400000 implements MigrationInterface {
  name = 'CreateTipoEquipoTable1771401400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ─── 1. Create tipo_equipo table ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "equipo"."tipo_equipo" (
        "id"            SERIAL        NOT NULL,
        "codigo"        VARCHAR(5)    NOT NULL,
        "nombre"        VARCHAR(100)  NOT NULL,
        "categoria_prd" VARCHAR(30)   NOT NULL,
        "descripcion"   TEXT,
        "activo"        BOOLEAN       NOT NULL DEFAULT TRUE,
        "created_at"    TIMESTAMP     NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_tipo_equipo" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tipo_equipo_codigo" UNIQUE ("codigo")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tipo_equipo_categoria_prd" ON "equipo"."tipo_equipo" ("categoria_prd")`
    );

    // ─── 2. Seed PRD-defined equipment types ──────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "equipo"."tipo_equipo" ("codigo", "nombre", "categoria_prd", "descripcion") VALUES
        -- MAQUINARIA_PESADA
        ('EX',  'Excavadora',          'MAQUINARIA_PESADA', 'Excavadora sobre orugas o ruedas'),
        ('TO',  'Tractor de Oruga',    'MAQUINARIA_PESADA', 'Tractor tipo bulldozer sobre orugas'),
        ('CF',  'Cargador Frontal',    'MAQUINARIA_PESADA', 'Cargador de ruedas con cucharón frontal'),
        ('MN',  'Motoniveladora',      'MAQUINARIA_PESADA', 'Máquina niveladora de superficies'),
        ('RC',  'Rodillo Compactador', 'MAQUINARIA_PESADA', 'Compactador vibratorio de suelos'),
        ('GR',  'Grúa',               'MAQUINARIA_PESADA', 'Grúa hidráulica o de pluma'),
        ('RE',  'Retroexcavadora',     'MAQUINARIA_PESADA', 'Retroexcavadora cargadora'),
        ('MC',  'Minicargador',        'MAQUINARIA_PESADA', 'Minicargador tipo skid steer'),
        ('PA',  'Pavimentadora',       'MAQUINARIA_PESADA', 'Finisher asfáltica'),
        -- VEHICULOS_PESADOS
        ('CV',  'Camión Volquete',     'VEHICULOS_PESADOS', 'Camión volquete de obra'),
        ('CC',  'Camión Cisterna',     'VEHICULOS_PESADOS', 'Cisterna para agua o combustible'),
        ('CP',  'Camión Plataforma',   'VEHICULOS_PESADOS', 'Camión de plataforma para transporte'),
        ('TC',  'Tracto Camión',       'VEHICULOS_PESADOS', 'Tractocamión / semirremolque'),
        ('BU',  'Bus',                 'VEHICULOS_PESADOS', 'Bus de transporte de personal'),
        ('MB',  'Minibús',             'VEHICULOS_PESADOS', 'Minibús o coaster de personal'),
        -- VEHICULOS_LIVIANOS
        ('CA',  'Camioneta',           'VEHICULOS_LIVIANOS', 'Camioneta pick-up o station wagon'),
        ('AU',  'Automóvil',           'VEHICULOS_LIVIANOS', 'Vehículo de pasajeros ligero'),
        ('FU',  'Furgoneta',           'VEHICULOS_LIVIANOS', 'Van o furgoneta de carga liviana'),
        ('MM',  'Motocicleta',         'VEHICULOS_LIVIANOS', 'Moto o cuatrimoto de supervisión'),
        -- EQUIPOS_MENORES
        ('CO',  'Compresora',          'EQUIPOS_MENORES', 'Compresor de aire portátil'),
        ('GE',  'Generador',           'EQUIPOS_MENORES', 'Grupo electrógeno o generador'),
        ('ME',  'Mezcladora',          'EQUIPOS_MENORES', 'Mezcladora de concreto'),
        ('VC',  'Vibrador de Concreto','EQUIPOS_MENORES', 'Vibrador de aguja para concreto'),
        ('BO',  'Motobomba',           'EQUIPOS_MENORES', 'Bomba motorizada de agua'),
        ('SO',  'Soldadora',           'EQUIPOS_MENORES', 'Equipo de soldadura eléctrica o autógena'),
        ('AN',  'Andamio',             'EQUIPOS_MENORES', 'Sistema de andamios modular'),
        ('TA',  'Taladro',             'EQUIPOS_MENORES', 'Taladro o perforadora neumática'),
        ('OT',  'Otro',                'EQUIPOS_MENORES', 'Equipo menor no categorizado')
      ON CONFLICT ("codigo") DO NOTHING
    `);

    // ─── 3. Add FK constraint on equipo.tipo_equipo_id ────────────────────────
    await queryRunner.query(`
      ALTER TABLE "equipo"."equipo"
        ADD CONSTRAINT "FK_equipo_tipo_equipo"
        FOREIGN KEY ("tipo_equipo_id")
        REFERENCES "equipo"."tipo_equipo" ("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE
    `);

    // ─── 4. Data migration: map existing free-text categoria → tipo_equipo_id ─
    // Map existing free-text values in the categoria column to the new tipo_equipo rows
    await queryRunner.query(`
      UPDATE "equipo"."equipo" e
      SET "tipo_equipo_id" = t.id
      FROM "equipo"."tipo_equipo" t
      WHERE e."tipo_equipo_id" IS NULL
        AND e."categoria" IS NOT NULL
        AND (
          t."nombre" ILIKE e."categoria"
          OR t."nombre" ILIKE CONCAT('%', e."categoria", '%')
          OR e."categoria" ILIKE CONCAT('%', t."nombre", '%')
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove FK before dropping the table
    await queryRunner.query(
      `ALTER TABLE "equipo"."equipo" DROP CONSTRAINT IF EXISTS "FK_equipo_tipo_equipo"`
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "equipo"."tipo_equipo"`);
  }
}
