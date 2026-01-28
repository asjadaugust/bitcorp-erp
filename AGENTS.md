# Bitcorp ERP - Agent Development Guide

This document provides guidelines for agentic AI coding assistants (Claude, Cursor, Copilot, etc.) working on this repository.

## Project Overview

**Bitcorp ERP** - Modern civil engineering equipment management system

- **Backend**: Node.js + TypeScript + Express + TypeORM + PostgreSQL
- **Frontend**: Angular 19 + TypeScript + Angular Material
- **Database**: PostgreSQL 16 with Spanish naming conventions
- **Architecture**: Multi-tenant REST API with frontend-backend separation

---

## Quick Reference Commands

### Development

```bash
# Start all services
make run-docker          # or: docker-compose up -d

# Start individual services
make dev-backend         # Backend on port 3400
make dev-frontend        # Frontend on port 3420

# Stop services
make stop               # or: docker-compose down

# View logs
make logs               # All services
make logs:backend        # Backend only
make logs:frontend       # Frontend only
```

### Building

```bash
# Build everything
make build              # or: npm run build

# Build backend only
cd backend && npm run build    # or: tsc

# Build frontend only
cd frontend && npm run build    # or: ng build
```

### Testing

```bash
# Run all tests
npm run test:all       # Backend + Frontend + E2E

# Run single test
npm run test            # Backend unit tests

# Run specific test file
cd backend && npm test -- -t "test name pattern"

# Run tests in watch mode
cd backend && npm run test:watch

# Generate coverage report
cd backend && npm run test:coverage
```

### Linting

```bash
# Lint all code
npm run lint            # Backend + Frontend

# Lint and auto-fix
npm run lint:fix        # Auto-fixes lint errors

# Lint backend only
cd backend && npm run lint

# Lint frontend only
cd frontend && npm run lint
```

---

## Code Style Guidelines

### 1. Imports & Dependencies

**Use ES modules with explicit extensions:**

```typescript
// ✅ CORRECT
import { EquipmentService } from '../../services/equipment.service';
import { Equipment } from '../../models/equipment.model';

// ❌ AVOID
import * as http from 'http'; // Prefer named imports
const { default: http } = require('http'); // Don't use require()
```

**Import ordering (group and sort within groups):**

```typescript
// 1. Core modules (Node.js, Express)
import { Request, Response } from 'express';
import { DataSource } from 'typeorm';

// 2. Third-party libraries
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';

// 3. Internal modules (services, models, types)
import { EquipmentService } from '../../services/equipment.service';
import { Equipment } from '../../models/equipment.model';
import { sendSuccess, sendError } from '../../utils/response-helpers';
```

### 2. TypeScript Types

**Avoid `any` type - use specific types:**

```typescript
// ✅ CORRECT
interface CreateUserDto {
  nombre: string;
  correo_electronico?: string;
  fecha_contratacion: Date;
}

async function createUser(dto: CreateUserDto): Promise<User> {
  // ...
}

// ❌ AVOID
async function createUser(dto: any): Promise<any> {
  // ...
}

// ❌ AVOID - Don't cast unless necessary
const equipment = data as Equipment; // Use type guards instead
```

**Use type guards for runtime type checking:**

```typescript
function isEquipment(data: unknown): data is Equipment {
  return data && typeof data === 'object' && 'id' in data && 'codigoEquipo' in data;
}

// ✅ Type guard usage
if (isEquipment(data)) {
  const equipo = data as Equipment; // Safe cast
  console.log(equipo.codigoEquipo);
}
```

### 3. Naming Conventions

**Database Layer (Spanish snake_case):**

```sql
-- Table names (plural, Spanish)
CREATE TABLE equipo.equipo (...);           -- Equipment
CREATE TABLE rrhh.trabajador (...);          -- Workers
CREATE TABLE logistica.movimiento (...);      -- Movements
CREATE TABLE proyectos.edt (...);              -- EDT (Work Breakdown Structure)

-- Column names (Spanish, snake_case)
codigo_equipo, marca, modelo, anio_fabricacion,  -- Equipment
razon_social, ruc, correo_electronico,              -- Provider
trabajador_id, fecha_inicio, fecha_fin,                   -- General
fecha_nacimiento, apellido_paterno, apellido_materno       -- Workers
```

