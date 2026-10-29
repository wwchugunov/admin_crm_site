const OrbitI18n =
  typeof module === "object" && module.exports
    ? require("./i18n.js")
    : globalThis.OrbitI18n;
const Staff =
  typeof module === "object" && module.exports
    ? require("../../shared/staff-rules.js")
    : globalThis.OrbitStaff;
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrbitAnalytics = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function localDate(value, timezone) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value));
  }
  function zoned(date, time, timezone) {
    const target = Date.parse(`${date}T${time}:00Z`);
    let result = target;
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    for (let i = 0; i < 4; i++) {
      const p = Object.fromEntries(
        formatter
          .formatToParts(new Date(result))
          .filter((p) => p.type !== "literal")
          .map((p) => [p.type, Number(p.value)]),
      );
      const delta =
        target - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
      if (!delta) return result;
      result += delta;
    }
    return result;
  }
  function nextDate(date) {
    return new Date(Date.parse(date + "T12:00:00Z") + 86400000)
      .toISOString()
      .slice(0, 10);
  }
  function period(mode, value, timezone) {
    let first, last;
    if (mode === "day" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      first = value;
      last = nextDate(first);
      if (last <= first) throw Error(OrbitI18n.t("m503"));
    } else if (mode === "month" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      first = value + "-01";
      const y = Number(value.slice(0, 4)),
        m = Number(value.slice(5));
      last = `${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, "0")}-01`;
    } else if (
      mode === "year" &&
      /^\d{4}$/.test(value) &&
      Number(value) >= 2000 &&
      Number(value) <= 2100
    ) {
      first = value + "-01-01";
      last = String(Number(value) + 1) + "-01-01";
    } else throw Error(OrbitI18n.t("m504"));
    if (new Date(first + "T12:00:00Z").toISOString().slice(0, 10) !== first)
      throw Error(OrbitI18n.t("m503"));
    const start = zoned(first, "00:00", timezone),
      end = zoned(last, "00:00", timezone),
      buckets = [];
    if (mode === "day") {
      for (let t = start; t < end; t += 3600000)
        buckets.push({
          key: String(t),
          label: new Intl.DateTimeFormat(OrbitI18n.locale(), {
            timeZone: timezone,
            hour: "2-digit",
            minute: "2-digit",
          }).format(t),
          start: t,
          end: Math.min(end, t + 3600000),
        });
    } else if (mode === "month") {
      for (let day = first; day < last; day = nextDate(day))
        buckets.push({
          key: day,
          label: day.slice(8),
          start: zoned(day, "00:00", timezone),
          end: zoned(nextDate(day), "00:00", timezone),
        });
    } else {
      for (let m = 1; m <= 12; m++) {
        const day = `${value}-${String(m).padStart(2, "0")}-01`,
          next =
            m === 12 ? last : `${value}-${String(m + 1).padStart(2, "0")}-01`;
        buckets.push({
          key: day.slice(0, 7),
          label: new Intl.DateTimeFormat(OrbitI18n.locale(), {
            timeZone: "UTC",
            month: "short",
          }).format(new Date(day + "T12:00:00Z")),
          start: zoned(day, "00:00", timezone),
          end: zoned(next, "00:00", timezone),
        });
      }
    }
    return { first, last, start, end, buckets };
  }
  function unionMinutes(intervals) {
    intervals.sort((a, b) => a[0] - b[0]);
    let total = 0,
      start,
      end;
    for (const pair of intervals) {
      if (start === undefined) {
        [start, end] = pair;
      } else if (pair[0] > end) {
        total += end - start;
        [start, end] = pair;
      } else end = Math.max(end, pair[1]);
    }
    return (total + (start === undefined ? 0 : end - start)) / 60000;
  }
  function dashboard(data, mode, value) {
    const timezone = data.timezone || "Europe/Kyiv",
      range = period(mode, value, timezone),
      financial = can("money");
    const buckets = range.buckets.map((b) => ({
      ...b,
      bookings: 0,
      people: 0,
      busy_minutes: 0,
      capacity_minutes: 0,
      income: financial ? 0 : null,
    }));
    const resources = data.resources || [],
      active = (data.appointments || []).filter(
        (a) => a.status === "confirmed" || a.status === "completed",
      );
    const byResource = new Map(resources.map((r) => [r.id, []]));
    for (const a of active)
      for (const id of new Set(
        (a.resources || [{ id: a.resource_id }]).map((r) => r.id),
      ))
        if (byResource.has(id)) byResource.get(id).push(a);
    const services = new Map();
    let bookings = 0,
      people = 0,
      received = 0,
      refunds = 0;
    for (const a of active) {
      const bucket = buckets.find((b) => a.start >= b.start && a.start < b.end);
      if (!bucket) continue;
      bucket.bookings++;
      bucket.people += Number(a.people_count || 1);
      bookings++;
      people += Number(a.people_count || 1);
      if (!services.has(a.service_id))
        services.set(a.service_id, {
          id: a.service_id,
          name: a.service_name || OrbitI18n.t("m275"),
          bookings: 0,
          people: 0,
        });
      const row = services.get(a.service_id);
      row.bookings++;
      row.people += Number(a.people_count || 1);
    }
    for (let day = range.first; day < range.last; day = nextDate(day)) {
      const weekday = new Date(day + "T12:00:00Z").getUTCDay() || 7;
      if (!(data.work_days || [1, 2, 3, 4, 5, 6, 7]).includes(weekday))
        continue;
      const opening = zoned(day, data.work_start || "09:00", timezone),
        closing = zoned(day, data.work_end || "18:00", timezone);
      for (const b of buckets) {
        const start = Math.max(opening, b.start),
          end = Math.min(closing, b.end);
        if (end <= start) continue;
        // Only people on shift that day count as available time.
        const staff = Staff
          ? resources.filter((r) => Staff.works(r, day, data.absences)).length
          : resources.length;
        b.capacity_minutes += ((end - start) / 60000) * staff;
        for (const appointments of byResource.values()) {
          const intervals = appointments
            .filter((a) => a.start < end && a.end > start)
            .map((a) => [Math.max(a.start, start), Math.min(a.end, end)]);
          b.busy_minutes += unionMinutes(intervals);
        }
      }
    }
    if (financial)
      for (const payment of data.payments || []) {
        const b = buckets.find(
          (b) => payment.at >= b.start && payment.at < b.end,
        );
        if (!b) continue;
        const amount = Number(payment.amount);
        b.income += amount;
        if (amount >= 0) received += amount;
        else refunds -= amount;
      }
    for (const b of buckets)
      b.occupancy = b.capacity_minutes
        ? (b.busy_minutes / b.capacity_minutes) * 100
        : null;
    const busy_minutes = buckets.reduce((s, b) => s + b.busy_minutes, 0),
      capacity_minutes = buckets.reduce((s, b) => s + b.capacity_minutes, 0);
    return {
      mode,
      value,
      timezone,
      financial,
      buckets,
      bookings,
      people,
      busy_minutes,
      capacity_minutes,
      occupancy: capacity_minutes
        ? (busy_minutes / capacity_minutes) * 100
        : null,
      income: financial ? received - refunds : null,
      received: financial ? received : null,
      refunds: financial ? refunds : null,
      services: [...services.values()].sort(
        (a, b) =>
          b.bookings - a.bookings ||
          b.people - a.people ||
          a.name.localeCompare(b.name),
      ),
    };
  }
  return { dashboard, period, localDate };
});
