"use strict";
// Sign-up and sign-in page for the site dialog: only these forms, no workspace code (~15 KB instead of ~660 KB).
// Texts are copied from web/app/i18n.js; keep them in step when those change.
(() => {
const TEXT = {
 "m293": {
  "uk": "Вхід до LOMVIKO",
  "en": "Sign in to LOMVIKO"
 },
 "m294": {
  "uk": "Логін · email",
  "en": "Login · email"
 },
 "m295": {
  "uk": "Пароль",
  "en": "Password"
 },
 "m296": {
  "uk": "Увійдіть email і паролем. Вхід зберігається в цьому браузері на 7 днів.",
  "en": "Sign in with your email and password. This browser stays signed in for 7 days."
 },
 "forgotPassword": {
  "uk": "Забули пароль?",
  "en": "Forgot password?"
 },
 "registerFreeTrial": {
  "uk": "Спробувати безкоштовно",
  "en": "Try every feature free"
 },
 "m036": {
  "uk": "Увійти",
  "en": "Sign in"
 },
 "forgotPasswordTitle": {
  "uk": "Відновити пароль",
  "en": "Reset your password"
 },
 "forgotPasswordHint": {
  "uk": "Вкажіть email, з яким входите. Надішлемо шестизначний код.",
  "en": "Enter the email you sign in with. We will send a six-digit code."
 },
 "sendCode": {
  "uk": "Отримати код",
  "en": "Send verification code"
 },
 "forgotPasswordCodeTitle": {
  "uk": "Новий пароль",
  "en": "New password"
 },
 "forgotPasswordCodeHint": {
  "uk": "Якщо такий обліковий запис є, код уже в пошті. Він діє 15 хвилин. Не бачите листа — перевірте «Спам».",
  "en": "If the account exists, the code is in your inbox. It is valid for 15 minutes. No letter? Check your spam folder."
 },
 "verificationCode": {
  "uk": "Код із листа",
  "en": "Email code"
 },
 "forgotPasswordNew": {
  "uk": "Новий пароль",
  "en": "New password"
 },
 "registerPasswordAgain": {
  "uk": "Повторіть пароль",
  "en": "Repeat the password"
 },
 "registerPasswordHint": {
  "uk": "Пароль — щонайменше 12 символів.",
  "en": "The password needs at least 12 characters."
 },
 "registerPasswordMismatch": {
  "uk": "Паролі не збігаються",
  "en": "The passwords do not match"
 },
 "forgotPasswordDone": {
  "uk": "Пароль змінено. На інших пристроях потрібно увійти знову.",
  "en": "Password changed. Other devices need to sign in again."
 },
 "forgotPasswordSave": {
  "uk": "Зберегти й увійти",
  "en": "Save and sign in"
 },
 "registrationClosedTitle": {
  "uk": "Реєстрацію тимчасово закрито",
  "en": "Registration is closed for now"
 },
 "registrationClosedText": {
  "uk": "Зараз ми не приймаємо нових користувачів. Залиште заявку на сайті — напишемо, щойно відкриємо реєстрацію.",
  "en": "We are not taking new users right now. Leave a request on the site and we will write as soon as registration opens."
 },
 "registrationClosedButton": {
  "uk": "Залишити заявку",
  "en": "Leave a request"
 },
 "close": {
  "uk": "Закрити",
  "en": "Close"
 },
 "registrationHint": {
  "uk": "Усі функції без обмеження тарифом. Підтвердіть email кодом із листа — тоді почнеться пробний період.",
  "en": "All features are included. Verify your email with the code we send to start your trial."
 },
 "registerCompany": {
  "uk": "Назва компанії",
  "en": "Company name"
 },
 "registerName": {
  "uk": "Ваше ім’я",
  "en": "Your name"
 },
 "registerEmail": {
  "uk": "Пошта",
  "en": "Email"
 },
 "legalAcceptLabel": {
  "uk": "Я приймаю",
  "en": "I accept the"
 },
 "legalTerms": {
  "uk": "Умови користування",
  "en": "Terms of use"
 },
 "legalOffer": {
  "uk": "Публічну оферту",
  "en": "Public offer"
 },
 "legalAnd": {
  "uk": "та",
  "en": "and the"
 },
 "legalPrivacyAccusative": {
  "uk": "Політику конфіденційності",
  "en": "Privacy policy"
 },
 "legalAcceptRequired": {
  "uk": "Щоб зареєструватися, позначте, що приймаєте Публічну оферту та Політику конфіденційності.",
  "en": "To register, tick that you accept the Public offer and the Privacy policy."
 },
 "legalAcceptRequiredTerms": {
  "uk": "Щоб зареєструватися, позначте, що приймаєте Умови користування та Політику конфіденційності.",
  "en": "To register, tick that you accept the Terms of use and the Privacy policy."
 },
 "legalAcceptRequiredPrivacy": {
  "uk": "Щоб зареєструватися, позначте, що приймаєте Політику конфіденційності.",
  "en": "To register, tick that you accept the Privacy policy."
 },
 "verifyEmail": {
  "uk": "Підтвердіть email",
  "en": "Verify your email"
 },
 "verifyEmailHint": {
  "uk": "Введіть шестизначний код із листа. Він діє 15 хвилин. Якщо лист не прийшов за кілька хвилин, перевірте «Спам». Якщо обліковий запис із цим email уже існує, код не надсилається — ми надіслали лист-підказку, просто увійдіть.",
  "en": "Enter the six-digit code from your email. It expires in 15 minutes. If it does not arrive within a few minutes, check your spam folder. If an account with this email already exists, no code is sent — we emailed you a hint; just sign in."
 },
 "legalCodeSigns": {
  "uk": "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Публічною офертою та Політикою конфіденційності.",
  "en": "The code from the email confirms your address and works as your electronic signature under the Public offer and Privacy policy."
 },
 "legalCodeSignsTerms": {
  "uk": "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Умовами користування та Політикою конфіденційності.",
  "en": "The code from the email confirms your address and works as your electronic signature under the Terms of use and Privacy policy."
 },
 "legalCodeSignsPrivacy": {
  "uk": "Код із листа підтверджує вашу пошту і є вашим електронним підписом під згодою з Політикою конфіденційності.",
  "en": "The code from the email confirms your address and works as your electronic signature under the Privacy policy."
 },
 "m271": {
  "uk": "Зберегти",
  "en": "Save"
 },
 "m298": {
  "uk": "Вхід виконано. Можна працювати.",
  "en": "Signed in. Ready to work."
 },
 "cancel": {
  "uk": "Скасувати",
  "en": "Cancel"
 },
 "haveAccount": {
  "uk": "Вже маєте акаунт?",
  "en": "Already have an account?"
 },
 "noAccount": {
  "uk": "Ще немає акаунта?",
  "en": "No account yet?"
 },
 "loading": {
  "uk": "Завантаження…",
  "en": "Loading…"
 },
 "offline": {
  "uk": "Немає зв’язку з сервером. Перевірте інтернет і спробуйте ще раз.",
  "en": "Cannot reach the server. Check the connection and try again."
 }
};

// Same calls as the app's own dialogs (web/app/forms.js): the server signs the person in on success,
// so the workspace opens without a second sign-in.
const params = new URLSearchParams(location.search);
const embedded = window.parent !== window;
let lang = params.get("lang") === "en" ? "en" : "uk";
try { if (!params.get("lang") && localStorage.getItem("orbit.language") === "en") lang = "en"; } catch {}
try { localStorage.setItem("orbit.language", lang); } catch {}
document.documentElement.lang = lang;
const t = (key) => TEXT[key]?.[lang] ?? key;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const root = document.getElementById("auth");
// Until the settings arrive, assume what production uses now (terms of use while sales are off).
let info = { offer: true, contract: "site-terms", registration: true, api: "" };

const tell = (type, extra = {}) => { if (embedded) window.parent.postMessage({ type, ...extra }, "https://lomviko.com"); };
async function post(path, body) {
  let response;
  try {
    response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify(body || {}) });
  } catch { throw Error(t("offline")); }
  const value = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(value.error || t("offline"));
  return value;
}
const call = async (channel, ...args) => (await post("/web/call", { channel, args })).value;
const field = (label, name, type, extra = "") => `<label for="f-${name}">${esc(label)}</label><input id="f-${name}" name="${name}" type="${type}" ${extra}>`;

