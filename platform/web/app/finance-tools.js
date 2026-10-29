"use strict";
// Expenses, materials, gift certificates, visit passes and specialists' pay.
// Finance gets tabs for them, Catalog gets the materials list; staff see none of the money.
Object.assign(OrbitI18n.messages, {
  finTabOverview: { uk: "Огляд", en: "Overview" },
  finTabExpenses: { uk: "Витрати", en: "Expenses" },
  finTabPayroll: { uk: "Зарплати", en: "Pay" },
  finTabVouchers: { uk: "Сертифікати й абонементи", en: "Certificates and passes" },
  finSpent: { uk: "Витрати", en: "Expenses" },
  finSales: { uk: "З них продаж сертифікатів і абонементів", en: "Of which certificate and pass sales" },
  expenseAdd: { uk: "Додати витрату", en: "Add expense" },
  expenseNone: { uk: "Витрат за цей місяць немає", en: "No expenses this month" },
  expenseNoneHint: { uk: "Оренда, закупівлі, реклама, податки — усе, що впливає на прибуток.", en: "Rent, purchases, ads, taxes — everything that affects profit." },
  expenseCategory: { uk: "Категорія", en: "Category" },
  expenseAmount: { uk: "Сума", en: "Amount" },
  expenseDate: { uk: "Дата", en: "Date" },
  expenseNote: { uk: "Коментар", en: "Note" },
  expenseWho: { uk: "Кому", en: "Paid to" },
  expenseSaved: { uk: "Витрату збережено", en: "Expense saved" },
  expenseDeleted: { uk: "Витрату видалено", en: "Expense deleted" },
  expenseDeleteAsk: { uk: "Видалити цю витрату? Залишки матеріалів не зміняться.", en: "Delete this expense? Material stock stays as it is." },
  expenseTotal: { uk: "Разом за місяць", en: "Month total" },
  cat_rent: { uk: "Оренда", en: "Rent" },
  cat_materials: { uk: "Матеріали", en: "Materials" },
  cat_salary: { uk: "Зарплата", en: "Salary" },
  cat_utilities: { uk: "Комунальні та зв’язок", en: "Utilities and phone" },
  cat_marketing: { uk: "Реклама", en: "Advertising" },
  cat_taxes: { uk: "Податки", en: "Taxes" },
  cat_other: { uk: "Інше", en: "Other" },
  payrollHint: { uk: "Відсоток від того, що клієнти заплатили за завершені візити спеціаліста (разом із сертифікатами й абонементами), плюс ставка за кожен робочий день із візитами. Ставки задаються в картці спеціаліста, окремий відсоток — у послузі.", en: "A share of what clients paid for the specialist's completed visits (certificates and passes included), plus a rate for each working day with visits. Rates are set on the specialist's card; a different share can be set on a service." },
  payrollLoading: { uk: "Рахуємо…", en: "Calculating…" },
  payrollPerson: { uk: "Спеціаліст", en: "Specialist" },
  payrollVisits: { uk: "Візити", en: "Visits" },
  payrollBase: { uk: "Оплачено клієнтами", en: "Paid by clients" },
  payrollShare: { uk: "Відсоток", en: "Share" },
  payrollDays: { uk: "Дні × ставка", en: "Days × rate" },
  payrollTotal: { uk: "Нараховано", en: "Earned" },
  payrollPaid: { uk: "Виплачено", en: "Paid out" },
  payrollLeft: { uk: "До виплати", en: "To pay" },
  payrollPay: { uk: "Виплатити", en: "Pay out" },
  payrollNone: { uk: "Завершених візитів за місяць немає", en: "No completed visits this month" },
  payrollNoRates: { uk: "Ставки ще не задані: відкрийте Каталог → спеціаліст і вкажіть відсоток або ставку за день.", en: "No rates yet: open Catalog → a specialist and set a share or a daily rate." },
  payoutTitle: { uk: "Виплата зарплати", en: "Salary payout" },
  payoutSaved: { uk: "Виплату записано у витрати", en: "Payout recorded as an expense" },
  certSell: { uk: "Продати сертифікат", en: "Sell a certificate" },
  certTitle: { uk: "Подарункові сертифікати", en: "Gift certificates" },
  certNone: { uk: "Сертифікатів ще немає", en: "No certificates yet" },
  certNoneHint: { uk: "Сертифікат на суму оплачує візити, доки не закінчиться залишок. Код друкуєте або надсилаєте клієнту.", en: "A certificate pays for visits until its balance runs out. Print the code or send it to the client." },
  certAmount: { uk: "Номінал", en: "Value" },
  certPrice: { uk: "Ціна продажу (якщо зі знижкою)", en: "Sale price (if discounted)" },
  certBalance: { uk: "Залишок", en: "Balance" },
  certCode: { uk: "Код", en: "Code" },
  certHolder: { uk: "Покупець (необов’язково)", en: "Buyer (optional)" },
  certNobody: { uk: "Не вказано", en: "Not specified" },
  certExpires: { uk: "Діє до (необов’язково)", en: "Valid until (optional)" },
  certSold: { uk: "Сертифікат продано. Код: {code}", en: "Certificate sold. Code: {code}" },
  certVoid: { uk: "Анулювати", en: "Cancel" },
  certVoidAsk: { uk: "Анулювати сертифікат? Ним більше не можна буде оплатити. Гроші клієнту поверніть окремо, якщо потрібно.", en: "Cancel the certificate? It can no longer be used. Return money to the client separately if needed." },
  certVoided: { uk: "Анульовано", en: "Cancelled" },
  certExpired: { uk: "Термін минув", en: "Expired" },
  certUsed: { uk: "Використано", en: "Used up" },
  certEnterCode: { uk: "Код сертифіката", en: "Certificate code" },
  passSell: { uk: "Продати абонемент", en: "Sell a pass" },
  passTitle: { uk: "Абонементи", en: "Visit passes" },
  passNone: { uk: "Абонементів ще немає", en: "No passes yet" },
  passNoneHint: { uk: "Наприклад, 10 масажів: кожен завершений візит списує одне відвідування.", en: "For example, 10 massages: each visit uses one." },
  passVisits: { uk: "Кількість візитів", en: "Number of visits" },
  passPrice: { uk: "Ціна абонемента", en: "Pass price" },
  passLeft: { uk: "Залишилось", en: "Left" },
  passSold: { uk: "Абонемент продано", en: "Pass sold" },
  passPick: { uk: "Абонемент", en: "Pass" },
  passCovers: { uk: "Абонемент оплачує візит повністю", en: "The pass pays for the whole visit" },
  saleMethod: { uk: "Як заплатили", en: "Paid by" },
  saleClient: { uk: "Клієнт", en: "Client" },
  saleService: { uk: "Послуга", en: "Service" },
  saleDate: { uk: "Продано", en: "Sold" },
  payCertificate: { uk: "Сертифікат", en: "Certificate" },
  payPass: { uk: "Абонемент", en: "Pass" },
  matTitle: { uk: "Матеріали", en: "Materials" },
  matAdd: { uk: "Додати матеріал", en: "Add material" },
  matNone: { uk: "Матеріалів ще немає", en: "No materials yet" },
  matNoneHint: { uk: "Гель, фарба, масло, пилки… Вкажіть у послузі, скільки йде на один візит, — після завершення візиту залишок зменшиться сам.", en: "Gel, dye, oil, files… Set how much one visit uses on the service, and stock goes down when the visit is completed." },
  matName: { uk: "Назва", en: "Name" },
  matUnit: { uk: "Одиниця", en: "Unit" },
  matMin: { uk: "Нагадати, коли залишиться менше", en: "Warn when less than" },
  matCost: { uk: "Ціна за одиницю", en: "Price per unit" },
  matStock: { uk: "Залишок", en: "In stock" },
  matStartStock: { uk: "Зараз є", en: "In stock now" },
  matLow: { uk: "Закінчується", en: "Running low" },
  matBuy: { uk: "Закупівля", en: "Purchase" },
  matBought: { uk: "Скільки купили", en: "Quantity bought" },
  matBuyCost: { uk: "Заплатили всього (піде у витрати)", en: "Total paid (goes to expenses)" },
  matCount: { uk: "Інвентаризація", en: "Stock count" },
  matCounted: { uk: "Фактичний залишок", en: "Counted stock" },
  matSaved: { uk: "Збережено", en: "Saved" },
  matDeleteAsk: { uk: "Прибрати матеріал зі списку й з послуг? Історія витрат залишиться.", en: "Remove the material from the list and from services? Expense history stays." },
  matPerVisit: { uk: "Матеріали на один візит", en: "Materials per visit" },
  matPerVisitHint: { uk: "Скільки йде на одну послугу; порожнє — не використовується.", en: "How much one service uses; empty means not used." },
  unitPcs: { uk: "шт", en: "pcs" },
  unitMl: { uk: "мл", en: "ml" },
  unitG: { uk: "г", en: "g" },
  unitPack: { uk: "уп", en: "pack" },
  payPercent: { uk: "Відсоток від послуг, %", en: "Share of services, %" },
  payDaily: { uk: "Ставка за робочий день", en: "Rate per working day" },
  payTitle: { uk: "Оплата праці", en: "Pay" },
  servicePayPercent: { uk: "Окремий відсоток майстру, % (необов’язково)", en: "Separate share for the specialist, % (optional)" },
  clientDiscount: { uk: "Особиста знижка, %", en: "Personal discount, %" },
  clientDiscountHint: { uk: "Нові записи клієнта рахуються зі знижкою.", en: "New visits of this client are priced with the discount." },
  delete: { uk: "Видалити", en: "Delete" },
  clientPet: { uk: "Тварина", en: "Pet" },
  serviceDeposit: { uk: "Передоплата при онлайн-записі (0 — без неї)", en: "Prepayment for online bookings (0 — none)" },
  serviceDepositHint: { uk: "Потрібен підключений monobank або LiqPay. Хто записався онлайн, має оплатити протягом 30 хвилин — інакше запис скасується, а час звільниться. Записи, які ви створюєте самі, без передоплати.", en: "Needs monobank or LiqPay connected. Clients who book online pay within 30 minutes, otherwise the booking is cancelled and the time is freed. Bookings you create yourself need no prepayment." },
  depositWaiting: { uk: "Чекає передоплату до {time}", en: "Waiting for prepayment until {time}" },
  clientBirthdayAdd: { uk: "Додати", en: "Add" },
  discountShort: { uk: "знижка", en: "discount" },
  discountLabel: { uk: "Знижка", en: "Discount" },
  botRoles: { uk: "Один бот на компанію працює у двох ролях. Для клієнтів: запис 24/7, нагадування з кнопками «Прийду / Перенести / Скасувати», лист очікування, запрошення повернутися, посилання на оплату й чек. Для команди: власник і адміністратори підключають свій Telegram у «Налаштування та дані → Сповіщення» — і бот надсилає їм план дня, нові записи, скасування, оплати й звіти.", en: "One bot per company has two roles. For clients: 24/7 booking, reminders with “I'll come / Reschedule / Cancel”, the waitlist, come-back invitations, payment and receipt links. For the team: the owner and administrators link their Telegram in Settings and data → Notifications, and the bot sends them the day plan, new bookings, cancellations, payments and reports." },
  botGuideTitle: { uk: "Як створити бота — 2 хвилини", en: "How to create the bot — 2 minutes" },
  botGuide1: { uk: "Відкрийте в Telegram @BotFather (офіційний бот Telegram із синьою галочкою).", en: "Open @BotFather in Telegram (the official Telegram bot with a blue check mark)." },
  botGuide2: { uk: "Надішліть /newbot і введіть назву, яку бачитимуть клієнти, наприклад «Студія Ліра — запис».", en: "Send /newbot and enter the name clients will see, for example “Lira Studio — booking”." },
  botGuide3: { uk: "Придумайте адресу латиницею, що закінчується на bot, наприклад lira_booking_bot.", en: "Choose an address in Latin letters ending in bot, for example lira_booking_bot." },
  botGuide4: { uk: "BotFather надішле токен вигляду 1234567890:AAH…. Скопіюйте його повністю й вставте нижче.", en: "BotFather sends a token like 1234567890:AAH…. Copy all of it and paste it below." },
  botGuide5: { uk: "Після підключення поділіться посиланням t.me/ваш_бот в Instagram, Google Картах і на візитках, а свій Telegram підключіть у «Налаштування та дані → Сповіщення», щоб отримувати звіти.", en: "After connecting, share t.me/your_bot in Instagram, Google Maps and on business cards, and link your own Telegram in Settings and data → Notifications to get reports." },
  botGuideSafe: { uk: "Токен — як пароль від бота: не публікуйте його. Після збереження ми його не показуємо.", en: "The token is the bot's password: do not publish it. Once saved, it is not shown again." },
  bookingClientFound: { uk: "Клієнт уже є в базі", en: "Client found in the base" },
  clientPetHint: { uk: "Кличка, порода, вік", en: "Name, breed, age" },
  paySaved: { uk: "Оплату збережено", en: "Payment saved" },
  edit: { uk: "Змінити", en: "Edit" },
});
const ft = (key) => OrbitI18n.t(key);
let financeTab = "overview",
  payrollCache = { key: "", rows: null, error: "" };
