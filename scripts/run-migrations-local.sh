#!/bin/bash

echo "🔄 Running database migrations locally..."

# Check if postgres container is running
if ! docker ps | grep -q bitcorp-postgres-dev; then
    echo "❌ Postgres container is not running. Please start docker-compose first."
    exit 1
fi

# Run schema migration
echo "📋 Running schema migration..."
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/migrations/001_consolidated_schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Schema migration completed"
else
    echo "❌ Schema migration failed"
    exit 1
fi

# Run seed data
echo "📋 Running seed data..."
docker exec -i bitcorp-postgres-dev psql -U bitcorp -d bitcorp_dev < database/migrations/002_seed_data.sql

if [ $? -eq 0 ]; then
    echo "✅ Seed data loaded"
else
    echo "❌ Seed data failed"
    exit 1
fi

echo "✅ All migrations completed successfully!"
echo "🔐 You can now login with:"
echo "   - Admin: admin / admin123"
echo "   - Operator: operator / operator123"
