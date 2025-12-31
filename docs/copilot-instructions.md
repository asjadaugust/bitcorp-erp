# Copilot Instructions - Bitcorp ERP

## Project Overview

**Bitcorp ERP** is a modern, containerized ERP system for civil engineering equipment management, focusing on road construction and maintenance projects. This system replaces a legacy VB application with a modern Angular + Node.js TypeScript stack.

### Core Technologies
- **Frontend**: Angular 19+ (latest stable)
- **Backend**: Node.js with TypeScript (Express + Fastify hybrid)
- **Database**: PostgreSQL 16+
- **Cache/Queue**: Redis 7+
- **Testing**: Playwright for E2E, Jest for unit tests
- **Containerization**: Docker + Docker Compose
- **Design System**: KLM Design (via MCP)

---

## Development Workflow

### 1. Feature Development Process

```bash
# Standard workflow for implementing features
1. Read requirements from PRD (Bitcorp_ERP_Product_Requirements_Document_en.md)
2. Check docs/old_code for VB legacy implementation references
3. Design API contracts (OpenAPI spec in docs/api/)
4. Implement backend endpoints with unit tests
5. Implement frontend components with KLM Design
6. Write Playwright E2E tests
7. Run all tests: npm run test:all
8. Only commit when ALL tests pass
9. Use conventional commits format
```

### 2. Testing Requirements

**CRITICAL**: Every feature MUST have passing tests before committing.

```typescript
// E2E Test Structure (tests/e2e/)
tests/
├── e2e/
│   ├── smoke/                    # Smoke tests run on every build
│   │   ├── login.spec.ts
│   │   ├── navigation.spec.ts
│   │   └── critical-paths.spec.ts
│   ├── modules/
│   │   ├── equipment/
│   │   │   ├── equipment-crud.spec.ts
│   │   │   ├── equipment-assignment.spec.ts
│   │   │   └── equipment-scheduling.spec.ts
│   │   ├── operators/
│   │   │   ├── operator-profile.spec.ts
│   │   │   ├── operator-scheduling.spec.ts
│   │   │   └── operator-notifications.spec.ts
│   │   └── daily-reports/
│   │       ├── mobile-report-submit.spec.ts
│   │       └── report-validation.spec.ts
│   └── helpers/
│       ├── test-data-factory.ts
│       ├── page-objects.ts
│       └── api-helpers.ts
```

### 3. Commit Convention

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     New feature
fix:      Bug fix
test:     Adding or updating tests
refactor: Code refactoring
docs:     Documentation changes
style:    Code style changes (formatting)
perf:     Performance improvements
chore:    Build/tooling changes

