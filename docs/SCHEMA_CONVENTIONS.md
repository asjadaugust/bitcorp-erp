# Database Schema & Naming Conventions

## Overview

This document defines the naming conventions and best practices for working with the Bitcorp ERP database schema. Following these conventions ensures consistency and prevents common "column does not exist" errors.

## Database Architecture

### Schema Organization

The database uses PostgreSQL schemas to organize tables by business domain:

- **`sistema`** - Core system tables (users, roles, permissions, audit logs)
- **`proyectos`** - Project management (EDT, project assignments)
- **`equipo`** - Equipment management (equipment, daily reports, maintenance, valuations)
- **`rrhh`** - Human resources (workers/operators, attendance)
- **`logistica`** - Logistics & inventory (products, movements, movement details)
- **`proveedores`** - Supplier/provider management
- **`administracion`** - Administrative functions (cost centers, accounts payable)
- **`sst`** - Occupational health and safety (incidents, inspections)
- **`public`** - Miscellaneous tables (attachments, notifications, tenders)

## Naming Conventions

### 1. Database Column Names

**Primary Rule**: Database columns use **Spanish names** with **snake_case** formatting.

```sql
-- ✅ CORRECT - Spanish, snake_case
CREATE TABLE equipo.equipo (
  id INTEGER PRIMARY KEY,
  codigo_equipo VARCHAR(50),
  tipo_equipo_id INTEGER,
  fecha_acreditacion DATE,
  is_active BOOLEAN
);
```

**Exceptions**: Some system-level columns use English:
- `id` - Primary keys (English)
- `legacy_id` - Legacy system reference (English)
- `is_active` - Active/inactive flag (English)
- `created_at` - Creation timestamp (English)
- `updated_at` - Update timestamp (English)

### 2. TypeORM Model Properties

**Primary Rule**: TypeScript properties use **Spanish-based** names with **camelCase** formatting.

```typescript
// ✅ CORRECT - Spanish-based camelCase
@Entity('equipo', { schema: 'equipo' })
export class Equipo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'codigo_equipo' })
  codigoEquipo!: string;

  @Column({ name: 'tipo_equipo_id' })
  tipoEquipoId?: number;

  @Column({ name: 'fecha_acreditacion' })
  fechaAcreditacion?: Date;

  @Column({ name: 'is_active' })
  isActive!: boolean;
}
```

**Mapping Pattern**:
```
Database Column    →  TypeScript Property
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
codigo_equipo      →  codigoEquipo
tipo_equipo_id     →  tipoEquipoId
fecha_acreditacion →  fechaAcreditacion
is_active          →  isActive
created_at         →  createdAt
updated_at         →  updatedAt
```

### 3. TypeORM Query Builder Usage

When using TypeORM's query builder, **ALWAYS use TypeScript property names** (camelCase), never database column names.

```typescript
// ✅ CORRECT - Use TypeScript property names
const equipment = await equipmentRepo
  .createQueryBuilder('e')
  .where('e.codigoEquipo = :code', { code })
  .andWhere('e.tipoEquipoId = :typeId', { typeId })
  .andWhere('e.isActive = true')
  .getOne();

// ❌ WRONG - Don't use database column names
const equipment = await equipmentRepo
  .createQueryBuilder('e')
  .where('e.codigo_equipo = :code', { code })  // Will fail!
  .getOne();
```

### 4. Raw SQL Queries

When using raw SQL (via `pool.query()`), **ALWAYS use actual database column names** (Spanish snake_case).

```typescript
// ✅ CORRECT - Use database column names
const result = await pool.query(`
  SELECT 
    e.codigo_equipo,
    e.tipo_equipo_id,
    e.fecha_acreditacion
  FROM equipo.equipo e
  WHERE e.is_active = true
    AND e.tipo_equipo_id = $1
`, [typeId]);

// ❌ WRONG - Don't use TypeScript property names
const result = await pool.query(`
  SELECT 
    e.codigoEquipo,  -- Column doesn't exist!
    e.tipoEquipoId   -- Column doesn't exist!
  FROM equipo.equipo e
`, []);
```

### 5. Request/Response Mapping

When receiving data from API requests, convert snake_case to camelCase before passing to TypeORM:

