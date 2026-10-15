const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');
const STATIC = new Map([['/', ['index.html','text/html; charset=utf-8']], ['/app.js',['app.js','text/javascript; charset=utf-8']], ['/motion.js',['motion.js','text/javascript; charset=utf-8']], ['/style.css',['style.css','text/css; charset=utf-8']], ['/assets/crm.png',['assets/crm.png','image/png']], ['/assets/icon.png',['assets/icon.png','image/png']], ['/robots.txt',['robots.txt','text/plain; charset=utf-8']]]);
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
      const url = new URL(req.url,'http://localhost'), route = url.pathname;
      if (url.search) return json(400,{error:'Query parameters are not supported'});
      if (req.method === 'GET' && route === '/healthz') return json(200,{status:'ok'});
      const asset = STATIC.get(route);
      if (req.method === 'GET' && asset) {
        const filename = path.join(directory, asset[0]), stat = fs.statSync(filename);res.writeHead(200,{'Content-Type':asset[1],'Content-Length':stat.size});await pipeline(fs.createReadStream(filename),res);return;
      }
      const download = /^\/public\/download\/(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\.(0|[1-9]\d{0,4})\/(mac|win)\/(x64|arm64)$/.test(route);
      const allowed = (req.method === 'GET' && (route === '/public/site' || download)) || (req.method === 'POST' && ['/public/demo','/public/access'].includes(route));
      if (!allowed) return json(404,{error:'Not found'});
      let body;
      if (req.method === 'POST') {
        if (req.headers['sec-fetch-site'] === 'cross-site') return json(403,{error:'Cross-site requests are not accepted'});
        if (!/^application\/json(?:;|$)/i.test(req.headers['content-type']||'')) return json(415,{error:'JSON required'});
        const ip = trustProxy ? String(req.headers['x-forwarded-for']||req.socket.remoteAddress).split(',').at(-1).trim() : req.socket.remoteAddress;
        const now=Date.now();for(const [key,value]of rates)if(now-value.at>3600000)rates.delete(key);
        const r=rates.get(ip)||{at:now,count:0};if(r.count>=5||(!rates.has(ip)&&rates.size>=10000))return json(429,{error:'Please try again later'});r.count++;rates.set(ip,r);
        const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>16384){json(413,{error:'Request too large'});return;}chunks.push(chunk);}body=Buffer.concat(chunks);try{JSON.parse(body.toString());}catch{return json(400,{error:'Invalid JSON'});}
      }
      const abort = new AbortController(), timeout = setTimeout(()=>abort.abort(), download?15*60000:15000);
      const disconnect=()=>{if(!res.writableFinished)abort.abort();};res.once('close',disconnect);
      try {
        // No cookies, credentials, client headers, arbitrary paths, or redirects pass through.
        const response = await fetch(origin+route,{method:req.method,headers:body?{'Content-Type':'application/json'}:{},body,redirect:'error',signal:abort.signal});
        const type = response.headers.get('content-type') || 'application/json; charset=utf-8';
        if (!response.ok || !download) {
          const payload = await response.json();return json(response.status,payload);
        }
        if (type !== 'application/octet-stream') throw Error('Unexpected download response');
        const headers={'Content-Type':type};
        for(const key of ['content-length','content-disposition'])if(response.headers.has(key))headers[key]=response.headers.get(key);
        res.writeHead(200,headers);await pipeline(Readable.fromWeb(response.body),res);
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