# Examples:
feat(equipment): add equipment assignment API endpoint
test(equipment): add E2E tests for equipment CRUD operations
fix(operators): resolve skill matching algorithm bug
refactor(daily-reports): optimize mobile form validation
```

**Commit Rules**:
- ✅ Commit only when `npm run test:all` passes
- ✅ Commit only when `npm run build` succeeds
- ✅ One logical feature per commit
- ❌ Never commit broken code
- ❌ Never commit without tests
- ❌ Never push to remote (maintain local git only)

---

## Project Structure

```
bitcorp-erp/
├── frontend/                      # Angular application
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/             # Singleton services, guards, interceptors
│   │   │   ├── shared/           # Shared components, pipes, directives
│   │   │   ├── features/         # Feature modules
│   │   │   │   ├── equipment/
│   │   │   │   ├── operators/
│   │   │   │   ├── daily-reports/
│   │   │   │   ├── scheduling/
│   │   │   │   ├── cost-analysis/
│   │   │   │   └── projects/
│   │   │   ├── layouts/          # Layout components
│   │   │   └── models/           # TypeScript interfaces/types
│   │   ├── assets/
│   │   └── environments/
│   ├── playwright.config.ts
│   └── package.json
│
├── backend/                       # Node.js TypeScript API
│   ├── src/
│   │   ├── api/                  # API routes
│   │   │   ├── equipment/
│   │   │   ├── operators/
│   │   │   ├── reports/
│   │   │   ├── scheduling/
│   │   │   └── cost/
│   │   ├── services/             # Business logic
│   │   ├── repositories/         # Data access layer
│   │   ├── models/               # Database models (TypeORM)
│   │   ├── middleware/           # Express middleware
│   │   ├── utils/                # Utilities
│   │   ├── config/               # Configuration
│   │   └── index.ts
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
│
├── database/
│   ├── migrations/               # TypeORM migrations
│   ├── seeds/                    # Seed data
│   ├── schemas/                  # Database schemas
│   └── scripts/
│       └── convert-bacpac.sh     # BACPAC to PostgreSQL converter
│
├── tests/
│   └── e2e/                      # Playwright E2E tests
│
├── docs/
│   ├── old_code/                 # Legacy VB code reference
│   ├── images/                   # UI screenshots, diagrams
│   ├── api/                      # OpenAPI specifications
│   └── architecture/             # Architecture diagrams
│
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── postgres.Dockerfile
│
├── docker-compose.yml            # Production setup
├── docker-compose.dev.yml        # Development setup
├── .env.example
├── .gitignore
├── package.json                  # Root workspace
└── copilot-instructions.md       # This file
```

---

## Module Implementation Guide

### Module 001: Equipment Management

**Priority**: HIGH | **Complexity**: Medium

#### Backend Tasks
1. **Database Schema**
   ```sql
   -- tables: equipment, equipment_types, equipment_status, equipment_assignments
   -- Reference: docs/old_code/equipment_module.vb
   ```

2. **API Endpoints**
   ```typescript
   // POST /api/v1/equipment
   // GET /api/v1/equipment
   // GET /api/v1/equipment/:id
   // PUT /api/v1/equipment/:id
   // DELETE /api/v1/equipment/:id
   // GET /api/v1/equipment/availability
   // POST /api/v1/equipment/:id/assign
   // POST /api/v1/equipment/:id/transfer
   ```

3. **Business Logic**
   - Equipment availability calculation
   - Cross-site transfer logic
   - Utilization rate computation
   - Validation rules

#### Frontend Tasks
1. **Components**
   - Equipment list (data table with filters)
   - Equipment form (create/edit)
   - Equipment detail view
   - Equipment assignment modal
   - Availability calendar

2. **Services**
   - EquipmentService (HTTP calls)
   - EquipmentStateService (NgRx/signals)

3. **Design**
   - Use KLM Design components via MCP
   - Responsive layouts for desktop
   - Data tables with sorting/filtering
   - Form validations

#### Testing
```typescript
// E2E: tests/e2e/modules/equipment/equipment-crud.spec.ts
test('should create new equipment', async ({ page }) => {
  // Test implementation
});

test('should assign equipment to project site', async ({ page }) => {
  // Test implementation
});

