const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
const {docxPage}=require('./docx-page.cjs');
// Legal texts become a web page from their Word file; the presentation stays a file.
const LEGAL=['site-privacy','site-terms','site-offer','app-privacy'];
// Replaceable public documents. Each kind keeps one current version per language plus an archive.
const KINDS=['site-privacy','site-terms','site-offer','presentation','app-privacy'];
const LANGUAGES=['uk','en'];
const MAX_SIZE=25*1024*1024;
const TYPES={
 pdf:{type:'application/pdf',inline:true},
 docx:{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',inline:false},
 doc:{type:'application/msword',inline:false},
};
// Each document keeps two current files per language: a PDF that the site and the app show, and a Word file
// to edit and send to a lawyer. Uploading one replaces only the current file of the same format.
const GROUP=extension=>extension==='pdf'?'pdf':'word';
const SAME_GROUP="(CASE WHEN extension='pdf' THEN 'pdf' ELSE 'word' END)=?";
function fail(message,status=400){throw Object.assign(Error(message),{status});}
function kind(value){if(!KINDS.includes(value))fail('Unknown document type');return value;}
function language(value){if(!LANGUAGES.includes(value))fail('Unsupported document language');return value;}
function title(value){if(typeof value!=='string'||!value.trim()||value.length>160)fail('Document title is required (up to 160 characters)');return value.trim();}
function filename(value){
 if(typeof value!=='string'||!value.trim()||value.length>200)fail('File name is required');
 const name=path.basename(value.trim()).replace(/[\u0000-\u001f\u007f"\\/]/g,'_');
 const extension=name.toLowerCase().split('.').pop();if(!TYPES[extension]||name.startsWith('.'))fail('Only PDF, DOC and DOCX files are accepted');
 return{name,extension};
}
// The declared extension must match the file signature, so a renamed script or archive is rejected.
function sniff(file,extension){
 const fd=fs.openSync(file,'r'),head=Buffer.alloc(8);try{fs.readSync(fd,head,0,8,0);}finally{fs.closeSync(fd);}
 const ok=extension==='pdf'?head.subarray(0,5).toString('latin1')==='%PDF-':extension==='docx'?head.subarray(0,4).equals(Buffer.from([0x50,0x4b,0x03,0x04])):head.equals(Buffer.from([0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1]));
 if(!ok)fail('File content does not match a PDF, DOC or DOCX document');
}
function disposition(row){const ascii=row.filename.replace(/[^\x20-\x7e]/g,'_');return `${TYPES[row.extension].inline?'inline':'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(row.filename)}`;}
class Documents{
 constructor(store,directory){
  Object.assign(this,{store,db:store.db,directory});fs.mkdirSync(directory,{recursive:true,mode:0o700});
  this.db.exec(`CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,kind TEXT NOT NULL,language TEXT NOT NULL,title TEXT NOT NULL,filename TEXT NOT NULL,extension TEXT NOT NULL,size INTEGER NOT NULL,sha256 TEXT NOT NULL,uploaded_at INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 0);
   CREATE INDEX IF NOT EXISTS documents_current ON documents(kind,language,active);
   CREATE TABLE IF NOT EXISTS document_switches(kind TEXT PRIMARY KEY,disabled INTEGER NOT NULL);`);
 }
 path(id){if(!/^[a-f0-9-]{36}$/.test(id||''))fail('Document not found',404);return path.join(this.directory,id);}
 temporary(){return path.join(this.directory,`${crypto.randomUUID()}.partial`);}
 // Called after the upload proof is verified; the partial file becomes a stored version.
 add(temporary,meta,size,sha256){
  const k=kind(meta.kind),lang=language(meta.language),t=title(meta.title),{name,extension}=filename(meta.filename);
  if(!Number.isSafeInteger(size)||size<1||size>MAX_SIZE)fail('Document must be at most 25 MiB',413);
  sniff(temporary,extension);
  const id=crypto.randomUUID(),activate=meta.activate!==false;
  let page=null;
  if(extension==='docx'&&LEGAL.includes(k)){try{page=docxPage(fs.readFileSync(temporary));}catch{fail('Не вдалося прочитати текст із Word-файлу. Відкрийте його у Word, збережіть як .docx і завантажте ще раз / The Word file could not be read');}}
  fs.linkSync(temporary,this.path(id));
  if(page)fs.writeFileSync(this.path(id)+'.page.json',JSON.stringify({title:page.title||t,html:page.html}),{mode:0o600});
  try{this.store.transaction(()=>{
   if(activate)this.db.prepare(`UPDATE documents SET active=0 WHERE kind=? AND language=? AND ${SAME_GROUP}`).run(k,lang,GROUP(extension));
   this.db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,k,lang,t,name,extension,size,sha256,Date.now(),activate?1:0);
   this.store.event('document.uploaded',null,null,lang,k);
  });}catch(error){fs.rmSync(this.path(id),{force:true});fs.rmSync(this.path(id)+'.page.json',{force:true});throw error;}
  return this.row(id);
 }
 row(id){const row=this.db.prepare('SELECT * FROM documents WHERE id=?').get(id);if(!row)fail('Document not found',404);return row;}
 owned(data){const row=this.row(String(data?.id||''));if(data.kind!==undefined&&row.kind!==data.kind)fail('Document not found',404);return row;}
 activate(data){const row=this.owned(data);this.store.transaction(()=>{this.db.prepare(`UPDATE documents SET active=0 WHERE kind=? AND language=? AND ${SAME_GROUP}`).run(row.kind,row.language,GROUP(row.extension));this.db.prepare('UPDATE documents SET active=1 WHERE id=?').run(row.id);this.store.event('document.activated',null,null,row.language,row.kind);});return{ok:true};}
 // Deleting the current version promotes the newest remaining one, so public links keep working.
 delete(data){
  const row=this.owned(data);
  this.store.transaction(()=>{
   this.db.prepare('DELETE FROM documents WHERE id=?').run(row.id);
   if(row.active){const next=this.db.prepare(`SELECT id FROM documents WHERE kind=? AND language=? AND ${SAME_GROUP} ORDER BY uploaded_at DESC LIMIT 1`).get(row.kind,row.language,GROUP(row.extension));if(next)this.db.prepare('UPDATE documents SET active=1 WHERE id=?').run(next.id);}
   this.store.event('document.deleted',null,null,row.language,row.kind);
  });
  fs.rmSync(this.path(row.id),{force:true});fs.rmSync(this.path(row.id)+'.page.json',{force:true});return{ok:true};
 }
 // A switched-off kind keeps its files but disappears from the website and the app until switched on again.
 disabled(k){return Boolean(this.db.prepare('SELECT disabled FROM document_switches WHERE kind=?').get(k)?.disabled);}
 disabledKinds(){return this.db.prepare('SELECT kind FROM document_switches WHERE disabled=1 ORDER BY kind').all().map(r=>r.kind);}
 setEnabled(data){
  const k=kind(data?.kind);if(typeof data.enabled!=='boolean')fail('Choose whether the document is shown');
  this.store.transaction(()=>{this.db.prepare('INSERT INTO document_switches VALUES(?,?) ON CONFLICT(kind) DO UPDATE SET disabled=excluded.disabled').run(k,data.enabled?0:1);this.store.event(data.enabled?'document.enabled':'document.disabled',null,null,'all',k);});
  return{ok:true};
 }
 list(){return this.db.prepare('SELECT id,kind,language,title,filename,extension,size,sha256,uploaded_at,active FROM documents ORDER BY kind,language,uploaded_at DESC').all().map(r=>({...r,active:!!r.active}));}
 // What people see: the current PDF; a Word file only while no PDF has been uploaded.
 // Legal texts: the Word file is the source (it becomes the page); otherwise the current PDF comes first.
 current(k,lang){return this.db.prepare(`SELECT * FROM documents WHERE kind=? AND language=? AND active=1 ORDER BY ${LEGAL.includes(k)?"extension='docx' DESC,":''}extension='pdf' DESC,uploaded_at DESC LIMIT 1`).get(k,lang)||null;}
 currentPdf(k,lang){return this.db.prepare("SELECT * FROM documents WHERE kind=? AND language=? AND active=1 AND extension='pdf'").get(k,lang)||null;}
 // The web page of a legal text, when its current Word file was readable.
 page(row){if(!row||row.extension!=='docx'||!LEGAL.includes(row.kind))return null;try{return JSON.parse(fs.readFileSync(this.path(row.id)+'.page.json','utf8'));}catch{return null;}}
 // Public metadata: the current version per kind and language, falling back to the other language.
 public(){
  const result={};
  for(const k of KINDS){const entry={};for(const lang of LANGUAGES){const row=this.pick(k,lang);if(row)entry[lang]={title:row.title,extension:row.extension,size:row.size,updatedAt:row.uploaded_at,language:row.language,path:`/public/documents/${k}/${lang}`};}if(Object.keys(entry).length)result[k]=entry;}
  return result;
 }
 // One privacy policy covers the site and the app: until a separate site version is uploaded, the site shows the app's.
 pick(k,lang){const other=LANGUAGES.find(l=>l!==lang),get=x=>this.disabled(x)?null:this.current(x,lang)||this.current(x,other);return get(k)||(k==='site-privacy'?get('app-privacy'):null);}
 resolve(k,lang){kind(k);language(lang);const row=this.pick(k,lang);if(!row)fail('Document is not published',404);return row;}
 async send(res,row,head=false){
  const file=this.path(row.id),digest=crypto.createHash('sha256');
  for await(const chunk of fs.createReadStream(file))digest.update(chunk);
  if(digest.digest('hex')!==row.sha256)fail('Document integrity check failed',409);
  res.writeHead(200,{'Content-Type':TYPES[row.extension].type,'Content-Length':row.size,'Content-Disposition':disposition(row),'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Last-Modified':new Date(row.uploaded_at).toUTCString()});
  if(head)return res.end();
  const stream=fs.createReadStream(file);res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
 }
}
// Shown instead of a JSON error when a visitor opens a document link that is switched off or not uploaded yet.
function unavailable(res,lang,head=false){
 const en=lang==='en',html=Buffer.from(`<!doctype html><html lang="${en?'en':'uk'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>LOMVIKO</title></head><body><h1>${en?'This document is not available right now.':'Документ зараз недоступний.'}</h1><p>${en?'Please check back a little later.':'Будь ласка, загляньте трохи пізніше.'}</p></body></html>`);
 res.writeHead(404,{'Content-Type':'text/html; charset=utf-8','Content-Length':html.length,'Cache-Control':'no-cache'});res.end(head?undefined:html);
}
module.exports={Documents,KINDS,LEGAL,LANGUAGES,MAX_SIZE,unavailable};
