"use strict";
// Who does which service and who works on which day. Shared by the store (booking, bot,
// website) and the window (grid, dashboard) so every place answers the same way.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitStaff = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DAY = 86400000;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const weekday = (date) => new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  const daysBetween = (from, to) =>
    Math.round(
      (Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / DAY,
    );
  // A schedule is null (every opening day), {days:[1..7]} or {on, off, from} (e.g. 2 on / 2 off).
  function normalize(value) {
    if (value == null || value === "") return null;
    const s = typeof value === "string" ? JSON.parse(value) : value;
    if (Array.isArray(s.days)) {
      const days = [...new Set(s.days.map(Number))].filter(
        (d) => Number.isInteger(d) && d >= 1 && d <= 7,
      );
      if (!days.length) throw Error("Schedule needs at least one working day");
      return { days: days.sort() };
    }
    const on = Number(s.on),
      off = Number(s.off);
    if (
      !Number.isInteger(on) ||
      !Number.isInteger(off) ||
      on < 1 ||
      off < 1 ||
      on > 14 ||
      off > 14 ||
      !datePattern.test(s.from || "")
    )
      throw Error("Invalid shift pattern");
    return { on, off, from: s.from };
  }
  function scheduled(schedule, date) {
    const s = normalize(schedule);
    if (!s) return true;
    if (s.days) return s.days.includes(weekday(date));
    const cycle = s.on + s.off,
      n = daysBetween(s.from, date);
    return ((n % cycle) + cycle) % cycle < s.on;
  }
  function absent(absences, resourceId, date) {
    return (absences || []).some(
      (a) =>
        a.resource_id === resourceId &&
        a.start_date <= date &&
        date <= a.end_date,
    );
  }
  // resource: {id, schedule}; absences: [{resource_id, start_date, end_date}]
  function works(resource, date, absences) {
    return (
      Boolean(resource) &&
      scheduled(resource.schedule, date) &&
      !absent(absences, resource.id, date)
    );
  }
  // service.resource_ids empty means "anyone can do it" (the behaviour before this setting).
  function capable(service, resourceId) {
    const ids = service?.resource_ids || [];
    return !ids.length || ids.includes(resourceId);
  }
  return { normalize, scheduled, works, capable, weekday };
});
