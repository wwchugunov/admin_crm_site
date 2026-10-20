#!/bin/sh
set -eu
deploy_directory=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$deploy_directory"
if [ ! -f .env ]; then
  (umask 077; cp .env.example .env)
  echo "Created deploy/.env. Set your five domains, then run this command again."
  exit 2
fi
compose() { docker compose --env-file .env -f compose.yaml -f compose.website.yaml "$@"; }
compose config --quiet
case "${1:-start}" in
  start|update)
    compose build
    trap 'rm -f .preflight-config.tmp' EXIT HUP INT TERM
    (umask 077; compose config --format json > .preflight-config.tmp)
    docker run --rm -i --network none --read-only --cap-drop ALL --security-opt no-new-privileges --entrypoint node "$(sed -n 's/^ *image: \(lomviko-platform:[0-9.]*\)$/\1/p' compose.yaml | head -1)" tools/deployment-preflight.cjs < .preflight-config.tmp
    rm -f .preflight-config.tmp
    compose up -d --wait --wait-timeout 180
    compose ps
    ;;
  status) compose ps ;;
  logs) compose logs --tail=100 -f ;;
  stop) compose stop ;;
  *) echo "Usage: sh deploy/manage.sh [start|update|status|logs|stop]"; exit 2 ;;
esac
