#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.prod.yml"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_DIR="$SCRIPT_DIR/logs"
LAST_GOOD_TAG_FILE="$SCRIPT_DIR/.last-good-tag"
HEALTH_URL="http://localhost:3400/health"
HEALTH_TIMEOUT=150  # 2.5 minutes
MAX_BACKUPS=10

mkdir -p "$BACKUP_DIR" "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/deploy_${TIMESTAMP}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

die() {
    log "ERROR: $*"
    exit 1
}

backup_database() {
    log "Backing up database..."
    local backup_file="$BACKUP_DIR/backup_${TIMESTAMP}.sql.gz"

    if docker compose -f "$COMPOSE_FILE" ps postgres --status running -q 2>/dev/null | grep -q .; then
        docker compose -f "$COMPOSE_FILE" exec -T postgres \
            pg_dump -U "${POSTGRES_USER:-bitcorp}" "${POSTGRES_DB:-bitcorp_prod}" \
            | gzip > "$backup_file"
        log "Backup saved: $backup_file ($(du -h "$backup_file" | cut -f1))"
    else
        log "WARNING: Postgres not running, skipping backup"
    fi
}

prune_backups() {
    local count
    count=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" | wc -l)
    if [ "$count" -gt "$MAX_BACKUPS" ]; then
        log "Pruning old backups (keeping $MAX_BACKUPS)..."
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -printf '%T@ %p\n' \
            | sort -n | head -n "-$MAX_BACKUPS" | awk '{print $2}' \
            | xargs rm -f
    fi
}

health_check() {
    log "Running health check (timeout: ${HEALTH_TIMEOUT}s)..."
    local elapsed=0
    local interval=5

    while [ $elapsed -lt $HEALTH_TIMEOUT ]; do
        if curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
            log "Health check passed!"
            return 0
        fi
        sleep $interval
        elapsed=$((elapsed + interval))
        log "Waiting for backend... (${elapsed}s / ${HEALTH_TIMEOUT}s)"
    done

    log "Health check FAILED after ${HEALTH_TIMEOUT}s"
    return 1
}

run_migrations() {
    log "Running database migrations..."
    docker compose -f "$COMPOSE_FILE" exec -T backend \
        alembic upgrade head
    log "Migrations complete"
}

do_deploy() {
    local tag="$1"
    log "=== DEPLOYING $tag ==="

    # Save current tag for rollback
    if [ -f "$LAST_GOOD_TAG_FILE" ]; then
        local previous_tag
        previous_tag=$(cat "$LAST_GOOD_TAG_FILE")
        log "Previous good tag: $previous_tag"
    fi

    # Backup
    backup_database
    prune_backups

    # Checkout tag
    log "Fetching and checking out $tag..."
    cd "$PROJECT_DIR"
    git fetch --tags
    git checkout "$tag" || die "Failed to checkout $tag"

    # Rebuild
    log "Rebuilding containers..."
    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d --build

    # Wait for postgres to be healthy before migrations
    log "Waiting for postgres..."
    local pg_wait=0
    while [ $pg_wait -lt 60 ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-bitcorp}" > /dev/null 2>&1; then
            break
        fi
        sleep 2
        pg_wait=$((pg_wait + 2))
    done

    # Migrations
    run_migrations

    # Health check
    if health_check; then
        echo "$tag" > "$LAST_GOOD_TAG_FILE"
        log "=== DEPLOY SUCCESSFUL: $tag ==="
    else
        log "=== DEPLOY FAILED, ROLLING BACK ==="
        if [ -n "${previous_tag:-}" ]; then
            do_rollback "$previous_tag"
        else
            log "No previous tag to rollback to!"
            exit 1
        fi
    fi
}

do_rollback() {
    local tag="$1"
    log "=== ROLLING BACK to $tag ==="

    cd "$PROJECT_DIR"
    git checkout "$tag" || die "Failed to checkout $tag"

    docker compose -f "$COMPOSE_FILE" down
    docker compose -f "$COMPOSE_FILE" up -d --build

    # Wait for postgres
    local pg_wait=0
    while [ $pg_wait -lt 60 ]; do
        if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U "${POSTGRES_USER:-bitcorp}" > /dev/null 2>&1; then
            break
        fi
        sleep 2
        pg_wait=$((pg_wait + 2))
    done

    # Restore latest backup if available
    local latest_backup
    latest_backup=$(find "$BACKUP_DIR" -name "backup_*.sql.gz" -printf '%T@ %p\n' | sort -rn | head -1 | awk '{print $2}')
    if [ -n "$latest_backup" ]; then
        log "Restoring database from $latest_backup..."
        gunzip -c "$latest_backup" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U "${POSTGRES_USER:-bitcorp}" "${POSTGRES_DB:-bitcorp_prod}"
        log "Database restored"
    fi

    if health_check; then
        echo "$tag" > "$LAST_GOOD_TAG_FILE"
        log "=== ROLLBACK SUCCESSFUL: $tag ==="
    else
        die "ROLLBACK FAILED! Manual intervention required."
    fi
}

usage() {
    echo "Usage: $0 {deploy|rollback} <tag>"
    echo ""
    echo "  deploy  <tag>   Deploy a specific release tag"
    echo "  rollback <tag>  Rollback to a previous tag"
    echo ""
    echo "Examples:"
    echo "  $0 deploy v1.3.0"
    echo "  $0 rollback v1.2.0"
    exit 1
}

# Load env
if [ -f "$SCRIPT_DIR/.env.prod" ]; then
    set -a
    source "$SCRIPT_DIR/.env.prod"
    set +a
fi

# Main
case "${1:-}" in
    deploy)
        [ -z "${2:-}" ] && usage
        do_deploy "$2" 2>&1 | tee -a "$LOG_FILE"
        ;;
    rollback)
        [ -z "${2:-}" ] && usage
        do_rollback "$2" 2>&1 | tee -a "$LOG_FILE"
        ;;
    *)
        usage
        ;;
esac
