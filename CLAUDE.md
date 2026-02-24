# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Environment & Ports

- **Frontend**: http://localhost:3420 (Angular 19)
- **Backend API**: http://localhost:3400 (Node.js + Express + TypeScript)
- **Swagger UI**: http://localhost:3400/api-docs
- **PostgreSQL**: port 3440 (internal)
- **Redis**: port 3460 (internal)
- **Default credentials**: `admin` / `admin123`

---

## Common Commands

### Start / Stop

```bash
# Start all services (with rebuild)
docker-compose up -d --build

# Start without rebuilding
docker-compose up -d

# Stop all
docker-compose down

# Root-level shorthand
npm run dev:build       # docker-compose.dev.yml up --build
npm run dev             # docker-compose.dev.yml up
npm run dev:down        # docker-compose.dev.yml down
npm run dev:clean       # down -v (removes volumes)
```

### Logs (always check these before concluding)

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
npm run logs:backend    # shorthand
npm run logs:frontend   # shorthand
```

### Testing

```bash
npm run test:all        # backend + frontend + e2e
npm run test:backend    # cd backend && jest
npm run test:frontend   # (currently no-op — no unit tests implemented)

# Backend only
cd backend && npm run test
cd backend && npm run test:watch
cd backend && npm run test:coverage
```

### Linting

```bash
npm run lint            # both backend and frontend
npm run lint:backend    # cd backend && eslint src/**/*.ts
npm run lint:frontend   # eslint src/**/*.ts *.html
```

### Database migrations

```bash
npm run db:migrate          # run TypeORM migrations
npm run db:migrate:create   # create new migration
npm run db:migrate:revert   # revert last migration
npm run db:seed             # run seeders
```

### Git commits

Use conventional commits. Commit author: `Mohammad Asjad <asjad.august@gmail.com>`.

```bash
# Set local git config (do once per worktree):
git config user.name "Mohammad Asjad"
git config user.email "asjad.august@gmail.com"
```

Commit format: `type(scope): subject`
Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `perf`, `chore`

---

## Architecture Overview

### Tech Stack

| Layer    | Technology                           |
| -------- | ------------------------------------ |
| Frontend | Angular 19, standalone components    |
| Backend  | Node.js 20 + Express + TypeScript    |
| Database | PostgreSQL 16 (multi-tenant)         |
| Cache    | Redis 7                              |
| ORM      | TypeORM (manual SQL migrations only) |

---

### Multi-Tenancy (Separate Database per Company)

Each company tenant has its **own PostgreSQL database** (`bitcorp_empresa_{code}`). A central `bitcorp_sistema` database stores the company registry and platform admins.

- Every authenticated request carries `id_empresa` in the JWT payload
- `TenantContextMiddleware` resolves the JWT → looks up `sistema.empresas` → sets `req.tenantContext.dataSource`
- All services **must** be `@Injectable({ scope: Scope.REQUEST })` and pull the DataSource from `req.tenantContext.dataSource`
- Never use a global/singleton DataSource for business queries

See `.opencode/MULTITENANCY.md` for full architecture.

---

### Backend Code Layers

```
backend/src/
├── api/           # Route handlers (controllers)
├── services/      # Business logic (request-scoped)
├── repositories/  # Data access helpers
├── models/        # TypeORM entities
├── types/dto/     # DTO interfaces (snake_case, output contracts)
├── utils/
│   ├── dto-transformer.ts   # Entity → DTO transformation functions
│   └── response-helper.ts   # sendSuccess / sendError / sendCreated helpers
├── middleware/    # Auth, tenant context, etc.
├── config/        # Database config
└── index.ts
```

**Controller responsibilities**: parse input, check permissions, call service, apply DTO, return standardized response.
**Service responsibilities**: business logic, database queries via `req.tenantContext.dataSource`, throw typed error objects.

---

### API Response Contract (mandatory)

All responses must use one of:

```typescript
// List
{ success: true, data: T[], pagination: { page, limit, total, total_pages } }