**TypeScript Models (Spanish-based camelCase):**

```typescript
// ✅ CORRECT - Map snake_case DB column to camelCase property
@Column({ name: 'codigo_equipo' })
codigoEquipo!: string;

@Column({ name: 'fecha_inicio' })
fechaInicio!: Date;

@Column({ name: 'apellido_paterno' })
apellidoPaterno!: string;

// ❌ AVOID - Don't use English names
@Column({ name: 'code' })
code!: string;  // Should be codigoEquipo
```

**API Responses (Spanish snake_case):**

```json
// ✅ CORRECT - Frontend receives Spanish snake_case
{
  "success": true,
  "data": {
    "id": 1,
    "codigo_equipo": "EXC-001",
    "marca": "Caterpillar",
    "fecha_inicio": "2024-01-01"
  }
}

// ❌ AVOID - Don't mix camelCase
{
  "data": {
    "codigoEquipo": "EXC-001"  // Frontend expects codigo_equipo
  }
}
```

**Services & Functions (camelCase, verb-first for actions):**

```typescript
// ✅ CORRECT
async findEquipmentById(id: number): Promise<Equipment> { }
async createEquipment(data: CreateDto): Promise<Equipment> { }
async updateEquipment(id: number, data: UpdateDto): Promise<Equipment> { }
async deleteEquipment(id: number): Promise<void> { }
async validateUserPermission(userId: number, action: string): Promise<boolean> { }

// ❌ AVOID
async equipmentById(id: number) { }
async equipment(data: CreateDto) { }
```

### 4. Error Handling

**Always use try-catch for async operations:**

```typescript
// ✅ CORRECT
async function createUser(req: Request, res: Response) {
  try {
    const user = await userService.create(req.body);
    sendSuccess(res, user, 'Usuario creado exitosamente');
  } catch (error) {
    sendError(res, 500, 'USER_CREATE_FAILED', 'Error al crear usuario', error);
  }
}

// ❌ AVOID - Uncaught async errors
async function createUser(req: Request, res: Response) {
  const user = await userService.create(req.body); // May throw!
  sendSuccess(res, user);
}
```

**Use specific error codes (documented in ARCHITECTURE.md):**

```typescript
// ✅ CORRECT - Use stable error codes
sendError(res, 404, 'EQUIPMENT_NOT_FOUND', 'Equipo no encontrado', error);
sendError(res, 400, 'INVALID_INPUT', 'Datos inválidos', error);
sendError(res, 409, 'CONFLICT', 'El código ya existe', error);

// ❌ AVOID - Generic error codes
res.status(500).json({ error: 'Something went wrong' });
```

**Validation before database operations:**

```typescript
async function createEquipment(data: CreateDto) {
  // Validate input
  if (!data.codigoEquipo || !data.tipoEquipoId) {
    throw new Error('Código y tipo son requeridos');
  }

  // Check duplicate
  const exists = await this.repo.findOne({ where: { codigoEquipo: data.codigoEquipo } });
  if (exists) {
    throw new Error('Código ya existe');
  }

  return await this.repo.save(data);
}
```

### 5. API Controller Patterns

**Standard response format (MANDATORY):**

```typescript
// Success response
{
  success: true,
  data: any | any[],
  message?: string,
  meta?: {
    page?: number,
    limit?: number,
    total?: number,
    totalPages?: number
  }
}

// Error response
{
  success: false,
  error: {
    code: string,        // Stable error code
    message: string,     // User-facing message (Spanish)
    details?: any       // Technical details for debugging
  }
}

// NEVER return raw entities
return res.status(200).json(entity);  // ❌ FORBIDDEN
```

**Use helper functions for responses:**

```typescript
import { sendSuccess, sendError, sendPaginatedSuccess } from '../utils/response-helpers';

// ✅ CORRECT
sendSuccess(res, equipment, 'Equipo creado');
sendPaginatedSuccess(res, equipmentList, { page, limit, total });
sendError(res, 404, 'NOT_FOUND', 'Recurso no encontrado');
```

**DTO transformation is REQUIRED:**

