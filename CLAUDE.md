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

Seeds are embedded in migration files — running `migrate` applies both schema and seed data.

```bash
# From inside the container:
alembic upgrade head

# Or via the db.sh helper (run from host):
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh migrate    # apply all pending migrations
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh fresh      # wipe + re-apply all migrations
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh downgrade  # revert all migrations
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh current    # show current revision
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh history    # show migration history
docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh revision -m "description"  # new migration
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

See `.opencode/MULTITENANCY.md` for full architecture.

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

- Mixing camelCase and snake_case in API responses
- Adding schema changes without updating seed data
- Dual field names in API responses (pick one canonical name)
- Pushing to remote without explicit user instruction

See `backend/CLAUDE.md` for backend-specific forbidden practices.

---

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

**ALWAYS use dora commands for code exploration instead of Grep/Glob/Find.**

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

For full command reference, see `./dora/docs/SKILL.md`.

---

## Context Loading (Trigger Table)

Scoped `CLAUDE.md` files extend these instructions. Claude Code auto-loads them
when editing files in those directories. For cross-cutting tasks, read manually.

| Task involves…                                                     | File                           |
| ------------------------------------------------------------------ | ------------------------------ |
| Angular, components, SCSS, UI, Aero, templates, design system      | `frontend/CLAUDE.md`           |
| FastAPI, SQLAlchemy, Pydantic, routers, services, schemas, backend | `backend/CLAUDE.md`            |
| Multi-tenant sessions, per-company DB isolation                    | `.opencode/MULTITENANCY.md`    |
| API patterns, DTOs, response shapes, pagination                    | `.opencode/API-PATTERNS.md`    |
| Role permissions, user lifecycle                                   | `.opencode/USER-MANAGEMENT.md` |

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
