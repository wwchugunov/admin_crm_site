'use strict';
// Word (.docx) → a clean web page for the legal documents. Only text is taken from the file: headings,
// paragraphs, bold/italic, lists, tables and links (http, https, mailto). Everything is escaped, so the page
// cannot carry scripts, styles or images from the upload.
const zlib = require('node:zlib');

const MAX_PART = 20 * 1024 * 1024;
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Reads one file from the ZIP container through its central directory.
function unzip(buffer, name) {
  const end = buffer.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (end < 0) throw Error('not a zip');
  const count = buffer.readUInt16LE(end + 10);
  let at = buffer.readUInt32LE(end + 16);
  for (let i = 0; i < count && at + 46 <= buffer.length; i++) {
    if (buffer.readUInt32LE(at) !== 0x02014b50) throw Error('bad zip');
    const method = buffer.readUInt16LE(at + 10), size = buffer.readUInt32LE(at + 20), full = buffer.readUInt32LE(at + 24);
    const nameLength = buffer.readUInt16LE(at + 28), extra = buffer.readUInt16LE(at + 30), comment = buffer.readUInt16LE(at + 32), local = buffer.readUInt32LE(at + 42);
    const file = buffer.subarray(at + 46, at + 46 + nameLength).toString('utf8');
    if (file === name) {
      if (full > MAX_PART) throw Error('part too large');
      const start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28), data = buffer.subarray(start, start + size);
      if (method === 0) return data.toString('utf8');
      if (method === 8) return zlib.inflateRawSync(data, { maxOutputLength: MAX_PART }).toString('utf8');
      throw Error('unsupported compression');
    }
    at += 46 + nameLength + extra + comment;
  }
  return null;
}

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
const attr = (tag, name) => { const m = new RegExp(`${name}="([^"]*)"`).exec(tag); return m ? decode(m[1]) : null; };
const safeHref = (url) => /^(https?:\/\/|mailto:)[^\s<>"']+$/i.test(url || '') ? url : null;

// Runs of a paragraph → escaped inline HTML.
function inline(xml, links) {
  let html = '';
  const parts = xml.match(/<w:hyperlink\b[^>]*>[\s\S]*?<\/w:hyperlink>|<w:r\b[^>]*>[\s\S]*?<\/w:r>/g) || [];
  for (const part of parts) {
    if (part.startsWith('<w:hyperlink')) {
      const href = safeHref(links[attr(part.slice(0, part.indexOf('>')), 'r:id')] || '');
      const text = inline(part.replace(/^<w:hyperlink\b[^>]*>|<\/w:hyperlink>$/g, ''), links);
      html += href && text ? `<a href="${esc(href)}" rel="noopener">${text}</a>` : text;
      continue;
    }
    const props = /<w:rPr>([\s\S]*?)<\/w:rPr>/.exec(part)?.[1] || '';
    const on = (tag) => new RegExp(`<w:${tag}(?:\\s+w:val="(?:true|1|on)")?\\s*/>`).test(props);
    let text = '';
    for (const piece of part.match(/<w:t\b[^>]*>[\s\S]*?<\/w:t>|<w:tab\/>|<w:br\b[^>]*\/>/g) || []) {
      if (piece.startsWith('<w:tab')) text += ' ';
      else if (piece.startsWith('<w:br')) text += '\n';
      else text += decode(piece.replace(/^<w:t\b[^>]*>|<\/w:t>$/g, ''));
    }
    if (!text) continue;
    let out = esc(text).replace(/\n/g, '<br>');
    if (on('b')) out = `<strong>${out}</strong>`;
    if (on('i')) out = `<em>${out}</em>`;
    html += out;
  }
  return html.replace(/<\/strong><strong>/g, '').replace(/<\/em><em>/g, '');
}

function paragraph(xml, styles, links) {
  const style = attr(/<w:pStyle\b[^>]*\/>/.exec(xml)?.[0] || '', 'w:val') || '';
  const name = (styles[style] || style).toLowerCase();
  const list = /<w:numPr>/.test(xml) || /list/.test(name);
  const ordered = list && /<w:numId w:val="[^0"]/.test(xml) && !/bullet/.test(name);
  const html = inline(xml, links).trim();
  if (!html) return null;
  const level = /^(title)$/.test(name) ? 'title' : /heading ?1|заголовок ?1/.test(name) ? 'h2' : /heading ?[2-6]|заголовок ?[2-6]|subtitle/.test(name) ? 'h3' : list ? 'li' : 'p';
  return { level, html, ordered };
}

