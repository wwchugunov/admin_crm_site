const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const DAY = 'public, max-age=86400', YEAR = 'public, max-age=31536000, immutable';
const STATIC = new Map([
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8', 'no-cache']],
  ['/motion.js', ['motion.js', 'text/javascript; charset=utf-8', 'no-cache']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8', 'no-cache']],
  ['/favicon.svg', ['favicon.svg', 'image/svg+xml', DAY]],
  ['/assets/crm.png', ['assets/crm.png', 'image/png', DAY]],
  ['/assets/icon.png', ['assets/icon.png', 'image/png', DAY]],
  ['/assets/app.png', ['assets/app.png', 'image/png', DAY]],
  ['/assets/og.png', ['assets/og.png', 'image/png', DAY]],
  ['/assets/og-en.png', ['assets/og-en.png', 'image/png', DAY]],
  ['/assets/icon-192.png', ['assets/icon-192.png', 'image/png', DAY]],
  ['/assets/icon-512.png', ['assets/icon-512.png', 'image/png', DAY]],
  ['/assets/apple-touch-icon.png', ['assets/apple-touch-icon.png', 'image/png', DAY]],
  ['/robots.txt', ['robots.txt', 'text/plain; charset=utf-8', DAY]],
  ['/sitemap.xml', ['sitemap.xml', 'application/xml; charset=utf-8', DAY]],
  ['/fonts/OFL.txt', ['fonts/OFL.txt', 'text/plain; charset=utf-8', DAY]],
  ...['onest-cyrillic-wght-normal', 'onest-latin-wght-normal', 'geologica-cyrillic-wght-normal', 'geologica-latin-wght-normal', 'jetbrains-mono-cyrillic-400-normal', 'jetbrains-mono-latin-400-normal', 'jetbrains-mono-cyrillic-500-normal', 'jetbrains-mono-latin-500-normal'].map(name => [`/fonts/${name}.woff2`, [`fonts/${name}.woff2`, 'font/woff2', YEAR]]),
]);
const PAGES = new Map([['/', 'uk'], ['/en', 'en']]);
// Short public addresses for replaceable documents managed in the website admin.
const DOCUMENTS = new Map([['privacy', 'site-privacy'], ['terms', 'site-terms'], ['offer', 'site-offer'], ['presentation', 'presentation']].flatMap(([slug, kind]) => [[`/${slug}`, [kind, 'uk']], [`/en/${slug}`, [kind, 'en']]]));
const DOCUMENT_TYPES = new Set(['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
function missingDocument(language) {
  const en = language === 'en';
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#ffffff"><title>LOMVIKO</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head><body><main class="wrap final"><h2>${en ? 'This document is <em>on its way.</em>' : 'Документ <em>готується.</em>'}</h2><p class="section-intro">${en ? 'We are updating it right now. Please check back a little later.' : 'Ми саме оновлюємо його. Будь ласка, загляньте трохи пізніше.'}</p><div class="hero-actions"><a class="btn btn-light" href="${en ? '/en' : '/'}">${en ? 'Back to LOMVIKO' : 'На головну LOMVIKO'}</a></div></main></body></html>`;
}
// Unknown addresses opened in a browser get a page with a way back, not a JSON error.
function notFound(language) {
  const en = language === 'en';
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="theme-color" content="#ffffff"><title>${en ? 'Page not found' : 'Сторінку не знайдено'} · LOMVIKO</title><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css"></head><body><main class="wrap final"><h2>${en ? 'This page <em>does not exist.</em>' : 'Такої сторінки <em>немає.</em>'}</h2><p class="section-intro">${en ? 'The link may be outdated or mistyped. Everything about LOMVIKO is on the home page.' : 'Можливо, посилання застаріло або в ньому помилка. Усе про LOMVIKO — на головній сторінці.'}</p><div class="hero-actions"><a class="btn btn-light" href="${en ? '/en' : '/'}">${en ? 'Back to LOMVIKO' : 'На головну LOMVIKO'}</a></div></main></body></html>`;
}
// The English page reuses index.html with its own head metadata, so crawlers and link previews see English text.
function page(directory, language) {
  const html = fs.readFileSync(path.join(directory, 'index.html'), 'utf8');
  if (language === 'uk') return html;
  const head = fs.readFileSync(path.join(directory, `head.${language}.html`), 'utf8').trim();
  return html.replace('<html lang="uk">', `<html lang="${language}">`).replace(/<!--meta:start-->[\s\S]*?<!--meta:end-->/, head);
}
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'";
function upstream(raw) {
  const u = new URL(raw);
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/' || !['http:', 'https:'].includes(u.protocol)) throw Error('CH_API_URL must be an origin without credentials or path');
  return u.origin;
}
function createServer({ apiUrl = 'http://127.0.0.1:4545', trustProxy = false, directory = path.join(__dirname, 'public') } = {}) {
  const origin = upstream(apiUrl), rates = new Map();
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Content-Security-Policy',csp);res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Cache-Control','no-store');
    const json = (status, value) => { if (!res.headersSent) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value)); } };
    try {
      const url = new URL(req.url,'http://localhost'), route = url.pathname, read = req.method === 'GET' || req.method === 'HEAD';
      const asset = STATIC.get(route), language = PAGES.get(route), document = DOCUMENTS.get(route);
      // Pages and static files ignore marketing parameters such as utm_source, gclid or fbclid; API paths stay strict.
      if (url.search && route.startsWith('/public/') && !(read && (asset || language || document || route === '/en/'))) return json(400,{error:'Query parameters are not supported'});
      if (req.method === 'GET' && route === '/healthz') return json(200,{status:'ok'});
      if (read && route === '/en/') { res.writeHead(301,{Location:'/en'+url.search});return res.end(); }
      if (read && language) {
        const html = Buffer.from(page(directory, language));
        res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Length':html.length,'Cache-Control':'no-cache','Content-Language':language});
        return res.end(req.method === 'HEAD' ? undefined : html);
      }
      if (read && document) {
        const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 120000), disconnect = () => { if (!res.writableFinished) abort.abort(); };
        res.once('close', disconnect);
        try {
          const response = await fetch(`${origin}/public/documents/${document[0]}/${document[1]}`, { method: req.method, redirect: 'error', signal: abort.signal });
          const type = (response.headers.get('content-type') || '').split(';')[0];
          if (!response.ok || !DOCUMENT_TYPES.has(type)) {
            if (response.status !== 404 && response.ok) throw Error('Unexpected document response');
            const html = Buffer.from(missingDocument(document[1]));
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
            return res.end(req.method === 'HEAD' ? undefined : html);
          }
          // The site CSP (object-src 'none') would stop the browser PDF viewer; documents are type-restricted and nosniff.
          res.removeHeader('Content-Security-Policy');
          const headers = { 'Content-Type': type, 'Cache-Control': 'no-cache' };
          for (const key of ['content-length', 'content-disposition', 'last-modified']) if (response.headers.has(key)) headers[key] = response.headers.get(key);
          res.writeHead(200, headers);
          if (req.method === 'HEAD' || !response.body) return res.end();
          await pipeline(Readable.fromWeb(response.body), res); return;
        } finally { clearTimeout(timeout); res.off('close', disconnect); }
      }
      if (read && asset) {
        const filename = path.join(directory, asset[0]), stat = fs.statSync(filename);res.writeHead(200,{'Content-Type':asset[1],'Content-Length':stat.size,'Cache-Control':asset[2]});
        if (req.method === 'HEAD') return res.end();
        await pipeline(fs.createReadStream(filename),res);return;
      }
      const allowed = (req.method === 'GET' && route === '/public/site') || (req.method === 'POST' && ['/public/demo','/public/access'].includes(route));
      if (!allowed) {
        if (read && /text\/html/.test(req.headers.accept || '') && !route.startsWith('/public/')) {
          const html = Buffer.from(notFound(route === '/en' || route.startsWith('/en/') ? 'en' : 'uk'));
          res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': html.length });
          return res.end(req.method === 'HEAD' ? undefined : html);
        }
        return json(404,{error:'Not found'});
      }
      let body;
      if (req.method === 'POST') {
        if (req.headers['sec-fetch-site'] === 'cross-site') return json(403,{error:'Cross-site requests are not accepted'});
        if (!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return json(415,{error:'JSON required'});
        const ip = trustProxy ? String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim() : req.socket.remoteAddress;
        const now=Date.now();for(const [key,value]of rates)if(now-value.at>3600000)rates.delete(key);
        const r=rates.get(ip)||{at:now,count:0};if(r.count>=5||(!rates.has(ip)&&rates.size>=10000))return json(429,{error:'Please try again later'});r.count++;rates.set(ip,r);
        const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16384){json(413,{error:'Request too large'});return;}chunks.push(chunk);}body=Buffer.concat(chunks);try{JSON.parse(body.toString());}catch{return json(400,{error:'Invalid JSON'});}
      }
      const abort = new AbortController(), timeout = setTimeout(()=>abort.abort(), 15000);
      const disconnect=()=>{if(!res.writableFinished)abort.abort();};res.once('close',disconnect);
      try {
        // No cookies, credentials, client headers, arbitrary paths, or redirects pass through.
        const response = await fetch(origin+route,{method:req.method,headers:body?{'Content-Type':'application/json'}:{},body,redirect:'error',signal:abort.signal});
        const payload = await response.json();return json(response.status,payload);
      } finally { clearTimeout(timeout);res.off('close',disconnect); }
    } catch { if(!res.headersSent&&!res.destroyed)json(502,{error:'Service temporarily unavailable. Please try again later.'});else if(!res.destroyed)res.destroy(); }
  });
  server.requestTimeout=30000;server.headersTimeout=10000;return server;
}
module.exports = { createServer, upstream };
if (require.main === module) {
  const server=createServer({apiUrl:process.env.CH_API_URL||'http://127.0.0.1:4545',trustProxy:process.env.CH_TRUST_PROXY==='1'});
  server.listen(Number(process.env.PORT||4546),process.env.HOST||'127.0.0.1',()=>console.log(`CH landing: http://${process.env.HOST||'127.0.0.1'}:${server.address().port}`));
  let stopping=false;const stop=()=>{if(stopping)return;stopping=true;server.close();server.closeIdleConnections();const deadline=setTimeout(()=>{server.closeAllConnections();},15000);deadline.unref();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
