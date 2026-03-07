#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Load env for NAS_SSH_TARGET
if [ -f "$SCRIPT_DIR/.env.prod" ]; then
    set -a
    source "$SCRIPT_DIR/.env.prod"
    set +a
fi

NAS_TARGET="${NAS_SSH_TARGET:-}"

if [ -z "$NAS_TARGET" ]; then
    echo "ERROR: NAS_SSH_TARGET not set in .env.prod"
    exit 1
fi

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A "$BACKUP_DIR" 2>/dev/null)" ]; then
    echo "No backups to sync"
    exit 0
fi

NAS_PORT="${NAS_SSH_PORT:-22}"
NAS_KEY="${NAS_SSH_KEY:-}"
SSH_OPTS="-o StrictHostKeyChecking=no -p ${NAS_PORT}"
if [ -n "$NAS_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i ${NAS_KEY}"
fi

echo "Syncing backups to NAS: $NAS_TARGET"
rsync -avz --progress -e "ssh ${SSH_OPTS}" "$BACKUP_DIR/" "$NAS_TARGET/"
echo "Sync complete: $(date)"
