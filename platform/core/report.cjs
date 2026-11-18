'use strict';
// The company report for a period, as people read it in Excel: totals, each specialist, every visit.
//
// Income follows the same rule as the dashboard and finance report: money received for visits (except
// what was taken from a certificate or pass), plus certificate and pass sales, minus refunds. A company
// that records no payments in the period gets the "estimated income" instead: the price of the
// services actually done. Cancelled, missed and future visits never count as income.
//
// Load = time taken by completed visits / working time available, per specialist and for the company.
// Available time: the person's own hours (or the company's) on days they work, without breaks,
// absences and closed days. A group class counts its length once, however many people came.
const OrbitStaff = require('../shared/staff-rules.js');

const DAY = 86400000;
const nextDate = (date) => new Date(Date.parse(date + 'T12:00:00Z') + DAY).toISOString().slice(0, 10);
const minutes = (clock) => { const [h, m] = clock.split(':').map(Number); return h * 60 + m; };
// Total minutes covered by a set of [start, end) intervals, overlaps counted once.
function covered(intervals) {
  let total = 0, start, end;
  for (const [s, e] of [...intervals].sort((a, b) => a[0] - b[0])) {
    if (start === undefined) { [start, end] = [s, e]; continue; }
    if (s > end) { total += end - start; [start, end] = [s, e]; } else end = Math.max(end, e);
  }
  return (total + (start === undefined ? 0 : end - start)) / 60000;
}

function companyReport(store, from, to) {
  from = Number(from); to = Number(to);
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to <= from || to - from > 400 * DAY)
    throw Error('Невірний період / Invalid period');
  const zone = store.get('timezone') || 'Europe/Kyiv',
    workDays = store.get('work_days') || [1, 2, 3, 4, 5, 6, 7],
    company = { start: store.get('work_start') || '09:00', end: store.get('work_end') || '18:00' };
  const visits = store.visits('a.start>=? AND a.start<?', [from, to]),
    resources = store.db.prepare('SELECT id,name,kind,schedule,archived FROM resources ORDER BY name,id').all(),
    staffIds = new Set(resources.filter((r) => r.kind !== 'room').map((r) => r.id)),
    absences = store.db.prepare('SELECT * FROM resource_absences').all();
  // Money in the period (dashboard rule).
  const payments = store.db.prepare('SELECT appointment_id,amount,method,at FROM payments WHERE at>=? AND at<?').all(from, to),
    sales = [
      ...store.db.prepare('SELECT price FROM certificates WHERE sold_at>=? AND sold_at<?').all(from, to),
      ...store.db.prepare('SELECT price FROM passes WHERE sold_at>=? AND sold_at<?').all(from, to),
    ];
  const cash = payments.filter((p) => !['certificate', 'pass'].includes(p.method)),
    received = cash.filter((p) => p.amount > 0).reduce((s, p) => s + p.amount, 0) + sales.reduce((s, v) => s + v.price, 0),
    refunds = -cash.filter((p) => p.amount < 0).reduce((s, p) => s + p.amount, 0);
  const completed = visits.filter((v) => v.status === 'completed'),
    model = payments.length || sales.length ? 'payments' : 'estimated',
    estimated = completed.reduce((s, v) => s + v.total, 0),
    income = model === 'payments' ? received - refunds : estimated;
  // Orders behind the income: visits paid in the period plus vouchers sold, or completed visits.
  const paidVisits = new Set(payments.filter((p) => p.amount > 0).map((p) => p.appointment_id)),
    orders = model === 'payments' ? paidVisits.size + sales.length : completed.length;

  // Per specialist. Money of a visit done by two people is shared equally, so nothing is counted twice.
  const people = new Map(resources.filter((r) => r.kind !== 'room').map((r) => [r.id, { id: r.id, name: r.name, archived: Boolean(r.archived), done: 0, cancelled: 0, noShow: 0, busy: [], money: 0, available: 0 }]));
  const paidFor = new Map();
  for (const p of payments) paidFor.set(p.appointment_id, (paidFor.get(p.appointment_id) || 0) + p.amount);
  for (const v of visits) {
    const mine = v.resources.filter((r) => staffIds.has(r.id));
    for (const r of mine) {
      const row = people.get(r.id);
      if (v.status === 'completed') {
        row.done++;
        row.busy.push([v.start, v.end]);
        const value = model === 'payments' ? Math.max(0, v.paid) : v.total;
        row.money += value / mine.length;
      } else if (v.status === 'cancelled') row.cancelled++;
      else if (v.status === 'no_show') row.noShow++;
    }
  }
  // Working time on each day of the period (company time zone).
  const first = store.businessDay(from), last = store.businessDay(to - 1);
  for (let day = first; day <= last; day = nextDate(day)) {
    if (!workDays.includes(OrbitStaff.weekday(day))) continue;
    for (const r of resources) {
      if (r.kind === 'room' || r.archived || !OrbitStaff.works(r, day, absences)) continue;
      const h = OrbitStaff.dayHours(r, company);
      let open = minutes(h.end) - minutes(h.start);
      for (const [x, y] of h.breaks) open -= Math.max(0, Math.min(minutes(y), minutes(h.end)) - Math.max(minutes(x), minutes(h.start)));
      // Periods are whole days in the company time zone, so every listed day counts in full.
      people.get(r.id).available += Math.max(0, open);
    }
  }
  const staff = [...people.values()]
    .map((p) => {
      const busy = covered(p.busy);
      return { name: p.name, archived: p.archived, done: p.done, hours: busy / 60, money: Math.round(p.money), load: p.available ? busy / p.available : null, cancelled: p.cancelled, no_show: p.noShow, available_hours: p.available / 60 };
    })
    .filter((p) => !p.archived || p.done || p.cancelled || p.no_show);
  const withHours = staff.filter((p) => p.available_hours > 0),
    busyAll = withHours.reduce((s, p) => s + p.hours, 0),
    availableAll = withHours.reduce((s, p) => s + p.available_hours, 0);
  const status = { confirmed: 'Заплановано', completed: 'Виконано', cancelled: 'Скасовано', no_show: 'Не прийшов' };
  return {
    business: store.get('business'),
    currency: store.get('currency') || 'UAH',
    timezone: zone,
    from, to,
    first, last,
    model,
    summary: {
      income,
      received: model === 'payments' ? received : null,
      refunds: model === 'payments' ? refunds : null,
      estimated,
      visits: visits.length,
      completed: completed.length,
      cancelled: visits.filter((v) => v.status === 'cancelled').length,
      no_show: visits.filter((v) => v.status === 'no_show').length,
      planned: visits.filter((v) => v.status === 'confirmed').length,
      average: orders ? Math.round(income / orders) : 0,
      orders,
      working: withHours.length,
      performed: staff.filter((p) => p.done > 0).length,
      load: availableAll ? busyAll / availableAll : null,
    },
    staff,
    visits: visits.map((v) => ({
      date: store.businessDay(v.start),
      time: new Intl.DateTimeFormat('uk-UA', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(v.start),
      client: v.client_name,
      phone: v.phone || '',
      service: v.service_name,
      specialist: v.resources.filter((r) => staffIds.has(r.id)).map((r) => r.name).join(', '),
      people: v.people_count || 1,
      price: v.total,
      paid: v.paid,
      status: status[v.status] || v.status,
    })),
  };
}
module.exports = { companyReport, covered };
