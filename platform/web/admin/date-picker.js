'use strict';
// Locale-independent calendar: native Chromium date fields use the OS language.
(()=>{
 const i18n=globalThis.OrbitI18n;let popup,active,year,month,selected;
 const pad=n=>String(n).padStart(2,'0');
 const iso=(y,m,d)=>`${y}-${pad(m+1)}-${pad(d)}`;
 function close(){popup?.remove();popup=null;active=null;}
 function choose(value){const input=active;input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));close();input.dispatchEvent(new Event('change',{bubbles:true}));}
 function node(tag,text,cls){const el=document.createElement(tag);if(text)el.textContent=text;if(cls)el.className=cls;return el;}
 function button(text,action){const b=node('button',text,'secondary');b.type='button';b.onclick=action;return b;}
 function draw(){
  popup.replaceChildren();const toolbar=node('div',null,'calendar-toolbar');toolbar.append(button('‹',()=>{if(--month<0){month=11;year--;}draw();}));
  const months=node('select');months.setAttribute('aria-label',i18n.t('calendarMonth'));for(let m=0;m<12;m++){const option=node('option',new Date(2020,m,1).toLocaleDateString(i18n.locale(),{month:'long'}));option.value=m;months.append(option);}months.value=month;months.onchange=()=>{month=Number(months.value);draw();};
  const years=node('input');years.type='number';years.min=1900;years.max=2200;years.value=year;years.setAttribute('aria-label',i18n.t('calendarYear'));years.onchange=()=>{if(years.checkValidity()){year=Number(years.value);draw();}};
  toolbar.append(months,years,button('›',()=>{if(++month>11){month=0;year++;}draw();}));popup.append(toolbar);
  if(active.dataset.dateType==='month'){popup.append(button(i18n.t('calendarApply'),()=>choose(iso(year,month,1).slice(0,7))));return;}
  const grid=node('div',null,'calendar-grid');for(let n=0;n<7;n++)grid.append(node('span',new Date(2024,0,1+n).toLocaleDateString(i18n.locale(),{weekday:'short'})));
  const offset=(new Date(year,month,1).getDay()+6)%7;for(let n=0;n<offset;n++)grid.append(node('span'));
  for(let d=1;d<=new Date(year,month+1,0).getDate();d++){const value=iso(year,month,d);const b=button(String(d),()=>{if(active.dataset.dateType==='datetime-local'){selected=value;draw();}else choose(value);});if(value===selected)b.classList.add('selected');if(active.min&&value<active.min.slice(0,10)||active.max&&value>active.max.slice(0,10))b.disabled=true;grid.append(b);}popup.append(grid);
  if(active.dataset.dateType==='datetime-local'){
   const row=node('div',null,'calendar-time');const [h,m]=(active.value.split('T')[1]||'09:00').split(':');
   const hour=node('select'),minute=node('select');hour.setAttribute('aria-label',i18n.t('calendarHour'));minute.setAttribute('aria-label',i18n.t('calendarMinute'));
   for(let n=0;n<24;n++){const o=node('option',pad(n));o.value=pad(n);hour.append(o);}for(let n=0;n<60;n++){const o=node('option',pad(n));o.value=pad(n);minute.append(o);}hour.value=h;minute.value=m;
   row.append(hour,node('span',':'),minute,button(i18n.t('calendarApply'),()=>choose(`${selected}T${hour.value}:${minute.value}`)));popup.append(row);
  }
  const footer=node('div',null,'calendar-footer');footer.append(button(i18n.t('calendarToday'),()=>{const now=new Date();year=now.getFullYear();month=now.getMonth();selected=iso(year,month,now.getDate());draw();}),button(i18n.t('m168'),close));popup.append(footer);
 }
 function open(input){close();active=input;const now=new Date(),parts=(input.value||iso(now.getFullYear(),now.getMonth(),now.getDate())).slice(0,10).split('-');year=Number(parts[0]);month=Number(parts[1])-1;selected=parts.length===3?parts.join('-'):iso(year,month,1);popup=node('div',null,'calendar-popup');popup.setAttribute('role','dialog');popup.setAttribute('aria-label',i18n.t('calendarChoose'));(input.closest('dialog')||document.body).append(popup);draw();const rect=input.getBoundingClientRect();popup.style.left=Math.max(8,Math.min(rect.left,innerWidth-350))+'px';popup.style.top=Math.max(8,Math.min(rect.bottom+6,innerHeight-popup.offsetHeight-8))+'px';popup.querySelector('button').focus();}
 function setup(){for(const input of document.querySelectorAll('input[type="date"],input[type="month"],input[type="datetime-local"]')){
  const kind=input.type;input.dataset.dateType=kind;input.type='text';input.placeholder=kind==='month'?'YYYY-MM':kind==='date'?'YYYY-MM-DD':'YYYY-MM-DD HH:MM';input.pattern=kind==='month'?'[0-9]{4}-[0-9]{2}':kind==='date'?'[0-9]{4}-[0-9]{2}-[0-9]{2}':'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}(:[0-9]{2})?';
  const wrapper=node('div',null,'calendar-field');input.before(wrapper);wrapper.append(input);const trigger=button('▦',()=>open(input));trigger.setAttribute('aria-label',i18n.t('calendarChoose'));trigger.disabled=input.disabled;wrapper.append(trigger);
 }if(active&&!active.isConnected)close();}
 new MutationObserver(setup).observe(document.body,{childList:true,subtree:true});setup();
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&popup){event.preventDefault();event.stopPropagation();close();}},true);
 document.addEventListener('pointerdown',event=>{if(popup&&!popup.contains(event.target)&&!event.target.closest('.calendar-field'))close();});
})();
