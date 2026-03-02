# Backend CLAUDE.md

This file extends the root `CLAUDE.md` with Python/FastAPI-specific guidance.
It is auto-loaded by Claude Code when editing files in the `backend/` directory.

---

## Backend Code Layers

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

## API Response Contract (mandatory)

All responses must use one of:

```python
# List
{ "success": True, "data": [...], "pagination": { "page": 1, "limit": 20, "total": N, "total_pages": N } }

# Single
{ "success": True, "data": { ... } }

# Created
{ "success": True, "data": { "id": 123, "message": "..." } }

# Error
{ "success": False, "error": { "code": "...", "message": "...", "details": ... } }
```

Use standardized response helpers in the backend. **Never return raw SQLAlchemy models.** Always transform to Pydantic schemas.

---

## Field Naming Convention

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

## Database Schema Organization

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

## Backend Forbidden Practices

- Returning raw SQLAlchemy models from routers
- Skipping Pydantic schemas for request/response
- Using auto-migration in SQLAlchemy (all schema changes go in SQL files)
- Using singleton/global sessions for multi-tenant queries (always use tenant-scoped session)
- String-concatenating SQL — always use parameterized queries
- Mixing camelCase and snake_case in API responses
- Dual field names in API responses (pick one canonical name)
