"use strict";
window.OrbitWelcome = (() => {
  let step = 0;
  const t = (key) => OrbitI18n.t(key);
  function visual() {
    const items =
      step === 0
        ? [
            ["calendar", t("welcomeVisualSchedule")],
            ["customers", t("welcomeVisualCustomers")],
            ["services", t("welcomeVisualServices")],
          ]
        : step === 1
          ? [
              ["phone", t("welcomeVisualPhone")],
              ["check", t("welcomeVisualAvailability")],
              ["booking", t("welcomeVisualBooking")],
            ]
          : [
              ["telegram", "Telegram"],
              ["biz", "LOMVIKO"],
              ["server", t("welcomeVisualHosting")],
            ];
    return `<div class="welcome-visual" aria-hidden="true">${items
      .map(
        ([icon, label], index) =>
          `${index ? '<span class="welcome-visual-arrow">→</span>' : ""}<span class="welcome-visual-card"><span class="welcome-visual-icon welcome-visual-icon-${icon}"></span><b>${label}</b></span>`,
      )
      .join("")}</div>`;
  }
  function preview() {
    const contents =
      step === 0
        ? `<div class="welcome-example-row"><b>10:00</b><span>${t("welcomeSampleService")}</span><span>✓</span></div><div class="welcome-example-row"><b>11:00</b><span>${t("welcomeSampleClient")}</span><span>✓</span></div>`
        : step === 1
          ? `<div class="welcome-example-row"><span>${t("welcomeSampleClient")}<small>+380 67 000 00 00</small></span><b>→</b><span>${t("welcomeSampleService")}<small>12:00 — 12:30</small></span></div>`
          : `<div class="welcome-example-row"><span>☁ ${t("botHosted")}</span><span>▣ ${t("botExternal")}</span></div>`;
    return `<div class="welcome-preview"><div class="welcome-preview-heading"><strong>LOMVIKO</strong><span>${t("welcomePreview")}</span></div>${contents}</div>`;
  }
  function show() {
    const keys = [
      ["welcomeTitle", "welcomeBody"],
      ["welcomeBookingTitle", "welcomeBookingBody"],
      ["welcomeBotTitle", "welcomeBotBody"],
    ];
    const [title, body] = keys[step];
    modal(
      OrbitI18n.t(title),
      `<div class="welcome-demo"><span class="welcome-step">${step + 1} / 3</span>${visual()}${preview()}<p>${OrbitI18n.t(body)}</p></div>` +
        (step === 2
          ? ""
          : `<button type="button" class="link-button welcome-skip" data-action="welcome-skip">${OrbitI18n.t("welcomeSkip")}</button>`),
      async () => {
        if (step < 2) {
          step++;
          setTimeout(show, 0);
        }
      },
      step < 2 ? OrbitI18n.t("welcomeNext") : OrbitI18n.t("welcomeDone"),
    );
    modalNeedsConnection = false;
  }
  return {
    start() {
      localStorage.setItem("biz.welcome.seen", "1");
      step = 0;
      show();
    },
  };
})();
