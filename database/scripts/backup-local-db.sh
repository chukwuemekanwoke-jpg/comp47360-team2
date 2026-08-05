#!/usr/bin/env bash
# Dumps the local dev Postgres (table-postgres container) to database/backups/,
# which is gitignored — see .gitignore. Never commit these: they contain
# password_hash values and real user emails.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backups"
mkdir -p "$BACKUP_DIR"

CONTAINER="${POSTGRES_CONTAINER:-table-postgres}"
DB_NAME="${POSTGRES_DB:-table_dev}"
DB_USER="${POSTGRES_USER:-postgres}"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql"

echo "Dumping $DB_NAME from container '$CONTAINER' to $OUT_FILE ..."
docker exec "$CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$OUT_FILE"

echo "Done. $(wc -l < "$OUT_FILE") lines written."
echo "Restore with: docker exec -i $CONTAINER psql -U $DB_USER -d $DB_NAME < \"$OUT_FILE\""
