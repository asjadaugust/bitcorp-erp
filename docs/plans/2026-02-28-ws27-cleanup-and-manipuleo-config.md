# WS-27 Fuel Cleanup + Manipuleo Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove orphaned FuelRecord model and make the fuel handling (manipuleo) rate configurable instead of hardcoded at 0.80.

**Architecture:** Two independent stories. Story A deletes dead code (FuelRecord model + seeder). Story B adds a `configuracion_combustible` config table following the PrecalentamientoConfig pattern — entity, service, controller, routes, migration, seed — then threads the rate through the valuation PDF transformer and calculation service.

**Tech Stack:** TypeORM entity, Express controller/routes, Jest tests, SQL migration

---

## Story A: WS-27 — Retire Orphaned Fuel Records Module

### Task 1: Delete FuelRecord model and remove references

**Files:**
- Delete: `backend/src/models/fuel-record.model.ts`
- Modify: `backend/src/config/database.config.ts:47,142`
- Modify: `backend/src/database/seeders/006-logistics-seeder.ts:3,254-314`

**Step 1: Delete the model file**

Delete `backend/src/models/fuel-record.model.ts` entirely.

**Step 2: Remove import and entity from database.config.ts**

In `backend/src/config/database.config.ts`:
- Remove line 47: `import { FuelRecord } from '../models/fuel-record.model';`
- Remove line 142: `FuelRecord,` from the entities array

**Step 3: Remove seeder usage from 006-logistics-seeder.ts**

In `backend/src/database/seeders/006-logistics-seeder.ts`:
- Remove line 3: `import { RegistroCombustible } from '../../models/fuel-record.model';`
- Remove lines 253-305: The entire fuel records seeder block (from `// 2. Fuel Records` through `await fuelRepo.save(fuelRecords);` and its closing brace)
- Update the log line at ~line 312: remove `, ${fuelCount} fuel records` from the console.log
- Remove the `fuelCount` variable and `fuelRepo.count()` call

**Step 4: Run tests to verify nothing breaks**

Run: `cd backend && npm test`
Expected: All 696+ tests pass (no service/controller/route depended on FuelRecord)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor(cleanup): retire orphaned FuelRecord model (ws-27)

WS-23 Vales Combustible fully supersedes this entity.
Removed model, config import, and seeder data.
DB table equipo.equipo_combustible preserved for historical data."
```

---

## Story B: Configurable Manipuleo Rate

### Task 2: Create TypeORM entity

**Files:**
- Create: `backend/src/models/combustible-config.model.ts`

**Step 1: Write the entity**

```typescript
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('configuracion_combustible', { schema: 'equipo' })
export class ConfiguracionCombustible {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'precio_manipuleo',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0.80,
  })
  precioManipuleo!: number;

  @Column({ name: 'activo', type: 'boolean', default: true })
  activo!: boolean;

  @Column({ name: 'updated_by', type: 'integer', nullable: true })
  updatedBy?: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
```

**Step 2: Register entity in database.config.ts**

In `backend/src/config/database.config.ts`:
- Add import: `import { ConfiguracionCombustible } from '../models/combustible-config.model';`
- Add `ConfiguracionCombustible,` to the entities array (where `FuelRecord` was removed in Task 1)

---

### Task 3: Create migration and seed data

**Files:**
- Create: `backend/src/database/migrations/1771965700000-add-configuracion-combustible.ts`

**Step 1: Write the migration**

```typescript
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

    -- Seed default row
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
```

**Step 2: Add table + seed to schema files**

Add to `database/001_init_schema.sql` (in the `equipo` schema section):
```sql
CREATE TABLE equipo.configuracion_combustible (
  id SERIAL PRIMARY KEY,
  precio_manipuleo DECIMAL(10,2) NOT NULL DEFAULT 0.80,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by INTEGER REFERENCES sistema.usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Add to `database/002_seed.sql`:
```sql
INSERT INTO equipo.configuracion_combustible (precio_manipuleo, activo)
VALUES (0.80, TRUE);
```

---

### Task 4: Create service with tests (TDD)

**Files:**
- Create: `backend/src/services/combustible-config.service.ts`
- Create: `backend/src/services/combustible-config.service.spec.ts`

**Step 1: Write the failing tests**

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CombustibleConfigService } from './combustible-config.service';

