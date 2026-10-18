#!/usr/bin/env bash
# Disposable marketplace journey check: supabase/postgres + PostgREST in Docker,
# every migration applied, then src/app/dashboard/marketplace/marketplace.e2e.test.ts.
# Never points at a real project. Containers are removed afterwards.
set -euo pipefail

cd "$(dirname "$0")/.."
PG_PORT="${MARKETPLACE_E2E_PG_PORT:-54329}"
REST_PORT="${MARKETPLACE_E2E_REST_PORT:-54330}"
JWT_SECRET="${MARKETPLACE_E2E_JWT_SECRET:-local-test-jwt-secret-at-least-32-chars-long}"
export PGPASSWORD=postgres

cleanup() { docker rm -f appraisal-e2e-db appraisal-e2e-rest >/dev/null 2>&1 || true; }
trap cleanup EXIT
cleanup

docker run -d --name appraisal-e2e-db -e POSTGRES_PASSWORD=postgres -p "$PG_PORT:5432" supabase/postgres:15.8.1.060 >/dev/null
for _ in $(seq 1 60); do psql -h localhost -p "$PG_PORT" -U postgres -tAc "select 1" >/dev/null 2>&1 && break; sleep 2; done
sleep 2

psql -h localhost -p "$PG_PORT" -U postgres -q -v ON_ERROR_STOP=1 -f supabase/tests/local-auth-shim.sql
for f in supabase/migrations/*.sql; do
  psql -h localhost -p "$PG_PORT" -U postgres -q -v ON_ERROR_STOP=1 -f "$f" >/dev/null
done
psql -h localhost -p "$PG_PORT" -U supabase_admin -d postgres -q -c "ALTER ROLE authenticator WITH LOGIN PASSWORD 'postgres'"

docker run -d --name appraisal-e2e-rest --network host \
  -e PGRST_SERVER_PORT="$REST_PORT" \
  -e PGRST_DB_URI="postgres://authenticator:postgres@localhost:$PG_PORT/postgres" \
  -e PGRST_DB_SCHEMAS=public -e PGRST_DB_ANON_ROLE=anon \
  -e PGRST_JWT_SECRET="$JWT_SECRET" postgrest/postgrest:v12.2.3 >/dev/null
# PostgREST answers 503 until its schema cache has loaded; wait for a real table response.
for _ in $(seq 1 60); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$REST_PORT/organizations?limit=1" || true)
  [ "$code" != "000" ] && [ "$code" != "503" ] && break
  sleep 1
done

MARKETPLACE_E2E=1 npx vitest run --config vitest.config.mts src/app/dashboard/marketplace/marketplace.e2e.test.ts
