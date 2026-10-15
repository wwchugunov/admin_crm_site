const fs = require('node:fs');
const assert = require('node:assert/strict');
try {
  const config = JSON.parse(fs.readFileSync(0, 'utf8'));
  const environment = config.services.https.environment;
  const names = ['ORBIT_DOMAIN', 'ORBIT_WEBSITE_DOMAIN', 'CH_APP_ADMIN_DOMAIN', 'CH_SITE_ADMIN_DOMAIN'];
  const domains = names.map(name => {
    const domain = environment[name];
    assert(typeof domain === 'string' && domain.length <= 253 && domain.includes('.'), `${name}: enter a public DNS hostname`);
    assert(domain.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label)), `${name}: hostname only, without https://, path or port`);
    assert(!/(^|\.)(example|test|invalid|localhost)(\.|$)/i.test(domain) && !/^\d+(\.\d+){3}$/.test(domain), `${name}: replace the placeholder with your real domain`);
    return domain.toLowerCase();
  });
  assert(new Set(domains).size === 4, 'Use four different hostnames for website, API and both admin panels');
  for (const name of ['orbit', 'landing', 'app-admin', 'site-admin']) {
    assert(config.services[name], `Missing service: ${name}`);
    assert(!config.services[name].ports?.length, `Do not publish the internal port of ${name}`);
  }
  console.log('Deployment preflight passed: four distinct domains; internal API/admin ports are not published.');
} catch (error) {
  console.error('Deployment preflight failed: ' + error.message);
  process.exitCode = 1;
}
