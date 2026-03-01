# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Environment & Ports

- **Frontend**: http://localhost:3420 (Angular 19)
- **Backend API**: http://localhost:3410 (Python + FastAPI)
- **Swagger UI**: http://localhost:3410/docs
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
npm run test:backend    # cd backend && python -m pytest tests/ -q
npm run test:frontend   # (currently no-op — no unit tests implemented)
```

### Linting

```bash
npm run lint            # both backend and frontend
npm run lint:backend    # cd backend && ruff check app/ tests/
npm run lint:frontend   # eslint src/**/*.ts *.html
```

### Database migrations

```bash
npm run db:migrate          # run Alembic migrations
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

| Layer    | Technology                        |
| -------- | --------------------------------- |
| Frontend | Angular 19, standalone components |
| Backend  | Python 3.12 + FastAPI             |
| Database | PostgreSQL 16 (multi-tenant)      |
| Cache    | Redis 7                           |
| ORM      | SQLAlchemy 2.0 Async              |

---

### Multi-Tenancy (Separate Database per Company)

Each company tenant has its **own PostgreSQL database** (`bitcorp_empresa_{code}`). A central `bitcorp_sistema` database stores the company registry and platform admins.

- Every authenticated request carries `id_empresa` in the JWT payload
- Tenant middleware resolves the JWT → looks up `sistema.empresas` → sets tenant context
- All services receive tenant-scoped async database sessions
- Never use a global/singleton session for business queries

See `.opencode/MULTITENANCY.md` for full architecture.

---

### Backend Code Layers

```
backend/app/
├── api/           # FastAPI route handlers (routers)
├── services/      # Business logic
├── models/        # SQLAlchemy models
├── schemas/       # Pydantic schemas (request/response)
├── core/          # Config, security, database
├── middleware/     # Auth, tenant context, etc.
└── main.py
```

**Router responsibilities**: parse input, check permissions, call service, return Pydantic schema.
**Service responsibilities**: business logic, database queries via async SQLAlchemy sessions.

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

Use standardized response helpers in the backend.
**Never return raw SQLAlchemy models.** Always transform to Pydantic schemas.

---

### Field Naming Convention

| Context                  | Format              | Example          |
| ------------------------ | ------------------- | ---------------- |
| Database columns         | Spanish, snake_case | `fecha_inicio`   |
| SQLAlchemy model props   | Spanish, snake_case | `fecha_inicio`   |
| API responses (Pydantic) | Spanish, snake_case | `fecha_inicio`   |
| Frontend TypeScript      | Spanish, snake_case | `fecha_inicio`   |
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
- **Never** use auto-migration; all schema changes go in SQL files
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

- Returning raw SQLAlchemy models from routers
- Mixing camelCase and snake_case in API responses
- Skipping Pydantic schemas
- Using auto-migration in SQLAlchemy
- Adding schema changes without updating seed data
- Using singleton sessions for multi-tenant queries
- String-concatenating SQL (always use parameterized queries `$1, $2, …`)
- Dual field names in API responses (pick one canonical name)
- Pushing to remote without explicit user instruction

## Tech Debt Workflow

When working on implementation tasks, if you encounter **unrelated issues** (bugs, missing validations, inconsistencies, UI glitches) that are NOT part of the current task, log them to `tech_debts.json` instead of fixing them inline. This prevents scope creep and wasted tokens.

Format:

```json
{
  "features": [
    {
      "category": "functional|ui|performance|security|testing",
      "description": "Short description of the issue",
      "steps": ["Step 1", "Step 2"],
      "passes": false
    }
  ]
}
```

These will be addressed in a separate session with a different model.

---

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

### UI Generation & Consistency Rules

Whenever you are asked to generate, modify, or review Frontend UI code (Angular), you MUST strictly adhere to the following rules. Failure to do so will break the application's design system.

**1. Context Gathering (MANDATORY FIRST STEP)**

Before writing any HTML or SCSS for a new module or component, you must first read and analyze a "Gold Standard" reference module to ensure your layout matches.

- If building a List/Data page: Read `frontend/src/app/features/equipment/equipment-list.component.ts`
- If building a Detail page: Read `frontend/src/app/features/contracts/contract-detail.component.ts`
- If building a Form: Read `frontend/src/app/features/contracts/contract-form.component.ts`

**2. Layout Wrappers**

NEVER build a raw `<div>` layout for a page. You must use the established layout shells:

- **Standard Pages**: `<app-page-layout>` + `<app-page-card>` for content area
- **Detail/Entity Pages**: `<app-entity-detail-shell>`
- **Forms**: `<app-form-container>` + `<app-form-section>`

Note: Layout shells (`app-page-layout`, `app-page-card`, `app-entity-detail-shell`, `app-form-container`, `app-form-section`, `app-filter-bar`, `app-stats-grid`, `app-actions-container`) are NOT part of the AERO design system — they are structural wrappers. Keep using them as-is.

