const OrbitI18n = require('./ui/i18n.js');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

class Vault {
  constructor(directory, safeStorage) { this.directory = directory; this.safe = safeStorage; fs.mkdirSync(directory, { recursive: true, mode: 0o700 }); }
  file(key) { if (!/^[a-z_]+$/.test(key)) throw Error('Invalid secret key'); return path.join(this.directory, `${key}.secret`); }
  available() { return this.safe.isEncryptionAvailable() && this.safe.getSelectedStorageBackend?.() !== 'basic_text'; }
  put(key, value) {
    if (!this.available()) throw Error(OrbitI18n.t('m574'));
    const file = this.file(key), temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, this.safe.encryptString(value), { mode: 0o600 }); fs.renameSync(temporary, file);
  }
  get(key) { if (!fs.existsSync(this.file(key))) return null; if (!this.available()) throw Error(OrbitI18n.t('m575')); return this.safe.decryptString(fs.readFileSync(this.file(key))); }
  has(key) { return fs.existsSync(this.file(key)); }
  remove(key) { fs.rmSync(this.file(key), { force: true }); }
}
function encryptBackup(data, password) {
  if (typeof password !== 'string' || password.length < 12 || password.length > 1024) throw Error(OrbitI18n.t('m576'));
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), key = crypto.scryptSync(password, salt, 32);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
  return Buffer.from(JSON.stringify({ format: 'orbit-encrypted', version: 1, salt: salt.toString('base64'), iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: encrypted.toString('base64') }));
}
function decryptBackup(buffer, password) {
  try {
    const e = JSON.parse(buffer.toString()); if (e.format !== 'orbit-encrypted' || e.version !== 1) throw Error();
    const key = crypto.scryptSync(password, Buffer.from(e.salt, 'base64'), 32);
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(e.iv, 'base64')); decipher.setAuthTag(Buffer.from(e.tag, 'base64'));
    return JSON.parse(Buffer.concat([decipher.update(Buffer.from(e.data, 'base64')), decipher.final()]).toString('utf8'));
  } catch { throw Error(OrbitI18n.t('m577')); }
}
module.exports = { Vault, encryptBackup, decryptBackup };
