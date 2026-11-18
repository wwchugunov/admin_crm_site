'use strict';
// Full server backups made by the server itself and managed from the owner's admin: every database
// (product and each company), uploaded documents and the server keys, so a new server can be brought up
// from one file with everything working, Telegram bots and bank connections included.
//
// A copy is a .tar.gz kept in <data>/backups. Databases are copied with VACUUM INTO, which gives a
// consistent file while the server keeps working; each copy is checked (PRAGMA quick_check) before it
// is listed. One copy is made automatically every day; the newest KEEP automatic ones are kept, copies
// made by hand stay until deleted. A download is encrypted with a password the owner types
// (AES-256-GCM, key from scrypt): the file contains personal data and the server keys.
// Restore: node tools/restore-server-backup.cjs <file> <folder> (asks for the password).
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), zlib = require('node:zlib');
const { DatabaseSync } = require('node:sqlite');

const DAY = 86400000, KEEP = 14, MAGIC = Buffer.from('LOMVIKO-BACKUP-1\n');
const ID = /^lomviko-\d{8}-\d{6}-(auto|manual)$/;

// A minimal ustar archive (names up to 255 bytes via the prefix field).
function tarEntry(name, body) {
  const header = Buffer.alloc(512), bytes = Buffer.from(name);
  let base = name, prefix = '';
  if (bytes.length > 100) { const cut = name.lastIndexOf('/', 154); prefix = name.slice(0, cut); base = name.slice(cut + 1); }
  header.write(base, 0, 100); header.write('0000600\0', 100); header.write('0000000\0', 108); header.write('0000000\0', 116);
  header.write(body.length.toString(8).padStart(11, '0') + '\0', 124); header.write(Math.floor(Date.now() / 1000).toString(8).padStart(11, '0') + '\0', 136);
  header.write('        ', 148); header.write('0', 156); header.write('ustar\0', 257); header.write('00', 263); header.write(prefix, 345, 155);
  let sum = 0; for (const b of header) sum += b;
  header.write(sum.toString(8).padStart(6, '0') + '\0 ', 148);
  return Buffer.concat([header, body, Buffer.alloc((512 - (body.length % 512)) % 512)]);
}
function untar(buffer) {
  const files = new Map();
  for (let p = 0; p + 512 <= buffer.length; ) {
    const header = buffer.subarray(p, p + 512);
    if (header.every((b) => b === 0)) break;
    const field = (a, b) => header.subarray(a, b).toString().replace(/\0.*$/s, '');
    const size = parseInt(field(124, 136).trim(), 8), prefix = field(345, 500), name = (prefix ? prefix + '/' : '') + field(0, 100);
    files.set(name, buffer.subarray(p + 512, p + 512 + size));
    p += 512 + Math.ceil(size / 512) * 512;
  }
  return files;
}