**3. AERO Design System Components**

Do NOT use raw HTML elements for interactive UI. Import from `@app/core/design-system`:

```typescript
import {
  AeroButtonComponent,
  AeroInputComponent,
  AeroDropdownComponent,
  AeroBadgeComponent,
} from '@app/core/design-system';
```

| Raw HTML               | Deprecated Component   | AERO Replacement                    |
| ---------------------- | ---------------------- | ----------------------------------- |
| `<button>`             | `<app-button>`         | `<aero-button>`                     |
| `<input>`              | —                      | `<aero-input>`                      |
| `<select>`             | `<app-dropdown>`       | `<aero-dropdown>`                   |
| `<div class="card">`   | —                      | `<aero-card>` or `<app-page-card>`  |
| `<span class="badge">` | —                      | `<aero-badge>`                      |
| `<div class="alert">`  | `<app-alert>`          | `<aero-notification>`               |
| `<nav>` in features    | —                      | `<aero-tabs>` or `<app-module-nav>` |
| `window.confirm()`     | `<app-confirm-dialog>` | `<aero-modal>`                      |

**Button variants**: `primary` / `secondary` / `tertiary` / `text` (NOT danger/success/ghost)
**Button sizes**: `small` / `regular` / `large` (NOT sm/md/lg)

**4. Navigation & Headers**

No local nav bars. All top-level navigation is handled by `<app-main-nav>`. For secondary navigation, use `<aero-tabs>` or `<app-module-nav>`.

**5. Styling & Colors**

- **No hardcoded colors**: Use CSS variables from `frontend/src/styles/tokens.css`
- **Spacing**: Use design tokens `var(--s-4)`, `var(--s-8)`, `var(--s-16)`, `var(--s-24)`, `var(--s-32)`
- **Colors**: `var(--primary-500)` for interactive, `var(--primary-900)` for text, `var(--semantic-red-500)` for errors

**6. Verification Step**

Before finalizing your code, ask yourself: Did I use `aero-*` components? Is this page wrapped in a layout shell? Did I accidentally create a new navigation bar?

### Gold Standard References

When building a new page, read the matching reference file FIRST:

| Page Type             | Reference File                                                       | Key Components                                                                                           |
| --------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| List                  | `features/equipment/equipment-list.component.ts`                     | `<app-page-layout>`, `<app-page-card>`, `<aero-table>`, `<app-filter-bar>`, `<aero-button>`              |
| Detail                | `features/contracts/contract-detail.component.ts`                    | `<app-entity-detail-shell>`, `@use 'detail-layout'`, `<app-entity-detail-sidebar-card>`, `<aero-button>` |
| Form                  | `features/contracts/contract-form.component.ts`                      | `<app-form-container>`, `<app-form-section>`, `@use 'form-layout'`, `<aero-dropdown>`                    |
| Notification (Inline) | `shared/components/validation-errors/validation-errors.component.ts` | AERO Inline Error: `--aero-notify-*` tokens, BEM `.notification__*` classes                              |
| Notification (Alert)  | `core/design-system/notification/aero-notification.component.ts`     | `<aero-notification>`: 4 types (error/warning/success/info), AERO tokens                                 |

### Form Page Rules

- **Outer wrapper**: Always `<app-form-container>` (provides header, cancel/save buttons, white card)
- **Sections**: Always `<app-form-section title="..." icon="..." [columns]="2">` — NEVER raw `.form-section` divs
- **Styles**: `@use 'form-layout'` in component styles — NEVER duplicate `.form-grid`, `.section-grid`, `.form-group` CSS inline
- **Inputs**: `<aero-input>` for text/number/date, `<aero-dropdown>` for selects, raw `<textarea class="form-control">` for multi-line text
- **Shared SCSS**: `frontend/src/styles/_form-layout.scss` provides `.form-grid`, `.section-grid`, `.form-group`, `.form-control`, `.error-msg`, `.checkbox-group`, `.file-upload-*`

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (90-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk vitest run          # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category         | Commands                       | Typical Savings |
| ---------------- | ------------------------------ | --------------- |
| Tests            | vitest, playwright, cargo test | 90-99%          |
| Build            | next, tsc, lint, prettier      | 70-87%          |
| Git              | status, log, diff, add, commit | 59-80%          |
| GitHub           | gh pr, gh run, gh issue        | 26-87%          |
| Package Managers | pnpm, npm, npx                 | 70-90%          |
| Files            | ls, read, grep, find           | 60-75%          |
| Infrastructure   | docker, kubectl                | 85%             |
| Network          | curl, wget                     | 65-70%          |

Overall average: **60-90% token reduction** on common development operations.

<!-- /rtk-instructions -->