```typescript
// ✅ CORRECT - Transform entity to DTO before returning
const equipment = await this.repo.findOne({ where: { id } });
const dto = toEquipmentDetailDto(equipment); // From backend/src/types/dto/*.dto.ts
sendSuccess(res, dto);

// ❌ AVOID - Never return raw entities
return res.status(200).json(equipment); // FORBIDDEN by ARCHITECTURE.md
```

### 6. Database Access Patterns

**Use TypeORM QueryBuilder (not raw SQL):**

```typescript
// ✅ CORRECT - Use TypeScript property names
const equipment = await this.repo
  .createQueryBuilder('e')
  .where('e.codigoEquipo = :code', { code })
  .andWhere('e.tipoEquipoId = :typeId', { typeId })
  .andWhere('e.isActive = true')
  .getOne();

// ❌ AVOID - Don't use database column names
const equipment = await this.repo
  .createQueryBuilder('e')
  .where('e.codigo_equipo = :code', { code }) // Will fail!
  .getOne();
```

**For raw SQL (use when necessary), use database column names:**

```typescript
// ✅ CORRECT - Use Spanish snake_case column names
const result = await pool.query(`
  SELECT e.codigo_equipo, e.marca, e.modelo
  FROM equipo.equipo e
  WHERE e.is_active = true
`);

// ❌ AVOID - Don't use TypeScript property names
const result = await pool.query(`
  SELECT e.codigoEquipo, e.marca  -- Column doesn't exist!
  FROM equipo.equipo e
`);
```

### 7. Frontend Service Patterns

**Always unwrap API responses in services:**

```typescript
// ✅ CORRECT - Components receive unwrapped data
this.equipmentService.getEquipmentList().subscribe({
  next: (data) => {
    this.equipmentList = data; // Already unwrapped by service
  },
  error: (err) => {
    this.errorMessage = err.error?.message;
  },
});

// ❌ AVOID - Don't make components handle response wrapping
this.http.get('/api/equipment').subscribe({
  next: (res) => {
    if (res.success) {
      this.equipmentList = res.data; // Component shouldn't know about success wrapper
    }
  },
});
```

**Angular component best practices:**

```typescript
// ✅ CORRECT - Use OnPush for performance
@Component({
  selector: 'app-equipment-list',
  templateUrl: './equipment-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ CORRECT - Track loading/error states
loading = false;
error: string | null = null;
equipmentList: Equipment[] = [];

loadEquipment() {
  this.loading = true;
  this.error = null;
  this.equipmentService.getList().subscribe({
    next: (data) => {
      this.equipmentList = data;
      this.loading = false;
    },
    error: (err) => {
      this.error = 'Error al cargar equipos';
      this.loading = false;
    }
  });
}
```

### 8. File & Directory Structure

**Backend organization:**

```
backend/src/
├── api/              # Route definitions (controllers live here)
├── services/          # Business logic layer
├── models/            # TypeORM entity definitions
├── types/dto/         # Data transfer objects & transformations
├── utils/             # Shared utilities
├── middleware/        # Express middleware
└── config/           # Configuration (database, env, etc.)
```

**Frontend organization:**

```
frontend/src/app/
├── core/              # Singleton services, guards, interceptors
├── shared/            # Shared components, pipes, directives
├── features/           # Feature modules (equipment, operators, etc.)
├── layouts/           # Layout components
└── models/            # TypeScript interfaces/types
```

---

## Running a Single Test

### Backend Tests

```bash
# Run specific test file
cd backend && npm test -- -t "EquipmentService"
cd backend && npm test -- -t "POST /api/equipment"
cd backend && npm test -- -t "should create equipment"

# Run test with verbose output
cd backend && npm test -- --verbose

# Run tests matching pattern
cd backend && npm test -- -t ".*Provider.*"

# Run tests and generate coverage
cd backend && npm test -- --coverage
```

### Frontend Tests

```bash
# Run unit tests (if any)
cd frontend && npm test

# Run E2E tests
npm run test:e2e

# Run specific E2E test
cd tests && npx playwright test -g "equipment-crud"
cd tests && npx playwright test -g "daily-reports"
```

---

## Key Rules from ARCHITECTURE.md

1. **API responses MUST use Spanish snake_case**
   - `{ "codigo_equipo": "EXC-001" }` ✅
   - `{ "codigoEquipo": "EXC-001" }` ❌