```typescript
// ✅ CORRECT - Map request body to model properties
async createProduct(req: Request, res: Response) {
  const {
    codigo,
    nombre,
    unidad_medida,      // From request (snake_case)
    stock_actual,       // From request (snake_case)
    precio_unitario     // From request (snake_case)
  } = req.body;

  const product = productRepo.create({
    codigo,
    nombre,
    unidadMedida: unidad_medida,      // Convert to camelCase
    stockActual: stock_actual,        // Convert to camelCase
    precioUnitario: precio_unitario   // Convert to camelCase
  });

  await productRepo.save(product);
}
```

## Common Column Name Patterns

### Equipment (Equipo)
```
codigo_equipo       → codigoEquipo
tipo_equipo_id      → tipoEquipoId
proveedor_id        → proveedorId
placa               → placa
marca               → marca
modelo              → modelo
numero_serie_equipo → numeroSerieEquipo
anio_fabricacion    → anioFabricacion
```

### Projects (Proyectos)
```
proyecto_id         → proyectoId
nombre              → nombre
descripcion         → descripcion
fecha_inicio        → fechaInicio
fecha_fin           → fechaFin
presupuesto         → presupuesto
```

### Logistics (Logística)
```
producto_id         → productoId
movimiento_id       → movimientoId
tipo_movimiento     → tipoMovimiento
numero_documento    → numeroDocumento
cantidad            → cantidad
precio_unitario     → precioUnitario
monto_total         → montoTotal
stock_actual        → stockActual
stock_minimo        → stockMinimo
```

### Workers (Trabajadores)
```
trabajador_id       → trabajadorId
nombres             → nombres
apellido_paterno    → apellidoPaterno
apellido_materno    → apellidoMaterno
dni                 → dni
fecha_nacimiento    → fechaNacimiento
fecha_ingreso       → fechaIngreso
cargo               → cargo
```

### Daily Reports (Parte Diario)
```
parte_diario_id     → parteDiarioId
equipo_id           → equipoId
trabajador_id       → trabajadorId
proyecto_id         → proyectoId
fecha               → fecha
horometro_inicial   → horometroInicial
horometro_final     → horometroFinal
odometro_inicial    → odometroInicial
odometro_final      → odometroFinal
horas_trabajadas    → horasTrabajadas
combustible_consumido → combustibleConsumido
```

## Status/State Fields

Status fields typically use Spanish uppercase values:

### Movement Status (Estado Movimiento)
```typescript
type StatusMovimiento = 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
```

### Equipment Status (Estado Equipo)
```typescript
type EstadoEquipo = 'DISPONIBLE' | 'EN_USO' | 'MANTENIMIENTO' | 'INACTIVO';
```

### Daily Report Status (Estado Parte Diario)
```typescript
type EstadoParteDiario = 'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
```

## Foreign Key Conventions

Foreign keys follow the pattern: `{referenced_table}_id`

```sql
-- References proyecto(id)
proyecto_id INTEGER REFERENCES proyectos.edt(id)

-- References equipo(id)  
equipo_id INTEGER REFERENCES equipo.equipo(id)

-- References trabajador(id)
trabajador_id INTEGER REFERENCES rrhh.trabajador(id)

-- References proveedor(id)
proveedor_id INTEGER REFERENCES proveedores.proveedor(id)
```

## Index Naming Conventions

```sql
-- Primary key: {table}_pkey
CONSTRAINT equipo_pkey PRIMARY KEY (id)

-- Regular index: idx_{table}_{column}
CREATE INDEX idx_equipo_codigo ON equipo.equipo(codigo_equipo);

-- Foreign key index: idx_{table}_{referenced_table}
CREATE INDEX idx_parte_diario_equipo ON equipo.parte_diario(equipo_id);

-- Composite index: idx_{table}_{col1}_{col2}
CREATE INDEX idx_movimiento_fecha_tipo ON logistica.movimiento(fecha, tipo_movimiento);
```

## Best Practices

### DO ✅

1. **Use TypeORM query builder for complex queries** - Better type safety
2. **Map database rows to model properties** - Use mapper functions for raw SQL
3. **Keep model property names consistent** - Always Spanish-based camelCase
4. **Document exceptions** - Note any tables with English column names
5. **Use enum types** - Define status/state values as TypeScript types
6. **Validate conversions** - Test snake_case ↔ camelCase mappings