const EXPENSE_KINDS = ["rent", "materials", "salary", "utilities", "marketing", "taxes", "other"];
const UNIT_KEYS = { pcs: "unitPcs", ml: "unitMl", g: "unitG", pack: "unitPack" };
const SALE_KEYS = { cash: "m116", card: "m117", transfer: "m118" };
const inMonth = (ms) => businessDate(ms).startsWith(financeMonth);
const qtyText = (q) => Number(q).toLocaleString(OrbitI18n.locale(), { maximumFractionDigits: 3 });
const dayText = (ms) => businessDate(ms).split("-").reverse().join(".");
const unitText = (u) => ft(UNIT_KEYS[u] || "unitPcs");
// A date picked in a form, as the middle of that day (safe for any time zone near Kyiv).
const dateMs = (value) => (value ? Date.parse(`${value}T12:00:00Z`) : undefined);
const endOfDay = (value) => (value ? Date.parse(`${value}T23:59:59`) : undefined);
function saleMethodField(name = "method") {
  return `<label>${ft("saleMethod")}</label><div class="segmented pay-methods">${Object.entries(SALE_KEYS)
    .map(([value, key], i) => `<label><input type="radio" name="${name}" value="${value}" ${i ? "" : "checked"}><span>${OrbitI18n.t(key)}</span></label>`)
    .join("")}</div>`;
}
function optionList(items, selected, blank) {
  return (blank ? `<option value="">${escape(blank)}</option>` : "") + items.map((i) => `<option value="${escape(i.id)}" ${i.id === selected ? "selected" : ""}>${escape(i.name)}</option>`).join("");
}
function confirmModal(title, text, submit, button) {
  modal(title, `<p>${escape(text)}</p>`, submit, button);
  $("#modal-submit").className = "danger";
}

