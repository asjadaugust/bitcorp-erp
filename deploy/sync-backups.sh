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

echo "Syncing backups to NAS: $NAS_TARGET"
rsync -avz --progress "$BACKUP_DIR/" "$NAS_TARGET/"
echo "Sync complete: $(date)"
