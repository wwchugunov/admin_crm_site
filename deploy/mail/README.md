# LOMVIKO mail server

Production services:

- Stalwart Mail Server: SMTP `25`, submissions `465`, submission with STARTTLS `587`, IMAPS `993`.
- Roundcube: `https://webmail.lomviko.com`.
- Stalwart administration: `https://mail.lomviko.com/admin/`.

The Caddy container terminates HTTPS for Roundcube and the Stalwart web interface. Stalwart loads the same certificate from `/opt/lomviko-mail/certs` for SMTP and IMAP. The systemd path unit copies every renewed Caddy certificate and restarts only Stalwart.

Secrets are never stored in Git. On the production server they live under `/opt/lomviko-mail/secrets`; workstation credentials live in `/Applications/CHProjects/.runtime/` with mode `0600`.

Daily local backups run through `lomviko-mail-backup.timer`, retain eight days, and briefly stop the two mail containers to create a consistent archive. Copy `/opt/backups/lomviko-mail` to independent storage before relying on it for disaster recovery.

Apply the deployment files on the server:

```bash
install -d -m 0700 /opt/lomviko-mail/secrets
cp deploy/mail/compose.yaml /opt/lomviko-mail/compose.yaml
cp deploy/mail/sync-certificate.sh /usr/local/sbin/sync-lomviko-mail-cert
cp deploy/mail/backup.sh /usr/local/sbin/backup-lomviko-mail
cp deploy/mail/lomviko-mail-*.service deploy/mail/lomviko-mail-*.timer deploy/mail/lomviko-mail-*.path /etc/systemd/system/
chmod 0750 /usr/local/sbin/sync-lomviko-mail-cert /usr/local/sbin/backup-lomviko-mail
systemctl daemon-reload
systemctl enable --now lomviko-mail-cert.path lomviko-mail-backup.timer
cd /opt/lomviko-mail && docker compose up -d
```
