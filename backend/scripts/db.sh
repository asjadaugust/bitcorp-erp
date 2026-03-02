#!/usr/bin/env bash
# Database management script for BitCorp ERP backend
#
# Run from inside the container:
#   bash scripts/db.sh <command>
#
# Or via docker-compose exec from the host:
#   docker-compose -f docker-compose.dev.yml exec backend bash scripts/db.sh <command>
#
# Commands:
#   migrate    — apply all pending migrations (alembic upgrade head)
#   downgrade  — revert all migrations (alembic downgrade base)
#   fresh      — downgrade then upgrade (wipe schema + re-apply all migrations + seeds)
#   revision   — create a new empty migration (pass -m "description")
#   history    — show migration history
#   current    — show current revision

set -euo pipefail

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
  echo "Usage: bash scripts/db.sh <migrate|downgrade|fresh|revision|history|current>"
  exit 1
fi

case "$COMMAND" in
  migrate)
    echo "Running migrations..."
    alembic upgrade head
    ;;
  downgrade)
    echo "Reverting all migrations..."
    alembic downgrade base
    ;;
  fresh)
    echo "Wiping schema and re-applying all migrations..."
    alembic downgrade base
    alembic upgrade head
    ;;
  revision)
    shift
    echo "Creating new migration revision..."
    alembic revision --autogenerate "$@"
    ;;
  history)
    alembic history --verbose
    ;;
  current)
    alembic current
    ;;
  *)
    echo "Unknown command: $COMMAND"
    echo "Valid commands: migrate, downgrade, fresh, revision, history, current"
    exit 1
    ;;
esac
