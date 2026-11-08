#!/usr/bin/env bash
# usage: quickstart_run.sh <ref> <out>; fresh clone, README quick start, one error sent, real counts recorded.
# The .env copy is not in the README (open PR #489); it is needed to get as far as the bug.
set -u
REF=$1; OUT=$2; HERE=$(cd "$(dirname "$0")" && pwd); W=$HERE/../fresh-$REF; rm -rf "$W"
git clone -q "${REPO:-https://github.com/superloglabs/superlog}" "$W"; cd "$W" || exit 1; git checkout -q "$REF"
: > "$OUT"; log(){ echo "$*" | tee -a "$OUT"; }
for f in $(git ls-files | grep -E '\.env\.example$'); do cp "$f" "${f%.example}"; done
P=$(basename "$PWD" | tr -cd 'a-z0-9-_')
docker compose up -d >/dev/null 2>&1; sleep 10
pnpm install --frozen-lockfile >/dev/null 2>&1
pnpm --filter @superlog/db db:migrate >/dev/null 2>&1
if grep -q 'clickhouse:migrate' package.json; then
  log '$ pnpm clickhouse:migrate'; pnpm -s clickhouse:migrate 2>&1 | grep -E '==> applying' | tee -a "$OUT"
  log '$ pnpm clickhouse:migrate   # again: must be a no-op'; pnpm -s clickhouse:migrate 2>&1 | grep -E 'applying' | tee -a "$OUT"; log "(exit ${PIPESTATUS[0]})"
fi
KEY=$(mktemp); DATABASE_URL=postgres://postgres:postgres@localhost:5434/superlog pnpm --filter @superlog/db db:seed 2>&1 | grep -oE 'api key: +.*' | awk '{print $3}' > "$KEY"
nohup pnpm dev > "$OUT.dev.log" 2>&1 & D=$!
for _ in $(seq 60); do curl -s -m 1 -o /dev/null http://localhost:4000/ && break; sleep 2; done; sleep 8
log '$ send one error span + one ERROR log to :4000'; python3 -I "$HERE/send_error.py" http://localhost:4000 "$KEY" "$REF" | sed -E "s/ b'.*//" | tee -a "$OUT"
sleep 40
CH(){ docker compose exec -T clickhouse clickhouse-client -q "$1" 2>/dev/null; }; PG(){ docker compose exec -T postgres psql -U postgres -d superlog -Atc "$1" 2>/dev/null; }
log "spans stored: $(CH 'SELECT count() FROM superlog.otel_traces')"
log "logs stored:  $(CH 'SELECT count() FROM superlog.otel_logs')"
log "issues:       $(PG 'select count(*) from issues')"
log "incidents:    $(PG 'select count(*) from incidents')"
log "worker UNKNOWN_TABLE lines in about 1 min: $(grep -c UNKNOWN_TABLE "$OUT.dev.log")"
PG 'select title from issues limit 1' | sed 's/^/issue title:  /' | tee -a "$OUT"
kill $D 2>/dev/null; pkill -f "turbo run dev" 2>/dev/null; sleep 3
for port in 4000 4100 5173; do /usr/sbin/lsof -ti ":$port" 2>/dev/null | xargs kill 2>/dev/null; done
docker compose down -v >/dev/null 2>&1; rm -f "$KEY"; cd "$HERE/.."; rm -rf "$W"
