const crypto=require('node:crypto');
// Proof that a person accepted the public offer and the app privacy policy (Law of Ukraine "On
// electronic commerce", art. 11–12: acceptance by registration; the emailed one-time code is an
// electronic signature by a one-time identifier). Each record keeps who, which document versions
// (fingerprint of the published file), when, how, from which device and IP.
const DOCS={offer:'site-offer',terms:'site-terms',privacy:'app-privacy'};
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
class Legal{
 constructor({store,fail}){Object.assign(this,{store,db:store.db,fail});
  this.db.exec('CREATE TABLE IF NOT EXISTS legal_acceptances(id TEXT PRIMARY KEY,user_id TEXT,email TEXT NOT NULL,offer_version TEXT NOT NULL,privacy_version TEXT NOT NULL,method TEXT NOT NULL,ip TEXT NOT NULL,device TEXT NOT NULL,app_version TEXT NOT NULL,accepted_at INTEGER NOT NULL);CREATE INDEX IF NOT EXISTS legal_user ON legal_acceptances(user_id)');}
 version(kind){
  // A document the owner switched off is not shown and not accepted; switching it on asks everyone again.
  try{if(this.db.prepare('SELECT disabled FROM document_switches WHERE kind=?').get(kind)?.disabled)return{version:'off',date:null};}catch{}
  try{const r=this.db.prepare("SELECT sha256,uploaded_at FROM documents WHERE kind=? AND language='uk' AND active=1 ORDER BY extension='docx' DESC,extension='pdf' DESC,uploaded_at DESC LIMIT 1").get(kind);if(r)return{version:r.sha256.slice(0,16),date:r.uploaded_at};}catch{}
  return{version:'none',date:null};
 }
 // The contract people accept: the public offer while it is published (sales on), otherwise the free terms of use.
 // The "offer" slot keeps its name for stored acceptances; switching between the two asks everyone again.
 contract(){const offer=this.version(DOCS.offer);if(!['off','none'].includes(offer.version))return{kind:DOCS.offer,...offer};const terms=this.version(DOCS.terms);return{kind:DOCS.terms,...(terms.version==='none'?{version:'off',date:null}:terms)};}
 current(){const offer=this.contract();return{offer,privacy:this.version(DOCS.privacy),links:{offer:`/public/documents/${offer.kind}/uk`,privacy:`/public/documents/${DOCS.privacy}/uk`}};}
 record({userId=null,email,method,ip='',device='',app=''}){
  const c=this.current();
  this.db.prepare('INSERT INTO legal_acceptances VALUES(?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(),userId,String(email).toLowerCase(),c.offer.version,c.privacy.version,method,String(ip||'').slice(0,64),String(device||'').slice(0,128),String(app||'').slice(0,30),Date.now());
  return c;
 }
 accepted(userId){const c=this.current();return Boolean(this.db.prepare('SELECT id FROM legal_acceptances WHERE user_id=? AND offer_version=? AND privacy_version=?').get(userId,c.offer.version,c.privacy.version));}
 status(user){const c=this.current(),last=this.db.prepare('SELECT accepted_at,method FROM legal_acceptances WHERE user_id=? ORDER BY accepted_at DESC LIMIT 1').get(user.id);return{required:!this.accepted(user.id),updated:Boolean(last),last:last||null,...c};}
 history(userId){return this.db.prepare('SELECT offer_version,privacy_version,method,ip,app_version,accepted_at FROM legal_acceptances WHERE user_id=? ORDER BY accepted_at DESC').all(userId);}
 forget(userIds,emails){for(const id of userIds)this.db.prepare('DELETE FROM legal_acceptances WHERE user_id=?').run(id);for(const e of emails)this.db.prepare('DELETE FROM legal_acceptances WHERE email=?').run(e);}
 // /v1/legal/status and /v1/legal/accept for signed-in apps (also after access ended).
 async handle(req,url,reply,accounts){
  if(!url.pathname.startsWith('/v1/legal/'))return false;
  if(req.method==='GET'&&url.pathname==='/v1/legal/current')return reply(200,this.current()),true;
  const {user,device}=accounts.session(req,{anyStage:true});
  if(req.method==='GET'&&url.pathname==='/v1/legal/status')return reply(200,this.status(user)),true;
  if(req.method==='POST'&&url.pathname==='/v1/legal/accept'){
   const d=req.parsedBody||{},c=this.current();
   // The person accepts exactly the versions they were shown; a newer upload in between asks again.
   if(d.offer_version!==c.offer.version||d.privacy_version!==c.privacy.version)this.fail(409,'Документи щойно оновилися — перегляньте нову редакцію / Documents were just updated');
   this.record({userId:user.id,email:user.email,method:'app-signed',ip:req.clientAddress,device:device?.id||'',app:String(d.app_version||'')});
   return reply(200,this.status(user)),true;
  }
  this.fail(404,'Not found');
 }
}
module.exports={Legal,DOCS,hash};
