#!/usr/bin/env bash
set -euo pipefail
umask 077

mail_dir=/opt/lomviko-mail
backup_dir=/opt/backups/lomviko-mail
stamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$backup_dir/lomviko-mail-$stamp.tar.gz"

install -d -m 0700 "$backup_dir"
cd "$mail_dir"

restore_services() {
  docker compose up -d >/dev/null
}
trap restore_services EXIT

docker compose stop -t 30 >/dev/null
tar --xattrs --selinux -czf "$archive" \
  compose.yaml certs secrets \
  /var/lib/docker/volumes/lomviko-mail_stalwart-etc/_data \
  /var/lib/docker/volumes/lomviko-mail_stalwart-data/_data \
  /var/lib/docker/volumes/lomviko-mail_roundcube-db/_data

find "$backup_dir" -type f -name 'lomviko-mail-*.tar.gz' -mtime +7 -delete
