# Database Migration Strategy

## TypeORM-Only Approach

Bitcorp ERP uses **TypeORM exclusively** for all database operations:

- Schema creation: TypeORM migrations
- Seed data: TypeORM seeders
- No manual SQL scripts

This ensures consistency, version control, and rollback capabilities.

---

## Why TypeORM Only?

### 1. Version Control

- Migrations are tracked in Git
- Easy to see what changed and when
- Rollback to previous schema versions

### 2. Rollback Support

- Can revert to previous database state
- No data loss if migration fails
- Safe deployment process

### 3. Consistency

- Single source of truth
- No conflicts between SQL files and code
- Prevents schema mismatches

### 4. Type Safety

- TypeScript integration
- Compile-time error detection
- IDE autocomplete support

---

## Migration Workflow

### Running Migrations

Migrations run automatically on backend startup:

```bash
# Manual run (if needed)
npm run migrate

# Or via Docker
docker-compose exec backend npm run migrate
```

**Location**: `backend/src/database/migrations/`

**Files**:

- 1768607735763-InitialSchema.ts - Initial schema creation
- 1768616921637-AddTimesheetTables.ts - Timesheet tables
- 1768618185998-AddMaintenanceSchedulesTable.ts - Maintenance
- 1768620557762-AddNotificationUrlAndReadAt.ts - Notifications
- 1768624699000-AddProviderContactsTable.ts - Provider contacts
- 1768625000000-AddProviderFinancialInfoTable.ts - Provider financial
- 1768700000000-AddUserProjectsTable.ts - User projects

### Running Seeders

Seeders create initial data (admin user, roles, etc.):

```bash
# Run all seeders
npm run seed:typeorm

# Or via Docker
docker-compose exec backend npm run seed:typeorm
```

**Location**: `backend/src/database/seeders/`

**Files**:

- 001-sistema-seeder.ts - Users, roles, operating units
- 002-core-entities-seeder.ts - Projects, providers
- 003-equipment-seeder.ts - Equipment
- 004-operators-seeder.ts - Operators
- 005-contracts-seeder.ts - Contracts
- ... (more seeders)

### Creating New Migration

When you modify entities, generate a migration:

```bash
npm run migration:generate -- src/database/migrations/AddNewTable
```

This creates a new migration file with:

- Table creation code
- Column definitions
- Indexes and constraints

### Viewing Migration Status

```bash
npm run migration:show

# Or via Docker
docker-compose exec backend npm run migration:show
```

Shows:

- Migration name
- Status (pending/executed)
- Timestamp

### Reverting Migrations

To rollback to previous schema:

```bash
npm run migration:revert

# Or via Docker
docker-compose exec backend npm run migration:revert
```

**Warning**: This removes the last migration. Use carefully in production!

---

## Seeder Workflow

### Creating New Seeder

Create file in `backend/src/database/seeders/`:

```typescript
import { AppDataSource } from '../config/database.config';
import { MyEntity } from '../../models/my-entity.model';

export async function seedMyEntity() {
  const repo = AppDataSource.getRepository(MyEntity);

  const data = [
    { name: 'Item 1', ... },
    { name: 'Item 2', ... },
  ];

  for (const item of data) {
    const existing = await repo.findOne({ where: { name: item.name } });
    if (!existing) {
      await repo.save(item);
    }
  }

  console.log('✅ MyEntity seeded');
}
```

### Running Specific Seeder

Edit `backend/src/database/seeders/index.ts` and call your seeder:

```typescript
import { seedMyEntity } from './my-entity-seeder';

async function runSeeders() {
  // ... existing seeders ...
  await seedMyEntity();
}
```

Then run:

```bash
npm run seed:typeorm
```

---

## Archived Files

Old manual SQL files are archived in `database/archive/manual-sql-deprecated/`:

**Schema Files** (replaced by TypeORM migrations):

- 001_init_schema.sql → 1768607735763-InitialSchema.ts
- 002_seed.sql → TypeORM seeders

**Migration Files** (should be converted to TypeORM):

- 003_add_sig_documents.sql
- 004_add_sample_maintenance_tasks.sql
- 005_create_checklist_tables.sql
- 006_add_valuation_fields.sql
- 007_add_detail_tables.sql
- 008_seed_detail_data.sql
- 009_add_daily_report_details.sql
- 010_extend_parte_diario_fields.sql
- 011_seed_daily_report_details.sql
- 013_create_payment_records.sql
- 014_create_logistics_schema.sql

**DO NOT USE THESE FILES** - They are kept for reference only.

---

## Commands Reference

| Command                                | Purpose                         |
| -------------------------------------- | ------------------------------- |
| `npm run migrate`                      | Run pending TypeORM migrations  |
| `npm run migration:show`               | Show migration status           |
| `npm run migration:generate -- <name>` | Generate new migration          |
| `npm run migration:revert`             | Rollback last migration         |
| `npm run seed:typeorm`                 | Run all seeders                 |
| `npm run db:fresh`                     | Clean database + migrate + seed |

---

## Troubleshooting

### Migrations not running

**Check**:

```bash
npm run migration:show
```

**If pending migrations exist**:

```bash
npm run migrate
```

### Migration conflicts

**Cause**: Two migrations trying to create same table

**Solution**:

1. Check migration files for duplicates
2. Delete or rename conflicting migration
3. Run migrations again

### Seeder fails

**Check logs**:

```bash
docker-compose logs backend --tail=100 | grep -i seed
```

**Common issues**:

- Foreign key constraint violation
- Duplicate key error
- Missing required fields

**Solution**:

1. Fix seeder code
2. Reset database: `docker-compose down -v`
3. Restart: `docker-compose up -d`

---

## Best Practices

1. **Always test migrations locally first**

```bash
docker-compose down -v
docker-compose up -d
```

2. **Backup production before migrating**

```bash
pg_dump -U bitcorp bitcorp_prod > backup.sql
```

3. **Use descriptive migration names**

```
AddUserEmailVerificationField
AddEquipmentMaintenanceSchedule
CreateContractAmendmentTable
```

4. **Keep seeders idempotent**

- Check if data exists before inserting
- Use unique constraints
- Handle duplicates gracefully

5. **Document complex migrations**

- Add comments explaining why
- Reference issue/ticket numbers
- Note any data transformations

---

## Production Considerations

### Pre-Deployment Checklist

- [ ] Test migrations on staging
- [ ] Backup production database
- [ ] Schedule maintenance window
- [ ] Notify users of downtime
- [ ] Have rollback plan ready
- [ ] Monitor logs after deployment

### Deployment Steps

```bash
# 1. Backup production
pg_dump -U bitcorp bitcorp_prod > backup-$(date +%Y%m%d).sql

# 2. Pull latest code
git pull origin main

# 3. Run migrations
npm run migrate

# 4. Run seeders (if needed)
npm run seed:typeorm

# 5. Verify
npm run migration:show
```

### Rollback Procedure

If something goes wrong:

```bash
# 1. Revert last migration
npm run migration:revert

# 2. Or restore from backup
psql -U bitcorp bitcorp_prod < backup-YYYYMMDD.sql

# 3. Verify
npm run migration:show
```

---

**Last Updated**: 2026-01-28
**Version**: 1.0.0
