🏗️ Bitcorp ERP – Architecture & Engineering Guidelines

This document defines non-negotiable architectural rules, workflows, and best practices for the Bitcorp ERP codebase. Its goal is to ensure consistency, predictability, scalability, and low regression risk as the system evolves.

This is a living document, but any change to it must be deliberate and reviewed.

⸻

1. Core Principles
   1. Single Source of Truth
      • Database schema, API contracts, and DTOs must each have a clearly defined authority.
      • No implicit behavior, no undocumented conventions.
   2. Explicit Over Implicit
      • Transform data explicitly.
      • Wrap responses explicitly.
      • Handle errors explicitly.
   3. Consistency Beats Cleverness
      • Prefer repeating a known pattern over inventing a new one.
   4. Frontend Stability Is a First-Class Concern
      • Backend changes must never silently break the frontend.

⸻

2. Database Architecture

2.1 Schema Source of Truth
• 001_init_schema.sql is the single source of truth for the database schema.
• Until the system reaches production maturity:
• All schema changes must be made in this file.
• No schema drift across multiple migration files.

Rationale: The system is still evolving rapidly. A single schema file avoids migration entropy and broken local setups.

2.2 Seed Data
• 002_seed.sql is the authoritative seed file.
• It must always be kept fully in sync with 001_init_schema.sql.
• Any change to:
• Tables
• Columns
• Foreign keys

➡️ Requires a corresponding update in 002_seed.sql.

2.3 Naming Conventions (Database)
• All table names and column names must be in Spanish.
• Names must correspond to legacy definitions documented in:
• ./docs/tables

Examples:
• equipos, proveedores, movimientos_logistica
• fecha_inicio, razon_social, precio_unitario

⸻

3. API Design Standards

3.1 Response Contract (Mandatory)

All API responses must follow one of the following formats:

// List (paginated)
{
success: true,
data: T[],
pagination: { page, limit, total, totalPages }
}

// Single entity
{
success: true,
data: T
}

// Error
{
success: false,
error: { code, message, details? }
}

❌ Returning raw entities is forbidden.

⸻

3.2 Field Naming Standard
• snake_case is the canonical API contract.
• Database fields (Spanish, camelCase) must be transformed.
• Frontend must never adapt to backend inconsistency.

✅ Correct:

{ "fecha_inicio": "2024-01-01" }

❌ Incorrect:

{ "fechaInicio": "2024-01-01" }

⸻

3.3 DTOs (Required)
• Every controller must return DTOs, never entities.
• DTOs live in:
• backend/src/types/dto/\*
• Transformation happens in:
• Service layer or controller layer (but consistently per module).

⸻

3.4 Pagination Rules
• Pagination is mandatory for all list endpoints by default.
• Exceptions:
• Reference tables
• Static catalogs
• Explicitly approved small datasets

Default:
• limit = 10
• page = 1

⸻

3.5 Backward Compatibility
• Dual field names are NOT allowed.
• Breaking API changes are acceptable during this phase if intentional and documented.

Rationale: Dual fields increase complexity, bugs, and frontend confusion.

⸻

3.6 Error Handling Standard
• All controllers must use a single error format.
• Preferred helper:

sendError(res, status, code, message, details?)

Error codes must be:
• Stable
• Machine-readable
• Documented

⸻

4. Backend Code Organization

4.1 Controllers

Controllers:
• Parse input
• Call services
• Apply DTO transformation
• Return standardized responses

❌ Controllers must NOT:
• Contain business logic
• Return raw entities

⸻

4.2 Services

Services:
• Contain business logic
• Query the database
• Optionally perform DTO mapping

Services must return:
• Entities or
• Already-transformed DTOs (but be consistent)

⸻

4.3 Shared Utilities
• DTO transformers live in:
• backend/src/utils/dto-transformer.ts
• Reusable logic must be centralized.

⸻

5. Frontend Architecture Guidelines

5.1 Service Layer
• Frontend services must unwrap API responses:

map(res => res.data)

    •	Components must never care about { success, pagination }.

⸻

5.2 Reusable & Composable Components
• The frontend must prioritize composability.
• Build:
• Generic tables
• Generic filters
• Reusable wizards
• Shared form components

Changes to one module should be:
• Easily replicated elsewhere
• Visually and behaviorally consistent

This ensures design consistency and lowers long-term maintenance cost.

⸻

6. Development & Verification Workflow

6.1 Implementation Checklist (Mandatory)

For every feature or fix: 1. Update schema (if needed) in 001_init_schema.sql 2. Update seed data in 002_seed.sql 3. Implement backend changes 4. Implement frontend changes 5. Manually navigate to the feature in the browser 6. Monitor:
• docker-compose backend logs
• docker-compose frontend logs
• Browser console logs

No feature is considered done without step 5 & 6.

⸻

6.2 Commits
• Every completed feature or fix requires a commit.
• Use Conventional Commits:

fix(logistics): map product stock and cost fields
feat(contracts): add contract detail DTO mapping
refactor(api): standardize error responses

    •	Use local git config user, not global defaults.

⸻

7. Forbidden Practices 🚫
   • Returning raw TypeORM entities
   • Mixing camelCase and snake_case in API responses
   • Skipping DTOs
   • Adding schema changes without updating seed
   • Fixing frontend bugs by hacking around backend inconsistency
   • Copy-pasting components instead of composing them

⸻

8. Enforcement

This document is:
• A PR review checklist
• A refactoring guide
• A source of architectural truth

If code violates this document, it should be changed, not debated.

⸻

9. Future Extensions (Planned)
   • DTO test coverage
   • OpenAPI spec generation from DTOs
   • Migration strategy once production stabilizes
   • Automated linting for response shape enforcement

⸻

10. Keep the workspace tidy
    • Remove unused imports
    • Remove commented-out code
    • Keep commit history clean
    • Dont commit unncecessary files and instead move to docs/ folder.
    • Get rid of backup or old files which are not in use anymore.

⸻

Architecture is not about perfection — it is about making the correct path the easiest path.