// Single
{ success: true, data: T }

// Created
{ success: true, data: { id: number, message?: string } }

// Error
{ success: false, error: { code: string, message: string, details?: any } }
```

Use `sendSuccess`, `sendPaginatedSuccess`, `sendError`, `sendCreated` from `backend/src/utils/response-helper.ts`.
**Never return raw TypeORM entities.** Always transform to DTOs in `backend/src/types/dto/`.

---

### Field Naming Convention

| Context                  | Format              | Example          |
| ------------------------ | ------------------- | ---------------- |
| Database columns         | Spanish, snake_case | `fecha_inicio`   |
| TypeORM entity props     | Spanish, camelCase  | `fechaInicio`    |
| API responses (DTOs)     | Spanish, snake_case | `fecha_inicio`   |
| Frontend TypeScript      | Spanish, snake_case | `fecha_inicio`   |
| Query builder conditions | camelCase (entity)  | `e.fechaInicio`  |
| Raw SQL                  | snake_case (DB col) | `e.fecha_inicio` |

Never mix camelCase and snake_case in API responses.
See `docs/SCHEMA_CONVENTIONS.md` for column name mappings.

---

### Database Schema Organization

```
bitcorp_dev (or bitcorp_empresa_*)
├── sistema      — users, roles, audit
├── proyectos    — projects (EDT)
├── equipo       — equipment, daily reports, maintenance, valuations
├── rrhh         — workers / operators
├── logistica    — inventory, movements
├── proveedores  — suppliers
├── administracion — cost centers, accounts payable
├── sst          — safety incidents, inspections
└── public       — attachments, notifications, tenders
```

- `database/001_init_schema.sql` — single source of truth for schema
- `database/002_seed.sql` — seed data (kept in sync with 001)
- **Never** use `synchronize: true` in TypeORM config; all schema changes go in SQL files
- Any schema change in `001_init_schema.sql` **requires** a corresponding update to `002_seed.sql`

---

### Frontend Architecture

```
frontend/src/app/
├── core/
│   ├── design-system/   # Aero Design System wrappers
│   ├── guards/          # Route guards
│   ├── interceptors/    # HTTP interceptors (auth, error)
│   ├── services/        # Singleton services (auth, etc.)
│   └── models/          # TypeScript interfaces
├── shared/
│   └── components/      # Reusable components (PageCard, AeroCard, FilterBar, etc.)
└── features/            # Feature modules (equipment, operators, projects, …)
```

**Key shared components**:

- `app-page-card` — standard card container with `title`, `subtitle`, `[header-actions]`, `[footer]` slots; use `[noPadding]="true"` for tables
- `aero-card`, `aero-table`, `filter-bar`, `stats-grid`, `actions-container`, `export-dropdown`

**Angular patterns**:

- Standalone components (no NgModule)
- Services **unwrap** API responses: `map(res => res.data)` — components never handle `{ success, pagination }` wrapper
- Signals and OnPush change detection where feasible
- Lazy-loaded feature routes

---

### Design System: Aero (KLM-based)

The UI is modeled on the **AFR-KLM Aero Design System**. Key CSS variables: `--primary-900`, `--grey-200`, `--grey-700`, `--radius-md`, `--s-{8,16,24}`. Use design system component classes consistently — do not invent ad-hoc styles that diverge from the Aero aesthetic.

---

### Role Hierarchy

5-tier: `ADMIN_SISTEMA` → `ADMIN` → `DIRECTOR` → `JEFE_EQUIPO` → `OPERADOR`
Plus special-purpose roles: `HR`, `CONTABILIDAD`, `ALMACEN`.

JWT payload includes `id_empresa`, `rol`, `id_usuario`. Role guards are enforced in controllers.
See `.opencode/USER-MANAGEMENT.md` for the full permission matrix.

---

## Development Checklist

Before marking any feature done:

1. Update `001_init_schema.sql` (if schema changed) and `002_seed.sql`
2. Implement backend changes (controller → service → DTO)
3. Implement frontend changes
4. Navigate to the feature in the browser manually
5. Check `docker-compose logs -f backend` — no errors
6. Check `docker-compose logs -f frontend` — no errors
7. Check browser console — no errors
8. Commit with conventional commit format using the local git config

---

## Forbidden Practices

- Returning raw TypeORM entities from controllers
- Mixing camelCase and snake_case in API responses
- Skipping DTOs
- Using `synchronize: true` in TypeORM
- Adding schema changes without updating seed data
- Using singleton services for multi-tenant queries
- String-concatenating SQL (always use parameterized queries `$1, $2, …`)
- Dual field names in API responses (pick one canonical name)
- Pushing to remote without explicit user instruction

## Code Exploration with dora

This codebase uses dora for fast code intelligence and architectural analysis.

### IMPORTANT: Use dora for code exploration

**ALWAYS use dora commands for code exploration instead of Grep/Glob/Find.**

### All Commands

**Overview:**

- `dora status` - Check index health, file/symbol counts, last indexed time
- `dora map` - Show packages, file count, symbol count

**Files & Symbols:**

- `dora ls [directory] [--limit N] [--sort field]` - List files in directory with metadata (symbols, deps, rdeps). Default limit: 100
- `dora file <path>` - Show file's symbols, dependencies, and dependents
- `dora symbol <query> [--kind type] [--limit N]` - Find symbols by name across codebase. Default limit: 20
- `dora refs <symbol> [--kind type] [--limit N]` - Find all references to a symbol
- `dora exports <path>` - List exported symbols from a file
- `dora imports <path>` - Show what a file imports

**Dependencies:**

- `dora deps <path> [--depth N]` - Show file dependencies (what this imports). Default depth: 1
- `dora rdeps <path> [--depth N]` - Show reverse dependencies (what imports this). Default depth: 1
- `dora adventure <from> <to>` - Find shortest dependency path between two files

**Code Health:**

- `dora leaves [--max-dependents N]` - Find files with few/no dependents. Default: 0
- `dora lost [--limit N]` - Find unused exported symbols. Default limit: 50
- `dora treasure [--limit N]` - Find most referenced files and files with most dependencies. Default: 10

**Architecture Analysis:**

- `dora cycles [--limit N]` - Detect circular dependencies. Empty = good. Default: 50
- `dora coupling [--threshold N]` - Find bidirectionally dependent file pairs. Default threshold: 5
- `dora complexity [--sort metric]` - Show file complexity metrics (sort by: complexity, symbols, stability). Default: complexity

**Change Impact:**

- `dora changes <ref>` - Show files changed since git ref and their impact
- `dora graph <path> [--depth N] [--direction type]` - Generate dependency graph. Direction: deps, rdeps, both. Default: both, depth 1

**Documentation:**

- `dora docs [--type TYPE]` - List all documentation files. Use --type to filter by md or txt
- `dora docs search <query> [--limit N]` - Search through documentation content. Default limit: 20
- `dora docs show <path> [--content]` - Show document metadata and references. Use --content to include full text

**Note:** To find where a symbol/file is documented, use `dora symbol` or `dora file` which show a `documented_in` field.

**Database:**

- `dora schema` - Show database schema (tables, columns, indexes)
- `dora cookbook show [recipe]` - Query patterns with real examples (quickstart, methods, references, exports)
- `dora query "<sql>"` - Execute read-only SQL query against the database

### When to Use Other Tools

- **Read**: For reading file source code
- **Grep**: Only for non-code files or when dora fails
- **Edit/Write**: For making changes
- **Bash**: For running commands/tests

### Quick Workflow

```bash
dora status                      # Check index health
dora treasure                    # Find core files
dora file <path>                 # Understand a file
dora deps/rdeps <path>           # Navigate dependencies
dora symbol <query>              # Find symbols (shows documented_in)
dora refs <symbol>               # Find references
dora docs                        # List all documentation
dora docs search <query>         # Search documentation content
```

For detailed usage and examples, refer to `./dora/docs/SKILL.md`.