// Finance tabs ---------------------------------------------------------------
function financeTabs() {
  return `<div class="period-buttons finance-tabs" role="group">${[
    ["overview", "finTabOverview"],
    ["expenses", "finTabExpenses"],
    ["payroll", "finTabPayroll"],
    ["vouchers", "finTabVouchers"],
  ]
    .map(([tab, key]) => `<button class="secondary ${financeTab === tab ? "selected" : ""}" aria-pressed="${financeTab === tab}" data-action="finance-tab" data-tab="${tab}">${ft(key)}</button>`)
    .join("")}</div>`;
}
function financeToolView() {
  const toolbar = `<div class="finance-toolbar"><input id="finance-month" type="month" value="${financeMonth}" aria-label="${OrbitI18n.t("m125")}"><span class="hint">${escape(data.currency)} · ${escape(data.timezone)}</span></div>`;
  if (financeTab === "expenses") return toolbar + expensesView();
  if (financeTab === "payroll") return toolbar + payrollView();
  return vouchersView();
}
// What came in during the month: payments except those taken from certificates and passes, plus their sales.
function monthMoney() {
  const paid = (data.payments || []).filter((p) => inMonth(p.at) && !["certificate", "pass"].includes(p.method)).reduce((s, p) => s + p.amount, 0),
    sales = [...(data.certificates || []), ...(data.passes || [])].filter((v) => inMonth(v.sold_at)).reduce((s, v) => s + v.price, 0),
    spent = (data.expenses || []).filter((e) => inMonth(e.at)).reduce((s, e) => s + e.amount, 0);
  return { income: paid + sales, sales, spent };
}