// Turns a .docx buffer into { title, html }. Throws when the file has no readable text.
function docxPage(buffer) {
  const doc = unzip(buffer, 'word/document.xml');
  if (!doc) throw Error('This Word file has no document text');
  const styles = {};
  for (const m of (unzip(buffer, 'word/styles.xml') || '').matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>[\s\S]*?<w:name w:val="([^"]+)"/g)) styles[m[1]] = m[2];
  const links = {};
  for (const m of (unzip(buffer, 'word/_rels/document.xml.rels') || '').matchAll(/<Relationship\b[^>]*>/g)) { const id = attr(m[0], 'Id'), target = attr(m[0], 'Target'); if (id && /hyperlink/.test(attr(m[0], 'Type') || '')) links[id] = target; }
  const body = /<w:body>([\s\S]*)<\/w:body>/.exec(doc)?.[1] || '';
  const blocks = [];
  for (const m of body.matchAll(/<w:tbl>[\s\S]*?<\/w:tbl>|<w:p\b[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g)) {
    if (m[0].startsWith('<w:tbl')) {
      const rows = (m[0].match(/<w:tr\b[\s\S]*?<\/w:tr>/g) || []).map((row) => (row.match(/<w:tc\b[\s\S]*?<\/w:tc>/g) || []).map((cell) => (cell.match(/<w:p\b[\s\S]*?<\/w:p>/g) || []).map((p) => inline(p, links)).filter(Boolean).join('<br>')));
      if (rows.length) blocks.push({ level: 'table', rows });
    } else { const p = paragraph(m[0], styles, links); if (p) blocks.push(p); }
  }
  let title = '', html = '', list = null;
  const close = () => { if (list) { html += `</${list}>`; list = null; } };
  for (const b of blocks) {
    if (b.level === 'title' && !title) { title = b.html.replace(/<[^>]+>/g, ''); continue; }
    if (b.level === 'li') { const tag = b.ordered ? 'ol' : 'ul'; if (list !== tag) { close(); html += `<${tag}>`; list = tag; } html += `<li>${b.html}</li>`; continue; }
    close();
    if (b.level === 'table') html += `<div class="table"><table>${b.rows.map((r, i) => `<tr>${r.map((c) => i === 0 ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
    else if (b.level === 'title') html += `<h2>${b.html}</h2>`;
    else html += `<${b.level}>${b.html}</${b.level}>`;
  }
  close();
  if (!html && !title) throw Error('This Word file has no document text');
  return { title, html };
}

// The public page around the text: readable on a phone, no scripts, styles inline so it works from any domain.
function legalPage({ lang, title, html, updatedAt, pdfHref, siteUrl }) {
  const en = lang === 'en', date = new Date(updatedAt).toLocaleDateString(en ? 'en-GB' : 'uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' });
  const home = siteUrl ? esc(siteUrl) + (en ? '/en' : '/') : '/';
  return `<!doctype html><html lang="${en ? 'en' : 'uk'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} — LOMVIKO</title><meta name="description" content="${esc(title)} LOMVIKO">`
    + `<style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f4f6f5;color:#16181d;font:16px/1.7 Geologica,'Segoe UI',-apple-system,Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased}`
    + `header{background:#fff;border-bottom:1px solid #e3e7e5}header div,main,footer{max-width:820px;margin:0 auto;padding:0 20px}header div{display:flex;align-items:center;justify-content:space-between;height:64px}`
    + `.mark{display:inline-flex;align-items:center;gap:10px;color:#16181d;text-decoration:none;font-weight:800;letter-spacing:-.02em}.mark b{display:inline-grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,#05523f,#0a8f74 55%,#11a6a0);color:#fff;font-size:15px}`
    + `header a.back{color:#0a8f74;text-decoration:none;font-weight:600;font-size:14px}main{padding-top:40px;padding-bottom:56px}article{background:#fff;border-radius:24px;padding:40px 44px;box-shadow:0 1px 2px rgba(0,0,0,.04)}`
    + `h1{margin:0 0 6px;font-size:clamp(28px,4.4vw,38px);line-height:1.15;letter-spacing:-.03em}.meta{margin:0 0 28px;color:#5b616a;font-size:14px}.meta a{color:#0a8f74;font-weight:600}`
    + `h2{margin:34px 0 10px;font-size:21px;line-height:1.3;letter-spacing:-.01em;color:#06664c}h3{margin:24px 0 8px;font-size:17px}p,li{margin:0 0 10px}ul,ol{margin:0 0 12px;padding-left:24px}a{color:#0a8f74}`
    + `.table{overflow-x:auto;margin:6px 0 16px}table{border-collapse:collapse;width:100%;font-size:14px;line-height:1.5}th,td{border:1px solid #e3e7e5;padding:10px 12px;text-align:left;vertical-align:top}th{background:#eef7f4}`
    + `footer{padding-bottom:40px;color:#8a8f98;font-size:13px}@media(max-width:600px){article{padding:26px 20px;border-radius:18px}main{padding-top:20px}}</style></head>`
    + `<body><header><div><a class="mark" href="${home}"><b>L</b>LOMVIKO</a><a class="back" href="${home}">${en ? '← To the site' : '← На сайт'}</a></div></header>`
    + `<main><article><h1>${esc(title)}</h1><p class="meta">${en ? 'Version of' : 'Редакція від'} ${esc(date)}${pdfHref ? ` · <a href="${esc(pdfHref)}">${en ? 'Download PDF' : 'Завантажити PDF'}</a>` : ''}</p>${html}</article></main>`
    + `<footer>© ${new Date().getFullYear()} LOMVIKO · info@lomviko.com</footer></body></html>`;
}

module.exports = { docxPage, legalPage };
