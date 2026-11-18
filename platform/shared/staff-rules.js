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
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  // Own working hours and a break, all optional: {start:"10:00", end:"18:00", break_start, break_end}.
  // Without them the person works the company's opening hours.
  function hours(s) {
    const out = {};
    if (s.start || s.end) {
      if (!timePattern.test(s.start || "") || !timePattern.test(s.end || "") || s.end <= s.start)
        throw Error("Invalid working hours");
      Object.assign(out, { start: s.start, end: s.end });
    }
    if (s.break_start || s.break_end) {
      if (!timePattern.test(s.break_start || "") || !timePattern.test(s.break_end || "") || s.break_end <= s.break_start)
        throw Error("Invalid break");
      Object.assign(out, { break_start: s.break_start, break_end: s.break_end });
    }
    return out;
  }
  // A schedule is null (every opening day), {days:[1..7]} or {on, off, from} (e.g. 2 on / 2 off),
  // each optionally with own hours and a break (see hours()); hours alone mean every opening day.
  function normalize(value) {
    if (value == null || value === "") return null;
    const s = typeof value === "string" ? JSON.parse(value) : value;
    const own = hours(s);
    if (!Array.isArray(s.days) && s.on == null && s.off == null)
      return Object.keys(own).length ? own : null;
    if (Array.isArray(s.days)) {
      const days = [...new Set(s.days.map(Number))].filter(
        (d) => Number.isInteger(d) && d >= 1 && d <= 7,
      );
      if (!days.length) throw Error("Schedule needs at least one working day");
      return { days: days.sort(), ...own };
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
    return { on, off, from: s.from, ...own };
  }
  function scheduled(schedule, date) {
    const s = normalize(schedule);
    if (!s) return true;
    if (s.days) return s.days.includes(weekday(date));
    if (s.on == null) return true;
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
  // The person's hours on a working day: own hours or the company's, and the break if set.
  function dayHours(resource, company) {
    let s = null;
    try { s = normalize(resource?.schedule); } catch { s = null; }
    return {
      start: s?.start || company.start,
      end: s?.end || company.end,
      breaks: s?.break_start ? [[s.break_start, s.break_end]] : [],
    };
  }
  return { normalize, scheduled, works, capable, weekday, dayHours };
});