class ServerBackups {
  constructor({ directory, keep = KEEP }) {
    this.data = directory;
    this.directory = path.join(directory, 'backups');
    this.keep = keep;
    fs.mkdirSync(this.directory, { recursive: true, mode: 0o700 });
  }
  // Files that make up the server: databases, documents, keys. Not the backups themselves.
  files(dir = this.data, prefix = '') {
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix + entry.name, full = path.join(dir, entry.name);
      if (!prefix && ['backups', 'tmp'].includes(entry.name)) continue;
      if (entry.isDirectory()) out.push(...this.files(full, rel + '/'));
      else if (entry.isFile() && !/-(wal|shm|journal)$/.test(entry.name)) out.push(rel);
    }
    return out;
  }
  list() {
    return fs.readdirSync(this.directory)
      .filter((f) => f.endsWith('.json') && ID.test(f.slice(0, -5)))
      .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(this.directory, f), 'utf8')); } catch { return null; } })
      .filter((b) => b && fs.existsSync(path.join(this.directory, b.id + '.tar.gz')))
      .sort((a, b) => b.created_at - a.created_at);
  }
  create(kind = 'manual', now = Date.now()) {
    const digits = new Date(now).toISOString().replace(/\D/g, '').slice(0, 14);
    const id = `lomviko-${digits.slice(0, 8)}-${digits.slice(8)}-${kind === 'auto' ? 'auto' : 'manual'}`;
    if (fs.existsSync(path.join(this.directory, id + '.json'))) throw Object.assign(Error('Копію щойно створено — зачекайте секунду / A copy was just made, wait a second'), { status: 409 });
    const work = fs.mkdtempSync(path.join(this.directory, '.work-'));
    try {
      const parts = [];
      let databases = 0;
      for (const rel of this.files()) {
        const full = path.join(this.data, rel);
        let body;
        if (rel.endsWith('.sqlite')) {
          // A consistent copy of a live database, then checked before it goes into the archive.
          const copy = path.join(work, String(databases++) + '.sqlite'), db = new DatabaseSync(full);
          try { db.exec(`VACUUM INTO '${copy.replaceAll("'", "''")}'`); } finally { db.close(); }
          const check = new DatabaseSync(copy, { readOnly: true });
          try { if (check.prepare('PRAGMA quick_check').get().quick_check !== 'ok') throw Error('Database check failed: ' + rel); } finally { check.close(); }
          body = fs.readFileSync(copy);
        } else body = fs.readFileSync(full);
        parts.push(tarEntry(rel, body));
      }
      const archive = zlib.gzipSync(Buffer.concat([...parts, Buffer.alloc(1024)]));
      fs.writeFileSync(path.join(this.directory, id + '.tar.gz'), archive, { mode: 0o600 });
      const meta = { id, kind: kind === 'auto' ? 'auto' : 'manual', created_at: now, size: archive.length, files: parts.length, databases, sha256: crypto.createHash('sha256').update(archive).digest('hex') };
      fs.writeFileSync(path.join(this.directory, id + '.json'), JSON.stringify(meta), { mode: 0o600 });
      this.prune();
      return meta;
    } finally { fs.rmSync(work, { recursive: true, force: true }); }
  }
  // Automatic copies beyond the newest `keep` go; copies made by hand stay.
  prune() {
    for (const old of this.list().filter((b) => b.kind === 'auto').slice(this.keep)) this.remove(old.id);
  }
  remove(id) {
    if (!ID.test(String(id)) || !fs.existsSync(path.join(this.directory, id + '.json'))) throw Object.assign(Error('Копію не знайдено / Backup not found'), { status: 404 });
    for (const ext of ['.tar.gz', '.json']) fs.rmSync(path.join(this.directory, id + ext), { force: true });
    return { ok: true };
  }
  // The file to download: the archive encrypted with the owner's password.
  encrypted(id, password) {
    if (typeof password !== 'string' || password.length < 12 || password.length > 256) throw Object.assign(Error('Пароль для файлу — щонайменше 12 символів / The file password needs at least 12 characters'), { status: 400 });
    if (!ID.test(String(id)) || !fs.existsSync(path.join(this.directory, id + '.tar.gz'))) throw Object.assign(Error('Копію не знайдено / Backup not found'), { status: 404 });
    const archive = fs.readFileSync(path.join(this.directory, id + '.tar.gz')), salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', crypto.scryptSync(password, salt, 32), iv);
    const body = Buffer.concat([cipher.update(archive), cipher.final()]);
    return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
  }
  // Once a day (checked every hour): a new automatic copy when the last one is a day old.
  schedule() {
    const tick = () => {
      try {
        const last = this.list().find((b) => b.kind === 'auto');
        if (!last || Date.now() - last.created_at >= DAY - 3600000) this.create('auto');
      } catch (e) { console.error('Automatic backup failed:', e.message); }
    };
    this.timer = setInterval(tick, 3600000);
    this.timer.unref?.();
    setTimeout(tick, 60000).unref?.();
  }
  stop() { clearInterval(this.timer); }
}
function decrypt(file, password) {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC)) throw Error('Not a LOMVIKO backup file');
  let p = MAGIC.length;
  const salt = file.subarray(p, (p += 16)), iv = file.subarray(p, (p += 12)), tag = file.subarray(p, (p += 16));
  const decipher = crypto.createDecipheriv('aes-256-gcm', crypto.scryptSync(password, salt, 32), iv);
  decipher.setAuthTag(tag);
  try { return Buffer.concat([decipher.update(file.subarray(p)), decipher.final()]); } catch { throw Error('Wrong password or damaged file'); }
}
module.exports = { ServerBackups, decrypt, untar };
