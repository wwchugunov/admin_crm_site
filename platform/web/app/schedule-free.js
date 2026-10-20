"use strict";
// The day list on a phone: visits plus the free windows between them for each specialist on shift,
// each with a button that opens a new booking at that time. Phones open the list by default.
Object.assign(OrbitI18n.messages, {
  freeWindow: { uk: "Вільно", en: "Free" },
  freeBook: { uk: "Записати", en: "Book" },
});
const FREE_MIN = 30;
function freeWindows(rows) {
  const today = businessDate(Date.now());
  if (selectedDate < today || data.role === "staff" && !data.resources.length) return [];
  const weekday = ((new Date(`${selectedDate}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
  if (Array.isArray(data.work_days) && data.work_days.length && !data.work_days.map(Number).includes(weekday)) return [];
  const from = timestamp(`${selectedDate}T${data.work_start || "09:00"}`),
    to = timestamp(`${selectedDate}T${data.work_end || "20:00"}`),
    now = Date.now(),
    out = [];
  for (const r of data.resources) {
    if (!OrbitStaff.works(r, selectedDate, data.absences || [])) continue;
    const busy = rows
      .filter((a) => !["cancelled", "no_show"].includes(a.status) && (a.resources?.length ? a.resources.some((x) => x.id === r.id) : a.resource_id === r.id))
      .map((a) => [a.start, a.end])
      .sort((x, y) => x[0] - y[0]);
    let cursor = Math.max(from, selectedDate === today ? Math.ceil(now / 900000) * 900000 : from);
    for (const [s, e] of [...busy, [to, to]]) {
      if (s - cursor >= FREE_MIN * 60000) out.push({ start: cursor, end: Math.min(s, to), resource: r });
      cursor = Math.max(cursor, e);
      if (cursor >= to) break;
    }
  }
  return out;
}
function agendaWithFree(rows) {
  const items = [...rows.map((a) => ({ at: a.start, html: scheduleAppointment(a) })), ...freeWindows(rows).map((f) => ({ at: f.start, html: `<div class="agenda-free"><span class="agenda-free-time">${time(f.start)}–${time(f.end)}</span><span class="agenda-free-who">${OrbitI18n.t("freeWindow")}${data.resources.length > 1 ? ` · ${escape(f.resource.name)}` : ""}</span><button class="secondary" data-action="free-book" data-time="${time(f.start)}" data-resource="${escape(f.resource.id)}">＋ ${OrbitI18n.t("freeBook")}</button></div>` }))];
  return items.sort((x, y) => x.at - y.at).map((i) => i.html).join("");
}
Object.assign(actions, {
  "free-book": (b) => bookingModal({ date: selectedDate, time: b.dataset.time, resourceId: b.dataset.resource }),
});
