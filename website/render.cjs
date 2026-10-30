const { parseHTML } = require('linkedom');
const { renderPublic, publicSnapshot } = require('./public/content.js');

function renderPage(template, language, site = null) {
  const { document } = parseHTML(template);
  renderPublic(document, { language, site });
  document.querySelector('link[rel="preload"][as="font"]').href = `/fonts/geologica-${language === 'en' ? 'latin' : 'cyrillic'}-wght-normal.woff2`;
  const data = document.createElement('script');
  data.id = 'public-site-data'; data.type = 'application/json';
  data.textContent = JSON.stringify(site).replace(/</g, '\\u003c');
  document.body.append(data);
  return document.toString().replace(/<!--meta:(?:start|end)-->/g, '');
}

module.exports = { publicSnapshot, renderPage };
