# Database Management Scripts

## Available Scripts

### Initialize Database

```bash
./deploy/init-database.sh
```

Creates database schema and runs initial migrations.

### Reset Database

```bash
./deploy/reset-database.sh
```

⚠️ **WARNING**: Drops and recreates the entire database. Use only in development!

### Run Migrations

```bash
./deploy/run-migrations.sh
```

Applies any pending database migrations.

## Manual Database Commands

### Connect to Database

```bash
# Using docker-compose
docker-compose exec postgres psql -U bitcorp -d bitcorp_erp

# Or directly
psql -U bitcorp -d bitcorp_erp
```

### Backup Database

```bash
pg_dump -U bitcorp bitcorp_erp > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U bitcorp bitcorp_erp < backup_20231230.sql
```

## Migration Files

Database migrations are stored in:

- `database/001_init_schema.sql` - Initial schema
- `database/002_seed.sql` - Seed data
- `database/migrations/` - Migration files
