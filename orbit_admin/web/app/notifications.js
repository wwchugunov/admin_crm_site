"use strict";
// Налаштування → Сповіщення: the owner and administrators link their own Telegram to the company
// bot and choose what arrives — a morning summary, news about online bookings, cancellations and
// payments, weekly and monthly reports. Email is an option. Runs on the LOMVIKO server, so the
// messages come even when this computer is off.
function settingsNotifications() {
  const n = data.integrations.notifications;
  if (data.mode !== "server")
    return settingsGroup(
      "",
      `<p class="hint">${OrbitI18n.t("notifyNeedsServer")}</p>`,
    );
  if (!n)
    return settingsGroup(
      "",
      `<p class="hint">${OrbitI18n.t("notifyOwnersOnly")}</p>`,
    );
  const p = n.prefs,
    box = (key, label, hint = "") =>
      settingRow(
        label,
        `<input type="checkbox" data-action="notify-pref" data-key="${key}" ${p[key] ? "checked" : ""} aria-label="${escape(label)}">`,
        hint,
      );
  const times = [];
  for (let h = 5; h <= 12; h++)
    for (const m of ["00", "30"]) {
      const t = `${String(h).padStart(2, "0")}:${m}`;
      times.push(
        `<option ${t === p.morning_time ? "selected" : ""}>${t}</option>`,
      );
    }
  const telegram = n.telegram
    ? `<span class="setting-value">${OrbitI18n.t("notifyLinked")}</span><button type="button" class="secondary" data-action="notify-unlink">${OrbitI18n.t("m221")}</button>`
    : n.bot
      ? `<button type="button" class="primary" data-action="notify-link">${OrbitI18n.t("notifyLink")}</button>`
      : `<span class="setting-value">${OrbitI18n.t("notifyNoBot")}</span>`;
  return (
    settingsGroup(
      OrbitI18n.t("notifyWhere"),
      settingRow(
        "Telegram",
        telegram,
        n.telegram
          ? OrbitI18n.t("notifyLinkedHint").replace(
              "{bot}",
              "@" + (n.bot || ""),
            )
          : OrbitI18n.t("notifyLinkHint"),
      ) +
        settingRow(
          OrbitI18n.t("notifyEmail"),
          `<input type="checkbox" data-action="notify-pref" data-key="email" ${p.email ? "checked" : ""} ${n.mail ? "" : "disabled"} aria-label="${escape(OrbitI18n.t("notifyEmail"))}">`,
          n.mail ? escape(n.email) : OrbitI18n.t("notifyNoMail"),
        ),
    ) +
    settingsGroup(
      OrbitI18n.t("notifyWhat"),
      settingRow(
        OrbitI18n.t("notifyMorning"),
        `<select id="notify-time" aria-label="${escape(OrbitI18n.t("notifyMorningTime"))}" ${p.morning ? "" : "disabled"}>${times.join("")}</select><input type="checkbox" data-action="notify-pref" data-key="morning" ${p.morning ? "checked" : ""} aria-label="${escape(OrbitI18n.t("notifyMorning"))}">`,
        OrbitI18n.t("notifyMorningHint"),
      ) +
        box(
          "booking",
          OrbitI18n.t("notifyBooking"),
          OrbitI18n.t("notifyBookingHint"),
        ) +
        box("cancel", OrbitI18n.t("notifyCancel")) +
        box("payment", OrbitI18n.t("notifyPayment")) +
        box(
          "weekly",
          OrbitI18n.t("notifyWeekly"),
          OrbitI18n.t("notifyWeeklyHint"),
        ) +
        box(
          "monthly",
          OrbitI18n.t("notifyMonthly"),
          OrbitI18n.t("notifyMonthlyHint"),
        ),
      `<button type="button" class="secondary" data-action="notify-test">${OrbitI18n.t("notifyTest")}</button>`,
    )
  );
}
async function saveNotify(change) {
  data.integrations.notifications = await window.orbit.call(
    "notify:save",
    change,
  );
  render();
}
Object.assign(actions, {
  "notify-pref": (b) => saveNotify({ [b.dataset.key]: b.checked }),
  "notify-link": async () => {
    await window.orbit.call("notify:link");
    toast(OrbitI18n.t("notifyLinkOpened"));
    // The bot confirms in Telegram; the status here follows within a few seconds.
    let tries = 0;
    const watch = setInterval(async () => {
      if (++tries > 40 || page !== "settings") return clearInterval(watch);
      await refresh({ preserveView: true }).catch(() => {});
      if (data.integrations.notifications?.telegram) {
        clearInterval(watch);
        render();
        toast(OrbitI18n.t("notifyLinkedToast"));
      }
    }, 3000);
  },
  "notify-unlink": async () => {
    data.integrations.notifications = await window.orbit.call("notify:unlink");
    render();
  },
  "notify-test": async () => {
    await window.orbit.call("notify:test");
    toast(OrbitI18n.t("notifyTestSent"));
  },
});
document.addEventListener("change", (event) => {
  if (event.target.id === "notify-time")
    run(() => saveNotify({ morning_time: event.target.value }));
});
