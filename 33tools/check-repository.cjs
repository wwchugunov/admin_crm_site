const fs=require('node:fs'),{execFileSync}=require('node:child_process');
const files=execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const stages=execFileSync('git',['ls-files','--stage','-z'],{encoding:'utf8'}).split('\0').filter(Boolean);
const indexed=new Map(stages.map(row=>{const [meta,name]=row.split('\t');return [name,meta.split(' ')[0]];}));
const bad=[];
const secret=/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----|(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16}|sk-[A-Za-z0-9_-]{32,}/;
for(const name of new Set(files)){
 if(/(^|\/)(node_modules|\.runtime|data|vault|backups|releases|dist|\.owner-data)(\/|$)|\.(pem|key|secret|sqlite[^/]*|db|p12|pfx|exe|dmg|log)$/i.test(name)||(/(^|\/)\.env(?:\.|$)/.test(name)&&!name.endsWith('.env.example'))){bad.push(name+': runtime data');continue;}
 const stat=fs.lstatSync(name,{throwIfNoEntry:false});if(indexed.get(name)==='120000'||stat?.isSymbolicLink()){bad.push(name+': symbolic link');continue;}
 const buffers=[];if(stat?.isFile())buffers.push(fs.readFileSync(name));if(indexed.has(name))buffers.push(execFileSync('git',['show',':'+name],{maxBuffer:10*1024*1024}));
 if(buffers.some(b=>!b.includes(0)&&secret.test(b.toString('utf8'))))bad.push(name+': credential pattern');
}
if(bad.length){console.error(bad.join('\n'));process.exitCode=1;}else console.log(`Repository check passed (${files.length} files); no runtime data or recognized secrets.`);
