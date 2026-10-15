const {test}=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {Releases}=require('../owner/releases.cjs');
test('Signed metadata uses one clock reading so its lifetime never exceeds five minutes',()=>{
 const {privateKey,publicKey}=crypto.generateKeyPairSync('ed25519'),original=Date.now;let clock=1700000000000;
 try{Date.now=()=>clock++;const envelope=Releases.prototype.sign.call({privateKey},{mandatory:false});const payload=Buffer.from(envelope.payload,'base64url');assert(crypto.verify(null,payload,publicKey,Buffer.from(envelope.signature,'base64url')));const value=JSON.parse(payload);assert.equal(value.expires-value.issued,300000);}finally{Date.now=original;}
});