### DON'T ❌

1. **Don't mix English and Spanish** - Stick to Spanish for business domain terms
2. **Don't use database column names in query builder** - Use model properties
3. **Don't use TypeScript property names in raw SQL** - Use actual column names
4. **Don't skip column mappings** - Always use `@Column({ name: '...' })`
5. **Don't assume column names** - Check actual database schema first
6. **Don't use synchronize: true** - Use manual SQL migrations

## Migration Strategy

We use **manual SQL migrations** in `/database/*.sql` files:

```
/database/
  001_init_schema.sql    - Initial schema creation
  002_seed.sql           - Seed data
  003_*.sql              - Additional migrations
```

**DO NOT** use TypeORM's automatic migrations (`synchronize: true` or `migrations` directory).

## Troubleshooting

### Error: "column does not exist"

**Cause**: Mismatch between code and database column names

**Solution**:
1. Check actual database column name: `\d schema.table` in psql
2. Verify model `@Column({ name: '...' })` mapping
3. If using query builder, use TypeScript property name
4. If using raw SQL, use database column name

### Error: Property does not exist on type

**Cause**: Using wrong property name in TypeScript code

**Solution**:
1. Check model definition for correct property name
2. Ensure you're using camelCase (not snake_case)
3. Import the correct model/type

## Schema Documentation

For detailed table structures, see:
- Database schema: `/database/001_init_schema.sql`
- Legacy tables: `/docs/tables/*.md`
- Model definitions: `/backend/src/models/*.model.ts`

## Examples

### Complete CRUD Example

```typescript
import { AppDataSource } from '../config/database.config';
import { Equipo } from '../models/equipment.model';

export class EquipmentService {
  private repo = AppDataSource.getRepository(Equipo);

  // CREATE - Map request to model
  async create(data: any) {
    const equipment = this.repo.create({
      codigoEquipo: data.codigo_equipo,
      tipoEquipoId: data.tipo_equipo_id,
      proveedorId: data.proveedor_id,
      marca: data.marca,
      modelo: data.modelo,
      anioFabricacion: data.anio_fabricacion,
      isActive: true
    });
    return await this.repo.save(equipment);
  }

  // READ - Query builder with TypeScript properties
  async findByType(typeId: number) {
    return await this.repo
      .createQueryBuilder('e')
      .where('e.tipoEquipoId = :typeId', { typeId })
      .andWhere('e.isActive = true')
      .orderBy('e.codigoEquipo', 'ASC')
      .getMany();
  }

  // UPDATE - Use model properties
  async update(id: number, data: Partial<Equipo>) {
    const equipment = await this.repo.findOne({ where: { id } });
    if (!equipment) throw new Error('Equipment not found');

    if (data.marca) equipment.marca = data.marca;
    if (data.modelo) equipment.modelo = data.modelo;
    if (data.anioFabricacion) equipment.anioFabricacion = data.anioFabricacion;

    return await this.repo.save(equipment);
  }

  // DELETE - Soft delete
  async delete(id: number) {
    const equipment = await this.repo.findOne({ where: { id } });
    if (!equipment) throw new Error('Equipment not found');

    equipment.isActive = false;
    return await this.repo.save(equipment);
  }

  // RAW SQL - Use database column names
  async getStatistics() {
    const result = await pool.query(`
      SELECT 
        te.nombre as tipo_equipo,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE e.is_active = true) as activos
      FROM equipo.equipo e
      INNER JOIN equipo.tipo_equipo te ON e.tipo_equipo_id = te.id
      GROUP BY te.nombre
      ORDER BY total DESC
    `);
    return result.rows;
  }
}
```

## Version History

- **v1.0** (2026-01-04) - Initial documentation after Sprint 1 schema fixes
- Fixed 11 files with column name mismatches
- Standardized camelCase property naming
- Documented Spanish column conventions

---

**Maintained by**: Bitcorp ERP Development Team  
**Last Updated**: January 4, 2026  
**Related Docs**: `/database/001_init_schema.sql`, `/backend/src/models/`
