#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

log() {
	echo "[$(date +"%H:%M:%S")] $*"
}

IN_DOCKER=false
if [[ -f "/.dockerenv" ]]; then
	IN_DOCKER=true
fi

DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-secret}"
DB_NAME="${DB_NAME:-mempa_db}"
DB_PORT="${DB_PORT:-5432}"
DB_HOST="${DB_HOST:-}"

if [[ -z "$DB_HOST" ]]; then
	if [[ "$IN_DOCKER" == true ]]; then
		DB_HOST="mempa-db"
	else
		DB_HOST="localhost"
	fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
	export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
fi

if [[ "$IN_DOCKER" == false ]]; then
	if ! command -v docker >/dev/null 2>&1; then
		echo "Docker is required to start the database container."
		exit 1
	fi

	if ! docker ps --format '{{.Names}}' | grep -q '^mempa-db$'; then
		if docker ps -a --format '{{.Names}}' | grep -q '^mempa-db$'; then
			log "Starting existing mempa-db container..."
			docker start mempa-db >/dev/null
		else
			log "Creating mempa-db container..."
			docker run --name mempa-db \
				-e POSTGRES_USER="$DB_USER" \
				-e POSTGRES_PASSWORD="$DB_PASSWORD" \
				-e POSTGRES_DB="$DB_NAME" \
				-p "${DB_PORT}:5432" \
				-v mempa_db_data:/var/lib/postgresql/data \
				-d postgres:16-alpine >/dev/null
		fi
	fi
fi

log "Waiting for database to accept connections..."
attempt=1
max_attempts=20
migrate_log="$(mktemp)"

until npx prisma migrate deploy >"$migrate_log" 2>&1; do
	if [[ "$attempt" -ge "$max_attempts" ]]; then
		echo "Database not ready after ${max_attempts} attempts."
		echo "Last error:"
		cat "$migrate_log"
		rm -f "$migrate_log"
		exit 1
	fi

	log "Database not ready (attempt ${attempt}/${max_attempts}). Retrying..."
	attempt=$((attempt + 1))
	sleep 2
done

rm -f "$migrate_log"

log "Seeding data..."
npx tsx scripts/seed-all.ts

log "Database initialized."