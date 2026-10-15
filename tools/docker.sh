#!/bin/sh
set -eu
project_directory=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$project_directory"
compose() { docker compose -f "$project_directory/compose.yaml" "$@"; }
case "${1:-start}" in
  start|update)
    compose config --quiet
    compose up -d --build --wait --wait-timeout 180
    compose ps
    ;;
  status) compose ps ;;
  logs) compose logs --tail=100 -f ;;
  stop) compose stop ;;
  code) node tools/admin-login-code.cjs ;;
  credentials)
    umask 077
    mkdir -p .runtime
    chmod 700 .runtime
    compose exec -T api node tools/admin-setup.cjs /data --show-credentials > .runtime/admin-access.txt.tmp
    mv .runtime/admin-access.txt.tmp .runtime/admin-access.txt
    chmod 600 .runtime/admin-access.txt
    echo "Saved administrator credentials: $project_directory/.runtime/admin-access.txt"
    ;;
  *) echo "Usage: sh tools/docker.sh [start|update|status|logs|stop|credentials|code]"; exit 2 ;;
esac
