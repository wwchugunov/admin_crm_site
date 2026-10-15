#!/usr/bin/env node
// Manages keys that may publish LOMVIKO desktop releases (and nothing else).
//   node tools/release-key.cjs <data-dir> add "<name>" < release-public.pem
//   node tools/release-key.cjs <data-dir> list
//   node tools/release-key.cjs <data-dir> revoke <id>
'use strict';
const fs=require('node:fs'),path=require('node:path');
const{ProductStore}=require('../owner/server.cjs');
const{ReleasePublishing}=require('../owner/release-publishing.cjs');
const[directory,command,arg]=process.argv.slice(2);
if(!directory||!['add','list','revoke'].includes(command)){console.error('Usage: release-key.cjs <data-dir> add "<name>" < public.pem | list | revoke <id>');process.exit(2);}
const store=new ProductStore(path.join(path.resolve(directory),'owner.sqlite'));
try{
 const keys=new ReleasePublishing(store,{directory:''});
 if(command==='add'){const id=keys.add(arg,fs.readFileSync(0,'utf8'));console.log(`Release key added: ${id} (${arg})`);}
 else if(command==='revoke'){keys.revoke(arg);console.log(`Release key revoked: ${arg}`);}
 else for(const k of keys.list())console.log(`${k.id}  ${k.revoked?'revoked':'active '}  ${new Date(k.created_at).toISOString()}  ${k.name}`);
}finally{store.db.close();}
