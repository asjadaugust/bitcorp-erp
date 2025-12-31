#!/bin/bash
set -e

echo "Initializing Bitcorp ERP database..."

# Load environment variables
if [ -f .env.prod ]; then
    source .env.prod
elif [ -f ../.env ]; then
    source ../.env
fi

# Database connection parameters
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-bitcorp_erp}
DB_USER=${DB_USER:-bitcorp}

echo "Connecting to database: $DB_NAME at $DB_HOST:$DB_PORT"

# Run initial schema
echo "Running initial schema..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/001_init_schema.sql

# Run seed data
echo "Running seed data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f ../database/002_seed.sql

# Run migrations if directory exists
if [ -d "../database/migrations" ]; then
    echo "Running migrations..."
    for migration in ../database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Applying: $(basename $migration)"
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration"
        fi
    done
fi

echo "Database initialization complete!"