test('should calculate equipment utilization rate', async ({ page }) => {
  // Test implementation
});
```

---

### Module 002: Operator Management

**Priority**: HIGH | **Complexity**: Medium

#### Backend Tasks
1. **Database Schema**
   ```sql
   -- tables: operators, operator_skills, operator_certifications, 
   -- operator_assignments, operator_notifications
   ```

2. **API Endpoints**
   ```typescript
   // POST /api/v1/operators
   // GET /api/v1/operators
   // GET /api/v1/operators/:id
   // PUT /api/v1/operators/:id
   // POST /api/v1/operators/:id/skills
   // POST /api/v1/operators/notify
   // GET /api/v1/operators/available
   ```

3. **Business Logic**
   - Skill-based matching algorithm
   - Notification dispatch system
   - Availability tracking
   - Contract history management

#### Frontend Tasks
1. **Components**
   - Operator profile page
   - Operator list with skill filters
   - Skill management interface
   - Notification center
   - Assignment calendar

2. **Mobile Considerations**
   - Responsive operator profile
   - Mobile-optimized notifications
   - Touch-friendly UI

---

### Module 003: Daily Reports (Mobile-First)

**Priority**: CRITICAL | **Complexity**: High

#### Backend Tasks
1. **Database Schema**
   ```sql
   -- tables: daily_reports, equipment_readings, 
   -- report_validations, report_sync_queue
   ```

2. **API Endpoints**
   ```typescript
   // POST /api/v1/reports
   // GET /api/v1/reports/:id
   // GET /api/v1/reports/operator/:operatorId
   // PUT /api/v1/reports/:id/validate
   // POST /api/v1/reports/sync
   // POST /api/v1/reports/bulk
   ```

3. **Business Logic**
   - Offline queue management
   - Data validation rules
   - Sync conflict resolution
   - Automatic calculations (fuel efficiency, etc.)

#### Frontend Tasks
1. **Mobile Components** (Priority!)
   - Quick report form (optimized for touch)
   - Equipment selector
   - Time pickers (start/end)
   - Hourmeter/odometer inputs
   - Fuel consumption entry
   - Photo upload (camera integration)
   - Offline indicator
   - Sync status display

2. **Desktop Components**
   - Report validation interface
   - Report history view
   - Batch approval tools

3. **PWA Features**
   - Service worker for offline functionality
   - Local storage for pending reports
   - Background sync
   - Push notifications

#### Testing
```typescript
// E2E: tests/e2e/modules/daily-reports/mobile-report-submit.spec.ts
test('should submit daily report offline and sync when online', async ({ page, context }) => {
  // Simulate offline
  await context.setOffline(true);
  // Fill report form
  // Submit
  // Verify stored in IndexedDB
  await context.setOffline(false);
  // Verify sync occurs
  // Verify report appears in backend
});
```

---

### Module 004: Scheduling Engine

**Priority**: HIGH | **Complexity**: Very High

#### Backend Tasks
1. **Algorithm Implementation**
   ```typescript
   // Constraint-based scheduling
   // - Equipment availability
   // - Operator skills match
   // - No double-booking
   // - Project requirements
   // - Cost optimization
   ```

2. **API Endpoints**
   ```typescript
   // POST /api/v1/schedule/generate
   // GET /api/v1/schedule/:projectId
   // PUT /api/v1/schedule/:id/approve
   // GET /api/v1/schedule/conflicts
   // POST /api/v1/schedule/optimize
   ```

3. **Business Logic**
   - Genetic algorithm for optimization
   - Conflict detection
   - Suggestion engine
   - Cost analysis integration

---

### Module 005: Cost Analysis & Valuation

**Priority**: MEDIUM | **Complexity**: Medium

#### Backend Tasks
1. **Database Schema**
   ```sql
   -- tables: cost_records, equipment_valuations, 
   -- operator_salaries, cost_reports
   ```

2. **API Endpoints**
   ```typescript
   // GET /api/v1/cost/report/:date
   // POST /api/v1/cost/equipment-valuation
   // GET /api/v1/cost/equipment-valuation/:id/pdf
   // POST /api/v1/cost/salary-calculation
   // GET /api/v1/cost/analytics
   ```

3. **PDF Generation**
   - Use PDFKit or Puppeteer
   - Template-based reports
   - Multi-language support (EN/ES)

---

## Docker Setup

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: bitcorp_dev
      POSTGRES_USER: bitcorp
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build:
      context: .
      dockerfile: docker/backend.Dockerfile
      target: development
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://bitcorp:dev_password@postgres:5432/bitcorp_dev
      REDIS_URL: redis://redis:6379
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run dev

  frontend:
    build:
      context: .
      dockerfile: docker/frontend.Dockerfile
      target: development
    environment:
      API_URL: http://localhost:3000
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run start

volumes:
  postgres_data:
```

### One-Click Setup Commands

