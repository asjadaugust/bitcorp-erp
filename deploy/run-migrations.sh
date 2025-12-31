#!/bin/bash
set -e

echo "Running database migrations..."

# Load environment variables
if [ -f .env.prod ]; then
    source .env.prod
elif [ -f ../.env ]; then
    source ../.env
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-bitcorp_erp}
DB_USER=${DB_USER:-bitcorp}

if [ -d "../database/migrations" ]; then
    for migration in ../database/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "Applying: $(basename $migration)"
            psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration"
        fi
    done
    echo "Migrations complete!"
else
    echo "No migrations directory found."
fi