// One screen: title, content, error line, Cancel and the main button.
function screen(title, html, submit, button, after = "") {
  root.innerHTML = `<form novalidate><h1>${esc(title)}</h1>${html}<p class="error" role="alert"></p><div class="footer"><button type="button" class="btn" data-act="cancel">${esc(t("cancel"))}</button><button type="submit" class="btn primary">${esc(button)}</button></div>${after}</form>`;
  const form = root.querySelector("form"), error = root.querySelector(".error"), main = root.querySelector('button[type="submit"]');
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.textContent = "";
    if (!form.checkValidity()) { form.reportValidity(); return; }
    main.disabled = true; main.setAttribute("aria-busy", "true");
    try { await submit(Object.fromEntries(new FormData(form))); }
    catch (err) { error.textContent = err.message; }
    finally { main.disabled = false; main.removeAttribute("aria-busy"); }
  });
  // On a phone the keyboard would cover the form at once; focus the first field only with a mouse.
  if (matchMedia("(pointer: fine)").matches) root.querySelector("input")?.focus({ preventScroll: true });
  size();
}
function done() {
  if (embedded) tell("lomviko:authenticated");
  else location.assign("/");
}
function openDocument(kind) {
  window.open(`${info.api}/public/documents/${kind}/${lang}`, "_blank", "noopener");
}

