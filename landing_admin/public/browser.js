'use strict';
let authenticated;
async function request(url,options={}){const r=await fetch(url,{...options,credentials:'same-origin',redirect:'error'}),d=await r.json();if(!r.ok){if(r.status===401&&url!=='/web/login'){authenticated=null;showLogin();}throw Error(d.error||'Request failed');}return d;}
function showLogin(){let form=document.querySelector('#web-login');if(form)return;form=document.createElement('form');form.id='web-login';form.innerHTML='<h2></h2><p>Admin secret + verification code / Код підтвердження</p><label>Admin secret<input name="token" type="password" required minlength="32" maxlength="300" autocomplete="off"></label><label>Verification code<input name="otp" required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code"></label><button class="primary">Sign in / Увійти</button><p role="status"></p>';form.querySelector('h2').textContent=document.title;document.body.append(form);form.onsubmit=async e=>{e.preventDefault();const values=Object.fromEntries(new FormData(form));try{await request('/web/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});form.reset();form.remove();location.reload();}catch(err){form.querySelector('[role="status"]').textContent=err.message;}};}
authenticated=request('/web/session').catch(()=>new Promise(()=>{}));
function chooseFile(accept){return new Promise(resolve=>{const input=document.createElement('input');input.type='file';input.accept=accept;input.onchange=()=>resolve(input.files[0]||null);input.oncancel=()=>resolve(null);input.click();});}
function download(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
window.owner={call:async(channel,...args)=>{
 if(channel==='owner:appearance'){if(args[0]?.reload)location.reload();return true;}
 await authenticated;
 if(channel==='owner:release:publish'){const d=args[0],file=await chooseFile(d.platform==='mac'?'.dmg':'.exe');if(!file)return false;if(file.size>512*1024*1024)throw Error('Installer exceeds 512 MiB');await request('/web/upload?'+new URLSearchParams({version:d.version,platform:d.platform,arch:d.arch,notes:d.notes||''}),{method:'PUT',body:file});return true;}
 if(channel==='owner:logo'){const file=await chooseFile('image/png,image/jpeg');if(!file)return null;if(file.size>2*1024*1024)throw Error('Logo exceeds 2 MiB');return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file);});}
 if(['owner:connect','owner:local','owner:release'].includes(channel))throw Error('Server connection is configured by deployment');
 const d=await request('/web/call',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({channel,args})});
 if(channel==='owner:export'||channel==='owner:site:export'){download(d,channel==='owner:export'?'CH-product.json':'CH-website.json');return true;}
 return d;
}};
document.addEventListener('DOMContentLoaded',()=>{const button=document.createElement('button');button.className='secondary';button.textContent='Sign out / Вийти';button.onclick=async()=>{await request('/web/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});location.reload();};document.querySelector('.sidebar-bottom').prepend(button);});
