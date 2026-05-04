#!/usr/bin/env bash
set -e

until npx prisma migrate deploy; do
  echo "Database not ready yet. Retrying..."
  sleep 2
done

npx tsx ./scripts/seed-all.ts
