#!/usr/bin/env bash
set -euo pipefail

source_dir=/var/lib/docker/volumes/orbit-admin_caddy-data/_data/caddy/certificates/acme-v02.api.letsencrypt.org-directory/mail.lomviko.com
target_dir=/opt/lomviko-mail/certs

install -d -m 0700 -o 2000 -g 2000 "$target_dir"
changed=0

for extension in crt key; do
  source_file="$source_dir/mail.lomviko.com.$extension"
  target_file="$target_dir/mail.lomviko.com.$extension"
  if [[ ! -f "$target_file" ]] || ! cmp -s "$source_file" "$target_file"; then
    install -m 0600 -o 2000 -g 2000 "$source_file" "$target_file"
    changed=1
  fi
done

if [[ "$changed" -eq 1 ]] && docker ps --format '{{.Names}}' | grep -qx 'lomviko-mail-stalwart-1'; then
  cd /opt/lomviko-mail
  docker compose restart stalwart
fi