function expensesView() {
  const rows = (data.expenses || []).filter((e) => inMonth(e.at)),
    names = new Map(data.resources.map((r) => [r.id, r.name])),
    total = rows.reduce((s, e) => s + e.amount, 0),
    byKind = EXPENSE_KINDS.map((k) => [k, rows.filter((e) => e.category === k).reduce((s, e) => s + e.amount, 0)]).filter(([, v]) => v);
  return `<section class="panel"><div class="panel-head"><h2>${ft("finTabExpenses")}</h2><button class="primary" data-action="expense-add">${ft("expenseAdd")}</button></div>${
    rows.length
      ? `<div class="expense-summary"><strong>${ft("expenseTotal")}: ${money(total)} ${escape(data.currency)}</strong>${byKind.map(([k, v]) => `<span class="tag">${ft("cat_" + k)} ${money(v)}</span>`).join("")}</div><div class="table-wrapper"><table class="table"><thead><tr><th>${ft("expenseDate")}</th><th>${ft("expenseCategory")}</th><th>${ft("expenseNote")}</th><th class="num">${ft("expenseAmount")}</th><th></th></tr></thead><tbody>${rows
          .map((e) => `<tr><td>${dayText(e.at)}</td><td>${ft("cat_" + e.category)}${e.resource_id ? ` · ${escape(names.get(e.resource_id) || "")}` : ""}</td><td>${escape(e.note)}</td><td class="num">${money(e.amount)}</td><td><button class="link-button" data-action="expense-delete" data-id="${escape(e.id)}">${ft("delete")}</button></td></tr>`)
          .join("")}</tbody></table></div>`
      : empty(ft("expenseNone"), ft("expenseNoneHint"))
  }</section>`;
}
function expenseModal(preset = {}) {
  modal(
    preset.title || ft("expenseAdd"),
    `<div class="form-grid"><div><label for="field-category">${ft("expenseCategory")}</label><select id="field-category" name="category">${EXPENSE_KINDS.map((k) => `<option value="${k}" ${preset.category === k ? "selected" : ""}>${ft("cat_" + k)}</option>`).join("")}</select></div><div>${field(ft("expenseAmount"), "amount", "number", `required min="0.01" step="0.01" ${preset.amount ? `value="${preset.amount / 100}"` : ""}`)}</div></div>` +
      `<div id="expense-who" ${preset.category === "salary" ? "" : "hidden"}><label for="field-resource_id">${ft("expenseWho")}</label><select id="field-resource_id" name="resource_id">${optionList(data.resources, preset.resource_id, "—")}</select></div>` +
      field(ft("expenseDate"), "date", "date", `required value="${businessDate(Date.now())}"`) +
      field(ft("expenseNote"), "note", "text", `maxlength="500" value="${escape(preset.note || "")}"`),
    async (v) => {
      await window.orbit.call("expense:add", { category: v.category, amount: Number(v.amount), at: dateMs(v.date), note: v.note, resource_id: v.category === "salary" ? v.resource_id || null : null });
      toast(preset.toast || ft("expenseSaved"));
    },
  );
  $("#field-category").addEventListener("change", (e) => ($("#expense-who").hidden = e.target.value !== "salary"));
}

