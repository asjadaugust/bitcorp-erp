# Database Skill — BitCorp ERP (PostgreSQL Multi-Schema)

> **When to activate**: Any prompt involving database schemas, migrations, SQL, TypeORM entities, SQLAlchemy models, or seed data.

---

## 1. Schema Organization

```
bitcorp_dev (or bitcorp_empresa_*)
├── sistema      — users, roles, audit
├── proyectos    — projects (EDT)
├── equipo       — equipment, daily reports, maintenance, valuations, contracts
├── rrhh         — workers / operators
├── logistica    — inventory, movements
├── proveedores  — suppliers
├── administracion — cost centers, accounts payable
├── sst          — safety incidents, inspections
└── public       — attachments, notifications, tenders
```

---

## 2. Source of Truth

| Layer                 | Source File                    | Column Style                    |
| --------------------- | ------------------------------ | ------------------------------- |
| **SQL DDL**           | `database/001_init_schema.sql` | snake_case Spanish              |
| **SQLAlchemy models** | `backend/app/modelos/*.py`     | snake_case Spanish (matches DB) |

When adding a new table or column:

1. Add to `database/001_init_schema.sql`
2. Update `database/002_seed.sql` if needed
3. Add SQLAlchemy model in `backend/app/modelos/`

---

## 3. Multi-Tenancy

Every business table has `tenant_id INTEGER NOT NULL` (no FK, just integer).

- **No shared data between tenants** — every query filters by `tenant_id`
- `sistema.empresas` is the tenant registry in the central `bitcorp_sistema` database
- JWT payload carries `id_empresa` which is the `tenant_id`

---

## 4. Naming Conventions

| What          | Style                      | Example                                         |
| ------------- | -------------------------- | ----------------------------------------------- |
| Table names   | Spanish snake_case         | `equipo.contrato_adenda`, `rrhh.trabajador`     |
| Column names  | Spanish snake_case         | `fecha_inicio`, `codigo_equipo`, `razon_social` |
| Primary keys  | `id` (serial)              | `id SERIAL PRIMARY KEY`                         |
| Foreign keys  | `<entity>_id`              | `equipo_id`, `contrato_id`, `proveedor_id`      |
| Timestamps    | `created_at`, `updated_at` | `TIMESTAMPTZ DEFAULT NOW()`                     |
| Soft delete   | `is_active` / `activo`     | `BOOLEAN DEFAULT TRUE`                          |
| Status fields | `estado`                   | `VARCHAR(50) DEFAULT 'ACTIVO'`                  |

---

## 5. Key Tables by Schema

### `equipo` schema

- `tipo_equipo` — Equipment type catalog (28 seeded types, 4 PRD categories)
- `equipo` — Main equipment registry
- `contrato_adenda` — Contracts + addendums (self-referential FK for parent)
- `contrato_obligacion` — Arrendador obligations (9 types)
- `contrato_obligacion_arrendatario` — Arrendatario obligations (4 types)
- `legalizacion_contrato` — Notarial legalization tracking (4 steps)
- `parte_diario` — Daily operation reports (46 columns, 5 signatures)
- `parte_diario_produccion` — Production records per daily report
- `parte_diario_actividad_produccion` — Activity records
- `parte_diario_demora_operativa` — Operational delays
- `parte_diario_demora_mecanica` — Mechanical delays (with resolution tracking)
- `parte_diario_otro_evento` — Other events
- `parte_diario_foto` — Report photos
- `valorizacion_equipo` — Monthly valuations (workflow: BORRADOR→PAGADO)
- `registro_pago` — Payment records
- `vale_combustible` — Fuel vouchers (VCB-NNNN)
- `periodo_inoperatividad` — Inoperability periods
- `precalentamiento_config` — Warmup hours per equipment type
- `cotizacion_proveedor` — Provider quotes (COT-NNNN)
- `solicitud_equipo` — Equipment requests (SEQ-NNNN)
- `orden_alquiler` — Rental orders (OAL-NNNN)
- `acta_devolucion` — Return acts (ADV-NNNN)

### `rrhh` schema

- `trabajador` — Workers/operators
- `operador_certificacion` — Operator certifications
- `operador_habilidad` — Operator skills
- `disponibilidad_operador` — Operator availability calendar

### `sistema` schema

- `usuario` — Users (with `rol` and `id_empresa`)
- `empresas` — Company/tenant registry

### `proveedores` schema

- `proveedor` — Suppliers
- `contacto_proveedor` — Supplier contacts

---

## 6. Migration Pattern

**Python (Alembic)**: `backend/alembic/versions/`

**Rules**:

- All schema changes go in `001_init_schema.sql` + corresponding seed in `002_seed.sql`
- Last migration timestamp: `1771965500000` (WS-34 cotizacion_proveedor)

---

## 7. Common Column Patterns

```sql
-- Timestamps
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

-- Soft delete
is_active BOOLEAN NOT NULL DEFAULT TRUE,

-- Status workflow
estado VARCHAR(50) NOT NULL DEFAULT 'ACTIVO',

-- Tenant isolation
tenant_id INTEGER NOT NULL,

-- Audit
creado_por INTEGER REFERENCES sistema.usuario(id),
actualizado_por INTEGER REFERENCES sistema.usuario(id),

-- Document code (auto-generated)
codigo VARCHAR(20) UNIQUE NOT NULL, -- e.g., SEQ-0001, VCB-0042
```