2. **Controllers MUST return DTOs, never raw entities**
   - Use `toXxxDto()` transformation functions
   - DTOs defined in `backend/src/types/dto/`

3. **Query builders use TypeScript property names**
   - `.where('e.codigoEquipo = :code')` ✅
   - `.where('e.codigo_equipo = :code')` ❌

4. **Raw SQL uses database column names (Spanish snake_case)**
   - `SELECT e.codigo_equipo, e.marca FROM ...` ✅
   - `SELECT e.codigoEquipo FROM ...` ❌

5. **Standard error response format is mandatory**
   - `{ success: false, error: { code, message, details? } }`

---

## Before Making Changes

1. **Check existing code patterns** - Look at similar files first
2. **Follow naming conventions** - Use Spanish for business terms
3. **Add tests** - Every new endpoint needs tests
4. **Update documentation** - Keep docs in sync with code
5. **Run tests** - Verify changes don't break anything

---

## Common Anti-Patterns to Avoid

### ❌ DON'T Return Raw Entities

```typescript
// ❌ FORBIDDEN
async getAll(req: Request, res: Response) {
  const equipment = await this.repo.find();
  return res.status(200).json(equipment);  // BREAKS FRONTEND!
}

// ✅ REQUIRED
async getAll(req: Request, res: Response) {
  const equipment = await this.repo.find();
  const dtos = toEquipmentListDtoArray(equipment);  // Transform to DTO
  sendSuccess(res, dtos);
}
```

### ❌ DON'T Mix Conventions

```typescript
// ❌ AVOID - Inconsistent
{
  "codigo_equipo": "EXC-001",  // Spanish snake_case
  "tipoEquipoId": 5             // camelCase
  "is_active": true                // snake_case
}

// ✅ REQUIRED - Consistent
{
  "codigo_equipo": "EXC-001",
  "tipo_equipo_id": 5,           // snake_case
  "is_active": true                // snake_case
}
```

### ❌ DON'T Skip Error Handling

```typescript
// ❌ AVOID
async function deleteEquipment(id: number) {
  await this.repo.delete(id); // May throw!
}

// ✅ REQUIRED
async function deleteEquipment(id: number) {
  try {
    const equipment = await this.repo.findOne({ where: { id } });
    if (!equipment) throw new Error('Not found');
    equipment.isActive = false;
    await this.repo.save(equipment);
  } catch (error) {
    throw error; // Re-throw for controller to handle
  }
}
```

---

## Quick Diagnostics

### Frontend not compiling?

```bash
# Check Angular version
cd frontend && ng version

# Check for workspace issues
# Remove "workspaces": ["frontend", "backend"] from root package.json

# Clean .angular cache
cd frontend && rm -rf .angular cache
```

### Backend not starting?

```bash
# Check if port is in use
lsof -i :3400

# Check Node version
node --version  # Should be v20.17+

# Check TypeScript compilation
cd backend && npm run type-check
```

### Database issues?

```bash
# Check connection
make db-status

# Reset database
make db-fresh

# Check migration status
make db-migrate:show
```

---

## Module-Specific Guidelines

### Equipment Module

- Frontend models use Spanish field names: `codigo_equipo`, `marca`, `modelo`
- Equipment types: `'DISPONIBLE' | 'EN_USO' | 'MANTENIMIENTO' | 'INACTIVO'`

### Operators Module

- Worker types: `'ACTIVO' | 'INACTIVO'`
- Skill matching uses operator skill tables

### Daily Reports Module

- Report status: `'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'`
- Date format: YYYY-MM-DD strings in API

### Logistics Module

- Movement status: `'BORRADOR' | 'PENDIENTE' | 'APROBADO' | 'RECHAZADO'`
- Product fields: `codigo`, `nombre`, `unidad_medida`, `precio_unitario`

---

## When in Doubt

1. **Check ARCHITECTURE.md** - Authoritative architectural rules
2. **Check SCHEMA_CONVENTIONS.md** - Database naming conventions
3. **Check existing controllers** - Follow established patterns
4. **Check existing tests** - Use same testing approach
5. **Ask before breaking convention** - Document the decision

---

**This guide is a living document. Update it when patterns change.**