function payrollView() {
  const key = `${data.business_id}:${financeMonth}:${data.revision}`;
  if (payrollCache.key !== key) {
    payrollCache = { key, rows: null, error: "" };
    window.orbit
      .call("payroll:get", { month: financeMonth })
      .then((rows) => (payrollCache.key === key ? (payrollCache.rows = rows) : null))
      .catch((e) => (payrollCache.key === key ? (payrollCache.error = e.message) : null))
      .finally(() => page === "finance" && financeTab === "payroll" && render());
  }
  const head = `<p class="hint payroll-hint">${ft("payrollHint")}</p>`;
  if (payrollCache.error) return head + `<div class="callout">${escape(payrollCache.error)}</div>`;
  if (!payrollCache.rows) return head + `<p class="hint">${ft("payrollLoading")}</p>`;
  const rows = payrollCache.rows.filter((r) => r.visits || r.paid_out || r.total);
  if (!rows.length) return head + empty(ft("payrollNone"), "");
  const noRates = rows.every((r) => !r.percent && !r.daily_rate);
  return (
    head +
    (noRates ? `<div class="callout">${ft("payrollNoRates")}</div>` : "") +
    `<section class="panel"><div class="table-wrapper"><table class="table payroll"><thead><tr><th>${ft("payrollPerson")}</th><th class="num">${ft("payrollVisits")}</th><th class="num">${ft("payrollBase")}</th><th class="num">${ft("payrollShare")}</th><th class="num">${ft("payrollDays")}</th><th class="num">${ft("payrollTotal")}</th><th class="num">${ft("payrollPaid")}</th><th class="num">${ft("payrollLeft")}</th><th></th></tr></thead><tbody>${rows
      .map(
        (r) =>
          `<tr><td>${escape(r.name)}</td><td class="num">${r.visits}</td><td class="num">${money(r.base)}</td><td class="num">${money(r.commission)}<small> · ${qtyText(r.percent)}%</small></td><td class="num">${r.days} × ${money(r.daily_rate)}</td><td class="num"><strong>${money(r.total)}</strong></td><td class="num">${money(r.paid_out)}</td><td class="num ${r.balance > 0 ? "due" : ""}">${money(r.balance)}</td><td>${r.balance > 0 ? `<button class="secondary" data-action="payroll-pay" data-id="${escape(r.resource_id)}" data-amount="${r.balance}">${ft("payrollPay")}</button>` : ""}</td></tr>`,
      )
      .join("")}</tbody></table></div></section>`
  );
}