```bash
# Development
npm run setup:dev          # Initialize everything
npm run dev                # Start all services
npm run test:all           # Run all tests
npm run migrate            # Run database migrations
npm run seed               # Seed development data

# Production
npm run build:prod         # Build production images
npm run start:prod         # Start production containers
npm run backup:db          # Backup database

# Database
npm run db:convert-bacpac  # Convert BACPAC to PostgreSQL
npm run db:reset           # Reset database
npm run db:migrate         # Run migrations
```

---

## AI Agent Tools & MCPs

### Available Tools

1. **KLM Design MCP** (UI/UX)
   - Get design system components
   - Fetch color schemes, typography
   - Retrieve component patterns
   - Usage: When implementing UI components

2. **Web Search** (Documentation)
   - Search Angular/Node.js docs
   - Find best practices
   - Look up package documentation
   - Usage: When implementing new features

3. **Web Fetch** (External Resources)
   - Fetch API documentation
   - Download templates
   - Get example code
   - Usage: When researching implementation patterns

4. **File Operations**
   - Read legacy VB code
   - Access images/diagrams
   - Read configuration files
   - Usage: Throughout development

### Tool Usage Guidelines

```typescript
// Example: Using KLM Design MCP
// 1. Request design for data table component
// 2. Get color scheme for module
// 3. Fetch responsive layout patterns
// 4. Implement with consistent styling

// Example: Using Web Search
// When implementing: "Search for Angular 19 standalone components best practices"
// When stuck: "Search for TypeORM many-to-many relationship examples"
// For optimization: "Search for PostgreSQL query optimization techniques"
```

---

## Database Migration from BACPAC

### Conversion Script

```bash
#!/bin/bash
# database/scripts/convert-bacpac.sh

# Prerequisites: sqlpackage, pgloader

# 1. Extract BACPAC to SQL Server
sqlpackage /Action:Import \
  /SourceFile:old_database.bacpac \
  /TargetConnectionString:"Server=localhost;Database=bitcorp_temp;..."

# 2. Convert SQL Server to PostgreSQL
pgloader \
  mssql://user:pass@localhost/bitcorp_temp \
  postgresql://bitcorp:password@localhost/bitcorp_dev

# 3. Run post-migration cleanup
psql -U bitcorp -d bitcorp_dev -f database/scripts/post-migration.sql
```

### Post-Migration Tasks
1. Verify data integrity
2. Update sequences
3. Create indexes
4. Apply constraints
5. Update foreign keys
6. Migrate stored procedures to functions

---

## Code Quality Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true
  }
}
```

### ESLint Rules
- No `any` types without explicit reason
- Prefer interfaces over types
- Use const over let
- Async/await over promises chains
- Descriptive variable names
- Maximum function length: 50 lines
- Maximum file length: 300 lines

### Code Review Checklist
- [ ] All tests passing
- [ ] No console.logs in production code
- [ ] Error handling implemented
- [ ] API responses typed
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Mobile responsiveness verified
- [ ] Accessibility standards met
- [ ] Documentation updated

---

## Internationalization (i18n)

### Languages
- English (default)
- Spanish

### Implementation
```typescript
// Use Angular i18n
// Translation files: src/assets/i18n/{en,es}.json

