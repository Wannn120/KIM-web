#!/usr/bin/env bash
set -euo pipefail
mkdir -p backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "$DATABASE_URL" > "backup/backup_${TIMESTAMP}.sql"
else
  echo "DATABASE_URL not set; skipping database backup." >&2
fi