function vouchersView() {
  const clients = new Map(data.clients.map((c) => [c.id, c.name])),
    services = new Map(data.services.map((s) => [s.id, s.name])),
    now = Date.now(),
    state = (v, left) => (v.status === "void" ? ft("certVoided") : v.expires && v.expires <= now ? ft("certExpired") : left ? "" : ft("certUsed"));
  const certs = data.certificates || [],
    passes = data.passes || [];
  return `<div class="grid-2"><section class="panel"><div class="panel-head"><h2>${ft("certTitle")}</h2><button class="primary" data-action="certificate-sell">${ft("certSell")}</button></div>${
    certs.length
      ? `<div class="table-wrapper"><table class="table"><thead><tr><th>${ft("certCode")}</th><th class="num">${ft("certBalance")}</th><th>${ft("saleClient")}</th><th>${ft("saleDate")}</th><th></th></tr></thead><tbody>${certs
          .map((c) => {
            const note = state(c, c.balance > 0);
            return `<tr><td><span class="mono-inline">${escape(c.code)}</span></td><td class="num">${money(c.balance)} / ${money(c.amount)}</td><td>${escape(clients.get(c.client_id) || "—")}${c.expires ? `<small> · ${OrbitI18n.language === "en" ? "until" : "до"} ${dayText(c.expires)}</small>` : ""}</td><td>${dayText(c.sold_at)}</td><td>${note ? `<span class="badge">${note}</span>` : `<button class="link-button" data-action="certificate-void" data-id="${escape(c.id)}">${ft("certVoid")}</button>`}</td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : empty(ft("certNone"), ft("certNoneHint"))
  }</section><section class="panel"><div class="panel-head"><h2>${ft("passTitle")}</h2><button class="primary" data-action="pass-sell">${ft("passSell")}</button></div>${
    passes.length
      ? `<div class="table-wrapper"><table class="table"><thead><tr><th>${ft("saleClient")}</th><th>${ft("saleService")}</th><th class="num">${ft("passLeft")}</th><th>${ft("saleDate")}</th><th></th></tr></thead><tbody>${passes
          .map((p) => {
            const note = state(p, p.used < p.visits);
            return `<tr><td>${escape(clients.get(p.client_id) || "—")}</td><td>${escape(services.get(p.service_id) || "—")}${p.expires ? `<small> · ${OrbitI18n.language === "en" ? "until" : "до"} ${dayText(p.expires)}</small>` : ""}</td><td class="num">${p.visits - p.used} / ${p.visits}</td><td>${dayText(p.sold_at)}</td><td>${note ? `<span class="badge">${note}</span>` : `<button class="link-button" data-action="pass-void" data-id="${escape(p.id)}">${ft("certVoid")}</button>`}</td></tr>`;
          })
          .join("")}</tbody></table></div>`
      : empty(ft("passNone"), ft("passNoneHint"))
  }</section></div>`;
}
function certificateModal() {
  modal(
    ft("certSell"),
    `<div class="form-grid"><div>${field(ft("certAmount"), "amount", "number", 'required min="1" step="0.01"')}</div><div>${field(ft("certPrice"), "price", "number", 'min="0" step="0.01"')}</div></div>` +
      saleMethodField() +
      `<label for="field-client_id">${ft("certHolder")}</label><select id="field-client_id" name="client_id">${optionList(data.clients, "", ft("certNobody"))}</select>` +
      field(ft("certExpires"), "expires", "date", `min="${businessDate(Date.now() + 86400000)}"`) +
      field(ft("expenseNote"), "note", "text", 'maxlength="500"'),
    async (v) => {
      const sold = await window.orbit.call("certificate:sell", { amount: Number(v.amount), price: v.price === "" ? undefined : Number(v.price), method: v.method, client_id: v.client_id || null, expires: endOfDay(v.expires), note: v.note });
      toast(ft("certSold").replace("{code}", sold.code));
    },
    ft("certSell"),
  );
}
function passModal() {
  if (!data.services.length || !data.clients.length) return toast(OrbitI18n.t("bookingSetupRequired"), true);
  modal(
    ft("passSell"),
    `<label for="field-client_id">${ft("saleClient")}</label><select id="field-client_id" name="client_id" required>${optionList(data.clients)}</select>` +
      `<label for="field-service_id">${ft("saleService")}</label><select id="field-service_id" name="service_id" required>${optionList(data.services)}</select>` +
      `<div class="form-grid"><div>${field(ft("passVisits"), "visits", "number", 'required min="1" max="500" value="10"')}</div><div>${field(ft("passPrice"), "price", "number", 'required min="0" step="0.01"')}</div></div>` +
      saleMethodField() +
      field(ft("certExpires"), "expires", "date", `min="${businessDate(Date.now() + 86400000)}"`),
    async (v) => {
      await window.orbit.call("pass:sell", { client_id: v.client_id, service_id: v.service_id, visits: Number(v.visits), price: Number(v.price), method: v.method, expires: endOfDay(v.expires) });
      toast(ft("passSold"));
    },
    ft("passSell"),
  );
  const suggest = () => {
    const s = data.services.find((x) => x.id === $("#field-service_id").value);
    if (s) $("#field-price").value = ((s.price * Number($("#field-visits").value || 1)) / 100).toString();
  };
  $("#field-service_id").addEventListener("change", suggest);
  $("#field-visits").addEventListener("input", suggest);
  suggest();
}

// Materials in Catalog --------------------------------------------------------
function materialsCard() {
  if (!can("catalog")) return "";
  const list = data.materials || [];
  return `<section class="card materials-card"><div class="panel-head"><h2>${ft("matTitle")}</h2><button class="secondary" data-action="material-add">${ft("matAdd")}</button></div>${
    list.length
      ? list
          .map((m) => {
            const low = m.stock <= m.min_stock && (m.min_stock > 0 || m.stock <= 0);
            return `<div class="catalog-row"><div><strong>${escape(m.name)}</strong><small>${ft("matStock")}: <span class="${low ? "due" : ""}">${qtyText(m.stock)} ${unitText(m.unit)}</span>${low ? ` · <span class="badge">${ft("matLow")}</span>` : ""}${m.unit_cost ? ` · ${money(m.unit_cost)} / ${unitText(m.unit)}` : ""}</small></div><div class="row-actions"><button class="secondary" data-action="material-buy" data-id="${escape(m.id)}">${ft("matBuy")}</button><button class="link-button" data-action="material-count" data-id="${escape(m.id)}">${ft("matCount")}</button><button class="link-button" data-action="material-edit" data-id="${escape(m.id)}">${ft("edit")}</button><button class="link-button" data-action="material-delete" data-id="${escape(m.id)}">${ft("delete")}</button></div></div>`;
          })
          .join("")
      : `<p class="hint">${ft("matNone")}</p><p class="hint">${ft("matNoneHint")}</p>`
  }</section>`;
}
function materialModal(id) {
  const m = (data.materials || []).find((x) => x.id === id) || {};
  modal(
    id ? m.name : ft("matAdd"),
    field(ft("matName"), "name", "text", `required maxlength="120" value="${escape(m.name || "")}"`) +
      `<div class="form-grid"><div><label for="field-unit">${ft("matUnit")}</label><select id="field-unit" name="unit">${Object.keys(UNIT_KEYS).map((u) => `<option value="${u}" ${m.unit === u ? "selected" : ""}>${unitText(u)}</option>`).join("")}</select></div><div>${field(ft("matMin"), "min_stock", "number", `min="0" step="0.001" value="${m.min_stock || 0}"`)}</div><div>${field(ft("matCost"), "unit_cost", "number", `min="0" step="0.01" value="${(m.unit_cost || 0) / 100}"`)}</div>${id ? "" : `<div>${field(ft("matStartStock"), "stock", "number", 'min="0" step="0.001" value="0"')}</div>`}</div>`,
    async (v) => {
      await window.orbit.call(id ? "material:update" : "material:add", { ...v, id, min_stock: Number(v.min_stock || 0), unit_cost: Number(v.unit_cost || 0), stock: Number(v.stock || 0) });
      toast(ft("matSaved"));
    },
  );
}
function materialMoveModal(id, kind) {
  const m = (data.materials || []).find((x) => x.id === id);
  if (!m) return;
  modal(
    `${ft(kind === "purchase" ? "matBuy" : "matCount")}: ${m.name}`,
    kind === "purchase"
      ? `<div class="form-grid"><div>${field(`${ft("matBought")}, ${unitText(m.unit)}`, "quantity", "number", 'required min="0.001" step="0.001"')}</div><div>${field(ft("matBuyCost"), "cost", "number", 'min="0" step="0.01"')}</div></div>` + field(ft("expenseDate"), "date", "date", `required value="${businessDate(Date.now())}"`)
      : `<p class="hint">${ft("matStock")}: ${qtyText(m.stock)} ${unitText(m.unit)}</p>` + field(`${ft("matCounted")}, ${unitText(m.unit)}`, "stock", "number", `required min="0" step="0.001" value="${Math.max(0, m.stock)}"`),
    async (v) => {
      await window.orbit.call("material:move", { material_id: id, kind, quantity: Number(v.quantity), cost: Number(v.cost || 0), stock: Number(v.stock), at: dateMs(v.date) });
      toast(ft("matSaved"));
    },
  );
}
// The part of the service form that lists materials used per visit and the specialist's share.
function serviceExtraFields(s = {}) {
  if (!can("catalog")) return "";
  const used = new Map((data.service_materials || []).filter((m) => m.service_id === s.id).map((m) => [m.material_id, m.quantity]));
  return (
    field(ft("serviceDeposit"), "deposit", "number", `min="0" step="0.01" value="${(s.deposit || 0) / 100}"`) +
    `<p class="hint">${ft("serviceDepositHint")}</p>` +
    field(ft("servicePayPercent"), "pay_percent", "number", `min="0" max="100" step="0.01" value="${s.pay_percent ?? ""}"`) +
    ((data.materials || []).length
      ? `<fieldset class="service-materials"><legend>${ft("matPerVisit")}</legend><p class="hint">${ft("matPerVisitHint")}</p>${data.materials
          .map((m) => `<label class="material-line"><span>${escape(m.name)}</span><input type="number" name="mat_${escape(m.id)}" min="0" step="0.001" value="${used.get(m.id) ?? ""}" aria-label="${escape(m.name)}"><small>${unitText(m.unit)}</small></label>`)
          .join("")}</fieldset>`
      : "")
  );
}
// Collects mat_<id> inputs of the service form into the list the server expects.
function serviceExtraValues(values) {
  if (!Object.keys(values).some((k) => k.startsWith("mat_"))) return values;
  const materials = [];
  for (const [k, v] of Object.entries(values))
    if (k.startsWith("mat_")) {
      if (Number(v) > 0) materials.push({ material_id: k.slice(4), quantity: Number(v) });
      delete values[k];
    }
  return { ...values, materials };
}
// Step-by-step: creating the company bot in @BotFather, shown in the connect window.
function botGuide() {
  return `<div class="bot-guide"><strong>${ft("botGuideTitle")}</strong><ol>${[1, 2, 3, 4, 5].map((n) => `<li>${ft("botGuide" + n)}</li>`).join("")}</ol><p class="hint">${ft("botGuideSafe")}</p><p class="hint">${ft("botRoles")}</p></div>`;
}
function staffPayFields(r) {
  if (!can("finance")) return "";
  return `<h3 class="form-section">${ft("payTitle")}</h3><div class="form-grid"><div>${field(ft("payPercent"), "pay_percent", "number", `min="0" max="100" step="0.01" value="${r.pay_percent || 0}"`)}</div><div>${field(ft("payDaily"), "pay_daily", "number", `min="0" step="0.01" value="${(r.pay_daily || 0) / 100}"`)}</div></div>`;
}
function discountField(c = {}) {
  if (!can("clients")) return "";
  return field(ft("clientDiscount"), "discount", "number", `min="0" max="100" step="1" value="${c.discount || 0}"`) + `<p class="hint">${ft("clientDiscountHint")}</p>`;
}
// Certificates and passes in the payment form: a code to type, or the client's pass for this service.
function voucherPayOptions(a) {
  const now = Date.now(),
    clients = new Set([a.client_id, ...(a.clients || []).map((c) => c.id)]),
    passes = (a.paid > 0 ? [] : data.passes || []).filter((p) => p.status === "active" && p.used < p.visits && (!p.expires || p.expires > now) && p.service_id === a.service_id && clients.has(p.client_id)),
    certificates = (data.certificates || []).some((c) => c.status === "active" && c.balance > 0 && (!c.expires || c.expires > now));
  return {
    methods: [...(certificates ? [["certificate", "payCertificate"]] : []), ...(passes.length ? [["pass", "payPass"]] : [])],
    fields:
      (certificates ? `<div id="pay-certificate" hidden>${field(ft("certEnterCode"), "certificate_code", "text", 'maxlength="12" autocomplete="off" spellcheck="false"')}</div>` : "") +
      (passes.length ? `<div id="pay-pass" hidden><label for="field-pass_id">${ft("passPick")}</label><select id="field-pass_id" name="pass_id">${passes.map((p) => `<option value="${escape(p.id)}">${p.visits - p.used} / ${p.visits}${p.expires ? ` · ${OrbitI18n.language === "en" ? "until" : "до"} ${dayText(p.expires)}` : ""}</option>`).join("")}</select><p class="hint">${ft("passCovers")}</p></div>` : ""),
  };
}
function voucherPayWire(due) {
  const amount = $("#field-amount");
  document.querySelectorAll('#modal-fields [name="method"]').forEach((radio) =>
    radio.addEventListener("change", () => {
      const method = document.querySelector('#modal-fields [name="method"]:checked')?.value;
      if ($("#pay-certificate")) $("#pay-certificate").hidden = method !== "certificate";
      if ($("#pay-pass")) $("#pay-pass").hidden = method !== "pass";
      if ($("#field-certificate_code")) $("#field-certificate_code").required = method === "certificate";
      amount.readOnly = method === "pass";
      if (method === "pass") amount.value = due / 100;
    }),
  );
}

Object.assign(actions, {
  "finance-tab": (b) => {
    financeTab = b.dataset.tab;
    render();
  },
  "expense-add": () => expenseModal(),
  "expense-delete": (b) =>
    confirmModal(ft("delete"), ft("expenseDeleteAsk"), async () => {
      await window.orbit.call("expense:delete", { id: b.dataset.id });
      toast(ft("expenseDeleted"));
    }, ft("delete")),
  "payroll-pay": (b) => {
    const r = data.resources.find((x) => x.id === b.dataset.id);
    expenseModal({ title: `${ft("payoutTitle")}: ${r?.name || ""}`, category: "salary", resource_id: b.dataset.id, amount: Number(b.dataset.amount), note: `${ft("payTitle")} ${financeMonth}`, toast: ft("payoutSaved") });
  },
  "certificate-sell": certificateModal,
  "certificate-void": (b) =>
    confirmModal(ft("certVoid"), ft("certVoidAsk"), () => window.orbit.call("certificate:void", { id: b.dataset.id }), ft("certVoid")),
  "pass-sell": passModal,
  "pass-void": (b) =>
    confirmModal(ft("certVoid"), ft("certVoidAsk"), () => window.orbit.call("pass:void", { id: b.dataset.id }), ft("certVoid")),
  "material-add": () => materialModal(),
  "material-edit": (b) => materialModal(b.dataset.id),
  "material-buy": (b) => materialMoveModal(b.dataset.id, "purchase"),
  "material-count": (b) => materialMoveModal(b.dataset.id, "adjust"),
  "material-delete": (b) =>
    confirmModal(ft("delete"), ft("matDeleteAsk"), () => window.orbit.call("material:delete", { id: b.dataset.id }), ft("delete")),
});