// Example:
{
  "equipment": {
    "title": "Equipment Management",
    "add": "Add Equipment",
    "status": {
      "available": "Available",
      "in_use": "In Use",
      "maintenance": "Under Maintenance"
    }
  }
}
```

---

## Performance Optimization

### Frontend
- Lazy load modules
- Virtual scrolling for large lists
- OnPush change detection
- Image optimization
- Bundle size < 500KB initial
- Lighthouse score > 90

### Backend
- Query optimization (use indexes)
- Connection pooling
- Redis caching for frequent queries
- Batch operations where possible
- API response time < 200ms

### Database
- Proper indexing strategy
- Query plan analysis
- Partitioning for large tables
- Regular VACUUM and ANALYZE

---

## Security Considerations

### Authentication
- JWT with refresh tokens
- Password hashing (bcrypt)
- Rate limiting on login
- Account lockout after failed attempts

### Authorization
- Role-based access control (RBAC)
- Route guards on frontend
- API middleware on backend
- Principle of least privilege

### Data Protection
- Input sanitization
- SQL injection prevention (use ORMs)
- XSS protection
- CSRF tokens
- HTTPS only in production
- Secrets in environment variables

---

## Monitoring & Logging

### Application Logging
```typescript
// Use structured logging
logger.info('Equipment created', {
  equipmentId: equipment.id,
  userId: user.id,
  timestamp: new Date()
});
```

### Metrics to Track
- API response times
- Error rates
- Database query performance
- Active users
- Equipment utilization rates
- Report submission rates

---

## Troubleshooting Guide

### Common Issues

**Docker containers won't start**
```bash
docker-compose down -v
docker-compose up --build
```

**Tests failing**
```bash
npm run test:clear-cache
npm run test:all
```

**Database migration errors**
```bash
npm run db:rollback
npm run db:migrate
```

**Port conflicts**
```bash
# Check ports: 3000, 4200, 5432, 6379
lsof -i :3000
# Kill process if needed
kill -9 <PID>
```

---

## Next Steps for Agent

### Phase 1: Foundation (Week 1-2)
1. ✅ Set up project structure
2. ✅ Configure Docker environment
3. ✅ Initialize Git repository
4. ⏳ Convert BACPAC database
5. ⏳ Set up CI/CD pipeline (GitHub Actions)
6. ⏳ Implement authentication module

### Phase 2: Core Modules (Week 3-6)
1. ⏳ Equipment Management (Module 001)
2. ⏳ Operator Management (Module 002)
3. ⏳ Daily Reports (Module 003) - PRIORITY
4. ⏳ Scheduling Engine (Module 004)

### Phase 3: Advanced Features (Week 7-10)
1. ⏳ Cost Analysis (Module 005)
2. ⏳ PDF Generation
3. ⏳ Advanced Analytics
4. ⏳ Performance Optimization

### Phase 4: Polish & Deploy (Week 11-12)
1. ⏳ E2E testing complete
2. ⏳ Performance optimization
3. ⏳ Security audit
4. ⏳ Documentation finalization
5. ⏳ Production deployment

---

## Critical Reminders for Agent

1. **NEVER COMMIT WITHOUT PASSING TESTS**
   - Run `npm run test:all` before every commit
   - All Playwright tests must pass
   - All Jest tests must pass
   - Build must succeed

2. **ALWAYS USE CONVENTIONAL COMMITS**
   - Format: `type(scope): subject`
   - Keep subject under 72 characters
   - Include test coverage in commit message

3. **REFERENCE LEGACY CODE**
   - Check `docs/old_code/` for VB implementation
   - Understand business logic before reimplementing
   - Document differences from legacy

4. **USE KLM DESIGN MCP**
   - Fetch designs before implementing UI
   - Maintain consistent theme
   - Follow accessibility guidelines

5. **MOBILE-FIRST FOR OPERATORS**
   - Daily Reports module is CRITICAL
   - Test on mobile viewport
   - Optimize for touch interactions
   - Implement offline-first

6. **MAINTAIN LOCAL GIT ONLY**
   - Never push to remote
   - Keep all changes local
   - Use descriptive branch names

7. **OPTIMIZE FOR AI DEVELOPMENT**
   - Clear file structure
   - Comprehensive inline documentation
   - Type everything (no `any`)
   - Modular, testable code

---

## Resources

### Documentation
- [Angular Docs](https://angular.io/docs)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [TypeORM Documentation](https://typeorm.io/)
- [Playwright Testing](https://playwright.dev/)
- [Docker Compose](https://docs.docker.com/compose/)

### Legacy Code Reference
- `docs/old_code/` - VB application source
- `docs/images/` - UI screenshots and diagrams
- `docs/api/` - API specifications

### Design System
- KLM Design MCP - Request via MCP tools
- Material Design principles
- WCAG 2.1 AA accessibility

---

**Last Updated**: 2025-11-07
**Version**: 1.0.0
**Maintainer**: AI Development Agent