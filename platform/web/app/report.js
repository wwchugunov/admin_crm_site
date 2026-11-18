"use strict";
// "Report in Excel": one .xlsx with company totals, each specialist and every visit of a period.
Object.assign(OrbitI18n.messages, {
  reportButton: { uk: "Звіт у Excel", en: "Excel report" },
  reportTitle: { uk: "Звіт у Excel", en: "Excel report" },
  reportHint: { uk: "Три аркуші: загальна статистика (дохід, записи, середній чек, завантаженість), співробітники та всі записи за період. Відкривається в Excel, Google Таблицях і LibreOffice; стовпці можна сортувати й фільтрувати.", en: "Three sheets: totals (income, visits, average bill, load), staff and every visit of the period. Opens in Excel, Google Sheets and LibreOffice; columns can be sorted and filtered." },
  reportPeriod: { uk: "Період", en: "Period" },
  reportDay: { uk: "День", en: "Day" },
  reportWeek: { uk: "Тиждень", en: "Week" },
  reportMonth: { uk: "Місяць", en: "Month" },
  reportCustom: { uk: "Свої дати", en: "Custom dates" },
  reportFrom: { uk: "З", en: "From" },
  reportTo: { uk: "По (включно)", en: "To (inclusive)" },
  reportDownload: { uk: "Завантажити .xlsx", en: "Download .xlsx" },
  reportDone: { uk: "Звіт завантажено", en: "Report downloaded" },
  reportInvalid: { uk: "Перевірте дати: кінець не раніше за початок, не більше 400 днів", en: "Check the dates: the end not before the start, at most 400 days" },
});
const reportShift = (date, days) => new Date(Date.parse(date + "T12:00:00Z") + days * 86400000).toISOString().slice(0, 10);
// [first, last] days of the chosen period around a date, in the company's calendar.
function reportRange(kind, date) {
  if (kind === "day") return [date, date];
  if (kind === "week") {
    const weekday = new Date(date + "T12:00:00Z").getUTCDay() || 7,
      monday = reportShift(date, 1 - weekday);
    return [monday, reportShift(monday, 6)];
  }
  const first = date.slice(0, 8) + "01",
    next = new Date(Date.parse(first + "T12:00:00Z"));
  next.setUTCMonth(next.getUTCMonth() + 1);
  return [first, reportShift(next.toISOString().slice(0, 10), -1)];
}
function reportModal() {
  const today = businessDate(Date.now()),
    [first, last] = reportRange("month", today),
    kinds = [["day", "reportDay"], ["week", "reportWeek"], ["month", "reportMonth"], ["custom", "reportCustom"]];
  modal(
    OrbitI18n.t("reportTitle"),
    `<p class="hint">${OrbitI18n.t("reportHint")}</p>` +
      `<fieldset class="report-kinds"><legend>${OrbitI18n.t("reportPeriod")}</legend>${kinds.map(([k, label]) => `<label class="chip"><input type="radio" name="report_kind" value="${k}" ${k === "month" ? "checked" : ""}><span>${OrbitI18n.t(label)}</span></label>`).join("")}</fieldset>` +
      `<div class="form-grid"><div>${field(OrbitI18n.t("reportFrom"), "report_from", "date", `required value="${first}"`)}</div><div>${field(OrbitI18n.t("reportTo"), "report_to", "date", `required value="${last}"`)}</div></div>`,
    async (v) => {
      const from = v.report_from,
        to = v.report_to;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "") || !/^\d{4}-\d{2}-\d{2}$/.test(to || "") || to < from || (Date.parse(to) - Date.parse(from)) / 86400000 > 400)
        throw Error(OrbitI18n.t("reportInvalid"));
      await window.orbit.call("report", timestamp(`${from}T00:00`), timestamp(`${reportShift(to, 1)}T00:00`));
      toast(OrbitI18n.t("reportDone"));
    },
    OrbitI18n.t("reportDownload"),
  );
  // Day / week / month fill both dates around the start date; editing a date switches to custom.
  const form = $("#modal-fields");
  form.addEventListener("change", (e) => {
    if (e.target.name === "report_kind" && e.target.value !== "custom") {
      // Switching the kind means "the current day / week / month"; another one is picked by its start date.
      const [a, b] = reportRange(e.target.value, today);
      $("#field-report_from").value = a;
      $("#field-report_to").value = b;
    } else if (["report_from", "report_to"].includes(e.target.name)) {
      const kind = form.querySelector('[name="report_kind"]:checked')?.value;
      if (e.target.name === "report_from" && kind && kind !== "custom") {
        const [a, b] = reportRange(kind, e.target.value);
        $("#field-report_from").value = a;
        $("#field-report_to").value = b;
      } else form.querySelector('[name="report_kind"][value="custom"]').checked = true;
    }
  });
}
Object.assign(actions, { "report-xlsx": reportModal });
