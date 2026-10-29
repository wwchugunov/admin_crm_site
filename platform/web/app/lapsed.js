"use strict";
// "Not seen lately": the owner's own limit, invitation templates, invite one or everyone, and automatic invitations.
Object.assign(OrbitI18n.messages, {
  lapsedSettings: { uk: "Налаштувати", en: "Settings" },
  lapsedSettingsTitle: { uk: "Давно не були: налаштування", en: "Not seen lately: settings" },
  lapsedDays: { uk: "Показувати клієнта, якщо його не було, днів", en: "Show a client after this many days without a visit" },
  lapsedRhythm: { uk: "Враховувати звичний ритм клієнта (хто ходить рідше — з’явиться пізніше)", en: "Respect the client's usual rhythm (those who come less often show up later)" },
  lapsedTemplates: { uk: "Шаблони запрошень", en: "Invitation templates" },
  lapsedTemplatesHint: { uk: "Підставляються: {name} — ім’я клієнта, {business} — назва компанії, {days} — скільки днів не був. Під повідомленням буде кнопка «Записатися».", en: "Placeholders: {name} — client's first name, {business} — company name, {days} — days since the last visit. A “Book” button is added below the message." },
  lapsedTemplateTitle: { uk: "Назва шаблону", en: "Template name" },
  lapsedTemplateText: { uk: "Текст повідомлення", en: "Message text" },
  lapsedTemplateAdd: { uk: "Додати шаблон", en: "Add template" },
  lapsedTemplateRemove: { uk: "Прибрати", en: "Remove" },
  lapsedAuto: { uk: "Надсилати запрошення автоматично — один раз за кожну відсутність, з 10:00 до 19:00", en: "Send invitations automatically — once per absence, between 10:00 and 19:00" },
  lapsedAutoTemplate: { uk: "Шаблон для автоматичних запрошень", en: "Template for automatic invitations" },
  lapsedAutoOn: { uk: "Автозапрошення увімкнено", en: "Automatic invitations on" },
  lapsedInviteAll: { uk: "Запросити всіх", en: "Invite everyone" },
  lapsedInviteAllAsk: { uk: "Запрошення отримають клієнти з Telegram-ботом, яких ще не запрошували після останнього візиту: {count}.", en: "Clients with the Telegram bot not invited since their last visit get the invitation: {count}." },
  lapsedInviteAllDone: { uk: "Надіслано запрошень: {count}", en: "Invitations sent: {count}" },
  lapsedNobodyToInvite: { uk: "Немає кого запросити: усі вже запрошені або без Telegram-бота", en: "Nobody to invite: everyone is invited or without the Telegram bot" },
  lapsedTemplate: { uk: "Шаблон", en: "Template" },
  lapsedPreview: { uk: "Клієнт отримає", en: "The client gets" },
  lapsedSend: { uk: "Надіслати", en: "Send" },
  reviewsName: { uk: "Відгуки в Google", en: "Google reviews" },
  reviewsShort: { uk: "Через 2 години після візиту бот просить оцінку: 4–5★ ведуть на ваші відгуки в Google, 1–3★ — одразу вам.", en: "Two hours after a visit the bot asks for a rating: 4–5★ lead to your Google reviews, 1–3★ come straight to you." },
  reviewsOn: { uk: "Увімкнено", en: "On" },
  reviewsOff: { uk: "Вимкнено", en: "Off" },
  reviewsSetup: { uk: "Налаштувати", en: "Set up" },
  reviewsUrl: { uk: "Посилання на відгуки в Google", en: "Google review link" },
  reviewsHow: { uk: "Профіль компанії в Google → «Попросити відгуки» (або «Отримати більше відгуків») → скопіюйте посилання й вставте сюди.", en: "Your Google Business Profile → “Ask for reviews” (or “Get more reviews”) → copy the link and paste it here." },
  reviewsEnable: { uk: "Просити оцінку після кожного візиту (одному клієнту — не частіше ніж раз на 2 тижні)", en: "Ask for a rating after each visit (no more than once in 2 weeks per client)" },
  reviewsNeedBot: { uk: "Працює для клієнтів, підключених до Telegram-бота.", en: "Works for clients connected to the Telegram bot." },
  reviewRating: { uk: "Оцінка клієнта", en: "Client rating" },
  lapsedSummary: { uk: "Від {days} днів без візиту", en: "From {days} days without a visit" },
});
function lapsedSettingsData() {
  return data.integrations?.lapsed || { days: data.lapsed_days || 30, rhythm: true, templates: [{ id: "default", title: "Запрошення", text: "{name}, давно вас не бачили! Запишіться на зручний час — це займе хвилину." }], auto: false, auto_template: "default" };
}
function lapsedFill(template, client, away) {
  const name = String(client.name || "").split(/\s+/)[0];
  return template.text.replaceAll("{name}", name).replaceAll("{ім'я}", name).replaceAll("{business}", data.business).replaceAll("{компанія}", data.business).replaceAll("{days}", away ?? "").replaceAll("{днів}", away ?? "");
}
function lapsedReady(rows) {
  return rows.filter(({ client: c }) => c.chat_id && !(c.invited_at > (c.stats.last || 0)));
}
function lapsedToolbar(rows, manage) {
  const s = lapsedSettingsData(),
    ready = lapsedReady(rows).length;
  return `<div class="lapsed-toolbar"><p class="hint lapsed-note">${OrbitI18n.t("lapsedNote")} <strong>${OrbitI18n.t("lapsedSummary").replace("{days}", s.days)}</strong>${s.auto ? ` · <span class="badge">${OrbitI18n.t("lapsedAutoOn")}</span>` : ""}</p>${
    manage ? `<div class="row-actions"><button class="secondary" data-action="lapsed-settings">${OrbitI18n.t("lapsedSettings")}</button>${ready ? `<button class="primary" data-action="lapsed-invite-all">${OrbitI18n.t("lapsedInviteAll")} (${ready})</button>` : ""}</div>` : ""
  }</div>`;
}
function templateRow(t, i) {
  return `<div class="lapsed-template" data-template="${escape(t.id || "")}"><div class="form-grid"><div><label for="tpl-title-${i}">${OrbitI18n.t("lapsedTemplateTitle")}</label><input id="tpl-title-${i}" class="tpl-title" maxlength="60" required value="${escape(t.title || "")}"></div><div class="tpl-remove-cell"><button type="button" class="link-button" data-template-remove>${OrbitI18n.t("lapsedTemplateRemove")}</button></div></div><label for="tpl-text-${i}">${OrbitI18n.t("lapsedTemplateText")}</label><textarea id="tpl-text-${i}" class="tpl-text" rows="3" maxlength="1000" required>${escape(t.text || "")}</textarea></div>`;
}
function lapsedSettingsModal() {
  const s = lapsedSettingsData();
  modal(
    OrbitI18n.t("lapsedSettingsTitle"),
    field(OrbitI18n.t("lapsedDays"), "days", "number", `required min="3" max="365" step="1" value="${s.days}"`) +
      `<label class="checkbox-line"><input type="checkbox" name="rhythm" ${s.rhythm ? "checked" : ""}>${OrbitI18n.t("lapsedRhythm")}</label>` +
      `<h3 class="form-section">${OrbitI18n.t("lapsedTemplates")}</h3><p class="hint">${OrbitI18n.t("lapsedTemplatesHint")}</p><div id="lapsed-templates">${s.templates.map(templateRow).join("")}</div><button type="button" class="secondary" id="lapsed-template-add">${OrbitI18n.t("lapsedTemplateAdd")}</button>` +
      `<h3 class="form-section">${OrbitI18n.t("lapsedAutoOn")}</h3><label class="checkbox-line"><input type="checkbox" name="auto" ${s.auto ? "checked" : ""}>${OrbitI18n.t("lapsedAuto")}</label><label for="field-auto_template">${OrbitI18n.t("lapsedAutoTemplate")}</label><select id="field-auto_template" name="auto_template">${s.templates.map((t) => `<option value="${escape(t.id)}" ${t.id === s.auto_template ? "selected" : ""}>${escape(t.title)}</option>`).join("")}</select>`,
    async (v) => {
      const templates = Array.from(document.querySelectorAll("#lapsed-templates .lapsed-template"), (el) => ({ id: el.dataset.template || undefined, title: el.querySelector(".tpl-title").value, text: el.querySelector(".tpl-text").value }));
      await window.orbit.call("lapsed:settings", { days: Number(v.days), rhythm: v.rhythm === "on", templates, auto: v.auto === "on", auto_template: v.auto_template });
      toast(OrbitI18n.t("m361"));
    },
  );
  const list = $("#lapsed-templates");
  $("#lapsed-template-add").addEventListener("click", () => {
    if (list.children.length >= 10) return;
    list.insertAdjacentHTML("beforeend", templateRow({}, list.children.length + Date.now()));
  });
  list.addEventListener("click", (e) => {
    if (e.target.closest("[data-template-remove]") && list.children.length > 1) e.target.closest(".lapsed-template").remove();
  });
}
function templateChooser(client, away) {
  const s = lapsedSettingsData();
  return `<label for="field-template_id">${OrbitI18n.t("lapsedTemplate")}</label><select id="field-template_id" name="template_id">${s.templates.map((t) => `<option value="${escape(t.id)}">${escape(t.title)}</option>`).join("")}</select>${client ? `<p class="hint">${OrbitI18n.t("lapsedPreview")}:</p><blockquote class="lapsed-preview" id="lapsed-preview"></blockquote>` : ""}`;
}
function lapsedInviteModal(id) {
  const row = lapsedClients().find((r) => r.client.id === id),
    c = row?.client || data.clients.find((x) => x.id === id);
  if (!c) return;
  modal(
    `${OrbitI18n.t("lapsedInvite")}: ${c.name}`,
    templateChooser(c, row?.away),
    async (v) => {
      await window.orbit.call("lapsed:invite", { id, template_id: v.template_id });
      toast(OrbitI18n.t("lapsedSent"));
    },
    OrbitI18n.t("lapsedSend"),
  );
  const preview = () => {
    const t = lapsedSettingsData().templates.find((x) => x.id === $("#field-template_id").value);
    if (t) $("#lapsed-preview").textContent = lapsedFill(t, c, row?.away);
  };
  $("#field-template_id").addEventListener("change", preview);
  preview();
}
function reviewsRow() {
  const r = data.reviews || {},
    on = Boolean(r.enabled);
  return integrationRow({
    icon: "★",
    name: OrbitI18n.t("reviewsName"),
    on,
    status: OrbitI18n.t(on ? "reviewsOn" : "reviewsOff"),
    short: OrbitI18n.t("reviewsShort"),
    controls: !can("clients") ? "" : `<button class="${on ? "secondary" : "primary"}" data-action="reviews-setup">${OrbitI18n.t("reviewsSetup")}</button>`,
    more: `<p>${OrbitI18n.t("reviewsNeedBot")}</p>`,
  });
}
Object.assign(actions, {
  "reviews-setup": () => {
    const r = data.reviews || {};
    modal(
      OrbitI18n.t("reviewsName"),
      `<p class="hint">${OrbitI18n.t("reviewsShort")}</p>` + field(OrbitI18n.t("reviewsUrl"), "url", "url", `maxlength="500" placeholder="https://g.page/r/…" value="${escape(r.url || "")}"`) + `<p class="hint">${OrbitI18n.t("reviewsHow")}</p><label class="checkbox-line"><input type="checkbox" name="enabled" ${r.enabled ? "checked" : ""}>${OrbitI18n.t("reviewsEnable")}</label><p class="hint">${OrbitI18n.t("reviewsNeedBot")}</p>`,
      async (v) => {
        await window.orbit.call("reviews:save", { url: v.url, enabled: v.enabled === "on" });
        toast(OrbitI18n.t("m361"));
      },
    );
  },
  "lapsed-settings": lapsedSettingsModal,
  "lapsed-invite-all": () => {
    const ready = lapsedReady(lapsedClients()).length;
    if (!ready) return toast(OrbitI18n.t("lapsedNobodyToInvite"));
    modal(
      OrbitI18n.t("lapsedInviteAll"),
      `<p>${OrbitI18n.t("lapsedInviteAllAsk").replace("{count}", ready)}</p>` + templateChooser(),
      async (v) => {
        const result = await window.orbit.call("lapsed:invite-all", { template_id: v.template_id });
        toast(OrbitI18n.t("lapsedInviteAllDone").replace("{count}", result.sent));
      },
      OrbitI18n.t("lapsedSend"),
    );
  },
});
