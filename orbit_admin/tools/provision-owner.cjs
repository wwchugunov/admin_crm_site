const path = require('node:path');
const crypto = require('node:crypto');
const {setup, ProductStore, createProductServer} = require('../owner/server.cjs');
const {passwordHash} = require('../owner/accounts.cjs');
const {PERPETUAL_EXPIRY} = require('../owner/entitlements.cjs');

// Run once on the server. No password, private key or admin secret is printed.
async function provisionOwner(directory, email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')) throw Error('A valid owner email is required');
  const keys = setup(directory), store = new ProductStore(path.join(directory, 'owner.sqlite'));
  const server = createProductServer({store, ...keys});
  try {
    return store.transaction(() => {
      const existing = store.db.prepare('SELECT * FROM users WHERE email=?').get(email.toLowerCase());
      if (existing) {
        if (existing.expires !== PERPETUAL_EXPIRY || existing.stage !== 'active' || existing.account_id)
          throw Error('Email already belongs to an account. Review it in the admin panel; no existing account was changed.');
        return {created:false, user_id:existing.id};
      }
      const id = store.addUser({email, name:'Owner', business:'BIZ — owner testing', days:14, max_devices:10, password_hash:passwordHash(crypto.randomBytes(32).toString('base64url'))});
      const company = server.accounts.addBusiness(id, 'BIZ — owner testing');
      store.db.prepare("UPDATE users SET stage='active',expires=? WHERE id=?").run(PERPETUAL_EXPIRY, id);
      store.event('owner.access.provisioned', id, null, '', 'Dedicated testing company; perpetual account; normal device verification');
      return {created:true, user_id:id, business_id:company};
    });
  } finally { await server.shutdown(); store.db.close(); }
}
if (require.main === module) {
  const [directory, email] = process.argv.slice(2);
  if (!directory) { console.error('Usage: node tools/provision-owner.cjs /data OWNER_EMAIL'); process.exitCode = 1; }
  else provisionOwner(path.resolve(directory), email).then(result => console.log(JSON.stringify({...result, next:'Set your password in the admin panel, then sign in to BIZ. No email has been sent.'}))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = {provisionOwner};
