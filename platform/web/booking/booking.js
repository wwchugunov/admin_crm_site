'use strict';
// Booking page: service → specialist → day and time → name and phone → done.
(() => {
  const cfg = JSON.parse(document.getElementById('config').textContent);
  const app = document.getElementById('app');
  const base = `/b/${cfg.slug}`;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const tz = cfg.timezone;
  const state = { services: [], resources: [], service: null, resource: 'any', date: null, slots: null, nearest: [], start: null, step: 'service', error: '', busy: false, done: null, request: null, waiting: false, waited: null };

  // Text on the company colour stays readable: white on dark colours, near-black on light ones.
  (() => {
    const hex = cfg.color.slice(1), [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    document.documentElement.style.setProperty('--on-accent', 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? '#141418' : '#fff');
  })();

  const money = (v) => {
    try { return new Intl.NumberFormat('uk-UA', { style: 'currency', currency: cfg.currency, maximumFractionDigits: v % 1 ? 2 : 0 }).format(v); }
    catch { return `${v} ${cfg.currency}`; }
  };
  const duration = (m) => (m < 60 ? `${m} хв` : `${Math.floor(m / 60)} год${m % 60 ? ` ${m % 60} хв` : ''}`);
  const ymd = (ms) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
  const addDays = (date, n) => { const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dayLabel = (date) => {
    const d = new Date(`${date}T12:00:00Z`);
    return { week: new Intl.DateTimeFormat('uk-UA', { weekday: 'short', timeZone: 'UTC' }).format(d), num: d.getUTCDate(), month: new Intl.DateTimeFormat('uk-UA', { month: 'short', timeZone: 'UTC' }).format(d) };
  };
  const time = (ms) => new Intl.DateTimeFormat('uk-UA', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
  const longDate = (ms) => new Intl.DateTimeFormat('uk-UA', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(ms));
  const shortDay = (ms) => new Intl.DateTimeFormat('uk-UA', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(ms));
  const dayDate = (date) => new Intl.DateTimeFormat('uk-UA', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00Z`));
  const today = ymd(Date.now());
  const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

  async function api(path, body) {
    const r = await fetch(base + path, body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
    let data = {};
    try { data = await r.json(); } catch {}
    if (!r.ok) throw Object.assign(Error(String(data.error || 'Не вдалося з’єднатися. Перевірте інтернет і спробуйте ще раз.').split(' / ')[0]), { status: r.status });
    return data;
  }
  const icon = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    insta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>',
  };
  function header() {
    const initials = cfg.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '•';
    const chips = [
      cfg.address && `<a class="chip" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cfg.address)}" target="_blank" rel="noopener">${icon.pin}${esc(cfg.address)}</a>`,
      cfg.phone && `<a class="chip" href="tel:${esc(cfg.phone.replace(/[^\d+]/g, ''))}">${icon.phone}${esc(cfg.phone)}</a>`,
      cfg.instagram && `<a class="chip" href="https://instagram.com/${esc(cfg.instagram)}" target="_blank" rel="noopener">${icon.insta}@${esc(cfg.instagram)}</a>`,
    ].filter(Boolean).join('');
    return `${cfg.embed ? '<button class="close" type="button" data-act="close" aria-label="Закрити">×</button>' : ''}<div class="cover"${cfg.cover ? ` style="background-image:url('${base}/cover')"` : ''}></div><header class="head"><div class="logo">${cfg.logo ? `<img src="${base}/logo" alt="">` : esc(initials)}</div><h1>${esc(cfg.name)}</h1>${cfg.about ? `<p class="about">${esc(cfg.about)}</p>` : ''}${chips ? `<div class="chips">${chips}</div>` : ''}</header>`;
  }
  const pressed = (v) => `aria-pressed="${v ? 'true' : 'false'}"`;
  const errorBox = () => (state.error ? `<p class="error" role="alert">${esc(state.error)}</p>` : '');
  function serviceStep() {
    if (!state.services.length) return `<section class="step"><h2>Онлайн-запис</h2><p class="empty">${state.loaded ? `Зараз немає послуг для онлайн-запису.${cfg.phone ? ` Зателефонуйте нам: ${esc(cfg.phone)}` : ''}` : 'Завантаження…'}</p>${errorBox()}</section>`;
    if (state.service) {
      const s = state.service;
      return `<section class="step"><div class="step-title"><h2>Послуга</h2><button class="link" type="button" data-act="change-service">Змінити</button></div><div class="option" aria-pressed="true"><span><span class="name">${esc(s.name)}</span><br><span class="meta">${duration(s.duration)}</span></span>${s.price ? `<span class="price">${money(s.price / 100)}</span>` : ''}</div></section>`;
    }
    return `<section class="step"><h2>Оберіть послугу</h2><div class="list">${state.services.map((s) => `<button type="button" class="option" data-act="service" data-id="${esc(s.id)}"><span><span class="name">${esc(s.name)}</span><br><span class="meta">${duration(s.duration)}</span></span>${s.price ? `<span class="price">${money(s.price / 100)}</span>` : ''}</button>`).join('')}</div>${errorBox()}</section>`;
  }
  function resourceStep() {
    if (!state.service || state.resources.length < 2) return '';
    return `<section class="step"><h2>Спеціаліст</h2><div class="pills"><button type="button" class="pill" data-act="resource" data-id="any" ${pressed(state.resource === 'any')}>Будь-який вільний</button>${state.resources.map((r) => `<button type="button" class="pill" data-act="resource" data-id="${esc(r.id)}" ${pressed(state.resource === r.id)}>${esc(r.name)}</button>`).join('')}</div></section>`;
  }
  function timeStep() {
    if (!state.service) return '';
    const strip = days.map((d) => { const l = dayLabel(d); return `<button type="button" class="day" data-act="day" data-date="${d}" ${pressed(state.date === d)} aria-label="${l.num} ${l.month}"><small${d === today ? ' class="today"' : ''}>${d === today ? 'сьогодні' : esc(l.week)}</small><b>${l.num}</b><small>${esc(l.month)}</small></button>`; }).join('');
    const slots = state.slots === null ? '<p class="loading">Шукаємо вільний час…</p>' : state.slots.length ? `<div class="times">${state.slots.map((t) => `<button type="button" class="time" data-act="time" data-start="${t}" ${pressed(state.start === t)}>${time(t)}</button>`).join('')}</div>` : `<p class="empty">На цей день вільного часу немає.</p>${state.nearest.length ? `<p class="hint">Найближчий вільний час:</p><div class="times near">${state.nearest.map((t) => `<button type="button" class="time" data-act="near" data-start="${t}"><small>${esc(shortDay(t))}</small>${time(t)}</button>`).join('')}</div>` : ''}<div class="wait-offer"><p class="hint">Хочете саме цей день? Станьте в лист очікування — якщо хтось скасує запис, ми з вами зв’яжемося.</p><button type="button" class="secondary" data-act="wait-open" ${pressed(state.waiting)}>Чекати, якщо звільниться</button></div>`;
    return `<section class="step"><h2>Дата і час</h2><div class="days" id="days">${strip}</div>${slots}${state.start ? '' : errorBox()}</section>`;
  }
  function formStep() {
    if (state.waiting && !state.start) return waitStep();
    if (!state.start) return '';
    const who = state.resource === 'any' ? '' : ` · ${esc(state.resources.find((r) => r.id === state.resource)?.name || '')}`;
    return `<section class="step" id="form-step"><h2>Ваші дані</h2><div class="summary"><b>${esc(state.service.name)}${who}</b><span>${esc(longDate(state.start))}, ${time(state.start)}</span></div><form id="form" novalidate>${fields('Записатися')}</form></section>`;
  }
  const fields = (button) => `<label for="name">Ім’я</label><input id="name" name="name" type="text" autocomplete="name" maxlength="120" required value="${esc(state.name || '')}"><label for="phone">Телефон</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="20" required placeholder="+380 67 123 45 67" value="${esc(state.phone || '')}"><div class="trap" aria-hidden="true"><input name="website" tabindex="-1" autocomplete="off"></div><label class="consent"><input type="checkbox" name="consent" required ${state.consent ? 'checked' : ''}><span>Погоджуюся, що «${esc(cfg.name)}» використає моє ім’я і телефон для запису та нагадувань.</span></label>${errorBox()}<button class="primary" type="submit" ${state.busy ? 'disabled' : ''}>${state.busy ? 'Зачекайте…' : button}</button>`;
  function waitStep() {
    const who = state.resource === 'any' ? '' : ` · ${esc(state.resources.find((r) => r.id === state.resource)?.name || '')}`;
    return `<section class="step" id="form-step"><h2>Лист очікування</h2><div class="summary"><b>${esc(state.service.name)}${who}</b><span>${esc(dayDate(state.date))}</span></div><p class="empty">Якщо на цей день звільниться час, адміністратор зателефонує вам і запропонує його.</p><form id="form" novalidate>${fields('Чекати на вільний час')}</form></section>`;
  }
  function waitedStep() {
    return `<section class="step done" role="status"><div class="check">✓</div><h2>Ви в листі очікування</h2><p class="when">${esc(dayDate(state.waited.date))}</p><p>${esc(state.service.name)}</p><p class="empty">Щойно звільниться час, ми зв’яжемося з вами за телефоном.</p><button class="link" type="button" data-act="again" style="margin-top:14px">Обрати інший час</button>${cfg.phone ? `<p class="empty" style="margin-top:12px">Питання? Телефонуйте: ${esc(cfg.phone)}</p>` : ''}</section>`;
  }
  function doneStep() {
    const d = state.done;
    const who = state.resource === 'any' ? '' : `<p>${esc(state.resources.find((r) => r.id === state.resource)?.name || '')}</p>`;
    return `<section class="step done" role="status"><div class="check">✓</div><h2>Ви записані</h2><p class="when">${esc(longDate(d.start))}, ${time(d.start)}</p><p>${esc(d.service || state.service.name)}</p>${who}${cfg.address ? `<p class="empty">${esc(cfg.address)}</p>` : ''}<button class="secondary" type="button" data-act="ics">Додати в календар</button>${cfg.bot ? `<a class="secondary" href="https://t.me/${esc(cfg.bot)}" target="_blank" rel="noopener">Нагадування в Telegram</a>` : ''}<button class="link" type="button" data-act="again" style="margin-top:14px">Записатися ще раз</button>${cfg.phone ? `<p class="empty" style="margin-top:12px">Щоб змінити або скасувати запис, зателефонуйте: ${esc(cfg.phone)}</p>` : ''}</section>`;
  }
  function render(focus) {
    const scroll = document.getElementById('days')?.scrollLeft;
    app.innerHTML = header() + (state.done ? doneStep() : state.waited ? waitedStep() : serviceStep() + resourceStep() + timeStep() + formStep()) + '<p class="foot">Онлайн-запис <a href="https://lomviko.com" target="_blank" rel="noopener">LOMVIKO</a></p>';
    const strip = document.getElementById('days');
    if (strip) {
      if (scroll !== undefined) strip.scrollLeft = scroll;
      else strip.querySelector('[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    }
    if (focus) document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function loadSlots(date) {
    state.date = date; state.slots = null; state.nearest = []; state.start = null; state.waiting = false; render();
    try {
      const q = new URLSearchParams({ service_id: state.service.id, date, resource_id: state.resource });
      const data = await api('/catalog?' + q);
      if (state.date !== date) return;
      state.slots = data.slots || [];
      state.nearest = data.nearest || [];
      state.resources = data.resources || [];
    } catch (e) { state.slots = []; state.error = e.message; }
    render();
  }
  // Opens the first day that still has free time, looking up to two weeks ahead.
  async function firstFreeDay() {
    for (const date of days.slice(0, 14)) {
      const q = new URLSearchParams({ service_id: state.service.id, date, resource_id: state.resource });
      try {
        const data = await api('/catalog?' + q);
        state.resources = data.resources || [];
        if ((data.slots || []).length) { state.date = date; state.slots = data.slots; render(); return; }
      } catch (e) { state.error = e.message; break; }
    }
    await loadSlots(today);
  }
  function ics() {
    const d = state.done, stamp = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const text = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//LOMVIKO//Booking//UK', 'BEGIN:VEVENT', `UID:${state.request}@lomviko`, `DTSTAMP:${stamp(Date.now())}`, `DTSTART:${stamp(d.start)}`, `DTEND:${stamp(d.end || d.start + state.service.duration * 60000)}`, `SUMMARY:${(d.service || state.service.name).replace(/[,;\n]/g, ' ')} — ${cfg.name.replace(/[,;\n]/g, ' ')}`, cfg.address ? `LOCATION:${cfg.address.replace(/[,;\n]/g, ' ')}` : '', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/calendar' }));
    a.download = 'zapys.ics';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  app.addEventListener('click', async (event) => {
    const b = event.target.closest('[data-act]');
    if (!b) return;
    const act = b.dataset.act;
    state.error = '';
    if (act === 'close') return parent.postMessage({ lomviko: 'close' }, '*');
    if (act === 'service') {
      state.service = state.services.find((s) => s.id === b.dataset.id); state.resource = 'any'; state.slots = null; state.start = null; state.date = null;
      render(); await firstFreeDay(); return;
    }
    if (act === 'change-service') { Object.assign(state, { service: null, start: null, slots: null, date: null, resource: 'any' }); return render(); }
    if (act === 'resource') { state.resource = b.dataset.id; return loadSlots(state.date || today); }
    if (act === 'day') return loadSlots(b.dataset.date);
    if (act === 'time') { state.start = Number(b.dataset.start); render('form-step'); document.getElementById('name')?.focus({ preventScroll: true }); return; }
    if (act === 'near') { const start = Number(b.dataset.start); await loadSlots(ymd(start)); if (state.slots?.includes(start)) { state.start = start; render('form-step'); document.getElementById('name')?.focus({ preventScroll: true }); } return; }
    if (act === 'wait-open') { state.waiting = true; state.start = null; render('form-step'); document.getElementById('name')?.focus({ preventScroll: true }); return; }
    if (act === 'ics') return ics();
    if (act === 'again') { Object.assign(state, { done: null, waited: null, waiting: false, service: null, start: null, slots: null, date: null, resource: 'any', request: null }); return render(); }
  });
  app.addEventListener('input', (event) => {
    if (event.target.name === 'name') state.name = event.target.value;
    if (event.target.name === 'phone') state.phone = event.target.value;
    if (event.target.name === 'consent') state.consent = event.target.checked;
  });
  app.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.target, v = Object.fromEntries(new FormData(form));
    state.name = v.name; state.phone = v.phone; state.consent = v.consent === 'on';
    const phone = String(v.phone || '').trim(), digits = phone.replace(/\D/g, '');
    state.error = !String(v.name || '').trim() ? 'Вкажіть, будь ласка, ім’я.' : digits.length < 9 || !/^[+\d\s().-]+$/.test(phone) ? 'Перевірте номер телефону, наприклад +380 67 123 45 67.' : !state.consent ? 'Позначте згоду, щоб ми могли вас записати.' : '';
    if (state.error) return render();
    // The same request id is reused on a retry, so a double tap or a lost answer never books twice.
    state.request ||= (crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9_-]/g, '');
    state.busy = true; render();
    const full = digits.length === 10 && digits.startsWith('0') ? '+38' + digits : phone;
    if (state.waiting && !state.start) {
      try { await api('/wait', { token: cfg.token, website: v.website || '', name: v.name.trim(), phone: full, consent: true, service_id: state.service.id, resource_id: state.resource, date: state.date }); state.waited = { date: state.date }; state.waiting = false; }
      catch (e) { state.error = e.message; }
      state.busy = false; render(state.waited ? undefined : 'form-step'); if (state.waited) scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    try {
      const r = await api('/book', { token: cfg.token, website: v.website || '', request_id: state.request, name: v.name.trim(), phone: full, consent: true, service_id: state.service.id, resource_id: state.resource, start: state.start });
      state.done = r;
      parent.postMessage({ lomviko: 'booked' }, '*');
    } catch (e) {
      state.error = e.message;
      if (e.status === 409) { state.request = null; const date = state.date; state.busy = false; await loadSlots(date); state.error = e.message; }
    }
    state.busy = false;
    render(state.done ? undefined : 'form-step');
    if (state.done) scrollTo({ top: 0, behavior: 'smooth' });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && cfg.embed) parent.postMessage({ lomviko: 'close' }, '*'); });
  render();
  api('/catalog').then((data) => { state.services = data.services || []; state.loaded = true; render(); }).catch((e) => { state.loaded = true; state.error = e.message; render(); });
})();
