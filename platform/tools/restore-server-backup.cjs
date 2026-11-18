'use strict';
// Unpacks a server backup downloaded from the admin (Backups page) into a folder that can be used as the
// server's data directory (ORBIT_OWNER_DATA / the orbit-data volume).
// Usage: node tools/restore-server-backup.cjs <backup.lomviko-backup> <empty folder>
// The password is read from LOMVIKO_BACKUP_PASSWORD or asked for.
const fs = require('node:fs'), path = require('node:path'), zlib = require('node:zlib'), readline = require('node:readline');
const { decrypt, untar } = require('../core/server-backup.cjs');

async function password() {
  if (process.env.LOMVIKO_BACKUP_PASSWORD) return process.env.LOMVIKO_BACKUP_PASSWORD;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  rl._writeToOutput = (s) => { if (!rl.stdoutMuted) rl.output.write(s); };
  return new Promise((resolve) => { rl.question('Backup password: ', (v) => { rl.close(); process.stdout.write('\n'); resolve(v); }); rl.stdoutMuted = true; });
}
(async () => {
  const [file, target] = process.argv.slice(2);
  if (!file || !target) { console.error('Usage: node tools/restore-server-backup.cjs <backup file> <empty folder>'); process.exit(2); }
  if (fs.existsSync(target) && fs.readdirSync(target).length) { console.error('The target folder must be empty.'); process.exit(2); }
  const files = untar(zlib.gunzipSync(decrypt(fs.readFileSync(file), await password())));
  for (const [name, body] of files) {
    if (name.includes('..') || path.isAbsolute(name)) throw Error('Unsafe path in backup: ' + name);
    const out = path.join(target, name);
    fs.mkdirSync(path.dirname(out), { recursive: true, mode: 0o700 });
    fs.writeFileSync(out, body, { mode: 0o600 });
  }
  console.log(`Restored ${files.size} files into ${target}`);
})().catch((e) => { console.error(e.message); process.exit(1); });
