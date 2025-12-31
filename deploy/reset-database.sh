#!/bin/bash
set -e

echo "⚠️  WARNING: This will DROP and RECREATE the entire database!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

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

echo "Dropping database: $DB_NAME..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "DROP DATABASE IF EXISTS $DB_NAME;"

echo "Creating database: $DB_NAME..."
psql -h $DB_HOST -p $DB_PORT -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "Initializing database..."
./init-database.sh

echo "Database reset complete!"
