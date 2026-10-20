const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
function git(args){return execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();}
if(git(['status','--porcelain']))throw Error('Commit the reviewed changes before preparing a deployment.');
execFileSync(process.execPath,[path.join(__dirname,'check-repository.cjs')],{cwd:root,stdio:'inherit'});
const commit=git(['rev-parse','HEAD']),directory=path.join(root,'.runtime');fs.mkdirSync(directory,{recursive:true,mode:0o700});
const file=path.join(directory,`biz-platform-${commit.slice(0,12)}.tar.gz`);
git(['archive','--format=tar.gz','--prefix=admin_crm_site/','--output='+file,'HEAD']);
const sha256=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
fs.writeFileSync(file+'.json',JSON.stringify({commit,sha256,file:path.basename(file)},null,2)+'\n');
console.log(JSON.stringify({archive:file,commit,sha256}));