describe('CombustibleConfigService', () => {
  let service: CombustibleConfigService;

  beforeEach(() => {
    service = new CombustibleConfigService();
  });

  describe('Service Instantiation', () => {
    it('should create an instance', () => {
      expect(service).toBeInstanceOf(CombustibleConfigService);
    });
  });

  describe('Method Existence', () => {
    it('should have obtener method', () => {
      expect(typeof service.obtener).toBe('function');
    });

    it('should have obtenerPrecioManipuleo method', () => {
      expect(typeof service.obtenerPrecioManipuleo).toBe('function');
    });

    it('should have actualizar method', () => {
      expect(typeof service.actualizar).toBe('function');
    });
  });

  describe('Method Signatures', () => {
    it('obtener should require no parameters', () => {
      expect(service.obtener.length).toBe(0);
    });

    it('obtenerPrecioManipuleo should require no parameters', () => {
      expect(service.obtenerPrecioManipuleo.length).toBe(0);
    });

    it('actualizar should accept precio and userId', () => {
      expect(service.actualizar.length).toBe(2);
    });
  });

  describe('DTO transformation (toDto)', () => {
    it('should correctly map entity properties to DTO', () => {
      const mockEntity = {
        id: 1,
        precioManipuleo: 0.80 as unknown as number,
        activo: true,
        updatedBy: 5,
        updatedAt: new Date('2026-01-01T00:00:00Z'),
      };

      const dto = (service as any).toDto(mockEntity);

      expect(dto.id).toBe(1);
      expect(dto.precio_manipuleo).toBe(0.80);
      expect(dto.activo).toBe(true);
      expect(dto.updated_by).toBe(5);
      expect(dto.updated_at).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should handle string decimal values from DB', () => {
      const mockEntity = {
        id: 2,
        precioManipuleo: '0.80' as unknown as number,
        activo: true,
        updatedBy: null,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.precio_manipuleo).toBe(0.80);
    });

    it('should return 0 for null/undefined precioManipuleo', () => {
      const mockEntity = {
        id: 3,
        precioManipuleo: null as unknown as number,
        activo: true,
        updatedBy: null,
        updatedAt: new Date(),
      };

      const dto = (service as any).toDto(mockEntity);
      expect(dto.precio_manipuleo).toBe(0);
    });
  });

  describe('DEFAULT_RATE constant', () => {
    it('should have DEFAULT_MANIPULEO_RATE of 0.80 per PRD Anexo B', () => {
      expect(CombustibleConfigService.DEFAULT_MANIPULEO_RATE).toBe(0.80);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- --testPathPattern=combustible-config.service`
Expected: FAIL — module not found

**Step 3: Write the service**

```typescript
import { AppDataSource } from '../config/database.config';
import { ConfiguracionCombustible } from '../models/combustible-config.model';
import logger from '../utils/logger';

// ─── DTO ──────────────────────────────────────────────────────────────────────

export interface CombustibleConfigDto {
  id: number;
  precio_manipuleo: number;
  activo: boolean;
  updated_by: number | null;
  updated_at: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class CombustibleConfigService {
  static readonly DEFAULT_MANIPULEO_RATE = 0.80;

  private get repository() {
    return AppDataSource.getRepository(ConfiguracionCombustible);
  }

  private toDto(entity: ConfiguracionCombustible): CombustibleConfigDto {
    return {
      id: entity.id,
      precio_manipuleo: parseFloat(entity.precioManipuleo as unknown as string) || 0,
      activo: entity.activo,
      updated_by: entity.updatedBy ?? null,
      updated_at: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  /** Returns the current config (first active row) or null */
  async obtener(): Promise<CombustibleConfigDto | null> {
    const config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });
    if (!config) return null;
    return this.toDto(config);
  }

  /** Returns just the manipuleo rate (fallback to 0.80 if no config) */
  async obtenerPrecioManipuleo(): Promise<number> {
    const config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });
    if (!config) return CombustibleConfigService.DEFAULT_MANIPULEO_RATE;
    return parseFloat(config.precioManipuleo as unknown as string) || CombustibleConfigService.DEFAULT_MANIPULEO_RATE;
  }

  /** Updates the manipuleo rate */
  async actualizar(precio: number, userId: number): Promise<CombustibleConfigDto> {
    let config = await this.repository.findOne({
      where: { activo: true },
      order: { id: 'ASC' },
    });

    if (!config) {
      config = this.repository.create({
        precioManipuleo: precio,
        activo: true,
        updatedBy: userId,
      });
    } else {
      config.precioManipuleo = precio;
      config.updatedBy = userId;
    }

    const saved = await this.repository.save(config);

    logger.info('Configuración de combustible actualizada', {
      precioManipuleo: precio,
      userId,
      context: 'CombustibleConfigService.actualizar',
    });

    return this.toDto(saved);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- --testPathPattern=combustible-config.service`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add backend/src/models/combustible-config.model.ts backend/src/services/combustible-config.service.ts backend/src/services/combustible-config.service.spec.ts
git commit -m "feat(combustible): add ConfiguracionCombustible entity and service with tests"
```

---

### Task 5: Create controller and routes

**Files:**
- Create: `backend/src/api/combustible-config/combustible-config.controller.ts`
- Create: `backend/src/api/combustible-config/combustible-config.routes.ts`
- Modify: `backend/src/index.ts` (register routes)

**Step 1: Write the controller**

Follow the PrecalentamientoConfig controller pattern exactly:

```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express';
import { CombustibleConfigService } from '../../services/combustible-config.service';
import { sendSuccess, sendError } from '../../utils/api-response';

export class CombustibleConfigController {
  private service = new CombustibleConfigService();

  /** GET /api/combustible-config */
  obtener = async (_req: Request, res: Response): Promise<void> => {
    try {
      const config = await this.service.obtener();
      sendSuccess(res, config ?? {
        precio_manipuleo: CombustibleConfigService.DEFAULT_MANIPULEO_RATE,
        activo: true,
      });
    } catch (error: any) {
      sendError(res, 500, 'COMBUSTIBLE_CONFIG_ERROR',
        'Error al obtener configuración de combustible', error.message);
    }
  };

  /** GET /api/combustible-config/precio-manipuleo */
  obtenerPrecio = async (_req: Request, res: Response): Promise<void> => {
    try {
      const precio = await this.service.obtenerPrecioManipuleo();
      sendSuccess(res, { precio_manipuleo: precio });
    } catch (error: any) {
      sendError(res, 500, 'COMBUSTIBLE_CONFIG_ERROR',
        'Error al obtener precio de manipuleo', error.message);
    }
  };

  /** PUT /api/combustible-config */
  actualizar = async (req: Request, res: Response): Promise<void> => {
    try {
      const { precio_manipuleo } = req.body;
      if (precio_manipuleo === undefined || precio_manipuleo === null) {
        sendError(res, 400, 'VALIDATION_ERROR', 'El campo precio_manipuleo es obligatorio');
        return;
      }
      const precio = parseFloat(precio_manipuleo);
      if (isNaN(precio) || precio < 0) {
        sendError(res, 400, 'VALIDATION_ERROR', 'precio_manipuleo debe ser un número >= 0');
        return;
      }
      const userId = req.user!.id_usuario;
      const config = await this.service.actualizar(precio, userId);
      sendSuccess(res, config);
    } catch (error: any) {
      sendError(res, 500, 'COMBUSTIBLE_CONFIG_ERROR',
        error.message || 'Error al actualizar configuración', error.message);
    }
  };
}
```

**Step 2: Write the routes**

```typescript
import { Router } from 'express';
import { CombustibleConfigController } from './combustible-config.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/auth.middleware';
import { ROLES } from '../../types/roles';

const router = Router();
const controller = new CombustibleConfigController();

router.use(authenticate);

// Read — any authenticated user (valuation calculations need this)
router.get('/', controller.obtener);
router.get('/precio-manipuleo', controller.obtenerPrecio);

// Write — ADMIN only
router.put('/', authorize(ROLES.ADMIN, ROLES.ADMIN_SISTEMA), controller.actualizar);

export default router;
```

**Step 3: Register routes in index.ts**

In `backend/src/index.ts`:
- Add import: `import combustibleConfigRoutes from './api/combustible-config/combustible-config.routes';`
- Add route: `app.use('/api/combustible-config', combustibleConfigRoutes);`
  (place near the precalentamiento-config route registration at line ~151)

**Step 4: Verify imports compile**

Run: `cd backend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only pre-existing ones)

**Step 5: Commit**

```bash
git add backend/src/api/combustible-config/ backend/src/index.ts
git commit -m "feat(combustible): add controller and routes for combustible config"
```

---

### Task 6: Thread rate through valuation transformer

**Files:**
- Modify: `backend/src/utils/valuation-pdf-transformer.ts:38-47,141,200-204,252`

**Step 1: Add `precioManipuleo` parameter to `transformToValuationPage1Dto`**

At line 42-47, add a 5th parameter to the function signature:

```typescript
export function transformToValuationPage1Dto(
  valuation: Valorizacion,
  contract: Contract,
  equipment: Equipment,
  financialTotals?: {
    importe_gasto_obra?: number;
    importe_adelanto?: number;
    importe_exceso_combustible?: number;
  },
  precioManipuleo: number = 0.80
): ValuationPage1Dto {
```

At line 141, replace:
```typescript
// OLD:
const precioManipuleoCombustible = 0.8;

// NEW:
const precioManipuleoCombustible = precioManipuleo;
```

**Step 2: Add `precioManipuleo` parameter to `transformToValuationPage2Dto`**

At line 200-204, add a 4th parameter:

```typescript
export function transformToValuationPage2Dto(
  currentValuation: Valorizacion,
  historicalValuations: Valorizacion[],
  equipment: Equipment,
  precioManipuleo: number = 0.80
): ValuationPage2Dto {
```

At line 252, replace:
```typescript
// OLD:
const precioManipuleoCombustible = 0.8;

// NEW:
const precioManipuleoCombustible = precioManipuleo;
```

**Step 3: Commit**

```bash
git add backend/src/utils/valuation-pdf-transformer.ts
git commit -m "refactor(valuation): parameterize manipuleo rate in PDF transformer"
```

---

### Task 7: Thread rate through valuation service

**Files:**
- Modify: `backend/src/services/valuation.service.ts:1-3,1885,2288-2293`

**Step 1: Import CombustibleConfigService**

At the top of `valuation.service.ts`, add:
```typescript
import { CombustibleConfigService } from './combustible-config.service';
```

**Step 2: Add service instance to ValuationService class**

Find the class property declarations area and add:
```typescript
private combustibleConfigService = new CombustibleConfigService();
```

**Step 3: Replace hardcoded rate in `calculateValuation`**

At line 1884-1886, replace:
```typescript
// OLD:
const MANIPULEO_RATE = 0.8;
const importeManipuleo = agg.combustibleConsumido * MANIPULEO_RATE;

// NEW:
const MANIPULEO_RATE = await this.combustibleConfigService.obtenerPrecioManipuleo();
const importeManipuleo = agg.combustibleConsumido * MANIPULEO_RATE;
```

**Step 4: Pass rate to transformer in getValuationPage1Data**

At lines 2288-2293, replace:
```typescript
// OLD:
const result = transformToValuationPage1Dto(
  valuation,
  contract,
  contract.equipo,
  financialTotals
);

// NEW:
const manipuleoRate = await this.combustibleConfigService.obtenerPrecioManipuleo();
const result = transformToValuationPage1Dto(
  valuation,
  contract,
  contract.equipo,
  financialTotals,
  manipuleoRate
);
```

**Step 5: Find and update Page2 call similarly**

Search for `transformToValuationPage2Dto(` call in valuation.service.ts and add `manipuleoRate` parameter.

**Step 6: Run all tests**

Run: `cd backend && npm test`
Expected: All tests pass (the default parameter `= 0.80` ensures backward compatibility)

**Step 7: Commit**

```bash
git add backend/src/services/valuation.service.ts
git commit -m "feat(valuation): use configurable manipuleo rate from combustible config"
```

---

### Task 8: Update schema files and run full verification

**Files:**
- Modify: `database/001_init_schema.sql`
- Modify: `database/002_seed.sql`

**Step 1: Add table to 001_init_schema.sql**

Find the equipo schema section and add:
```sql
-- Configuración de manipuleo de combustible (PRD Anexo B)
CREATE TABLE equipo.configuracion_combustible (
  id SERIAL PRIMARY KEY,
  precio_manipuleo DECIMAL(10,2) NOT NULL DEFAULT 0.80,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by INTEGER REFERENCES sistema.usuarios(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Step 2: Add seed to 002_seed.sql**

```sql
INSERT INTO equipo.configuracion_combustible (precio_manipuleo, activo)
VALUES (0.80, TRUE);
```

**Step 3: Run full test suite**

Run: `cd backend && npm test`
Expected: All tests pass

**Step 4: Rebuild and verify docker**

Run: `docker-compose up -d --build`
Check: `docker-compose logs -f backend` — no errors
Check: `docker-compose logs -f frontend` — no errors

**Step 5: Verify API endpoint works**

Run:
```bash
# Login
TOKEN=$(curl -s http://localhost:3400/api/auth/login -H 'Content-Type: application/json' -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# Get config
curl -s http://localhost:3400/api/combustible-config -H "Authorization: Bearer $TOKEN" | jq .

# Get just the rate
curl -s http://localhost:3400/api/combustible-config/precio-manipuleo -H "Authorization: Bearer $TOKEN" | jq .
```
Expected: `{ "success": true, "data": { "precio_manipuleo": 0.80, ... } }`

**Step 6: Final commit**

```bash
git add database/ backend/src/config/database.config.ts
git commit -m "chore(schema): add configuracion_combustible table and seed data"
```

---

## Verification Checklist

- [ ] FuelRecord model deleted, no import errors
- [ ] All 696+ backend tests pass
- [ ] `GET /api/combustible-config` returns config with 0.80 default
- [ ] `GET /api/combustible-config/precio-manipuleo` returns `{ precio_manipuleo: 0.80 }`
- [ ] `PUT /api/combustible-config` updates rate (ADMIN only)
- [ ] Valuation calculation uses DB rate (not hardcoded)
- [ ] Valuation PDF generation uses DB rate (not hardcoded)
- [ ] Docker logs clean (backend + frontend)
- [ ] `001_init_schema.sql` and `002_seed.sql` updated
