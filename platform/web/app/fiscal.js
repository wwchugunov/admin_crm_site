"use strict";
// Fiscal receipts (ПРРО) in Integrations: connect Checkbox, choose what gets a receipt, see and retry receipts.
// LOMVIKO only passes sales to the licensed provider; whether a business needs receipts is for its accountant to say.
Object.assign(OrbitI18n.messages, {
  fiscalGroup: { uk: "Фіскальні чеки (ПРРО)", en: "Fiscal receipts (PRRO)" },
  fiscalNote: { uk: "LOMVIKO передає продаж ліцензованому ПРРО, а він реєструє чек у податковій. LOMVIKO не є ПРРО й не консультує з податків: чи потрібні вам чеки — уточніть у бухгалтера.", en: "LOMVIKO passes each sale to a licensed PRRO provider, which registers the receipt with the tax service. LOMVIKO is not a PRRO and gives no tax advice: ask your accountant whether you need receipts." },
  fiscalCheckbox: { uk: "Checkbox", en: "Checkbox" },
  fiscalOff: { uk: "Вимкнено", en: "Off" },
  fiscalOn: { uk: "Чеки видаються", en: "Issuing receipts" },
  fiscalShort: { uk: "Чек на кожну оплату — готівкою, карткою на місці чи онлайн через monobank і LiqPay, — на продаж сертифіката чи абонемента й на повернення.", en: "A receipt for every payment — cash, card at the place or online through monobank and LiqPay — for certificate and pass sales, and refunds." },
  fiscalConnect: { uk: "Підключити Checkbox", en: "Connect Checkbox" },
  fiscalDisconnect: { uk: "Вимкнути", en: "Turn off" },
  fiscalDisconnectAsk: { uk: "Нові оплати більше не передаватимуться в Checkbox. Видані чеки залишаться в Checkbox і в списку нижче.", en: "New payments will no longer go to Checkbox. Issued receipts stay in Checkbox and in the list below." },
  fiscalVchasno: { uk: "Вчасно.Каса", en: "Vchasno.Kasa" },
  fiscalWhyTitle: { uk: "Фіскальні чеки — за вашим бажанням", en: "Fiscal receipts are up to you" },
  fiscalWhy1: { uk: "LOMVIKO повністю працює й без них: записи, клієнти, оплати, звіти, бот — усе як є.", en: "LOMVIKO works fully without them: bookings, clients, payments, reports and the bot stay as they are." },
  fiscalWhy2: { uk: "Каса (ПРРО) — це ваш окремий договір із провайдером: Checkbox або Вчасно.Каса. Ви реєструєтеся в нього й оплачуєте його тариф напряму, а LOMVIKO лише передає продажі у вашу касу й нічого за це не бере.", en: "The cash register (PRRO) is your own agreement with a provider: Checkbox or Vchasno.Kasa. You sign up with them and pay their plan directly; LOMVIKO only passes sales to your register and charges nothing for it." },
  fiscalWhy3: { uk: "Чи потрібні вам чеки і на яких оплатах — вирішує ваш бухгалтер. Ціни провайдерів можуть змінюватися, перевіряйте їх на їхніх сайтах.", en: "Your accountant decides whether you need receipts and for which payments. Provider prices may change; check them on their websites." },
  fiscalCheckboxPrice: { uk: "Checkbox: 30 днів безкоштовно, далі близько 348 грн на місяць за касу (за даними їхнього сайту).", en: "Checkbox: 30 days free, then about 348 UAH a month per register (according to their website)." },
  fiscalHowTitle: { uk: "Як підключити Checkbox", en: "How to connect Checkbox" },
  fiscalHow1: { uk: "Зареєструйтеся на checkbox.ua — як ФОП або компанія, з КЕП.", en: "Sign up at checkbox.ua as a sole proprietor or company, with a qualified e-signature." },
  fiscalHow2: { uk: "Створіть касу. Щоб спершу спробувати, візьміть тестову касу — її чеки не йдуть у податкову.", en: "Create a cash register. To try first, use a test register — its receipts do not go to the tax service." },
  fiscalHow3: { uk: "Додайте касира й задайте йому логін і пароль або PIN-код.", en: "Add a cashier and give them a login and password or a PIN." },
  fiscalHow4: { uk: "Скопіюйте ключ ліцензії каси й вставте все нижче.", en: "Copy the register licence key and paste everything below." },
  fiscalSoon: { uk: "Незабаром", en: "Coming soon" },
  fiscalVchasnoShort: { uk: "Підключення з’явиться найближчим часом. За даними їхнього сайту, є безкоштовний тариф з обмеженнями.", en: "Coming soon. According to their website, there is a free plan with limits." },
  fiscalLicence: { uk: "Ключ ліцензії каси", en: "Cash register licence key" },
  fiscalLicenceHint: { uk: "Кабінет Checkbox → Каси → ваша каса → «Ключ ліцензії». Для перевірки можна взяти тестову касу.", en: "Checkbox account → Cash registers → your register → “Licence key”. A test register works for trying it out." },
  fiscalLogin: { uk: "Логін касира", en: "Cashier login" },
  fiscalPassword: { uk: "Пароль касира", en: "Cashier password" },
  fiscalPin: { uk: "Або PIN-код касира", en: "Or the cashier PIN" },
  fiscalMethods: { uk: "Видавати чек, коли клієнт платить", en: "Issue a receipt when the client pays" },
  fiscalOnline: { uk: "Онлайн: monobank, LiqPay", en: "Online: monobank, LiqPay" },
  fiscalOnlineHint: { uk: "Онлайн-оплати вмикайте лише тоді, коли в кабінеті monobank чи LiqPay не увімкнені їхні власні чеки — інакше клієнт отримає два чеки на одну оплату.", en: "Turn on online payments only if receipts are not enabled in your monobank or LiqPay account — otherwise the client gets two receipts for one payment." },
  fiscalTelegram: { uk: "Надсилати клієнту посилання на чек у Telegram-бот", en: "Send the client a receipt link in the Telegram bot" },
  fiscalConsent: { uk: "Я розумію, що відповідальність за видачу чеків несу я, фіскалізацію виконує Checkbox, а LOMVIKO лише передає дані про продаж.", en: "I understand that I am responsible for issuing receipts, Checkbox performs the fiscalisation, and LOMVIKO only passes on the sale data." },
  fiscalConnected: { uk: "Checkbox підключено", en: "Checkbox connected" },
  fiscalCashier: { uk: "Касир", en: "Cashier" },
  fiscalSince: { uk: "Згода прийнята", en: "Accepted on" },
  fiscalSave: { uk: "Зберегти", en: "Save" },
  fiscalSettings: { uk: "Налаштування чеків", en: "Receipt settings" },
  fiscalReceipts: { uk: "Останні чеки", en: "Recent receipts" },
  fiscalNone: { uk: "Чеків ще немає. Перший з’явиться після оплати готівкою чи карткою.", en: "No receipts yet. The first appears after a cash or card payment." },
  fiscalOpen: { uk: "Чек", en: "Receipt" },
  fiscalRetry: { uk: "Повторити", en: "Retry" },
  fiscalRetried: { uk: "Чек відправлено ще раз", en: "Receipt sent again" },
  fiscalStatus_pending: { uk: "В черзі", en: "Queued" },
  fiscalStatus_sent: { uk: "Реєструється", en: "Registering" },
  fiscalStatus_done: { uk: "Видано", en: "Issued" },
  fiscalStatus_failed: { uk: "Помилка", en: "Failed" },
  fiscalReturn: { uk: "повернення", en: "refund" },
  fiscalTest: { uk: "тестовий", en: "test" },
  fiscalFailedNote: { uk: "Є чеки з помилкою — перевірте дані каси в Checkbox і натисніть «Повторити».", en: "Some receipts failed — check the register in Checkbox and press “Retry”." },
});
function fiscalGroup() {
  if (data.mode !== "server" || data.role === "staff") return "";
  const f = data.integrations.fiscal || { connected: false },
    owner = data.role === "owner",
    receipts = data.fiscal_receipts || [],
    failed = receipts.filter((r) => r.status === "failed").length;
  const checkbox = integrationRow({
    icon: "₴",
    name: ft("fiscalCheckbox"),
    on: f.connected,
    status: f.connected ? ft("fiscalOn") : ft("fiscalOff"),
    short: f.connected ? `${ft("fiscalCashier")}: ${escape(f.cashier || "")}${f.consent_at ? ` · ${ft("fiscalSince")} ${dayText(f.consent_at)}` : ""}` : ft("fiscalShort"),
    controls: !owner ? "" : f.connected ? `<button class="secondary" data-action="fiscal-settings">${ft("fiscalSettings")}</button><button class="danger" data-action="fiscal-off">${ft("fiscalDisconnect")}</button>` : `<button class="primary" data-action="fiscal-connect">${ft("fiscalConnect")}</button>`,
    more: `<p>${ft("fiscalCheckboxPrice")}</p><p>${ft("fiscalNote")}</p>`,
  });
  const why = `<div class="fiscal-why"><strong>${ft("fiscalWhyTitle")}</strong><ul><li>${ft("fiscalWhy1")}</li><li>${ft("fiscalWhy2")}</li><li>${ft("fiscalWhy3")}</li></ul></div>`;
  const vchasno = integrationRow({ icon: "◷", name: ft("fiscalVchasno"), on: false, status: ft("fiscalSoon"), short: ft("fiscalVchasnoShort"), controls: "", more: "" });
  const list =
    f.connected || receipts.length
      ? `<div class="fiscal-receipts"><h4>${ft("fiscalReceipts")}</h4>${failed ? `<div class="callout">${ft("fiscalFailedNote")}</div>` : ""}${
          receipts.length
            ? `<div class="table-wrapper"><table class="table"><tbody>${receipts
                .slice(0, 20)
                .map(
                  (r) =>
                    `<tr><td>${dayText(r.created_at)}</td><td>${escape(r.title)}${r.kind === "return" ? ` · ${ft("fiscalReturn")}` : ""}${r.is_test ? ` · <span class="tag">${ft("fiscalTest")}</span>` : ""}${r.status === "failed" && r.error ? `<small class="fiscal-error">${escape(r.error)}</small>` : ""}</td><td class="num">${r.kind === "return" ? "−" : ""}${money(r.amount)}</td><td><span class="badge ${r.status === "failed" ? "cancelled" : ""}">${ft("fiscalStatus_" + r.status)}</span></td><td>${r.status === "done" ? `<a class="link-button" href="${escape(fiscalReceiptUrl(r.id))}" target="_blank" rel="noopener">${ft("fiscalOpen")}</a>` : r.status === "failed" ? `<button class="link-button" data-action="fiscal-retry" data-id="${escape(r.id)}">${ft("fiscalRetry")}</button>` : ""}</td></tr>`,
                )
                .join("")}</tbody></table></div>`
            : `<p class="hint">${ft("fiscalNone")}</p>`
        }</div>`
      : "";
  return settingsGroup(ft("fiscalGroup"), why + checkbox + vchasno + list);
}
function fiscalReceiptUrl(id) {
  return `https://api.checkbox.in.ua/api/v1/receipts/${id}/html`;
}
function fiscalMethodFields(f = {}) {
  const methods = f.methods || ["cash", "card"];
  return `<fieldset class="chip-group"><legend>${ft("fiscalMethods")}</legend>${[
    ["cash", "m116"],
    ["card", "m117"],
    ["online", "fiscalOnline"],
  ]
    .map(([value, key]) => `<label class="chip"><input type="checkbox" name="fiscal_methods" value="${value}" ${methods.includes(value) ? "checked" : ""}><span>${OrbitI18n.t(key)}</span></label>`)
    .join("")}</fieldset><p class="hint">${ft("fiscalOnlineHint")}</p><label class="checkbox-line"><input type="checkbox" name="fiscal_telegram" ${f.telegram === false ? "" : "checked"}>${ft("fiscalTelegram")}</label>`;
}
const fiscalChoices = () => ({
  methods: Array.from(document.querySelectorAll('#modal-fields [name="fiscal_methods"]:checked'), (i) => i.value),
  telegram: Boolean($('#modal-fields [name="fiscal_telegram"]')?.checked),
});
Object.assign(actions, {
  "fiscal-connect": () =>
    modal(
      ft("fiscalConnect"),
      `<div class="bot-guide"><strong>${ft("fiscalHowTitle")}</strong><ol>${[1, 2, 3, 4].map((n) => `<li>${ft("fiscalHow" + n)}</li>`).join("")}</ol><p class="hint">${ft("fiscalWhy2")}</p><p class="hint">${ft("fiscalCheckboxPrice")}</p></div>` +
        field(ft("fiscalLicence"), "license_key", "password", 'required autocomplete="off" spellcheck="false" maxlength="200"') +
        `<p class="hint">${ft("fiscalLicenceHint")}</p>` +
        `<div class="form-grid"><div>${field(ft("fiscalLogin"), "login", "text", 'autocomplete="off" maxlength="200"')}</div><div>${field(ft("fiscalPassword"), "password", "password", 'autocomplete="new-password" maxlength="200"')}</div></div>` +
        field(ft("fiscalPin"), "pin", "password", 'autocomplete="off" inputmode="numeric" maxlength="20"') +
        fiscalMethodFields() +
        `<label class="checkbox-line consent-line"><input type="checkbox" name="consent" required>${ft("fiscalConsent")}</label>`,
      async (v) => {
        await window.orbit.call("fiscal:connect", { provider: "checkbox", license_key: v.license_key, login: v.login, password: v.password, pin: v.pin, consent: v.consent === "on", ...fiscalChoices() });
        toast(ft("fiscalConnected"));
      },
      ft("fiscalConnect"),
    ),
  "fiscal-settings": () => {
    const f = data.integrations.fiscal || {};
    modal(ft("fiscalSettings"), fiscalMethodFields(f), async () => {
      await window.orbit.call("fiscal:settings", fiscalChoices());
      toast(OrbitI18n.t("m361"));
    }, ft("fiscalSave"));
  },
  "fiscal-off": () => confirmModal(ft("fiscalDisconnect"), ft("fiscalDisconnectAsk"), () => window.orbit.call("fiscal:disconnect"), ft("fiscalDisconnect")),
  "fiscal-retry": async (b) => {
    await window.orbit.call("fiscal:retry", { id: b.dataset.id });
    toast(ft("fiscalRetried"));
    await refresh();
  },
});
