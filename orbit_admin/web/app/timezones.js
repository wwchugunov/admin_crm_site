"use strict";
// Time zones for the profile and the booking form. Offsets come from the system's time-zone
// database, so summer/winter time changes are always applied for the exact date.
window.OrbitZones = (() => {
  const popular = [
    "Europe/Kyiv",
    "Europe/Warsaw",
    "Europe/Berlin",
    "Europe/Prague",
    "Europe/Vilnius",
    "Europe/Bucharest",
    "Europe/Istanbul",
    "Europe/London",
    "Europe/Lisbon",
    "America/New_York",
    "America/Toronto",
    "Asia/Dubai",
    "Asia/Tbilisi",
  ];
  function all() {
    let zones = [];
    try {
      zones = Intl.supportedValuesOf("timeZone");
    } catch {}
    // Some systems still list the old spelling; show one Kyiv entry.
    zones = zones.filter((z) => z !== "Europe/Kiev");
    return [...popular, ...zones.filter((z) => !popular.includes(z))];
  }
  // Minutes east of UTC for a zone at a moment.
  function offset(zone, at = Date.now()) {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: zone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(at)
        .filter((x) => x.type !== "literal")
        .map((x) => [x.type, Number(x.value)]),
    );
    return Math.round(
      (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute) -
        Math.floor(at / 60000) * 60000) /
        60000,
    );
  }
  function label(zone, at = Date.now()) {
    const m = offset(zone, at),
      sign = m < 0 ? "−" : "+",
      h = Math.floor(Math.abs(m) / 60),
      min = Math.abs(m) % 60;
    return `UTC${sign}${h}${min ? ":" + String(min).padStart(2, "0") : ""}`;
  }
  // "summer", "winter" or "" for zones without seasonal change.
  function season(zone, at = Date.now()) {
    const year = new Date(at).getUTCFullYear(),
      jan = offset(zone, Date.UTC(year, 0, 15)),
      jul = offset(zone, Date.UTC(year, 6, 15));
    if (jan === jul) return "";
    return offset(zone, at) === Math.max(jan, jul) ? "summer" : "winter";
  }
  function options(selected) {
    const zones = all();
    if (selected && !zones.includes(selected)) zones.unshift(selected);
    return zones
      .map(
        (z, i) =>
          `${i === popular.length ? "<option disabled>──────────</option>" : ""}<option value="${z}" ${z === selected ? "selected" : ""}>${z.replace(/_/g, " ")} (${label(z)})</option>`,
      )
      .join("");
  }
  function clock(zone, at) {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: zone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(at);
  }
  return { all, offset, label, season, options, clock };
})();
