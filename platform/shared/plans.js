"use strict";
// LOMVIKO plans. While sales are switched off (or during a trial) a company gets everything;
// with sales on, a paid company gets what its plan includes. Shared by the API, the app and the site.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitPlans = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const FEATURES = {
    payments: { uk: "Онлайн-оплати monobank і LiqPay, передоплата", en: "Online payments (monobank, LiqPay), prepayment" },
    reports: { uk: "Дашборд, фінансовий звіт, витрати, звіти в Telegram", en: "Dashboard, finance report, expenses, Telegram reports" },
    marketing: { uk: "«Давно не були», відгуки в Google", en: "Win-back invitations, Google reviews" },
    vouchers: { uk: "Подарункові сертифікати й абонементи", en: "Gift certificates and passes" },
    stock: { uk: "Матеріали та склад", en: "Materials and stock" },
    payroll: { uk: "Зарплати спеціалістів", en: "Specialists' pay" },
    fiscal: { uk: "Фіскальні чеки (ПРРО)", en: "Fiscal receipts" },
    multi: { uk: "Кілька філій в одному акаунті", en: "Several branches in one account" },
  };
  const BASE = {
    uk: ["Розклад і клієнтська база", "Telegram-бот для запису 24/7", "Сторінка онлайн-запису", "Нагадування клієнтам"],
    en: ["Schedule and client base", "Telegram booking bot 24/7", "Online booking page", "Client reminders"],
  };
  const PLANS = [
    { id: "start", price: 199, yearly: 1990, seats: 2, uk: "Старт", en: "Start", for: { uk: "Для майстра, який працює сам або вдвох", en: "For a specialist working alone or in pairs" }, features: [] },
    { id: "business", price: 499, yearly: 4990, seats: 6, uk: "Бізнес", en: "Business", for: { uk: "Для салону чи студії з командою", en: "For a salon or studio with a team" }, features: ["payments", "reports", "marketing"], popular: true },
    { id: "pro", price: 899, yearly: 8990, seats: 25, uk: "Про", en: "Pro", for: { uk: "Для бізнесу з обліком, касою та філіями", en: "For businesses with accounting, receipts and branches" }, features: ["payments", "reports", "marketing", "vouchers", "stock", "payroll", "fiscal", "multi"] },
  ];
  const ALL = Object.keys(FEATURES);
  // CRM actions that need a plan feature.
  const ROUTES = {
    payments: ["monobank/connect", "monobank/disconnect", "monobank/invoice", "monobank/cancel", "liqpay/connect", "liqpay/disconnect", "liqpay/invoice", "liqpay/cancel"],
    reports: ["expense", "expense/delete", "notify/save", "notify/test"],
    marketing: ["lapsed/days", "lapsed/invite", "lapsed/invite-all", "lapsed/settings", "reviews/save"],
    vouchers: ["certificate", "certificate/void", "pass", "pass/void"],
    stock: ["material", "material/update", "material/delete", "material/move"],
    payroll: ["payroll"],
    fiscal: ["fiscal/connect", "fiscal/disconnect", "fiscal/settings", "fiscal/retry"],
    multi: ["business/add"],
  };
  const ROUTE_FEATURE = {};
  for (const [key, list] of Object.entries(ROUTES)) for (const r of list) ROUTE_FEATURE["/v1/crm/" + r] = key;
  const byId = (id) => PLANS.find((p) => p.id === id) || PLANS[0];
  // free: sales off or trial — everything is open.
  function effective({ sales, stage, plan }) {
    if (!sales || stage === "trial") return { id: plan || "pro", free: true, features: Object.fromEntries(ALL.map((k) => [k, true])) };
    const p = byId(plan);
    return { id: p.id, free: false, features: Object.fromEntries(ALL.map((k) => [k, p.features.includes(k)])) };
  }
  // The cheapest plan that has a feature, for "available in …" hints.
  const cheapest = (feature) => PLANS.find((p) => p.features.includes(feature)) || PLANS[PLANS.length - 1];
  return { FEATURES, BASE, PLANS, ALL, ROUTE_FEATURE, byId, effective, cheapest };
});
