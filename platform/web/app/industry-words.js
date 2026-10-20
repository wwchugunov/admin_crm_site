"use strict";
// The app speaks the words of the company's business type (patients and doctors for a clinic, and so on).
// The type is remembered per browser, so the words are right before the first screen is drawn;
// app.js reloads once when the company's type turns out to be different.
(function () {
  let type = "beauty";
  try {
    type = localStorage.getItem("orbit.industry") || "beauty";
  } catch {}
  OrbitIndustries.apply(OrbitI18n.messages, type);
  // Feature scripts loaded later add their own texts; the words are idempotent, so they are applied once more.
  document.addEventListener("DOMContentLoaded", () => OrbitIndustries.apply(OrbitI18n.messages, type));
  window.OrbitIndustryWords = {
    type,
    // Called with every new snapshot; true means the page reloads to switch the words.
    follow(next) {
      if (!next || next === type) return false;
      const was = OrbitIndustries.find(type),
        now = OrbitIndustries.find(next);
      try {
        localStorage.setItem("orbit.industry", next);
      } catch {
        return false;
      }
      if (was.client === now.client && was.specialist === now.specialist && was.place === now.place) return false;
      location.reload();
      return true;
    },
  };
})();
