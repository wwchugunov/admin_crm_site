const OrbitI18n=require('./ui/i18n.js');
const fs = require('node:fs');
function googleClient(config) {
  const client = config?.installed;
  if (!client || typeof client.client_id !== 'string' || !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(client.client_id) || typeof client.client_secret !== 'string' || !client.client_secret.trim() || client.client_secret.length > 500) {
    throw Error(OrbitI18n.t('googleDesktop'));
  }
  return { client_id: client.client_id, client_secret: client.client_secret };
}
function loadGoogleClient(filename) {
  if (!fs.existsSync(filename)) return null;
  try { return googleClient(JSON.parse(fs.readFileSync(filename, 'utf8'))); }
  catch { throw Error(OrbitI18n.t('googleConfig')); }
}
module.exports = { googleClient, loadGoogleClient };
