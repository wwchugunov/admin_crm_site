"use strict";
// What a team member may open and change. The owner always has everything; an administrator
// and an employee start from a preset, and the owner can switch every item on or off.
// The schedule itself (see, book, move, mark visits) is open to every member.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitPermissions = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ITEMS = [
    { key: "dashboard", uk: "Дашборд", en: "Dashboard" },
    { key: "clients", uk: "Клієнти: картки, зміни, розсилки", en: "Clients: cards, edits, mailings" },
    { key: "money", uk: "Ціни, оплати й прийом оплат", en: "Prices, payments and taking payments" },
    { key: "catalog", uk: "Послуги, спеціалісти й матеріали", en: "Services, specialists and materials" },
    { key: "finance", uk: "Фінансовий звіт, витрати й зарплати", en: "Finance report, expenses and pay" },
    { key: "integrations", uk: "Інтеграції: бот, оплати, каса, сторінка запису", en: "Integrations: bot, payments, receipts, booking page" },
    { key: "settings", uk: "Налаштування компанії та експорт", en: "Company settings and export" },
  ];
  const KEYS = ITEMS.map((i) => i.key);
  const PRESETS = {
    admin: Object.fromEntries(KEYS.map((k) => [k, true])),
    staff: { dashboard: false, clients: true, money: false, catalog: false, finance: false, integrations: false, settings: false },
  };
  // Which permission each CRM action needs. Actions not listed are either open to every member
  // (the schedule) or decided by role (team and businesses: owner only).
  const ROUTES = {
    money: ["payment", "monobank/invoice", "monobank/cancel", "liqpay/invoice", "liqpay/cancel", "certificate", "certificate/void", "pass", "pass/void", "fiscal/retry", "visit/update"],
    clients: ["client/update", "client/delete", "client/history", "client/import", "lapsed/days", "lapsed/invite", "lapsed/invite-all", "lapsed/settings", "reviews/save"],
    catalog: ["service", "service/update", "service/delete", "resource", "resource/update", "resource/delete", "absence", "absence/delete", "material", "material/update", "material/delete", "material/move"],
    finance: ["expense", "expense/delete", "payroll"],
    integrations: ["telegram/check", "telegram/connect", "telegram/disconnect", "telegram/external", "telegram/link", "monobank/connect", "monobank/disconnect", "liqpay/connect", "liqpay/disconnect", "fiscal/connect", "fiscal/disconnect", "fiscal/settings", "booking/save", "notify/save", "notify/test", "notify/link", "notify/unlink"],
    settings: ["profile", "export"],
  };
  const ROUTE_PERMISSION = {};
  for (const [key, routes] of Object.entries(ROUTES)) for (const r of routes) ROUTE_PERMISSION["/v1/crm/" + r] = key;
  // Stored value: null (use the role preset) or a JSON object with booleans.
  function effective(role, stored) {
    if (role === "owner") return Object.fromEntries(KEYS.map((k) => [k, true]));
    let own = {};
    try { own = typeof stored === "string" ? JSON.parse(stored) : stored || {}; } catch { own = {}; }
    const base = PRESETS[role] || PRESETS.staff;
    return Object.fromEntries(KEYS.map((k) => [k, typeof own[k] === "boolean" ? own[k] : base[k]]));
  }
  function clean(value) {
    if (value == null) return null;
    if (typeof value !== "object" || Array.isArray(value)) throw Error("Invalid permissions");
    return Object.fromEntries(KEYS.map((k) => [k, value[k] === true]));
  }
  return { ITEMS, KEYS, PRESETS, ROUTE_PERMISSION, effective, clean };
});