function login() {
  view = "login";
  screen(
    t("m293"),
    field(t("m294"), "login", "email", 'required autocomplete="username"') +
      field(t("m295"), "password", "password", 'required autocomplete="current-password"') +
      `<p class="hint">${esc(t("m296"))} <button type="button" class="link" data-act="forgot">${esc(t("forgotPassword"))}</button></p>`,
    async (v) => { await call("account:login", "", v.login, v.password); done(); },
    t("m036"),
    `<p class="switch">${esc(t("noAccount"))} <button type="button" class="link" data-act="register">${esc(t("registerFreeTrial"))}</button></p>`,
  );
}

function forgot() {
  view = "forgot";
  const known = root.querySelector("#f-login")?.value || "";
  screen(
    t("forgotPasswordTitle"),
    `<p class="hint">${esc(t("forgotPasswordHint"))}</p>` + field(t("m294"), "email", "email", `required maxlength="254" autocomplete="username" value="${esc(known)}"`),
    async (v) => {
      await call("account:reset:start", v.email, lang);
      screen(
        t("forgotPasswordCodeTitle"),
        `<p class="hint">${esc(t("forgotPasswordCodeHint"))}</p>` +
          field(t("verificationCode"), "code", "text", 'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6"') +
          field(t("forgotPasswordNew"), "password", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
          field(t("registerPasswordAgain"), "password_again", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
          `<p class="hint">${esc(t("registerPasswordHint"))}</p>`,
        async (c) => {
          if (c.password !== c.password_again) throw Error(t("registerPasswordMismatch"));
          await call("account:reset:confirm", c.code, c.password);
          done();
        },
        t("forgotPasswordSave"),
      );
    },
    t("sendCode"),
  );
}

// Which documents the person accepts: the offer while it is published, otherwise the terms of use,
// or only the privacy policy when the owner switched the contract off.
const legalKey = (base) => base + (info.offer === false ? "Privacy" : info.contract === "site-terms" ? "Terms" : "");
const legalText = () => `${esc(t("legalAcceptLabel"))} ${info.offer === false ? "" : `<button type="button" class="link" data-act="contract">${esc(t(info.contract === "site-terms" ? "legalTerms" : "legalOffer"))}</button> ${esc(t("legalAnd"))} `}<button type="button" class="link" data-act="privacy">${esc(t("legalPrivacyAccusative"))}</button>`;
let view = "";
function register() {
  if (info.registration === false) {
    root.innerHTML = `<h1>${esc(t("registrationClosedTitle"))}</h1><p>${esc(t("registrationClosedText"))}</p><div class="footer"><button type="button" class="btn" data-act="cancel">${esc(t("close"))}</button><a class="btn primary" href="https://lomviko.com/#request" target="_top">${esc(t("registrationClosedButton"))}</a></div>`;
    size();
    return;
  }
  view = "register";
  screen(
    t("registerFreeTrial"),
    `<p class="hint">${esc(t("registrationHint"))}</p>` +
      field(t("registerCompany"), "business", "text", 'required maxlength="120" autocomplete="organization"') +
      field(t("registerName"), "name", "text", 'required maxlength="120" autocomplete="name"') +
      field(t("registerEmail"), "email", "email", 'required maxlength="254" autocomplete="email"') +
      field(t("m295"), "password", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
      field(t("registerPasswordAgain"), "password_again", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
      `<p class="hint">${esc(t("registerPasswordHint"))}</p>` +
      `<label class="check"><input name="accept" type="checkbox"><span id="legal">${legalText()}</span></label>`,
    async (values) => {
      if (values.password !== values.password_again) throw Error(t("registerPasswordMismatch"));
      if (values.accept !== "on") throw Error(t(legalKey("legalAcceptRequired")));
      const { password_again, accept: ticked, ...fields } = values;
      await call("account:register:start", { ...fields, accept: true, language: lang });
      screen(
        t("verifyEmail"),
        `<p class="hint">${esc(t("verifyEmailHint"))}</p><p class="hint">${esc(t(legalKey("legalCodeSigns")))}</p>` +
          field(t("verificationCode"), "code", "text", 'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6"'),
        async (v) => {
          await call("account:register:confirm", v.code);
          try { window.OrbitAds?.registrationComplete(); } catch {}
          // The first visit to the workspace starts the short welcome tour.
          try { if (!localStorage.getItem("biz.welcome.seen")) sessionStorage.setItem("biz.welcome.pending", "1"); } catch {}
          done();
        },
        t("m036"),
      );
    },
    t("sendCode"),
    `<p class="switch">${esc(t("haveAccount"))} <button type="button" class="link" data-act="login">${esc(t("m036"))}</button></p>`,
  );
}

root.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (!act) return;
  if (act === "cancel") { if (embedded) tell("lomviko:auth-close"); else location.assign("/"); }
  else if (act === "forgot") forgot();
  else if (act === "register") register();
  else if (act === "login") login();
  else if (act === "privacy") openDocument("app-privacy");
  else if (act === "contract") openDocument(info.contract === "site-terms" ? "site-terms" : "site-offer");
});

// The dialog on the site follows the height of the form.
function size() { tell("lomviko:auth-size", { height: document.documentElement.scrollHeight }); }
new ResizeObserver(size).observe(root);

// The form is drawn at once. The settings arrive a moment later: closed registration replaces the form,
// and the consent line names the documents actually in force.
(params.get("start") === "login" ? login : register)();
post("/web/info")
  .then((value) => {
    info = { ...info, ...value };
    window.OrbitAds?.configure(value.ads);
    if (view === "register" && document.getElementById("f-business")) {
      if (info.registration === false) register();
      else document.getElementById("legal").innerHTML = legalText();
    }
  })
  .catch(() => {});
})();
