const crypto=require('node:crypto'),fs=require('node:fs'),path=require('node:path');
// Replaceable public documents. Each kind keeps one current version per language plus an archive.
const KINDS=['site-privacy','site-offer','presentation','app-privacy'];
const LANGUAGES=['uk','en'];
const MAX_SIZE=25*1024*1024;
const TYPES={
 pdf:{type:'application/pdf',inline:true},
 docx:{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',inline:false},
 doc:{type:'application/msword',inline:false},
};
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
   CREATE INDEX IF NOT EXISTS documents_current ON documents(kind,language,active);`);
 }
 path(id){if(!/^[a-f0-9-]{36}$/.test(id||''))fail('Document not found',404);return path.join(this.directory,id);}
 temporary(){return path.join(this.directory,`${crypto.randomUUID()}.partial`);}
 // Called after the upload proof is verified; the partial file becomes a stored version.
 add(temporary,meta,size,sha256){
  const k=kind(meta.kind),lang=language(meta.language),t=title(meta.title),{name,extension}=filename(meta.filename);
  if(!Number.isSafeInteger(size)||size<1||size>MAX_SIZE)fail('Document must be at most 25 MiB',413);
  sniff(temporary,extension);
  const id=crypto.randomUUID(),activate=meta.activate!==false;
  fs.linkSync(temporary,this.path(id));
  try{this.store.transaction(()=>{
   if(activate)this.db.prepare('UPDATE documents SET active=0 WHERE kind=? AND language=?').run(k,lang);
   this.db.prepare('INSERT INTO documents VALUES(?,?,?,?,?,?,?,?,?,?)').run(id,k,lang,t,name,extension,size,sha256,Date.now(),activate?1:0);
   this.store.event('document.uploaded',null,null,lang,k);
  });}catch(error){fs.rmSync(this.path(id),{force:true});throw error;}
  return this.row(id);
 }
 row(id){const row=this.db.prepare('SELECT * FROM documents WHERE id=?').get(id);if(!row)fail('Document not found',404);return row;}
 owned(data){const row=this.row(String(data?.id||''));if(data.kind!==undefined&&row.kind!==data.kind)fail('Document not found',404);return row;}
 activate(data){const row=this.owned(data);this.store.transaction(()=>{this.db.prepare('UPDATE documents SET active=0 WHERE kind=? AND language=?').run(row.kind,row.language);this.db.prepare('UPDATE documents SET active=1 WHERE id=?').run(row.id);this.store.event('document.activated',null,null,row.language,row.kind);});return{ok:true};}
 // Deleting the current version promotes the newest remaining one, so public links keep working.
 delete(data){
  const row=this.owned(data);
  this.store.transaction(()=>{
   this.db.prepare('DELETE FROM documents WHERE id=?').run(row.id);
   if(row.active){const next=this.db.prepare('SELECT id FROM documents WHERE kind=? AND language=? ORDER BY uploaded_at DESC LIMIT 1').get(row.kind,row.language);if(next)this.db.prepare('UPDATE documents SET active=1 WHERE id=?').run(next.id);}
   this.store.event('document.deleted',null,null,row.language,row.kind);
  });
  fs.rmSync(this.path(row.id),{force:true});return{ok:true};
 }
 list(){return this.db.prepare('SELECT id,kind,language,title,filename,extension,size,sha256,uploaded_at,active FROM documents ORDER BY kind,language,uploaded_at DESC').all().map(r=>({...r,active:!!r.active}));}
 current(k,lang){return this.db.prepare('SELECT * FROM documents WHERE kind=? AND language=? AND active=1').get(k,lang)||null;}
 // Public metadata: the current version per kind and language, falling back to the other language.
 public(){
  const result={};
  for(const k of KINDS){const entry={};for(const lang of LANGUAGES){const row=this.current(k,lang)||this.current(k,LANGUAGES.find(l=>l!==lang));if(row)entry[lang]={title:row.title,extension:row.extension,size:row.size,updatedAt:row.uploaded_at,language:row.language,path:`/public/documents/${k}/${lang}`};}if(Object.keys(entry).length)result[k]=entry;}
  return result;
 }
 resolve(k,lang){kind(k);language(lang);const row=this.current(k,lang)||this.current(k,LANGUAGES.find(l=>l!==lang));if(!row)fail('Document is not published',404);return row;}
 async send(res,row,head=false){
  const file=this.path(row.id),digest=crypto.createHash('sha256');
  for await(const chunk of fs.createReadStream(file))digest.update(chunk);
  if(digest.digest('hex')!==row.sha256)fail('Document integrity check failed',409);
  res.writeHead(200,{'Content-Type':TYPES[row.extension].type,'Content-Length':row.size,'Content-Disposition':disposition(row),'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Last-Modified':new Date(row.uploaded_at).toUTCString()});
  if(head)return res.end();
  const stream=fs.createReadStream(file);res.on('close',()=>stream.destroy());stream.on('error',()=>res.destroy());stream.pipe(res);
 }
}
module.exports={Documents,KINDS,LANGUAGES,MAX_SIZE};
