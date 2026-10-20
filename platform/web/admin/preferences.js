'use strict';
(function(){
  const i18n=globalThis.OrbitI18n;
  const bridge=window.orbit||window.owner,channel=window.owner?'owner:appearance':'appearance:set';
  function apply(){document.documentElement.lang=i18n.language;document.title=i18n.t('panelTitle')+' · LOMVIKO';for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=i18n.t(el.dataset.i18n);for(const attr of ['aria-label','placeholder'])for(const el of document.querySelectorAll(`[data-i18n-${attr}]`))el.setAttribute(attr,i18n.t(el.getAttribute(`data-i18n-${attr}`)));document.querySelector('#language-choice').value=i18n.language;}
  let theme;try{theme=localStorage.getItem('orbit.theme');}catch{}if(!['light','dark'].includes(theme))theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  function setTheme(value){theme=value;document.documentElement.dataset.theme=theme;localStorage.setItem('orbit.theme',theme);const button=document.querySelector('#theme-toggle');button.textContent=i18n.t(theme==='dark'?'light':'dark');button.setAttribute('aria-pressed',String(theme==='dark'));bridge.call(channel,{language:i18n.language,theme}).catch(()=>{});}
  apply();setTheme(theme);

  document.querySelector('#theme-toggle').addEventListener('click',()=>setTheme(theme==='dark'?'light':'dark'));
  document.querySelector('#language-choice').addEventListener('change',event=>{i18n.setLanguage(event.target.value);localStorage.setItem('orbit.language',i18n.language);bridge.call(channel,{language:i18n.language,theme,reload:true}).catch(()=>{});});
})();
