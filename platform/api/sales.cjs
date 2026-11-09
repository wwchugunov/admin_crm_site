'use strict';
// Free or selling: one place that decides what may be switched and what happens to accounts.
// Free mode never locks or deletes a free-period account, even when the date passes unnoticed.
// Selling cannot start until the date has passed and the offer, the policy and the 30-day notice are in place.
const DAY = 86400000, NOTICE_DAYS = 30, HOLD_DAYS = 30, GRACE_DAYS = 7, SOON_DAYS = 14, EXPORT_DAYS = 30, KEEP_DAYS = 90, PERPETUAL = 253402300799000;
const PLACEHOLDER = /ПРИКЛАД|ЧЕРНЕТКА|\{\{|0000000000|UA00 0000/i;
const dateOf = (ms) => new Date(ms).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' }).replace(/\s*р\.$/, '');
const daysLeft = (ms, now) => Math.ceil((ms - now) / DAY);

class Sales {
  constructor({ store, documents, mail, fail, plans }) {
    Object.assign(this, { store, db: store.db, documents, mail, fail, plans });
    if (!this.db.prepare('PRAGMA table_info(users)').all().some((c) => c.name === 'free_period')) {
      this.db.exec('ALTER TABLE users ADD COLUMN free_period INTEGER NOT NULL DEFAULT 0');
      // Accounts opened earlier with a default end of the free period belong to the free period.
      const old = Date.parse('2027-03-01T00:00:00+02:00');
      this.db.prepare("UPDATE users SET free_period=1 WHERE account_id IS NULL AND stage='trial' AND expires IN (?,?)").run(old, store.freeUntil());
    }
    this.hold();
  }

  // While free, free-period accounts always have at least a month ahead, so nothing that looks at the end
  // date (bots, booking pages, reminders, deletion) can act on them.
  hold(now = Date.now()) {
    if (this.store.product().sales) return;
    const target = Math.max(this.store.freeUntil(), now + HOLD_DAYS * DAY);
    this.db.prepare("UPDATE users SET expires=? WHERE free_period=1 AND stage='trial' AND account_id IS NULL AND expires<?").run(target, target);
  }

  owners() {
    return this.db.prepare("SELECT * FROM users WHERE account_id IS NULL AND stage IN ('trial','active') AND expires<?").all(PERPETUAL);
  }

  checks(now = Date.now()) {
    const until = this.store.freeUntil(), get = (k) => this.store.setting(k), confirmed = (k) => get(k) === '1';
    const offer = this.documents.current('site-offer', 'uk');
    let offerOk = false, offerHint = 'Завантажте оферту у Word у розділі «Документи».';
    if (offer) {
      const page = this.documents.page(offer);
      if (!page) offerHint = 'Завантажте оферту саме у Word: PDF не можна перевірити.';
      else if (PLACEHOLDER.test(page.html)) offerHint = 'В оферті лишилися приклади чи чернетка. Впишіть справжні реквізити.';
      else offerOk = true;
    }
    const sentAt = Number(get('notice_sent_at')) || 0, sentDays = sentAt ? Math.floor((now - sentAt) / DAY) : 0, people = this.owners().length;
    return [
      { id: 'date', ok: now >= until, title: 'Безкоштовний період закінчився', hint: `Сайт обіцяє безкоштовно до ${dateOf(until)}. Раніше цієї дати продажі не вмикаються.` },
      { id: 'offer', ok: offerOk, title: 'Публічна оферта завантажена й заповнена', hint: offerOk ? '' : offerHint },
      { id: 'privacy', ok: Boolean(this.documents.pick('site-privacy', 'uk')), title: 'Політика конфіденційності показується', hint: 'Завантажте й увімкніть її в розділі «Документи».' },
      { id: 'notice', ok: people === 0 || (sentAt > 0 && sentDays >= NOTICE_DAYS), title: `Клієнтів попереджено за ${NOTICE_DAYS} днів`, hint: sentAt ? `Лист надіслано ${dateOf(sentAt)}. Минуло днів: ${sentDays} з ${NOTICE_DAYS}.` : 'Натисніть «Попередити клієнтів». Це обіцянка з Умов користування.' },
      { id: 'mail', ok: this.mail.accessReady(), title: 'Пошта налаштована', hint: 'Без пошти клієнти не отримають нагадувань і листів про оплату.' },
      { id: 'fop', ok: confirmed('confirm_fop'), title: 'Я відкрив ФОП і маю рахунок', hint: 'Без реєстрації брати гроші не можна. Позначте, коли зроблено.', manual: true },
      { id: 'cash', ok: confirmed('confirm_cash'), title: 'Я узгодив податки й касу (ПРРО) з бухгалтером', hint: 'Група єдиного податку, КВЕД і чи потрібен ПРРО.', manual: true },
    ];
  }

  subscriptions(now = Date.now()) {
    const sales = this.store.product().sales;
    const rows = this.db.prepare("SELECT id,name,email,business,stage,plan,expires,free_period FROM users WHERE account_id IS NULL AND stage IN ('trial','active') AND expires<? ORDER BY expires").all(PERPETUAL);
    return rows.map((u) => {
      const free = !sales && u.free_period === 1, days = daysLeft(u.expires, now);
      const status = free ? 'free' : days <= 0 ? 'ended' : days <= SOON_DAYS ? 'ending' : u.stage === 'active' ? 'active' : 'trial';
      return { id: u.id, name: u.name, email: u.email, business: u.business, stage: u.stage, plan: u.plan, expires: u.expires, days, status,
        exportUntil: u.expires + EXPORT_DAYS * DAY, deleteOn: u.expires + KEEP_DAYS * DAY };
    });
  }

  status(now = Date.now()) {
    const product = this.store.product(), until = this.store.freeUntil(), checks = this.checks(now), subscriptions = this.subscriptions(now);
    const count = (s) => subscriptions.filter((r) => r.status === s).length;
    return { sales: product.sales, registration: product.registration, owner: product.owner, free_until: until, days_left: daysLeft(until, now), date_passed: now >= until,
      ready: checks.every((c) => c.ok), checks, notice_sent_at: Number(this.store.setting('notice_sent_at')) || 0,
      registration_ready: this.registrationReady(), subscriptions,
      counts: { free: count('free'), trial: count('trial'), active: count('active'), ending: count('ending'), ended: count('ended') },
      paying: this.paying(now) };
  }

  paying(now = Date.now()) {
    return this.db.prepare("SELECT count(*) n FROM users WHERE account_id IS NULL AND stage='active' AND expires>? AND expires<?").get(now, PERPETUAL).n;
  }

  registrationReady() { return Boolean(this.documents.pick('site-privacy', 'uk') && this.documents.pick('site-terms', 'uk')); }

  // The date comes as YYYY-MM-DD and means the start of that day in Kyiv.
  setDate(value, now = Date.now()) {
    if (this.store.product().sales) this.fail(409, 'Продажі вже ввімкнено: дата більше не діє. Спершу вимкніть продажі.');
    const text = String(value || '');
    const ms = /^\d{4}-\d{2}-\d{2}$/.test(text) ? Date.parse(`${text}T00:00:00+02:00`) : NaN;
    if (!Number.isSafeInteger(ms) || ms <= now) this.fail(400, 'Оберіть дату в майбутньому.');
    if (ms > now + 5 * 366 * DAY) this.fail(400, 'Оберіть дату не далі ніж за 5 років.');
    if (ms < this.store.freeUntil() && ms < now + NOTICE_DAYS * DAY) this.fail(409, `Коротший безкоштовний період потребує попередження: оберіть дату не раніше ніж через ${NOTICE_DAYS} днів.`);
    this.store.transaction(() => {
      this.store.setSetting('free_until', String(ms));
      const target = Math.max(ms, now + HOLD_DAYS * DAY);
      this.db.prepare("UPDATE users SET expires=? WHERE free_period=1 AND stage='trial' AND account_id IS NULL").run(target);
      this.store.event('sales.date.changed', null, null, '', text);
    });
    return this.status(now);
  }

  confirm(data) {
    for (const [key, name] of [['fop', 'confirm_fop'], ['cash', 'confirm_cash']]) {
      if (data[key] === undefined) continue;
      if (typeof data[key] !== 'boolean') this.fail(400, 'Invalid confirmation');
      this.store.setSetting(name, data[key] ? '1' : '0');
      this.store.event(`sales.confirm.${key}.${data[key] ? 'on' : 'off'}`);
    }
    return this.status();
  }

  // One letter per client per end date; the 30 days count from the first sending for that date.
  notice(now = Date.now()) {
    if (this.store.product().sales) this.fail(409, 'Продажі вже ввімкнено.');
    if (!this.mail.accessReady()) this.fail(400, 'Спершу налаштуйте пошту.');
    const start = Math.max(this.store.freeUntil(), now + NOTICE_DAYS * DAY), key = dateOf(start), owners = this.owners();
    const prices = this.plans.PLANS.map((p) => `«${p.uk}» — ${p.price} грн/міс`).join(', ');
    let sent = 0;
    for (const u of owners) {
      const queued = this.mail.enqueue('notice', u.email, 'uk', { subject: 'зміна умов: платні тарифи', lines: [
        u.name ? `Вітаємо, ${u.name}!` : 'Вітаємо!',
        `Безкоштовний період LOMVIKO закінчується ${dateOf(this.store.freeUntil())}. Платні тарифи почнуть діяти не раніше ${dateOf(start)}.`,
        `Тарифи: ${prices}.`,
        'Нічого не списується автоматично: платний тариф діє лише після вашої згоди й оплати. Якщо не переходитимете, ви зможете вивантажити дані.',
        'Щоб обрати тариф, дайте відповідь на цей лист.',
      ] }, { dedupe: `paid-notice:${u.id}:${key}`, userId: u.id, expires: now + 7 * DAY });
      if (queued) sent++;
    }
    if (this.store.setting('notice_key') !== key) { this.store.setSetting('notice_key', key); this.store.setSetting('notice_sent_at', String(now)); }
    this.store.event('sales.notice.sent', null, null, '', String(sent));
    return { ...this.status(now), notified: sent };
  }

  remind(userId, now = Date.now()) {
    if (!this.mail.configured()) this.fail(400, 'Спершу налаштуйте пошту.');
    const u = this.db.prepare("SELECT * FROM users WHERE id=? AND account_id IS NULL AND stage IN ('trial','active')").get(String(userId || ''));
    if (!u) this.fail(404, 'Клієнта не знайдено.');
    const left = u.expires - now, business = this.db.prepare('SELECT name FROM businesses WHERE account_id=? ORDER BY rowid LIMIT 1').get(u.id)?.name || u.business;
    const until = new Date(u.expires).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
    const day = new Date(now).toISOString().slice(0, 10), options = { dedupe: `manual:${u.id}:${day}`, userId: u.id, expires: now + 2 * DAY };
    if (left <= 0) this.mail.enqueue('trial-ended', u.email, 'uk', { name: u.name, business, until }, options);
    else this.mail.enqueue('trial-ending', u.email, 'uk', { name: u.name, business, days: Math.max(1, daysLeft(u.expires, now)), stage: u.stage, until }, options);
    this.store.event('sales.reminder.sent', u.id);
    return { ok: true };
  }

  // Everything the /admin/product route does, with the checks in one place.
  apply(data, now = Date.now()) {
    if (data.registration === true && !this.registrationReady()) this.fail(409, 'Спершу завантажте й увімкніть Політику конфіденційності та Умови користування: без них реєструвати людей не можна.');
    if (data.sales === true && !this.store.product().sales) {
      const missing = this.checks(now).filter((c) => !c.ok);
      if (missing.length) this.fail(409, `Продажі не ввімкнено. Ще не готово: ${missing.map((c) => c.title).join('; ')}.`);
    }
    if (data.sales === false && this.store.product().sales && this.paying(now) > 0 && data.confirm !== true) this.fail(409, `Є клієнти, що заплатили (${this.paying(now)}). Підтвердьте вимкнення продажів.`);
    this.store.transaction(() => {
      if (data.sales !== undefined) {
        const was = this.store.product().sales;
        this.store.setProduct('sales', data.sales);
        this.documents.setEnabled({ kind: 'site-offer', enabled: data.sales });
        // Starting to sell: free-period accounts get a week and the usual reminders, then the offer applies.
        if (data.sales && !was) this.db.prepare("UPDATE users SET expires=? WHERE free_period=1 AND stage='trial' AND account_id IS NULL").run(now + GRACE_DAYS * DAY);
        if (!data.sales) this.hold(now);
      }
      if (data.registration !== undefined) this.store.setProduct('registration', data.registration);
      if (data.owner !== undefined) this.store.setProduct('owner', data.owner);
    });
    return this.store.product();
  }

  ownerAddress() { const c = this.mail.settings(); return c.ownerEmail || c.fromEmail; }

  // Hourly: keep free accounts open, tell the owner about the date and about subscriptions that need attention.
  tick(now = Date.now()) {
    this.hold(now);
    if (!this.mail.configured() || !this.ownerAddress()) return;
    const day = new Date(now).toISOString().slice(0, 10), to = this.ownerAddress(), product = this.store.product();
    if (!product.sales) {
      const until = this.store.freeUntil(), left = daysLeft(until, now);
      if ([60, 30, 7].includes(left) || (left <= 0 && (-left) % 30 === 0)) {
        this.mail.enqueue('notice', to, 'uk', { subject: left > 0 ? `безкоштовний період закінчиться через ${left} днів` : 'дата безкоштовного періоду минула', lines: [
          left > 0 ? `Безкоштовний період LOMVIKO закінчується ${dateOf(until)}. Днів лишилося: ${left}.` : `Дата ${dateOf(until)} минула, а продажі вимкнені. Клієнти працюють безкоштовно, їхні дані в безпеці.`,
          'Оберіть одне: перенесіть дату або готуйтеся до продажів.',
          'Для продажів: ФОП і бухгалтер, заповнена оферта, лист клієнтам щонайменше за 30 днів. Усе є в адмінці, розділ «Продажі».',
        ] }, { dedupe: `owner-free:${until}:${left}`, expires: now + DAY });
      }
    }
    // A list is sent on the days someone reaches 7, 3 or 1 days left or has just ended.
    const rows = this.subscriptions(now).filter((r) => r.status === 'ending' || (r.status === 'ended' && r.days > -EXPORT_DAYS));
    if (rows.some((r) => [7, 3, 1, 0].includes(r.days))) {
      const line = (r) => `${r.business || r.name} · ${r.email} · ${r.days > 0 ? `лишилось днів: ${r.days}` : `закінчилась ${dateOf(r.expires)}`}`;
      this.mail.enqueue('notice', to, 'uk', { subject: `підписки, що потребують уваги: ${rows.length}`, lines: [
        'Цим клієнтам час продовжити доступ. Нагадування їм уже надсилаються автоматично за 7, 3 і 1 день та в день закінчення.',
        ...rows.map(line),
        'Коли клієнт оплатив, відкрийте «Продажі» → «Підписки» і натисніть «Оплату отримано».',
      ] }, { dedupe: `owner-subscriptions:${day}`, expires: now + DAY });
    }
  }
}

module.exports = { Sales, NOTICE_DAYS, GRACE_DAYS, HOLD_DAYS, SOON_DAYS, EXPORT_DAYS, KEEP_DAYS };
