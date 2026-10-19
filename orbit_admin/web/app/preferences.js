"use strict";
(function () {
  const i18n = globalThis.OrbitI18n;
  const bridge = window.orbit || window.owner,
    channel = window.owner ? "owner:appearance" : "appearance:set";
  function apply() {
    document.documentElement.lang = i18n.language;
    for (const el of document.querySelectorAll("[data-i18n]"))
      el.textContent = i18n.t(el.dataset.i18n);
    for (const attr of ["aria-label", "placeholder"])
      for (const el of document.querySelectorAll(`[data-i18n-${attr}]`))
        el.setAttribute(attr, i18n.t(el.getAttribute(`data-i18n-${attr}`)));
  }
  let theme;
  try {
    theme = localStorage.getItem("orbit.theme");
  } catch {}
  if (!["light", "dark"].includes(theme))
    theme = matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  function setTheme(value) {
    theme = value;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("orbit.theme", theme);
    for (const b of document.querySelectorAll("[data-theme-choice]"))
      b.setAttribute("aria-pressed", String(b.dataset.themeChoice === theme));
    bridge.call(channel, { language: i18n.language, theme }).catch(() => {});
  }
  apply();
  setTheme(theme);

  function setLanguage(value) {
    i18n.setLanguage(value);
    localStorage.setItem("orbit.language", i18n.language);
    bridge
      .call(channel, { language: i18n.language, theme, reload: true })
      .catch(() => {});
  }
  // Theme and language live in Settings; the controls are rendered by the settings page.
  document.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-theme-choice]");
    if (choice) setTheme(choice.dataset.themeChoice);
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "language-choice") setLanguage(event.target.value);
  });
  window.OrbitPreferences = {
    get theme() {
      return theme;
    },
    setTheme,
    setLanguage,
  };
})();
