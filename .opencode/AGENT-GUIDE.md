# BitCorp ERP - OpenCode Agent Guide

## Overview

This guide explains when and how to use BitCorp ERP's specialized OpenCode agents. Agents are context-aware AI assistants that help with specific development tasks by following established patterns and accessing relevant documentation.

**Date**: January 17, 2026  
**Agent Count**: 6 (2 primary, 4 subagents)  
**Status**: Active

---

## Table of Contents

1. [Agent Overview](#agent-overview)
2. [Primary Agents](#primary-agents)
3. [Subagents](#subagents)
4. [When to Use Each Agent](#when-to-use-each-agent)
5. [Cross-Agent Workflows](#cross-agent-workflows)
6. [Usage Examples](#usage-examples)
7. [Best Practices](#best-practices)

---

## Agent Overview

### Agent Types

**Primary Agents** (User-facing, full feature implementation):

- **bitcorp-backend**: Backend development (NestJS, TypeORM, APIs)
- **bitcorp-frontend**: Frontend development (Angular, Aero Design System)

**Subagents** (Specialized, called by primary agents or users):

- **bitcorp-database**: Database schema design and migrations
- **bitcorp-multitenancy**: Multi-tenant architecture patterns
- **bitcorp-prd-reader**: PRD document analysis (read-only)
- **bitcorp-security**: Authentication, authorization, role-based access

### Agent Hierarchy

```
User Request
    │
    ├─> bitcorp-backend (Primary)
    │       ├─> bitcorp-database (Subagent)
    │       ├─> bitcorp-multitenancy (Subagent)
    │       ├─> bitcorp-security (Subagent)
    │       └─> bitcorp-prd-reader (Subagent)
    │
    └─> bitcorp-frontend (Primary)
            ├─> bitcorp-prd-reader (Subagent)
            └─> bitcorp-security (Subagent)
```

---

## Primary Agents

### bitcorp-backend

**Purpose**: Complete backend feature implementation

**Capabilities**:

- Create controllers (API endpoints)
- Create services (business logic)
- Define DTOs (data transfer objects)
- Implement tenant-aware queries
- Apply ARCHITECTURE.md patterns
- Handle error responses
- Implement pagination
- Create database migrations

**When to Use**:

- "Implement equipment listing API endpoint"
- "Create contract valuation service"
- "Add authentication middleware"
- "Build user management module"
- "Fix API response format"

**Reference Documents**:

- `ARCHITECTURE.md` - Core patterns
- `API-PATTERNS.md` - Controller/Service/DTO structure
- `MULTITENANCY.md` - Tenant context handling
- `.opencode/skill/bitcorp-prd-analyzer/SKILL.md` - Business rules

**Key Patterns Enforced**:

- ✅ Standard response contract (`{ success, data, pagination/error }`)
- ✅ snake_case API responses
- ✅ Request-scoped services for multi-tenancy
- ✅ Explicit DTOs (never return raw entities)
- ✅ Spanish database names, snake_case API
- ✅ Pagination for list endpoints

**Example Prompts**:

```
@bitcorp-backend Implement the equipment list API endpoint with filters for tipo_equipo and estado

@bitcorp-backend Create a service to calculate monthly valuation based on partes diarios

@bitcorp-backend Add user creation endpoint following the role hierarchy from USER-MANAGEMENT.md
```

---

### bitcorp-frontend

**Purpose**: Complete frontend feature implementation

**Capabilities**:

- Create Angular components
- Implement Aero Design System components
- Build forms with validation
- Create data tables with pagination
- Implement routing and guards
- Connect to backend APIs
- Handle authentication state
- Apply responsive design

**When to Use**:

- "Create equipment list component"
- "Build contract creation wizard"
- "Implement user management UI"
- "Add login page with Aero components"
- "Create dashboard with charts"

**Reference Documents**:

- `.opencode/skill/frontend-design/SKILL.md` - UI design principles
- `USER-MANAGEMENT.md` - Role-based UI permissions
- `.opencode/skill/bitcorp-prd-analyzer/SKILL.md` - UI flows from PRD

**Key Patterns Enforced**:

- ✅ Aero Design System components (AFR-KLM standard)
- ✅ Reusable, composable components
- ✅ Responsive design (mobile-first)
- ✅ Role-based UI rendering
- ✅ Service layer unwraps API responses
- ✅ Loading states and error handling

**Example Prompts**:

```
@bitcorp-frontend Create the equipment list component with filters and pagination using Aero table

@bitcorp-frontend Build a contract creation wizard (3 steps: equipment selection, pricing, review)

@bitcorp-frontend Implement the user profile page with edit capabilities
```

---

## Subagents

### bitcorp-database

**Purpose**: Database schema design and migration scripts

**Capabilities**:

- Design database schemas (Spanish naming)
- Create migration SQL scripts
- Define indexes and constraints
- Implement audit triggers
- Optimize queries
- Design tenant-aware schemas

**When to Use**:

- "Design schema for equipment module"
- "Create migration to add GPS tracking"
- "Add indexes for performance"
- "Design audit log tables"

**Reference Documents**:

- `ARCHITECTURE.md` - Spanish naming conventions
- `MULTITENANCY.md` - Separate DB per company
- Database files: `database/001_init_schema.sql`

**Key Patterns Enforced**:

- ✅ Spanish table and column names
- ✅ snake_case in database
- ✅ Proper foreign keys and cascades
- ✅ Indexes on frequently queried fields
- ✅ Audit fields (created_at, updated_at)

**Example Prompts**:

```
@bitcorp-database Design the schema for equipment GPS tracking with historical location data

@bitcorp-database Create migration to add user_projects junction table

@bitcorp-database Optimize the valorizaciones query for better performance
```

---

### bitcorp-multitenancy

**Purpose**: Multi-tenant architecture implementation

**Capabilities**:

- Implement tenant context middleware
- Create company provisioning logic
- Design connection pooling
- Implement tenant-aware queries
- Handle cross-company operations (sistema DB)

**When to Use**:

- "Implement tenant context for new module"
- "Create company provisioning service"
- "Fix multi-tenant query issue"
- "Add connection pooling"

**Reference Documents**:

- `MULTITENANCY.md` - Complete architecture
- `API-PATTERNS.md` - Tenant-aware service patterns

**Key Patterns Enforced**:

- ✅ Request-scoped services
- ✅ DataSource from `req.tenantContext`
- ✅ Separate database per company
- ✅ Sistema DB for platform operations

**Example Prompts**:

```
@bitcorp-multitenancy Implement tenant context validation in equipment service

@bitcorp-multitenancy Create company provisioning with database creation and first user setup

@bitcorp-multitenancy Fix the connection leak issue in tenant middleware
```

---

### bitcorp-prd-reader

**Purpose**: Analyze PRD documents and extract business requirements (read-only)

**Capabilities**:

- Extract business rules from PRD documents
- Identify equipment types and classifications
- Understand process flows (valorización, contracts)
- Explain pricing models (Anexo B variants)
- Map PRD requirements to technical implementation
- Extract terminology and glossary

**When to Use**:

- "What equipment types are defined in CORP-GEM-P-001?"
- "Explain the monthly valuation timeline"
- "What are the contract legalization steps?"
- "List all required documents for equipment entry"

**Reference Documents**:

- `.opencode/skill/bitcorp-prd-analyzer/SKILL.md` - Complete PRD knowledge
- `docs/PRD-Raw/` - Source PRD documents

**Key Capabilities**:

- ✅ Read-only (no code generation)
- ✅ Spanish business terminology
- ✅ Process workflow explanations
- ✅ Business rule extraction

**Example Prompts**:

```
@bitcorp-prd-reader What are the equipment types from CORP-GEM-P-001 Section 4.1?

@bitcorp-prd-reader Explain the valorización timeline (Day 5, 7, 10)

@bitcorp-prd-reader What are the required documents for OPERADOR certification?
```

---

### bitcorp-security

**Purpose**: Authentication, authorization, and security implementation

**Capabilities**:

- Implement authentication (JWT, sessions)
- Design role-based access control
- Create permission guards
- Implement password policies
- Design audit logging
- Handle security best practices

**When to Use**:

- "Implement JWT authentication"
- "Create role-based guard for ADMIN"
- "Add password reset flow"
- "Implement audit logging for user actions"

**Reference Documents**:

- `USER-MANAGEMENT.md` - Role hierarchy and permissions
- `MULTITENANCY.md` - Tenant context in auth

**Key Patterns Enforced**:

- ✅ JWT with company context (id_empresa)
- ✅ Role-based permissions (5-tier hierarchy)
- ✅ Password hashing (bcrypt, salt=10)
- ✅ Audit trail for security events

**Example Prompts**:

```
@bitcorp-security Implement JWT authentication with company context

@bitcorp-security Create a role guard that only allows ADMIN and DIRECTOR

@bitcorp-security Add password reset flow with email token verification
```

---

## When to Use Each Agent

### Decision Tree

```
Need backend work?
  ├─ Yes → @bitcorp-backend
  │   ├─ Need database schema? → Delegates to @bitcorp-database
  │   ├─ Multi-tenant question? → Delegates to @bitcorp-multitenancy
  │   ├─ Need business rules? → Delegates to @bitcorp-prd-reader
  │   └─ Auth/permissions? → Delegates to @bitcorp-security
  │
  ├─ No → Need frontend work?
  │   ├─ Yes → @bitcorp-frontend
  │   │   ├─ Need UI flow from PRD? → Delegates to @bitcorp-prd-reader
  │   │   └─ Need role-based UI? → Delegates to @bitcorp-security
  │   │
  │   └─ No → Direct question?
  │       ├─ About database schema? → @bitcorp-database
  │       ├─ About multi-tenancy? → @bitcorp-multitenancy
  │       ├─ About PRD/business rules? → @bitcorp-prd-reader
  │       └─ About security/auth? → @bitcorp-security
```

### Quick Reference

| Task                       | Agent                   | Why                          |
| -------------------------- | ----------------------- | ---------------------------- |
| Create API endpoint        | `@bitcorp-backend`      | Full backend implementation  |
| Create UI component        | `@bitcorp-frontend`     | Full frontend implementation |
| Design database table      | `@bitcorp-database`     | Schema expertise             |
| Tenant context issue       | `@bitcorp-multitenancy` | Multi-tenancy specialist     |
| Understand PRD requirement | `@bitcorp-prd-reader`   | Business domain knowledge    |
| Implement auth flow        | `@bitcorp-security`     | Security specialist          |

---

## Cross-Agent Workflows

### Workflow 1: New Feature (Full Stack)

```
User: "Implement equipment GPS tracking feature"

Step 1: @bitcorp-prd-reader
  └─> Check if GPS tracking is mentioned in PRD
  └─> Extract business requirements

Step 2: @bitcorp-database
  └─> Design schema (equipos.latitud, equipos.longitud, historial_ubicaciones)
  └─> Create migration script

Step 3: @bitcorp-backend
  └─> Create API endpoints (GET /equipos/:id/ubicacion, POST /equipos/:id/ubicacion)
  └─> Implement service with tenant-aware queries
  └─> Create DTOs

Step 4: @bitcorp-frontend
  └─> Create map component (Google Maps/Leaflet)
  └─> Add location tracking UI to equipment detail page
  └─> Implement location history chart
```

### Workflow 2: Fix Multi-Tenant Bug

```
User: "Equipment query returns data from other companies"

Step 1: @bitcorp-multitenancy (Diagnose)
  └─> Check if service is request-scoped
  └─> Verify tenant context middleware
  └─> Identify root cause

Step 2: @bitcorp-backend (Fix)
  └─> Update service to use req.tenantContext.dataSource
  └─> Add @Injectable({ scope: Scope.REQUEST })
  └─> Test query isolation
```

### Workflow 3: Implement Security Feature

```
User: "Add password reset functionality"

Step 1: @bitcorp-security (Design)
  └─> Design reset token schema
  └─> Define security rules (token expiry, one-time use)

Step 2: @bitcorp-database (Schema)
  └─> Create password_reset_tokens table
  └─> Add migration

Step 3: @bitcorp-backend (Backend)
  └─> POST /auth/forgot-password endpoint
  └─> POST /auth/reset-password endpoint
  └─> Email service integration

Step 4: @bitcorp-frontend (UI)
  └─> Forgot password form
  └─> Reset password form
  └─> Success/error messages
```

---

## Usage Examples

### Example 1: Equipment Module

**User Request**: "Implement the equipment management module"

**Recommended Workflow**:

```bash
# Step 1: Understand business requirements
@bitcorp-prd-reader What equipment types are defined in CORP-GEM-P-001? Extract the complete classification.

# Step 2: Design database schema
@bitcorp-database Design the schema for equipment management including equipment, contracts, and daily reports (partes diarios).

# Step 3: Implement backend
@bitcorp-backend Create the equipment API endpoints:
- GET /api/equipos (list with pagination, filters)
- GET /api/equipos/:id (detail view)
- POST /api/equipos (create new equipment)
- PUT /api/equipos/:id (update equipment)
- DELETE /api/equipos/:id (soft delete)

Follow ARCHITECTURE.md and API-PATTERNS.md. Include tenant context.

# Step 4: Implement frontend
@bitcorp-frontend Create the equipment management UI:
- Equipment list with Aero table
- Equipment detail page
- Equipment creation form
- Equipment filters (tipo_equipo, estado, proveedor)

Use Aero Design System components.
```

### Example 2: User Management

**User Request**: "Implement user creation with role hierarchy"

**Recommended Workflow**:

```bash
# Step 1: Understand role hierarchy
@bitcorp-security Explain the 5-tier role hierarchy and who can create whom based on USER-MANAGEMENT.md

# Step 2: Design permission system
@bitcorp-security Design the permission check logic for user creation (ADMIN can create all, DIRECTOR can request JEFE_EQUIPO/OPERADOR)

# Step 3: Implement backend
@bitcorp-backend Create user management endpoints:
- POST /api/usuarios (create user with role validation)
- GET /api/usuarios (list users for current company)
- PUT /api/usuarios/:id (update user)
- DELETE /api/usuarios/:id (soft delete)

Implement permission checks in controller.

# Step 4: Implement frontend
@bitcorp-frontend Create user management UI:
- User list (filtered by role, project)
- User creation form (dropdown shows only roles current user can create)
- User edit form
- Role-based UI rendering (hide actions based on permissions)
```

### Example 3: Multi-Tenant Setup

**User Request**: "Set up multi-tenancy for new companies module"

**Recommended Workflow**:

```bash
# Step 1: Understand architecture
@bitcorp-multitenancy Explain the separate database per company architecture and how tenant context works

# Step 2: Implement provisioning
@bitcorp-backend Create company provisioning service:
- Create empresa in sistema.empresas
- Create new PostgreSQL database (bitcorp_empresa_{code})
- Run schema migrations
- Create first company ADMIN user

# Step 3: Update tenant middleware
@bitcorp-multitenancy Verify tenant context middleware handles new company databases correctly

# Step 4: Test isolation
@bitcorp-multitenancy Create test script to verify data isolation between companies
```

---

## Best Practices

### Agent Selection

1. **Start with primary agents** (`@bitcorp-backend`, `@bitcorp-frontend`) for full features
2. **Use subagents directly** only for specific questions or focused tasks
3. **Let primary agents delegate** to subagents automatically when needed
4. **Be specific** in your requests (include module names, requirements)

### Effective Prompts

**Good Prompts** ✅:

```
@bitcorp-backend Implement the equipment list API endpoint with pagination, filters for tipo_equipo and estado, and tenant-aware queries. Follow API-PATTERNS.md.

@bitcorp-frontend Create the contract valuation form with 3 sections: equipment selection, deductions, and final amount. Use Aero form components.

@bitcorp-prd-reader What are the timeline requirements for monthly valuations from CORP-GEM-P-002? List Day 5, 7, and 10 milestones.
```

**Bad Prompts** ❌:

```
Make equipment work                  // Too vague
Create API                           // Missing details
Fix the bug                          // No context
Add a form                           // Which form? What fields?
```

### Multi-Agent Coordination

When working on a complete feature:

1. **PRD Analysis First**: Use `@bitcorp-prd-reader` to understand business requirements
2. **Schema Design Second**: Use `@bitcorp-database` to design data structures
3. **Backend Third**: Use `@bitcorp-backend` to implement APIs
4. **Frontend Last**: Use `@bitcorp-frontend` to build UI

### Documentation References

Agents automatically reference these documents:

| Document                     | Purpose           | Agents Using It                 |
| ---------------------------- | ----------------- | ------------------------------- |
| `ARCHITECTURE.md`            | Core patterns     | All agents                      |
| `MULTITENANCY.md`            | Tenant context    | backend, database, multitenancy |
| `USER-MANAGEMENT.md`         | Roles/permissions | backend, frontend, security     |
| `API-PATTERNS.md`            | Backend patterns  | backend, database               |
| `bitcorp-prd-analyzer` skill | Business rules    | prd-reader, backend, frontend   |

---

## Troubleshooting

### Agent Not Responding as Expected

**Issue**: Agent doesn't follow patterns  
**Solution**: Be more specific, reference the instruction file:

```
@bitcorp-backend Create equipment API following the exact pattern in API-PATTERNS.md Section 4 (Controller Patterns)
```

**Issue**: Agent doesn't understand business term  
**Solution**: Use `@bitcorp-prd-reader` first to clarify terminology:

```
@bitcorp-prd-reader What does "valorización parcial" mean in the context of CORP-GEM-P-002?
```

**Issue**: Agent creates non-tenant-aware code  
**Solution**: Explicitly mention multi-tenancy:

```
@bitcorp-backend Create equipment service as REQUEST-SCOPED and use req.tenantContext.dataSource for queries. Reference MULTITENANCY.md.
```

### Getting Help

```
# Ask agent about its capabilities
@bitcorp-backend What can you help me with?

# Ask agent to explain a pattern
@bitcorp-backend Explain the standard API response contract from API-PATTERNS.md

# Ask for examples
@bitcorp-backend Show me an example of a controller following ARCHITECTURE.md patterns
```

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Core architectural principles
- [MULTITENANCY.md](./MULTITENANCY.md) - Multi-tenant architecture
- [USER-MANAGEMENT.md](./USER-MANAGEMENT.md) - Role hierarchy and permissions
- [API-PATTERNS.md](./API-PATTERNS.md) - Backend development patterns
- [SKILLS-INTEGRATION.md](./SKILLS-INTEGRATION.md) - OpenCode skills documentation

---

## Version History

- **v1.0.0** (2026-01-17): Initial agent guide
  - 2 primary agents (backend, frontend)
  - 4 subagents (database, multitenancy, prd-reader, security)
  - Cross-agent workflows
  - Usage examples

---

**Use the right agent for the right task to maximize development efficiency.**
