"use strict";
function dashboardValue() {
  return dashboardMode === "day"
    ? dashboardDate
    : dashboardMode === "month"
      ? dashboardDate.slice(0, 7)
      : dashboardDate.slice(0, 4);
}
function percent(value) {
  return value === null
    ? "—"
    : value > 0 && value < 0.01
      ? "<0,01%"
      : value.toLocaleString(OrbitI18n.locale(), { maximumFractionDigits: 2 }) +
        "%";
}
function dashboardChart(rows, metric, title) {
  const w = 800,
    h = 230,
    left = 62,
    top = 18,
    bottom = 190,
    plot = bottom - top,
    n = rows.length,
    step = (w - left - 18) / n;
  const values = rows.map((b) =>
      metric === "occupancy" ? b.occupancy || 0 : b.income || 0,
    ),
    max = metric === "occupancy" ? 100 : Math.max(1, ...values),
    min = metric === "occupancy" ? 0 : Math.min(0, ...values),
    y = (v) => top + ((max - v) / (max - min)) * plot,
    zero = y(0);
  const grid = [max, (max + min) / 2, min]
    .map(
      (v) =>
        `<line x1="${left}" x2="${w - 10}" y1="${y(v)}" y2="${y(v)}" class="chart-grid"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" class="chart-axis">${escape(metric === "occupancy" ? Math.round(v) + "%" : money(Math.round(v)))}</text>`,
    )
    .join("");
  return `<svg class="dashboard-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${escape(title)}">${grid}<line x1="${left}" x2="${w - 10}" y1="${zero}" y2="${zero}" class="chart-baseline"/>${rows
    .map((b, i) => {
      const value = values[i],
        x = left + i * step + step * 0.15,
        label =
          metric === "occupancy"
            ? percent(b.occupancy)
            : money(b.income) + " " + data.currency;
      return `<rect class="${metric === "occupancy" ? "chart-load" : value < 0 ? "chart-refund" : "chart-income"}" x="${x}" y="${Math.min(zero, y(value))}" width="${step * 0.7}" height="${Math.abs(zero - y(value))}" rx="2"><title>${escape(b.label + ": " + label)}</title></rect>${i % Math.ceil(n / 16) === 0 ? `<text x="${left + (i + 0.5) * step}" y="214" text-anchor="middle" class="chart-axis">${escape(b.label)}</text>` : ""}`;
    })
    .join("")}</svg>`;
}
function dashboardView() {
  if (!feature("reports")) return planLock("reports");
  const a = OrbitAnalytics.dashboard(data, dashboardMode, dashboardValue()),
    popular = a.services[0];
  const filter = `<div class="dashboard-toolbar"><div class="period-buttons" role="group" aria-label="${OrbitI18n.t("m072")}">${[
    ["day", OrbitI18n.t("m069")],
    ["month", OrbitI18n.t("m070")],
    ["year", OrbitI18n.t("m071")],
  ]
    .map(
      ([mode, label]) =>
        `<button class="secondary ${dashboardMode === mode ? "selected" : ""}" data-action="dashboard-mode" data-mode="${mode}" aria-pressed="${dashboardMode === mode}">${label}</button>`,
    )
    .join(
      "",
    )}</div><label for="dashboard-period">${OrbitI18n.t("m072")}</label><input id="dashboard-period" type="${dashboardMode === "year" ? "number" : dashboardMode === "month" ? "month" : "date"}" ${dashboardMode === "year" ? 'min="2000" max="2100"' : ""} value="${dashboardValue()}"><span class="hint">${escape(a.timezone)} · ${escape(data.currency)}</span></div>`;
  const cards = [
    [
      OrbitI18n.t("m073"),
      percent(a.occupancy),
      `${Math.round((a.busy_minutes / 60) * 10) / 10} ${OrbitI18n.t("m074")} ${Math.round((a.capacity_minutes / 60) * 10) / 10} ${OrbitI18n.t("m075")}`,
    ],
    [OrbitI18n.t("m076"), a.bookings, `${a.people} ${OrbitI18n.t("m077")}`],
    ...(a.financial
      ? [
          [
            OrbitI18n.t("m078"),
            money(a.income) + " " + data.currency,
            `${OrbitI18n.t("m079")} ${money(a.received)} ${OrbitI18n.t("m080")} ${money(a.refunds)}`,
          ],
        ]
      : []),
    [
      OrbitI18n.t("m081"),
      popular?.name || OrbitI18n.t("m082"),
      popular
        ? `${popular.bookings} ${OrbitI18n.t("m083")} ${popular.people} ${OrbitI18n.t("m077")}`
        : OrbitI18n.t("m084"),
    ],
  ];
  return (
    filter +
    `<div class="stats dashboard-stats">${cards.map(([name, value, note]) => `<div class="stat"><div class="stat-top">${name}</div><div class="stat-number">${escape(value)}</div><div class="stat-foot">${escape(note)}</div></div>`).join("")}</div><div class="dashboard-panels"><section class="panel"><div class="panel-head"><h2>${OrbitI18n.t("m099")} ${dashboardMode === "day" ? OrbitI18n.t("m085") : dashboardMode === "month" ? OrbitI18n.t("m086") : OrbitI18n.t("m087")}</h2></div>${dashboardChart(a.buckets, "occupancy", OrbitI18n.t("m088"))}</section>${a.financial ? `<section class="panel"><div class="panel-head"><h2>${OrbitI18n.t("m090")} ${dashboardMode === "day" ? OrbitI18n.t("m085") : dashboardMode === "month" ? OrbitI18n.t("m086") : OrbitI18n.t("m087")}</h2><span class="hint">${escape(data.currency)}</span></div>${dashboardChart(a.buckets, "income", OrbitI18n.t("m089"))}</section>` : ""}</div><section class="panel mt"><div class="panel-head"><h2>${OrbitI18n.t("m100")}</h2><span class="hint">${OrbitI18n.t("m101")}</span></div>${a.services.length ? `<table class="table"><thead><tr><th>${OrbitI18n.t("m091")}</th><th>${OrbitI18n.t("m092")}</th><th>${OrbitI18n.t("m093")}</th><th>${OrbitI18n.t("m094")}</th></tr></thead><tbody>${a.services.map((s) => `<tr data-layout-key="service:${escape(s.id)}"><td>${escape(s.name)}</td><td>${s.bookings}</td><td>${s.people}</td><td>${percent((s.bookings / a.bookings) * 100)}</td></tr>`).join("")}</tbody></table>` : empty(OrbitI18n.t("m095"), OrbitI18n.t("m096"))}</section><details class="panel mt"><summary>${OrbitI18n.t("m102")}</summary><div class="table-wrapper"><table class="table"><thead><tr><th>${OrbitI18n.t("m103")}</th><th>${OrbitI18n.t("m092")}</th><th>${OrbitI18n.t("m104")}</th>${a.financial ? `<th>${OrbitI18n.t("m097")}</th>` : ""}</tr></thead><tbody>${a.buckets.map((b) => `<tr data-layout-key="bucket:${escape(b.start)}"><td>${escape(b.label)}</td><td>${b.bookings}</td><td>${percent(b.occupancy)}</td>${a.financial ? `<td>${money(b.income)} ${escape(data.currency)}</td>` : ""}</tr>`).join("")}</tbody></table></div></details><div class="callout">${OrbitI18n.t("m105")}${a.financial ? ` ${OrbitI18n.t("m098")}` : ""}</div>`
  );
}
function financeView() {
  if (!can("finance"))
    return empty(OrbitI18n.t("m106"), OrbitI18n.t("m107"));
  if (financeTab === "overview" && !feature("reports")) return financeTabs() + planLock("reports");
  if (financeTab !== "overview") return financeTabs() + financeToolView();
  const appointments = data.appointments.filter(
      (a) =>
        businessDate(a.start).startsWith(financeMonth) &&
        !["cancelled", "no_show"].includes(a.status),
    ),
    payments = (data.payments || []).filter((p) =>
      businessDate(p.at).startsWith(financeMonth),
    ),
    { income, sales, spent } = monthMoney(),
    costs = appointments
      .filter((a) => a.status === "completed")
      .reduce((s, a) => s + a.cost, 0);
  const unpaid = appointments.filter(
      (a) => a.status === "completed" && a.price > a.paid,
    ),
    due = unpaid.reduce((s, a) => s + a.price - a.paid, 0);
  return `${financeTabs()}<div class="finance-toolbar"><input id="finance-month" type="month" value="${financeMonth}" aria-label="${OrbitI18n.t("m125")}"><span class="hint">${escape(data.currency)} · ${escape(data.timezone)}</span></div><div class="stats">${[
    [
      OrbitI18n.t("m108"),
      appointments.reduce((s, a) => s + a.total, 0),
      OrbitI18n.t("m109"),
    ],
    [
      OrbitI18n.t("m110"),
      income,
      sales ? `${ft("finSales")}: ${money(sales)}` : OrbitI18n.t("m111"),
    ],
    [
      OrbitI18n.t("financeDue"),
      due,
      `${OrbitI18n.t("financeDueHint")}: ${unpaid.length}`,
      due ? "due" : "",
    ],
    [
      OrbitI18n.t("m114"),
      income - costs - spent,
      `${OrbitI18n.t("m112")}: ${money(costs)} · ${ft("finSpent")}: ${money(spent)}`,
    ],
  ]
    .map(
      (s) =>
        `<div class="stat ${s[3] || ""}"><div class="stat-top">${s[0]}</div><div class="stat-number">${money(s[1])}</div><div class="stat-foot">${s[2]}</div></div>`,
    )
    .join(
      "",
    )}</div>${unpaid.length ? `<section class="panel due-panel"><div class="panel-head"><h2>${OrbitI18n.t("financeDue")}</h2></div><table class="table"><tbody>${unpaid.map((a) => `<tr class="clickable" data-action="appointment-open" data-id="${escape(a.id)}"><td>${businessDate(a.start)} ${time(a.start)}</td><td><strong>${escape(a.client_name)}</strong></td><td>${escape(a.service_name)}</td><td>${money(a.price - a.paid)} ${escape(data.currency)}</td></tr>`).join("")}</tbody></table></section>` : ""}${staffReport(appointments)}<section class="panel"><div class="panel-head"><h2>${OrbitI18n.t("m126")}</h2></div>${payments.length ? `<table class="table"><thead><tr><th>${OrbitI18n.t("m120")}</th><th>${OrbitI18n.t("m091")}</th><th>${OrbitI18n.t("m121")}</th><th>${OrbitI18n.t("m122")}</th></tr></thead><tbody>${payments.map((p) => `<tr data-layout-key="payment:${escape(p.id)}"><td>${businessDate(p.at)} ${time(p.at)}</td><td>${escape(p.service_name)}</td><td>${money(p.amount)} ${escape(data.currency)}</td><td>${escape(payMethodLabel(p))}</td></tr>`).join("")}</tbody></table>` : empty(OrbitI18n.t("m123"), OrbitI18n.t("m124"))}</section><div class="callout">${OrbitI18n.t("m127")}</div>`;
}
// Earnings per specialist for payroll: a visit with several people is split evenly.
function staffReport(appointments) {
  const rows = new Map();
  for (const a of appointments.filter((x) => x.status === "completed")) {
    const people = a.resources?.length
      ? a.resources
      : [{ id: a.resource_id, name: a.resource_name }];
    for (const p of people) {
      const row = rows.get(p.id) || { name: p.name, visits: 0, revenue: 0 };
      row.visits++;
      row.revenue += a.price / people.length;
      rows.set(p.id, row);
    }
  }
  if (!rows.size) return "";
  const list = [...rows.values()].sort((x, y) => y.revenue - x.revenue);
  return `<section class="panel staff-report"><div class="panel-head"><h2>${OrbitI18n.t("staffReport")}</h2><span class="hint">${OrbitI18n.t("staffReportHint")}</span></div><table class="table"><thead><tr><th>${OrbitI18n.t("staffPerson")}</th><th>${OrbitI18n.t("clientVisits")}</th><th>${OrbitI18n.t("staffRevenue")}</th><th>${OrbitI18n.t("staffAverage")}</th></tr></thead><tbody>${list.map((r) => `<tr><td><strong>${escape(r.name)}</strong></td><td>${r.visits}</td><td>${money(Math.round(r.revenue))} ${escape(data.currency)}</td><td>${money(Math.round(r.revenue / r.visits))} ${escape(data.currency)}</td></tr>`).join("")}</tbody></table></section>`;
}
function teamView() {
  if (data.mode !== "server")
    return empty(OrbitI18n.t("m128"), OrbitI18n.t("m129"));
  const roles = { owner: OrbitI18n.t("m130"), admin: OrbitI18n.t("m131"), staff: OrbitI18n.t("m132") };
  if (data.role !== "owner")
    return `<div class="list-toolbar"><span class="role-hint">${OrbitI18n.t("m148")} ${escape(roles[data.role])}</span></div>${empty(OrbitI18n.t("m146"), OrbitI18n.t("m147"))}`;
  // The list loads by itself when the page opens.
  if (!team.length && !teamLoading) {
    teamLoading = true;
    window.orbit
      .call("account:users")
      .then((list) => { team = list; })
      .catch(() => {})
      .finally(() => { teamLoading = false; if (page === "team") render(); });
  }
  const items = OrbitPermissions.ITEMS,
    lang = OrbitI18n.language === "en" ? "en" : "uk",
    access = (u) => {
      if (u.role === "owner") return OrbitI18n.t("teamAccessAll");
      const on = items.filter((i) => u.perms?.[i.key]);
      return on.length === items.length ? OrbitI18n.t("teamAccessAll") : on.length ? on.map((i) => escape(i[lang].split(":")[0])).join(", ") : OrbitI18n.t("teamAccessSchedule");
    };
  const rows = team.length
    ? `<table class="table"><thead><tr><th>${OrbitI18n.t("m139")}</th><th>${OrbitI18n.t("m140")}</th><th>${OrbitI18n.t("teamAccess")}</th><th>${OrbitI18n.t("m141")}</th><th></th></tr></thead><tbody>${team.map((u) => `<tr><td><strong>${escape(u.name)}</strong><div class="sub">${escape(u.email)}</div></td><td>${escape(roles[u.role])}</td><td class="team-access">${access(u)}</td><td><span class="badge status-${u.stage}">${u.stage === "blocked" ? OrbitI18n.t("m135") : OrbitI18n.t("m136")}</span></td><td>${u.id !== data.account.id ? `<button class="secondary" data-action="team-edit" data-id="${u.id}">${OrbitI18n.t("m137")}</button>` : OrbitI18n.t("m138")}</td></tr>`).join("")}</tbody></table>`
    : `<p class="loading">${OrbitI18n.t("teamLoading")}</p>`;
  return `<div class="list-toolbar"><span class="role-hint">${OrbitI18n.t("m148")} ${escape(roles[data.role])}</span><div class="team-actions">${feature("multi") ? `<button class="secondary" data-action="business-add">${OrbitI18n.t("m133")}</button>` : ""}<button class="primary" data-action="team-add">${OrbitI18n.t("m134")}</button></div></div><section class="panel">${rows}</section><p class="hint mt">${OrbitI18n.t("teamHint")}</p>`;
}
// Switches for each part of the app; the role only picks the starting set.
function permissionFields(role, perms) {
  const lang = OrbitI18n.language === "en" ? "en" : "uk",
    current = perms || OrbitPermissions.PRESETS[role] || OrbitPermissions.PRESETS.staff;
  return `<fieldset class="perm-list"><legend>${OrbitI18n.t("teamAccess")}</legend><p class="hint">${OrbitI18n.t("teamAccessHint")}</p>${OrbitPermissions.ITEMS.map((i) => `<label class="checkbox-line perm-line"><input type="checkbox" name="perm_${i.key}" ${current[i.key] ? "checked" : ""}><span>${escape(i[lang])}</span></label>`).join("")}</fieldset>`;
}
function permissionValues(v) {
  return Object.fromEntries(OrbitPermissions.KEYS.map((k) => [k, v["perm_" + k] === "on"]));
}
function scheduleWeek() {
  const monday = new Date(`${selectedDate}T12:00:00`);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const today = businessDate(Date.now());
  return `<div class="week-strip" role="group" aria-label="${OrbitI18n.t("scheduleWeek")}">${Array.from(
    { length: 7 },
    (_, index) => {
      const day = new Date(monday);
      day.setDate(day.getDate() + index);
      const key = dateKey(day);
      const count = data.appointments.filter(
        (a) =>
          businessDate(a.start) === key &&
          !["cancelled", "no_show"].includes(a.status),
      ).length;
      return `<button class="week-day ${key === selectedDate ? "selected" : ""} ${key === today ? "today" : ""}" data-action="schedule-day" data-date="${key}" aria-pressed="${key === selectedDate}" ${key === today ? 'aria-current="date"' : ""}><span>${escape(day.toLocaleDateString(OrbitI18n.locale(), { weekday: "short" }))}</span><strong>${day.getDate()}</strong>${count ? `<small>${count}</small>` : "<small></small>"}</button>`;
    },
  ).join("")}</div>`;
}
// The client pressed "I'll come" in the reminder.
function comingBadge(a) {
  return a.client_confirmed && a.status === "confirmed"
    ? `<span class="badge coming" title="${OrbitI18n.t("comingHint")}">✓ ${OrbitI18n.t("coming")}</span>`
    : "";
}
function scheduleAppointment(a) {
  const status = ["confirmed", "completed", "cancelled", "no_show"].includes(
    a.status,
  )
    ? a.status
    : "confirmed";
  const initials = a.client_name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => Array.from(name)[0])
    .join("");
  return `<article class="appointment ${status}" data-layout-key="appointment:${escape(a.id)}"><div class="appointment-time"><strong>${time(a.start)}</strong><small>${time(a.end)}</small></div><div class="appointment-person"><span class="client-avatar" aria-hidden="true">${escape(initials)}</span><div><strong>${escape(a.client_name)}</strong><span>${escape(a.service_name)}</span>${a.notes ? `<small>${escape(a.notes)}</small>` : ""}${visitAlerts(
    a,
  )
    .map((t) => `<small class="visit-alert">⚠ ${escape(t)}</small>`)
    .join(
      "",
    )}</div></div><div class="appointment-resource"><span>${escape(a.resource_name)}</span><strong>${money(a.price)} <small>${escape(data.currency)}</small></strong></div><div class="appointment-status"><span class="badge ${status}">${statuses[a.status] || escape(a.status)}</span>${comingBadge(a)}${a.rating ? `<span class="badge rating-badge" title="${OrbitI18n.t("reviewRating")}">${"★".repeat(a.rating)}</span>` : ""}${a.status === "confirmed" && a.deposit_until > Date.now() ? `<span class="badge deposit-wait">${OrbitI18n.t("depositWaiting").replace("{time}", time(a.deposit_until))}</span>` : ""}<div class="appointment-actions">${can("money") ? `<button class="secondary" data-action="payment" data-id="${a.id}">${OrbitI18n.t("m166")}</button>` : ""}${a.status === "confirmed" ? `${a.start <= Date.now() || businessDate(a.start) === businessDate(Date.now()) ? `<button class="secondary finish-button" data-action="complete" data-id="${a.id}">${OrbitI18n.t("m167")}</button>` : `<button class="secondary" data-action="appointment-open" data-id="${a.id}">${OrbitI18n.t("apptMove")}</button>`}<details class="appointment-menu"><summary aria-label="${OrbitI18n.t("bookingActions")}">•••</summary><div><button data-action="cancel-booking" data-id="${a.id}">${OrbitI18n.t("m168")}</button>${a.start <= Date.now() ? `<button data-action="no-show" data-id="${a.id}">${OrbitI18n.t("m003")}</button>` : ""}</div></details>` : ""}</div></div></article>`;
}
// Minutes since midnight in the business time zone.
function dayMinutes(value) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone:
        data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .map((part) => [part.type, part.value]),
  );
  return Number(parts.hour) * 60 + Number(parts.minute);
}
function clockMinutes(value, fallback) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value || ""));
  return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
}
function initialsOf(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] || "")
    .join("")
    .toLocaleUpperCase();
}
// Free hours and "already past" are counted in the company's time zone. When it differs from this
// computer (e.g. a company created with the server's UTC), offer to switch it in one click.
function zoneBanner() {
  // Some systems still report the old spelling of Kyiv.
  const local = Intl.DateTimeFormat()
      .resolvedOptions()
      .timeZone?.replace("Europe/Kiev", "Europe/Kyiv"),
    key = `${data.business_id || "local"}:${data.timezone}`;
  if (
    !data.timezone ||
    !local ||
    data.role === "staff" ||
    OrbitZones.offset(local) === OrbitZones.offset(data.timezone)
  )
    return "";
  try {
    if (localStorage.getItem("lomviko.zone.keep") === key) return "";
  } catch {}
  const name = (zone) => zone.replace(/_/g, " ").split("/").pop(),
    now = Date.now();
  return `<section class="setup-banner zone-banner"><div><strong>${OrbitI18n.t("zoneMismatchTitle")}</strong><p>${OrbitI18n.t(
    "zoneMismatchBody",
  )
    .replace(
      "{company}",
      `${escape(name(data.timezone))} — ${OrbitZones.clock(data.timezone, now)}`,
    )
    .replace(
      "{local}",
      `${escape(name(local))} — ${OrbitZones.clock(local, now)}`,
    )}</p></div><div class="setup-actions"><button class="primary" data-action="zone-fix" data-zone="${escape(local)}">${OrbitI18n.t("zoneMismatchFix")} ${escape(name(local))}</button><button class="secondary" data-action="zone-keep" data-key="${escape(key)}">${OrbitI18n.t("zoneMismatchKeep")}</button></div></section>`;
}
// Offer and privacy policy: shown until the signed-in person accepts the current versions.
let legalState = null;
async function loadLegal() {
  try {
    legalState = await window.orbit.call("legal:status");
  } catch {
    return;
  }
  if (legalState?.required && !$("#modal").open) render();
}
// How long the company can still work, as the owner sees it: in the account settings always,
// and as a banner on every page in the last week and after access has ended.
function subscriptionState() {
  const sub = data?.subscription;
  if (!sub || !sub.expires || data.mode !== "server") return null;
  const left = sub.expires - Date.now(),
    days = Math.max(0, Math.ceil(left / 86400000)),
    until = new Date(sub.expires).toLocaleDateString(OrbitI18n.locale(), { day: "numeric", month: "long" });
  return { trial: sub.stage === "trial", ended: left <= 0, days, until };
}
function subscriptionText(s) {
  if (s.ended) return OrbitI18n.t("subscriptionEnded").replace("{date}", s.until);
  return OrbitI18n.t(s.trial ? "subscriptionTrialLeft" : "subscriptionPaidLeft")
    .replace("{date}", s.until)
    .replace("{days}", String(s.days))
    .replace("{unit}", dayUnit(s.days));
}
function dayUnit(n) {
  if (OrbitI18n.language === "en") return n === 1 ? "day" : "days";
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? "день" : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? "дні" : "днів";
}
function subscriptionBanner() {
  const s = subscriptionState();
  if (!s || data.role === "staff" || (!s.ended && s.days > 7)) return "";
  return `<section class="setup-banner subscription-banner${s.ended ? " ended" : ""}"><div><strong>${escape(subscriptionText(s))}</strong><p>${OrbitI18n.t(s.ended ? "subscriptionEndedHint" : "subscriptionSoonHint")}</p></div><div class="setup-actions"><button class="primary" data-action="subscription-extend">${OrbitI18n.t("subscriptionExtend")}</button></div></section>`;
}
function legalBanner() {
  if (!legalState?.required || data?.mode !== "server") return "";
  return `<section class="setup-banner legal-banner"><div><strong>${OrbitI18n.t(legalState.updated ? "legalBannerTitle" : "legalBannerTitleFirst")}</strong><p>${OrbitI18n.t(legalState.offer?.version === "off" ? "legalBannerPrivacyOnly" : (legalState.updated ? "legalBannerUpdated" : "legalBannerFirst") + (legalState.offer?.kind === "site-terms" ? "Terms" : ""))}</p><p class="legal-links">${legalState.offer?.version === "off" ? "" : `<button type="button" class="link-button" data-action="offer">${OrbitI18n.t(legalState.offer?.kind === "site-terms" ? "legalTermsTitle" : "legalOfferTitle")}</button> · `}<button type="button" class="link-button" data-action="privacy">${OrbitI18n.t("privacyPolicy")}</button></p></div><div class="setup-actions"><button class="primary" data-action="legal-accept">${OrbitI18n.t("legalAccept")}</button></div></section>`;
}
function dayGrid(rows) {
  // Columns only for people on shift that day (plus anyone who already has a visit).
  const booked = new Set(
    rows
      .filter((a) => !["cancelled", "no_show"].includes(a.status))
      .flatMap((a) =>
        (a.resources?.length ? a.resources : [{ id: a.resource_id }]).map(
          (r) => r.id,
        ),
      ),
  );
  const resources = data.resources.filter(
    (r) => booked.has(r.id) || OrbitStaff.works(r, selectedDate, data.absences),
  );
  const resting = data.resources.filter((r) => !resources.includes(r));
  if (data.resources.length && !resources.length)
    return empty(OrbitI18n.t("staffNobody"), OrbitI18n.t("staffNobodyHint"));
  if (!resources.length)
    return empty(
      OrbitI18n.t("m172"),
      OrbitI18n.t("bookingSetupRequired"),
      `<button class="primary" data-action="go-catalog">${OrbitI18n.t("goCatalog")}</button>`,
    );
  const visible = rows.filter(
    (a) => !["cancelled", "no_show"].includes(a.status),
  );
  let from = clockMinutes(data.work_start, 540),
    to = clockMinutes(data.work_end, 1080);
  for (const a of visible) {
    from = Math.min(from, dayMinutes(a.start));
    to = Math.max(to, dayMinutes(a.end) || 1440);
  }
  from = Math.max(0, Math.floor(from / 60) * 60);
  to = Math.min(1440, Math.max(from + 60, Math.ceil(to / 60) * 60));
  const hours = [];
  for (let m = from; m < to; m += 60) hours.push(m);
  const columns = resources
    .map((r) => {
      const events = visible.filter((a) =>
        (a.resources?.length ? a.resources : [{ id: a.resource_id }]).some(
          (x) => x.id === r.id,
        ),
      );
      return `<div class="grid-column" data-resource="${escape(r.id)}" aria-label="${escape(r.name)}">${events
        .map((a) => {
          const status = statuses[a.status] ? a.status : "confirmed";
          return `<button type="button" class="grid-event ${status}" data-action="appointment-open" data-id="${escape(a.id)}" data-start-min="${dayMinutes(a.start)}" data-end-min="${dayMinutes(a.end) || 1440}" title="${escape(`${time(a.start)} – ${time(a.end)} · ${a.client_name || ""} · ${a.service_name || ""}`)}"><span class="grid-event-time">${time(a.start)}<span class="grid-event-end"> – ${time(a.end)}</span>${a.client_confirmed && status === "confirmed" ? ` <i class="grid-coming" title="${OrbitI18n.t("comingHint")}">✓</i>` : ""}</span><strong>${visitAlerts(a).length ? '<span class="grid-alert" aria-hidden="true">⚠</span> ' : ""}${escape(a.client_name)}</strong><small>${escape(a.service_name)}</small></button>`;
        })
        .join("")}</div>`;
    })
    .join("");
  const heads = resources
    .map((r) => {
      const count = visible.filter((a) =>
        (a.resources?.length ? a.resources : [{ id: a.resource_id }]).some(
          (x) => x.id === r.id,
        ),
      ).length;
      return `<div class="grid-resource"><span class="grid-avatar" aria-hidden="true">${escape(initialsOf(r.name))}</span><span><strong>${escape(r.name)}</strong><small>${OrbitI18n.t("bookingCount")}: ${count}</small></span></div>`;
    })
    .join("");
  return `<div class="day-grid" data-from="${from}" data-to="${to}" data-columns="${resources.length}"><div class="day-grid-head"><span></span>${heads}</div><div class="day-grid-scroll"><div class="day-grid-body"><div class="grid-times">${hours.map((m) => `<span data-min="${m}">${String(m / 60).padStart(2, "0")}:00</span>`).join("")}</div>${columns}<div class="grid-now" hidden></div><div class="grid-hover" hidden></div></div></div><p class="grid-hint">${resting.length ? `${OrbitI18n.t("staffResting")}: ${escape(resting.map((r) => r.name).join(", "))} · ` : ""}${OrbitI18n.t("gridHint")}</p></div>`;
}
function scheduleView() {
  const rows = data.appointments
    .filter((a) => businessDate(a.start) === selectedDate)
    .sort((a, b) => a.start - b.start);
  const active = rows.filter(
    (a) => !["cancelled", "no_show"].includes(a.status),
  );
  const completed = rows.filter((a) => a.status === "completed");
  const summary = [
    `${OrbitI18n.t("bookingCount")}: ${active.length}`,
    ...(!can("money")
      ? []
      : [
          `${money(active.reduce((s, a) => s + a.price, 0))} ${escape(data.currency)}`,
        ]),
    ...(completed.length
      ? [`${OrbitI18n.t("m161")}: ${completed.length}`]
      : []),
  ].join(" · ");
  const mode = scheduleMode === "list" ? "list" : "grid";
  const waiting = (data.waitlist || []).filter(
    (w) => w.date === selectedDate,
  ).length;
  const title = new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
    OrbitI18n.locale(),
    { day: "numeric", month: "long", weekday: "long" },
  );
  const list = rows.length || freeWindows(rows).length
    ? `<div class="agenda-labels" aria-hidden="true"><span>${OrbitI18n.t("m170")}</span><span>${OrbitI18n.t("m171")}</span><span>${OrbitI18n.t("m165")}</span><span>${OrbitI18n.t("m141")}</span></div><div class="agenda-list">${agendaWithFree(rows)}</div>`
    : empty(
        OrbitI18n.t("m172"),
        OrbitI18n.t("m173"),
        `<button class="primary" data-action="book">${OrbitI18n.t("m174")}</button>`,
      );
  return `${zoneBanner()}<section class="panel agenda-panel schedule-panel"><div class="schedule-toolbar"><div class="schedule-title"><h2>${escape(title)}</h2><span>${summary}</span></div><div class="schedule-controls"><button class="secondary waitlist-button" data-action="waitlist" title="${OrbitI18n.t("waitHint")}">${OrbitI18n.t("waitTitle")}${waiting ? ` <span class="count">${waiting}</span>` : ""}</button><button class="secondary" data-action="schedule-today" ${selectedDate === businessDate(Date.now()) ? "disabled" : ""}>${OrbitI18n.t("calendarToday")}</button><div class="date-controls"><button class="icon-button" data-action="day-prev" aria-label="${OrbitI18n.t("m181")}">‹</button><input aria-label="${OrbitI18n.t("m182")}" type="date" id="schedule-date" value="${selectedDate}"><button class="icon-button" data-action="day-next" aria-label="${OrbitI18n.t("m183")}">›</button></div><div class="segmented" role="group" aria-label="${OrbitI18n.t("scheduleView")}"><button type="button" data-action="schedule-mode" data-mode="grid" aria-pressed="${mode === "grid"}">${OrbitI18n.t("scheduleGrid")}</button><button type="button" data-action="schedule-mode" data-mode="list" aria-pressed="${mode === "list"}">${OrbitI18n.t("scheduleList")}</button></div></div></div>${scheduleWeek()}${mode === "grid" ? dayGrid(rows) : list}</section>`;
}
// Clients who have stayed away longer than usual for them: over one and a half of their own gap
// between visits, and never less than the company's minimum. Clients with a visit ahead are fine.
function lapsedClients() {
  const settings = data.integrations?.lapsed || {
      days: data.lapsed_days || 30,
      rhythm: true,
    },
    minimum = settings.days,
    now = Date.now();
  return data.clients
    .map((c) => {
      const s = c.stats || {},
        ahead = s.upcoming ?? (clientStats(c.id).next ? 1 : 0);
      if (!s.last || ahead) return null;
      const away = Math.floor((now - s.last) / 86400000),
        usual = s.rhythm || 0;
      return away >=
        Math.max(minimum, settings.rhythm ? Math.round(usual * 1.5) : 0)
        ? { client: c, away, usual }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => b.away - a.away);
}
function lapsedView(rows) {
  if (!feature("marketing")) return planLock("marketing");
  const manage = can("clients"),
    match = (c) =>
      `${c.name} ${c.phone}`.toLowerCase().includes(search.toLowerCase()),
    shown = rows.filter((r) => match(r.client)),
    day = (ms) => businessDate(ms).split("-").reverse().join(".");
  const note = lapsedToolbar(rows, manage);
  if (!shown.length)
    return (
      note + empty(OrbitI18n.t("lapsedEmpty"), OrbitI18n.t("lapsedEmptyHint"))
    );
  return `${note}<table class="table clients-table lapsed-table"><thead><tr><th>${OrbitI18n.t("m191")}</th><th>${OrbitI18n.t("m192")}</th><th>${OrbitI18n.t("clientLast")}</th><th>${OrbitI18n.t("lapsedUsual")}</th><th></th></tr></thead><tbody>${shown
    .map(({ client: c, away, usual }) => {
      // One invitation per absence: invited after the last visit means already done.
      const invited = c.invited_at && c.invited_at > (c.stats.last || 0);
      const invite = !manage
        ? ""
        : invited
          ? `<span class="sub">${OrbitI18n.t("lapsedInvited")} ${day(c.invited_at)}</span>`
          : c.chat_id
            ? `<button class="secondary" data-action="lapsed-invite" data-id="${escape(c.id)}">${OrbitI18n.t("lapsedInvite")}</button>`
            : "";
      return `<tr data-layout-key="lapsed:${escape(c.id)}"><td><button class="link-button" data-action="client-open" data-id="${escape(c.id)}"><strong>${escape(c.name)}</strong></button></td><td>${escape(c.phone || "—")}</td><td>${day(c.stats.last)} <span class="sub">· ${OrbitI18n.t("lapsedAway").replace("{days}", away)}</span></td><td>${usual ? OrbitI18n.t("lapsedEvery").replace("{days}", usual) : "—"}</td><td><div class="row-actions"><button class="secondary" data-action="client-book" data-id="${escape(c.id)}">${OrbitI18n.t("waitBook")}</button>${invite}</div></td></tr>`;
    })
    .join("")}</tbody></table>`;
}
const clientText = (c) =>
  `${c.name} ${c.phone} ${c.email || ""} ${c.tags || ""} ${c.vehicle || ""} ${c.plate || ""}`.toLowerCase();
// Birthdays in the coming week, nearest first.
function birthdayClients() {
  return data.clients
    .map((c) => ({ client: c, next: birthdayIn(c.birthday) }))
    .filter((x) => x.next && x.next.days <= 7)
    .sort((a, b) => a.next.days - b.next.days);
}
function birthdaysView(rows) {
  const shown = rows.filter((r) =>
    clientText(r.client).includes(search.toLowerCase()),
  );
  if (!shown.length)
    return empty(
      OrbitI18n.t("birthdaysEmpty"),
      OrbitI18n.t("birthdaysEmptyHint"),
    );
  return `<table class="table clients-table lapsed-table"><thead><tr><th>${OrbitI18n.t("m191")}</th><th>${OrbitI18n.t("m192")}</th><th>${OrbitI18n.t("clientBirthday")}</th><th></th></tr></thead><tbody>${shown
    .map(
      ({ client: c, next }) =>
        `<tr data-layout-key="birthday:${escape(c.id)}"><td><button class="link-button" data-action="client-open" data-id="${escape(c.id)}"><strong>${escape(c.name)}</strong></button></td><td>${escape(c.phone || "—")}</td><td>🎂 ${formatDay(c.birthday).slice(0, 5)} <span class="sub">· ${next.days === 0 ? OrbitI18n.t("birthdayToday") : OrbitI18n.t("birthdayIn").replace("{days}", next.days)} · ${next.age}</span></td><td><div class="row-actions"><button class="secondary" data-action="client-book" data-id="${escape(c.id)}">${OrbitI18n.t("waitBook")}</button></div></td></tr>`,
    )
    .join("")}</tbody></table>`;
}
function clientsView() {
  const clients = data.clients.filter((c) =>
      clientText(c).includes(search.toLowerCase()),
    ),
    staff = !can("money"),
    lapsed = lapsedClients(),
    birthdays = birthdayClients(),
    filter = ["lapsed", "birthdays"].includes(clientFilter)
      ? clientFilter
      : "all";
  const tabs = `<div class="segmented" role="group" aria-label="${OrbitI18n.t("clientsFilter")}"><button type="button" data-action="client-filter" data-filter="all" aria-pressed="${filter === "all"}">${OrbitI18n.t("clientsAll")}</button><button type="button" data-action="client-filter" data-filter="lapsed" aria-pressed="${filter === "lapsed"}">${OrbitI18n.t("lapsedTitle")}${lapsed.length ? ` <span class="count">${lapsed.length}</span>` : ""}</button><button type="button" data-action="client-filter" data-filter="birthdays" aria-pressed="${filter === "birthdays"}">${OrbitI18n.t("birthdaysTitle")}${birthdays.length ? ` <span class="count">${birthdays.length}</span>` : ""}</button></div>`;
  if (filter === "birthdays")
    return `<div class="list-toolbar">${tabs}<input class="search" id="client-search" placeholder="${OrbitI18n.t(OrbitIndustries.fields(data.industry).includes("vehicle") ? "clientSearchAuto" : "clientSearch")}" value="${escape(search)}"></div><section class="panel">${birthdaysView(birthdays)}</section>`;
  if (filter === "lapsed")
    return `<div class="list-toolbar">${tabs}<input class="search" id="client-search" placeholder="${OrbitI18n.t(OrbitIndustries.fields(data.industry).includes("vehicle") ? "clientSearchAuto" : "clientSearch")}" value="${escape(search)}"></div><section class="panel">${lapsedView(lapsed)}</section>`;
  return `<div class="list-toolbar">${tabs}<input class="search" id="client-search" placeholder="${OrbitI18n.t(OrbitIndustries.fields(data.industry).includes("vehicle") ? "clientSearchAuto" : "clientSearch")}" value="${escape(search)}"><button class="secondary" data-action="client">${OrbitI18n.t("m197")}</button>${!can("clients") ? "" : `<button class="secondary" data-action="client-import">${OrbitI18n.t("importButton")}</button>`}</div><section class="panel">${
    clients.length
      ? `<table class="table clients-table"><thead><tr><th>${OrbitI18n.t("m191")}</th><th>${OrbitI18n.t("m192")}</th><th>${OrbitI18n.t("clientVisits")}</th><th>${OrbitI18n.t("clientLast")}</th>${staff ? "" : `<th>${OrbitI18n.t("clientPaid")}</th>`}<th>Telegram</th></tr></thead><tbody>${clients
          .map((c) => {
            const st = clientStats(c.id);
            return `<tr class="clickable" data-action="client-open" data-id="${escape(c.id)}" data-layout-key="client:${escape(c.id)}"><td><span class="client-name"><strong>${escape(c.name)}</strong>${birthdayIn(c.birthday)?.days <= 7 ? '<span title="' + OrbitI18n.t("birthdaysTitle") + '">🎂</span>' : ""}${c.alert ? `<span class="visit-alert" title="${escape(c.alert)}">⚠</span>` : ""}</span>${
              c.tags
                ? `<div class="client-tags">${c.tags
                    .split(",")
                    .map((t) => `<span class="tag">${escape(t.trim())}</span>`)
                    .join("")}</div>`
                : ""
            }${c.notes ? `<div class="sub">${escape(c.notes)}</div>` : ""}${c.vehicle || c.plate ? `<div class="sub">${escape([c.vehicle, c.plate].filter(Boolean).join(" · "))}</div>` : ""}</td><td>${escape(c.phone || "—")}</td><td>${st.done}${st.next ? ` <span class="sub">· ${OrbitI18n.t("clientNext").toLowerCase()} ${businessDate(st.next.start).slice(5).split("-").reverse().join(".")}</span>` : ""}</td><td>${st.last ? businessDate(st.last).split("-").reverse().join(".") : "—"}</td>${staff ? "" : `<td>${money(st.paid)}${st.due ? ` <span class="badge due">−${money(st.due)}</span>` : ""}</td>`}<td>${c.chat_id ? `<span class="badge">${OrbitI18n.t("m189")}</span>` : `<button class="link-button" data-action="link" data-id="${c.id}">${OrbitI18n.t("clientInvite")}</button>`}</td></tr>`;
          })
          .join("")}</tbody></table>`
      : empty(
          search ? OrbitI18n.t("m193") : OrbitI18n.t("m194"),
          OrbitI18n.t("m195"),
        )
  }</section>`;
}
function catalogView() {
  return `<div class="grid-2"><section class="card"><div class="panel-head"><h2>${OrbitI18n.t("m213")}</h2><button class="secondary" data-action="service">${OrbitI18n.t("m214")}</button></div>${
    data.services.length
      ? data.services
          .map(
            (s) =>
              `<div class="catalog-row" data-layout-key="service:${escape(s.id)}"><div><strong>${escape(s.name)}</strong><small>${s.duration} ${OrbitI18n.t("m200")} ${s.capacity} ${OrbitI18n.t("m201")} ${s.required_resources} ${OrbitI18n.t("m202")}</small><small>${OrbitI18n.t("m203")} ${s.bot_visible ? OrbitI18n.t("m198") : OrbitI18n.t("m199")} ${OrbitI18n.t("m204")} ${s.web_visible ? OrbitI18n.t("m198") : OrbitI18n.t("m199")}</small><small>${OrbitI18n.t("staffWho")}: ${
                (s.resource_ids || []).length
                  ? escape(
                      data.resources
                        .filter((r) => s.resource_ids.includes(r.id))
                        .map((r) => r.name)
                        .join(", "),
                    )
                  : OrbitI18n.t("staffAnyone")
              }</small></div><div><span class="mini-price">${money(s.price)} ${escape(data.currency)} ${OrbitI18n.t("m205")}</span><div class="mt"><button class="secondary" data-action="service-edit" data-id="${s.id}">${OrbitI18n.t("m206")}</button>${can("catalog") ? `<button class="danger" data-action="service-delete" data-id="${s.id}">${OrbitI18n.t("catalogDelete")}</button>` : ""}</div></div></div>`,
          )
          .join("")
      : empty(OrbitI18n.t("m207"), OrbitI18n.t("m208"))
  }</section><section class="card"><div class="panel-head"><h2>${OrbitI18n.t("m210")}</h2><button class="secondary" data-action="resource">${OrbitI18n.t("m215")}</button></div>${
    data.resources.length
      ? data.resources
          .map((r) => {
            const away = (data.absences || []).find(
              (x) =>
                x.resource_id === r.id &&
                x.end_date >= businessDate(Date.now()),
            );
            return `<div class="catalog-row" data-layout-key="resource:${escape(r.id)}"><div><strong>${escape(r.name)}</strong><small>${escape(scheduleLabel(r))}${away ? ` · ${OrbitI18n.t("staffAway")} ${away.start_date.slice(5).split("-").reverse().join(".")}–${away.end_date.slice(5).split("-").reverse().join(".")}` : ""}</small></div>${can("catalog") ? `<div class="row-buttons"><button class="secondary" data-action="staff-edit" data-id="${r.id}">${OrbitI18n.t("staffSchedule")}</button><button class="danger" data-action="resource-delete" data-id="${r.id}">${OrbitI18n.t("catalogDelete")}</button></div>` : ""}</div>`;
          })
          .join("")
      : empty(OrbitI18n.t("m211"), OrbitI18n.t("m212"))
  }</section></div>${materialsCard()}<div class="callout">${OrbitI18n.t("m216")}</div>`;
}
// "Повернення · Готівка" for a refund given back in cash; older refunds were their own method.
function payMethodLabel(p) {
  const name =
    {
      cash: OrbitI18n.t("m116"),
      card: OrbitI18n.t("m117"),
      transfer: OrbitI18n.t("m118"),
      refund: OrbitI18n.t("m119"),
      monobank: "monobank",
      liqpay: "LiqPay",
    }[p.method] || p.method;
  return p.amount < 0 && p.method !== "refund"
    ? `${OrbitI18n.t("m119")} · ${name}`
    : name;
}
// One compact row per integration: icon, name with status, one line of what it does, buttons on the right.
// The longer explanations and legal notes stay one click away under "Детальніше".
function integrationRow({ icon, name, on, status, short, controls, more }) {
  return `<div class="integration-row"><div class="setting-row"><div class="integration-main"><span class="integration-icon small">${icon}</span><div class="setting-label"><span>${name} <span class="badge ${on ? "" : "cancelled"}">${status}</span></span><small>${short}</small></div></div><div class="setting-control">${controls}</div></div>${more ? `<details class="integration-more"><summary>${OrbitI18n.t("intMore")}</summary>${more}</details>` : ""}</div>`;
}
function payRow(kind) {
  const mono = kind === "monobank",
    m = data.integrations[kind] || { connected: false };
  const controls =
    data.mode !== "server" || data.role !== "owner"
      ? ""
      : m.connected
        ? `<button class="danger" data-action="${mono ? "mono-off" : "liqpay-off"}">${OrbitI18n.t("payMonoDisconnect")}</button>`
        : `<button class="primary" data-action="${mono ? "mono-connect" : "liqpay-connect"}">${OrbitI18n.t(mono ? "payMonoConnect" : "payLiqConnect")}</button>`;
  return integrationRow({
    icon: "₴",
    name: OrbitI18n.t(mono ? "payMonoTitle" : "payLiqTitle"),
    on: m.connected,
    status: m.connected
      ? escape(m.merchant || (mono ? "monobank" : "LiqPay"))
      : OrbitI18n.t("m217"),
    short:
      data.mode !== "server"
        ? OrbitI18n.t("payNeedsAccount")
        : OrbitI18n.t(mono ? "intMonoShort" : "intLiqShort"),
    controls,
    more: `<p>${OrbitI18n.t(mono ? "payMonoAbout" : "payLiqAbout")}</p><p>${OrbitI18n.t(mono ? "payMonoLegal" : "payLiqLegal")}</p>`,
  });
}
function integrationsView() {
  const t = data.integrations.telegram,
    w = data.integrations.website;
  const telegram = integrationRow({
    icon: "➤",
    name: OrbitI18n.t("m239"),
    on: t.connected,
    status: t.connected ? `@${escape(t.username)}` : OrbitI18n.t("m217"),
    short: t.connected
      ? `t.me/${escape(t.username)} · ${escape(OrbitI18n.message(t.state))}`
      : OrbitI18n.t("intBotShort"),
    controls: t.connected
      ? `<button class="secondary" data-action="telegram-check">${OrbitI18n.t("m219")}</button><button class="secondary" data-action="telegram">${OrbitI18n.t("m220")}</button><button class="danger" data-action="telegram-off">${OrbitI18n.t("m221")}</button>`
      : `<button class="primary" data-action="telegram">${OrbitI18n.t("m222")}</button>`,
    more: `<p>${OrbitI18n.t("botRoles")}</p><p>${OrbitI18n.t("m240")}</p><p>${OrbitI18n.t("botHosting")}: ${OrbitI18n.t(t.hosting === "external" ? "botExternal" : "botHosted")}</p>${t.connected ? `<p>${OrbitI18n.t("m218")}</p>` : ""}<p>${OrbitI18n.t("m242")} ${data.mode === "server" ? OrbitI18n.t("m223") : OrbitI18n.t("m224")} ${OrbitI18n.t("m243")}</p>`,
  });
  const b = data.integrations.booking;
  const booking = integrationRow({
    icon: "✦",
    name: OrbitI18n.t("bookTitle"),
    on: Boolean(b?.enabled),
    status: b?.enabled ? OrbitI18n.t("m233") : OrbitI18n.t("m234"),
    short: !b
      ? OrbitI18n.t("payNeedsAccount")
      : b.enabled
        ? `<span class="mono-inline">${escape(b.url)}</span>`
        : OrbitI18n.t("bookShort"),
    controls: !b
      ? ""
      : `${b.enabled ? `<button class="secondary" data-action="booking-share">${OrbitI18n.t("bookShareButton")}</button><button class="secondary" data-action="booking-open">${OrbitI18n.t("bookOpen")}</button>` : ""}${!can("integrations") ? "" : `<button class="${b.enabled ? "secondary" : "primary"}" data-action="booking-settings">${OrbitI18n.t(b.enabled ? "bookSettings" : "bookTurnOn")}</button>`}`,
    more: `<p>${OrbitI18n.t("bookAboutLong")}</p>`,
  });
  const website = w
    ? integrationRow({
        icon: "◎",
        name: OrbitI18n.t("m235"),
        on: w.enabled,
        status: w.enabled ? OrbitI18n.t("m233") : OrbitI18n.t("m234"),
        short: `<span class="mono-inline">${escape(data.integrations.product.endpoint || "")}${escape(w.path)}</span>`,
        controls: "",
        more: `<p>${OrbitI18n.t("m236")}</p>`,
      })
    : "";
  return `<div class="integrations">${settingsGroup(OrbitI18n.t("intGroupClients"), booking + telegram + (feature("marketing") ? reviewsRow() : "") + website, OrbitI18n.t("m237"))}${settingsGroup(OrbitI18n.t("intGroupPay"), feature("payments") ? payRow("monobank") + payRow("liqpay") : planLock("payments"))}${feature("fiscal") ? fiscalGroup() : settingsGroup(OrbitI18n.t("planFiscal"), planLock("fiscal"))}</div>`;
}
let settingsSection = "general";
// One setting per row: what it is on the left, the control on the right.
function settingRow(label, control, hint = "") {
  return `<div class="setting-row"><div class="setting-label"><span>${label}</span>${hint ? `<small>${hint}</small>` : ""}</div><div class="setting-control">${control}</div></div>`;
}
function settingsGroup(title, rows, note = "") {
  return `<section class="settings-group">${title ? `<h3>${title}</h3>` : ""}<div class="group-box">${rows}</div>${note ? `<p class="group-note">${note}</p>` : ""}</section>`;
}
function settingsGeneral() {
  const theme = window.OrbitPreferences?.theme;
  return (
    settingsGroup(
      OrbitI18n.t("appearanceTitle"),
      settingRow(
        OrbitI18n.t("appearanceTheme"),
        `<div class="segmented">${[
          ["light", "appearanceLight"],
          ["dark", "appearanceDark"],
        ]
          .map(
            ([value, key]) =>
              `<button type="button" data-theme-choice="${value}" aria-pressed="${theme === value}">${OrbitI18n.t(key)}</button>`,
          )
          .join("")}</div>`,
      ) +
        settingRow(
          `<label for="language-choice">${OrbitI18n.t("language")}</label>`,
          `<select id="language-choice">${[
            ["uk", "Українська"],
            ["en", "English"],
          ]
            .map(
              ([value, name]) =>
                `<option value="${value}" ${OrbitI18n.language === value ? "selected" : ""}>${name}</option>`,
            )
            .join("")}</select>`,
        ),
    ) +
    settingsGroup(
      OrbitI18n.t("settingsHelp"),
      settingRow(
        OrbitI18n.t("showWelcome"),
        `<button type="button" class="secondary" data-action="welcome">${OrbitI18n.t("settingsOpen")}</button>`,
      ),
    )
  );
}
function settingsCompany() {
  return settingsGroup(
    OrbitI18n.t("m259"),
    `<form id="settings-form" class="settings-form"><label for="business">${OrbitI18n.t("m260")}</label><input id="business" name="business" maxlength="120" value="${escape(data.business)}" required><label for="industry">${OrbitI18n.t("m063")}</label><select name="industry" id="industry">${[
      ...OrbitIndustries.TYPES.map((t) => [
        t.id,
        OrbitI18n.language === "en" ? t.en : t.uk,
      ]),
    ]
      .map(
        ([id, label]) =>
          `<option value="${id}" ${data.industry === id ? "selected" : ""}>${label}</option>`,
      )
      .join("")}</select></form>`,
  );
}
function settingsAccount() {
  const remote = data.mode === "server";
  return (
    settingsGroup(
      OrbitI18n.t("accountTitle"),
      (remote
        ? settingRow(
            escape(data.account?.name || OrbitI18n.t("accountTitle")),
            `<span class="badge">${OrbitI18n.t("m255")}</span>`,
            OrbitI18n.t("m257"),
          ) +
          (subscriptionState() && data.role !== "staff"
            ? settingRow(
                OrbitI18n.t("subscriptionTitle"),
                `<button type="button" class="primary" data-action="subscription-extend">${OrbitI18n.t("subscriptionExtend")}</button>`,
                `${data.plan && !data.plan.free ? `${OrbitI18n.t("planCurrent")}: ${escape(OrbitI18n.language === "en" ? OrbitPlans.byId(data.plan.id).en : OrbitPlans.byId(data.plan.id).uk)}. ` : ""}${escape(subscriptionText(subscriptionState()))}. ${OrbitI18n.t("subscriptionPriceHint")}`,
              )
            : "")
        : settingRow(
            OrbitI18n.t("m256"),
            `<button type="button" class="primary" data-action="login">${OrbitI18n.t("m036")}</button>`,
            OrbitI18n.t("accountAccessHint"),
          )),
    ) +
    (remote
      ? settingsGroup(
          "",
          settingRow(
            OrbitI18n.t("accountDelete"),
            `<button type="button" class="danger" data-action="account-delete">${OrbitI18n.t("accountDelete")}</button>`,
            OrbitI18n.t(
              data.role === "owner"
                ? "accountDeleteOwnerHint"
                : "accountDeleteMemberHint",
            ),
          ),
        )
      : "")
  );
}
function settingsData() {
  const owner = can("settings");
  return (
    settingsGroup(
      OrbitI18n.t("m261"),
      owner
        ? settingRow(
            OrbitI18n.t("settingsExport"),
            `<button type="button" class="secondary" data-action="export-json">${OrbitI18n.t("m248")}</button><button type="button" class="secondary" data-action="export-csv">${OrbitI18n.t("m249")}</button>`,
            OrbitI18n.t("m262"),
          ) +
            settingRow(
              OrbitI18n.t("m250"),
              `<button type="button" class="secondary" data-action="backup">${OrbitI18n.t("settingsCreate")}</button>`,
            )
        : settingRow(OrbitI18n.t("m252"), ""),
      OrbitI18n.t("m263"),
    ) +
    settingsGroup(
      OrbitI18n.t("m269"),
      settingRow(
        data.mode === "server" ? OrbitI18n.t("m255") : OrbitI18n.t("m256"),
        "",
        data.mode === "server" ? OrbitI18n.t("m257") : OrbitI18n.t("m258"),
      ),
    )
  );
}
function settingsAbout() {
  return `<div class="about-head"><span class="wordmark">LOMVIKO</span><strong>${OrbitI18n.t("settingsVersion")} ${escape(appVersion || "—")}</strong></div>${settingsGroup(
    "",
      settingRow(
        OrbitI18n.t("legalDocuments"),
        `<button type="button" class="secondary" data-action="offer">${OrbitI18n.t("legalOfferTitle")}</button> <button type="button" class="secondary" data-action="privacy">${OrbitI18n.t("privacyPolicy")}</button>`,
        OrbitI18n.t("legalDocumentsHint"),
      ),
  )}`;
}
function settingsSupport() {
  const contact = supportContact(),
    rows = supportState.requests;
  const list = supportState.signedOut
    ? `<p class="hint">${OrbitI18n.t("supportSignedOut")}</p>`
    : rows.length
      ? `<div class="support-requests">${rows
          .map(
            (r) =>
              `<button type="button" class="support-row ${r.unread ? "unread" : ""}" data-action="support-thread" data-id="${escape(r.id)}"><strong>№${r.number}</strong><span class="support-row-text">${escape(r.messages.at(-1)?.text.slice(0, 90) || "")}</span><span class="badge support-status ${r.status}">${OrbitI18n.t(supportStatus[r.status] || "supportStatusOpen")}</span>${r.unread ? `<span class="support-new">${OrbitI18n.t("supportNewReply")}</span>` : ""}<span class="hint">${supportWhen(r.updated_at || r.created_at)}</span></button>`,
          )
          .join("")}</div>`
      : `<p class="hint">${supportState.loaded ? OrbitI18n.t("supportNoRequests") : "…"}</p>`;
  return `<p class="support-intro">${OrbitI18n.t("supportIntro")}</p>${settingsGroup(
    "",
    settingRow(
      OrbitI18n.t("supportWrite"),
      `<button type="button" class="primary" data-action="support">${OrbitI18n.t("supportFromError")}</button>`,
      OrbitI18n.t("supportWriteHint"),
    ) +
      (contact
        ? settingRow(
            OrbitI18n.t("supportDirect"),
            `<span class="setting-value">${escape(contact)}</span>`,
          )
        : ""),
  )}<h3 class="support-heading">${OrbitI18n.t("supportMine")}</h3>${list}`;
}
function settingsView() {
  const sections = [
    ["general", "settingsGeneral", settingsGeneral],
    ["company", "settingsCompany", settingsCompany],
    ["notify", "notifyTitle", settingsNotifications],
    ["account", "accountTitle", settingsAccount],
    ["data", "settingsData", settingsData],
    ["support", "settingsSupport", settingsSupport],
    ["about", "settingsAbout", settingsAbout],
  ];
  const current =
    sections.find(([id]) => id === settingsSection) || sections[0];
  return `<div class="settings-layout"><nav class="settings-nav" aria-label="${OrbitI18n.t("m012")}">${sections.map(([id, key]) => `<button type="button" data-action="settings-section" data-section="${id}" ${id === current[0] ? 'aria-current="page"' : ""}>${OrbitI18n.t(key)}</button>`).join("")}</nav><div class="settings-pane"><h2>${OrbitI18n.t(current[1])}</h2>${current[2]()}</div></div>`;
}
