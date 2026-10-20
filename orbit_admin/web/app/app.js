"use strict";
const $ = (selector) => document.querySelector(selector);
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const dateKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const time = (value) =>
  new Date(value).toLocaleTimeString(OrbitI18n.locale(), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone:
      data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
const money = (value) =>
  (value / 100).toLocaleString(OrbitI18n.locale(), {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
const statuses = {
  confirmed: OrbitI18n.t("m000"),
  completed: OrbitI18n.t("m001"),
  cancelled: OrbitI18n.t("m002"),
  no_show: OrbitI18n.t("m003"),
};
let data,
  page = "schedule",
  selectedDate = dateKey(new Date()),
  search = "",
  clientFilter = "all",
  onSubmit,
  modalNeedsConnection = true,
  toastTimer,
  selectedLogo,
  financeMonth = new Date().toISOString().slice(0, 7),
  team = [],
  appVersion = "";
let scheduleMode = (() => {
  try {
    return localStorage.getItem("lomviko.schedule.mode") === "list"
      ? "list"
      : "grid";
  } catch {
    return "grid";
  }
})();
let dashboardMode = "month",
  dashboardDate = dateKey(new Date());
const pages = {
  schedule: [OrbitI18n.t("m004"), OrbitI18n.t("m005")],
  clients: [OrbitI18n.t("m006"), OrbitI18n.t("m007")],
  catalog: [OrbitI18n.t("m008"), OrbitI18n.t("m009")],
  integrations: [OrbitI18n.t("m010"), OrbitI18n.t("m011")],
  settings: [OrbitI18n.t("m012"), OrbitI18n.t("m013")],
};
pages.dashboard = [OrbitI18n.t("m014"), OrbitI18n.t("m015")];
pages.finance = [OrbitI18n.t("m016"), OrbitI18n.t("m017")];
pages.team = [OrbitI18n.t("m018"), OrbitI18n.t("m019")];
function businessDate(value) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone:
        data?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(new Date(value))
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}
// Every error the user sees is in their language and says what to do next. The original text is
// kept for the support form, so the team still gets the technical cause.
let lastError = "",
  legalFor = "";
const cyrillic = /[А-Яа-яІіЇїЄєҐґ]/;
const knownErrors = [
  [/trial already used/i, "errTrialUsed"],
  [
    /invalid or expired access key|request (was )?already used/i,
    "errAccessKey",
  ],
  [/update required/i, "errUpdateRequired"],
  [/device proof|invalid device key/i, "m649"],
  [/invalid signature/i, "m676"],
  [/too many/i, "m681"],
  [
    /fetch failed|failed to fetch|econn|etimedout|enotfound|eai_again|network|timed? ?out|aborted/i,
    "m559",
  ],
  [/unexpected token|json/i, "errServerReply"],
  [/sqlite|database is locked/i, "errDatabase"],
  [/not found/i, "errNotFound"],
];
function friendlyError(raw) {
  const text = String(raw || "").trim();
  // Server messages written as "Українською / In English".
  const parts = text.split(" / ");
  if (parts.length === 2 && cyrillic.test(parts[0]) && !cyrillic.test(parts[1]))
    return OrbitI18n.language === "en" ? parts[1] : parts[0];
  const message = OrbitI18n.message(text);
  if (OrbitI18n.language === "en" || cyrillic.test(message)) return message;
  const known = knownErrors.find(([pattern]) => pattern.test(text));
  return OrbitI18n.t(known ? known[1] : "errUnknown");
}
function toast(message, error = false) {
  const host = $("#modal").open ? $("#modal") : document.body;
  if ($("#toast").parentElement !== host) host.append($("#toast"));
  if (error) lastError = String(message || "");
  $("#toast").textContent = error ? friendlyError(message) : message;
  if (error) {
    const help = document.createElement("button");
    help.type = "button";
    help.className = "toast-help";
    help.dataset.action = "support";
    help.dataset.fromError = "1";
    help.textContent = OrbitI18n.t("supportFromError");
    $("#toast").append(help);
  }
  $("#toast").className = error ? "error" : "";
  $("#toast").style.display = "block";
  $("#toast").hidePopover?.();
  $("#toast").showPopover?.();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(
    () => {
      $("#toast").hidePopover?.();
      $("#toast").style.display = "none";
    },
    error ? 12000 : 5000,
  );
}
async function run(fn) {
  try {
    return await fn();
  } catch (e) {
    if (!e?.signedOut) toast(e.message, true);
  }
}
// The company data arrives as a window (previous month, this month, everything ahead). Older
// months are fetched once when finance or the dashboard needs them and kept here; when nothing
// changed since the last refresh the app gets a few bytes and keeps what it has.
let windowData = null,
  older = { business: null, from: Infinity, appointments: [], payments: [] },
  olderLoading = false;
function mergeOlder() {
  if (!data?.loaded_from || older.business !== data.business_id) return;
  const ids = new Set(windowData.appointments.map((a) => a.id)),
    paymentIds = new Set(windowData.payments.map((p) => p.id));
  data.appointments = [
    ...older.appointments.filter((a) => !ids.has(a.id)),
    ...windowData.appointments,
  ];
  data.payments = [
    ...windowData.payments,
    ...older.payments.filter((p) => !paymentIds.has(p.id)),
  ];
}
// Earliest moment the open page shows; older data is loaded if the window does not reach it.
function neededFrom() {
  try {
    if (page === "finance" && financeMonth)
      return OrbitAnalytics.period("month", financeMonth, data.timezone).start;
    if (page === "dashboard")
      return OrbitAnalytics.period(
        dashboardMode,
        dashboardValue(),
        data.timezone,
      ).start;
    if (page === "schedule" && selectedDate)
      return (
        OrbitAnalytics.period("day", selectedDate, data.timezone).start -
        7 * 86400000
      );
  } catch {}
  return Infinity;
}
async function loadOlder() {
  const need = neededFrom(),
    have = Math.min(
      data?.loaded_from ?? -Infinity,
      older.business === data?.business_id ? older.from : Infinity,
    );
  if (!data?.loaded_from || olderLoading || need >= have || data.offline)
    return;
  olderLoading = true;
  try {
    const range = await window.orbit.call("crm:range", {
      from: need,
      to: have,
    });
    if (older.business !== data.business_id)
      older = {
        business: data.business_id,
        from: Infinity,
        appointments: [],
        payments: [],
      };
    older.appointments.push(...range.appointments);
    older.payments.push(...range.payments);
    older.from = need;
    mergeOlder();
    render();
  } finally {
    olderLoading = false;
  }
}
async function refresh({ preserveView = false } = {}) {
  const first = !data;
  const known =
    data?.revision && !data.offline && windowData
      ? { revision: data.revision, from: data.loaded_from }
      : undefined;
  const next = await window.orbit.call("snapshot", known);
  window.OrbitWeb.signedIn();
  if (next.unchanged && windowData && data)
    data = { ...data, ...next, unchanged: undefined };
  else {
    data = next;
    windowData = {
      appointments: next.appointments || [],
      payments: next.payments || [],
    };
  }
  if (older.business && older.business !== data.business_id)
    older = { business: null, from: Infinity, appointments: [], payments: [] };
  mergeOlder();
  if (!appVersion) {
    appVersion = await window.orbit.call("app:version").catch(() => "");
    $(".version").textContent = appVersion
      ? `LOMVIKO ${appVersion}`
      : "LOMVIKO";
  }
  if (first) {
    selectedDate = businessDate(Date.now());
    dashboardDate = selectedDate;
  }
  $("#business-name").textContent = data.business;
  // Signed in just now (or on another account): check the offer/policy consent right away.
  const who = data.mode === "server" ? data.account?.id || "" : "";
  if (who !== legalFor) {
    legalFor = who;
    legalState = null;
    if (who) setTimeout(() => loadLegal(), 0);
  }
  if (preserveView) connectionView();
  else render();
  if (data.connecting)
    setTimeout(
      () =>
        run(() =>
          refresh({ preserveView: $("#modal").open || page === "settings" }),
        ),
      250,
    );

}
const onlineActions = new Set([
  "book",
  "client",
  "service",
  "service-edit",
  "resource",
  "payment",
  "complete",
  "cancel-booking",
  "no-show",
  "team-refresh",
  "team-add",
  "team-edit",
  "business-add",
  "telegram",
  "telegram-off",
  "telegram-check",
  "link",
  "export-json",
  "export-csv",
  "backup",
]);
function connectionView() {
  const offline = Boolean(data.offline),
    remote = data.mode === "server";
  $("#mode-pill").textContent = remote
    ? offline
      ? data.connecting
        ? OrbitI18n.t("m020")
        : OrbitI18n.t("m021")
      : OrbitI18n.t("m022")
    : OrbitI18n.t("m023");
  $("#storage-note").textContent = remote
    ? offline
      ? OrbitI18n.t("m024")
      : OrbitI18n.t("m025")
    : OrbitI18n.t("m026");
  const notice = $("#connection-notice");
  notice.hidden = !offline;
  notice.textContent = offline
    ? `${data.connecting ? OrbitI18n.t("m027") : OrbitI18n.t("m028")} ${OrbitI18n.t("m030")}${data.cached_at ? ` ${OrbitI18n.t("m029")} ` + new Date(data.cached_at).toLocaleString(OrbitI18n.locale()) : ""}${OrbitI18n.t("m031")}`
    : "";
  const controls = [
    $("#new-booking"),
    $("#business-selector"),
    ...document.querySelectorAll("#view [data-action]"),
  ].filter((el) => !el.dataset.action || onlineActions.has(el.dataset.action));
  controls.push(
    ...document.querySelectorAll(
      "#settings-form input,#settings-form select,#settings-form textarea,#settings-form button",
    ),
  );
  for (const el of controls) {
    if (
      offline &&
      !el.disabled
    ) {
      el.dataset.offlineDisabled = "1";
      el.disabled = true;
    } else if (!offline && el.dataset.offlineDisabled) {
      delete el.dataset.offlineDisabled;
      el.disabled = false;
    }
  }
}

function empty(title, description, button = "") {
  return `<div class="empty"><div class="empty-icon">▦</div><strong>${escape(title)}</strong><p>${escape(description)}</p>${button}</div>`;
}
function render() {
  if (!data) return;
  if (neededFrom() < (data.loaded_from ?? -Infinity)) run(loadOlder);
  $("#page-title").textContent = pages[page][0];
  $("#page-subtitle").textContent = pages[page][1];
  document.querySelectorAll(".nav").forEach((n) => {
    n.classList.toggle("active", n.dataset.page === page);
    if (n.dataset.page === page) n.setAttribute("aria-current", "page");
    else n.removeAttribute("aria-current");
  });
  $("#view").innerHTML =
    legalBanner() +
    subscriptionBanner() +
    {
      dashboard: dashboardView,
      schedule: scheduleView,
      clients: clientsView,
      catalog: catalogView,
      integrations: integrationsView,
      settings: settingsView,
      finance: financeView,
      team: teamView,
    }[page]();
  const remote = data.mode === "server";
  $("#storage-label").textContent = remote
    ? OrbitI18n.t("m032")
    : OrbitI18n.t("m033");
  $("#storage-note").textContent = remote
    ? OrbitI18n.t("m034")
    : OrbitI18n.t("m026");
  $("#account-entry").textContent = remote
    ? OrbitI18n.t("m035")
    : OrbitI18n.t("m036");
  $("#business-selector").hidden = !remote;
  $("#business-selector").innerHTML = (data.businesses || [])
    .map(
      (b) =>
        `<option value="${b.id}" ${b.id === data.business_id ? "selected" : ""}>${escape(b.name)}</option>`,
    )
    .join("");
  $(".workspace-icon").innerHTML = data.logo
    ? `<img alt="${OrbitI18n.t("m037")}" src="${escape(data.logo)}">`
    : escape(data.business.slice(0, 1));
  document.querySelector('[data-page="team"]').hidden = !remote;
  document.querySelector('[data-page="finance"]').hidden =
    data.role === "staff";
  if (page === "settings" && $("#settings-form")) profileFields();
  connectionView();
  $("#connection-corner").textContent =
    data.mode === "server"
      ? data.offline
        ? OrbitI18n.t("offlineMode")
        : OrbitI18n.t("sharedBase")
      : OrbitI18n.t("localBase");
  OrbitLayout.prepare(page, data);
  if (page === "schedule") OrbitScheduleGrid.layout();
  OrbitStartup.play();
}
