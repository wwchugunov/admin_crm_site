"use strict";
function profileFields() {
  const form = $("#settings-form");
  form.insertAdjacentHTML(
    "beforeend",
    `<div class="profile-extra">${profileInputs(data)}<button class="primary mt" type="submit">${OrbitI18n.t("m038")}</button></div>`,
  );
}
function profileInputs(p) {
  return `<div class="logo-row">${selectedLogo || p.logo ? `<img class="logo-preview" alt="${OrbitI18n.t("m039")}" src="${escape(selectedLogo || p.logo)}">` : ""}<button class="secondary" type="button" data-action="logo">${OrbitI18n.t("m053")}</button><span class="hint">${OrbitI18n.t("m054")}</span></div><div class="form-grid"><div>${field(OrbitI18n.t("m040"), "phone", "tel", `value="${escape(p.phone || "")}" maxlength="40"`)}</div><div>${field(OrbitI18n.t("m041"), "currency", "text", `required maxlength="3" value="${escape(p.currency || "UAH")}"`)}</div></div>${field(OrbitI18n.t("m042"), "address", "text", `value="${escape(p.address || "")}" maxlength="500"`)}<label for="field-timezone">${OrbitI18n.t("m043")}</label><select id="field-timezone" name="timezone" required>${OrbitZones.options(p.timezone || "Europe/Kyiv")}</select><p class="hint">${OrbitI18n.t("zoneHint")}</p><div class="form-grid"><div>${field(OrbitI18n.t("m044"), "work_start", "time", `required value="${p.work_start || "09:00"}"`)}</div><div>${field(OrbitI18n.t("m045"), "work_end", "time", `required value="${p.work_end || "18:00"}"`)}</div></div><label>${OrbitI18n.t("m055")}</label><div class="work-days">${[OrbitI18n.t("m046"), OrbitI18n.t("m047"), OrbitI18n.t("m048"), OrbitI18n.t("m049"), OrbitI18n.t("m050"), OrbitI18n.t("m051"), OrbitI18n.t("m052")].map((name, i) => `<label class="chip"><input type="checkbox" name="work_days" value="${i + 1}" ${(p.work_days || [1, 2, 3, 4, 5, 6, 7]).includes(i + 1) ? "checked" : ""}><span>${name}</span></label>`).join("")}</div><label class="checkbox-line"><input type="checkbox" name="website_enabled" value="1" ${p.website_enabled ? "checked" : ""}>${OrbitI18n.t("m056")}</label><p class="hint">${OrbitI18n.t("m057")}</p>`;
}
function profileValues(form) {
  const values = Object.fromEntries(form);
  values.work_days = form.getAll("work_days").map(Number);
  values.website_enabled = form.get("website_enabled") === "1";
  if (selectedLogo !== undefined) values.logo = selectedLogo;
  return values;
}
function field(label, name, type = "text", extras = "") {
  return `<label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" ${extras}>`;
}
function select(label, name, items) {
  return `<label for="field-${name}">${label}</label><select id="field-${name}" name="${name}" required>${items.map((i) => `<option value="${escape(i.id)}">${escape(i.name)}</option>`).join("")}</select>`;
}
function modal(title, html, submit, button = OrbitI18n.t("m271")) {
  modalNeedsConnection = true;
  $("#modal-title").textContent = title;
  $("#modal-fields").innerHTML = html;
  $("#modal-submit").textContent = button;
  $("#modal-submit").className = "primary";
  $("#modal").classList.toggle("readonly", button === OrbitI18n.t("close"));
  onSubmit = submit;
  $("#modal").showModal();
}
function closeModal() {
  // A message shown inside the window moves to the page, so "Saved" stays visible after the window closes.
  const note = $("#toast");
  if (note.parentElement === $("#modal")) {
    document.body.append(note);
    if (note.style.display === "block") {
      note.hidePopover?.();
      note.showPopover?.();
    }
  }
  $("#modal").close();
  $("#modal-form").reset();
  $("#modal-fields").innerHTML = "";
  onSubmit = null;
}
function bookingModal(options = {}) {
  if (!data.services.length || !data.resources.length) {
    toast(OrbitI18n.t("bookingSetupRequired"));
    return;
  }
  const service =
    data.services.find((s) => s.id === options.serviceId) || data.services[0];
  const chosen = options.resourceId
    ? [options.resourceId]
    : data.resources.slice(0, service.required_resources).map((r) => r.id);
  modal(
    OrbitI18n.t("m273"),
    bookingClientFields() +
      select(OrbitI18n.t("m275"), "service_id", data.services) +
      resourceChips(chosen) +
      `<div class="form-grid booking-when">` +
      `<div>${field(OrbitI18n.t("bookingDate"), "date", "date", `required value="${escape(options.date || selectedDate)}"`)}</div>` +
      `<div><label for="field-time">${OrbitI18n.t("bookingTime")}</label><select id="field-time" name="time" required></select></div></div>` +
      `<p class="hint booking-when-hint" id="booking-when-hint" role="status"></p>` +
      `<label for="field-client_zone">${OrbitI18n.t("zoneClient")}</label><select id="field-client_zone" name="client_zone">${OrbitZones.options(data.timezone)}</select>` +
      `<div class="form-grid">` +
      `<div id="booking-people" ${service.capacity > 1 ? "" : "hidden"}>` +
      field(
        OrbitI18n.t("bookingPeople"),
        "people_count",
        "number",
        `required min="1" max="${service.capacity}" value="1"`,
      ) +
      `<p class="hint">${OrbitI18n.t("bookingPeopleHint")}</p></div>` +
      `<div>${field(OrbitI18n.t("m280"), "total", "number", `required min="0" step="0.01" value="${service.price / 100}"`)}</div>` +
      "</div>" +
      field(OrbitI18n.t("m282"), "notes", "text", 'maxlength="2000"') +
      (options.waitId
        ? `<input type="hidden" name="wait_id" value="${escape(options.waitId)}">`
        : ""),
    async (values) => {
      const name = values.client_query.trim(),
        phone = values.new_client_phone.trim();
      if (name && phone.replace(/[^0-9]/g, "").length < 7)
        throw Error(OrbitI18n.t("bookingPhoneRequired"));
      const client_ids = Array.from(
        $("#field-client_ids").selectedOptions,
        (o) => o.value,
      );
      if (!client_ids.length && !name)
        throw Error(OrbitI18n.t("bookingClientRequired"));
      if (!name && phone) throw Error(OrbitI18n.t("bookingClientRequired"));
      if (name && /^[+\d\s().-]+$/.test(name))
        throw Error(OrbitI18n.t("bookingClientRequired"));
      const resource_ids = checkedResources();
      const service = data.services.find((s) => s.id === values.service_id);
      if (resource_ids.length < (service?.required_resources || 1))
        throw Error(OrbitI18n.t("bookingResourceRequired"));
      if (!/^\d{4}-\d{2}-\d{2}$/.test(values.date) || !values.time)
        throw Error(OrbitI18n.t("m285"));
      await window.orbit.call("booking:add", {
        ...values,
        resource_ids,
        client_ids,
        new_clients: name ? [{ name, phone }] : [],
        start: timestamp(`${values.date}T${values.time}`),
      });
      toast(OrbitI18n.t("m283"));
    },
  );
  if (options.clientId)
    for (const o of $("#field-client_ids").options)
      if (o.value === options.clientId) o.selected = true;
  if (options.serviceId) $("#field-service_id").value = service.id;
  setupBookingClients();
  syncBookingStaff(!options.resourceId);
  setupBookingTime(options.time);
}
// Booking form: hide people who do not do the service, mark those off that day, and
// pick working people automatically when the service changes.
function syncBookingStaff(autoPick) {
  const service = data.services.find(
      (x) => x.id === $("#field-service_id")?.value,
    ),
    date = $("#field-date")?.value || selectedDate;
  if (!service || !$("#field-resources")) return;
  const boxes = Array.from(
    document.querySelectorAll('#field-resources input[name="resource_ids"]'),
  );
  for (const box of boxes) {
    const person = data.resources.find((r) => r.id === box.value),
      can = OrbitStaff.capable(service, box.value),
      on = OrbitStaff.works(person, date, data.absences);
    const chip = box.closest(".chip");
    chip.hidden = !can;
    chip.classList.toggle("off", !on);
    chip.title = on ? "" : OrbitI18n.t("staffOffThatDay");
    if (!can) box.checked = false;
  }
  if (!autoPick) return;
  for (const box of boxes) box.checked = false;
  const usable = boxes.filter(
    (b) =>
      !b.closest(".chip").hidden &&
      !b.closest(".chip").classList.contains("off"),
  );
  for (const box of usable.slice(0, service.required_resources))
    box.checked = true;
}
function resourceChips(chosen) {
  return `<fieldset class="chip-group" id="field-resources"><legend>${OrbitI18n.t("m276")}</legend>${data.resources.map((r) => `<label class="chip"><input type="checkbox" name="resource_ids" value="${escape(r.id)}" ${chosen.includes(r.id) ? "checked" : ""}><span>${escape(r.name)}</span></label>`).join("")}</fieldset>`;
}
function checkedResources() {
  return Array.from(
    document.querySelectorAll(
      '#field-resources input[name="resource_ids"]:checked',
    ),
    (input) => input.value,
  );
}
// 15-minute slots for the chosen day, marking busy specialists, time outside
// the working schedule and the past. The schedule is advice, not a block:
// owners may still book overtime on purpose.
function bookingSlots() {
  const service =
    data.services.find((s) => s.id === $("#field-service_id")?.value) ||
    data.services[0];
  const date = $("#field-date")?.value || selectedDate,
    ids = checkedResources();
  const workFrom = clockMinutes(data.work_start, 540),
    workTo = clockMinutes(data.work_end, 1080);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
  const workDay = (data.work_days || [1, 2, 3, 4, 5, 6, 7]).includes(weekday);
  const today = businessDate(Date.now()),
    now = date === today ? dayMinutes(Date.now()) : date < today ? 1440 : -1;
  const ignore = $("#field-ignore")?.value;
  const busy = data.appointments.filter(
    (a) =>
      a.status === "confirmed" &&
      a.id !== ignore &&
      businessDate(a.start) === date &&
      (a.resources?.length ? a.resources : [{ id: a.resource_id }]).some((r) =>
        ids.includes(r.id),
      ),
  );
  const slots = [];
  for (
    let m = Math.min(workFrom, 420);
    m + service.duration <= Math.max(workTo, 1260);
    m += 15
  ) {
    const end = m + service.duration;
    slots.push({
      value: `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`,
      busy: busy.some(
        (a) => dayMinutes(a.start) < end && (dayMinutes(a.end) || 1440) > m,
      ),
      outside: !workDay || m < workFrom || end > workTo,
      past: m <= now,
    });
  }
  return { slots, workDay, workFrom, workTo };
}
function setupBookingTime(preferred) {
  const select = $("#field-time");
  function fill() {
    const { slots, workDay, workFrom, workTo } = bookingSlots();
    const keep = preferred || select.value;
    preferred = null;
    const zone = $("#field-client_zone")?.value || data.timezone,
      day = $("#field-date")?.value || selectedDate;
    select.innerHTML = slots
      .map(
        (s) =>
          `<option value="${s.value}" ${s.past ? "disabled" : ""}>${s.value}${zone !== data.timezone ? ` (${OrbitI18n.t("zoneForClient")} ${OrbitZones.clock(zone, timestamp(`${day}T${s.value}`))})` : ""}${s.busy ? ` · ${OrbitI18n.t("slotBusy")}` : s.outside ? ` · ${OrbitI18n.t("slotOutside")}` : ""}</option>`,
      )
      .join("");
    const usable = slots.filter((s) => !s.past);
    const pick =
      usable.find((s) => s.value === keep) ||
      usable.find((s) => !s.busy && !s.outside) ||
      usable[0];
    if (pick) select.value = pick.value;
    hint(slots, workDay, workFrom, workTo);
  }
  function hint(slots, workDay, workFrom, workTo) {
    const current = slots.find((s) => s.value === select.value),
      box = $("#booking-when-hint");
    if (!box) return;
    const range = `${String(Math.floor(workFrom / 60)).padStart(2, "0")}:${String(workFrom % 60).padStart(2, "0")}–${String(Math.floor(workTo / 60)).padStart(2, "0")}:${String(workTo % 60).padStart(2, "0")}`;
    box.className = "hint booking-when-hint";
    if (!slots.some((s) => !s.past)) {
      box.textContent = OrbitI18n.t("slotNoneLeft");
      box.classList.add("warn");
    } else if (current?.busy) {
      box.textContent = OrbitI18n.t("slotBusyHint");
      box.classList.add("warn");
    } else if (!workDay) {
      box.textContent = OrbitI18n.t("slotDayOff");
      box.classList.add("warn");
    } else if (current?.outside) {
      box.textContent = `${OrbitI18n.t("slotOutsideHint")} ${range}`;
      box.classList.add("warn");
    } else {
      const day = $("#field-date")?.value || selectedDate,
        at = timestamp(`${day}T${select.value || "12:00"}`),
        season = OrbitZones.season(data.timezone, at),
        zone = $("#field-client_zone")?.value || data.timezone;
      box.textContent = `${OrbitI18n.t("bookingTimezoneHint")} ${data.timezone} · ${OrbitZones.label(data.timezone, at)}${season ? ` · ${OrbitI18n.t(season === "summer" ? "zoneSummer" : "zoneWinter")}` : ""}${zone !== data.timezone ? ` · ${OrbitI18n.t("zoneForClient")} ${OrbitZones.clock(zone, at)} (${zone.replace(/_/g, " ")}, ${OrbitZones.label(zone, at)})` : ""}`;
    }
  }
  $("#modal-fields").addEventListener("change", (event) => {
    if (event.target.id === "field-time") {
      const state = bookingSlots();
      hint(state.slots, state.workDay, state.workFrom, state.workTo);
    } else if (
      ["field-date", "field-service_id", "field-client_zone"].includes(
        event.target.id,
      ) ||
      event.target.name === "resource_ids"
    ) {
      if (event.target.id === "field-date") syncBookingStaff(false);
      // Let the shared service handler adjust specialists first.
      setTimeout(fill, 0);
    }
  });
  fill();
}
// Waiting list: people who want a day that is full. The bot offers them freed times by itself; here the
// team sees who waits, books them by hand or adds someone who called.
function waitlistModal() {
  const list = data.waitlist || [],
    day = (d) => {
      const text = new Date(`${d}T12:00:00`).toLocaleDateString(
        OrbitI18n.locale(),
        { day: "numeric", month: "long", weekday: "long" },
      );
      return text.charAt(0).toLocaleUpperCase() + text.slice(1);
    },
    source = { bot: "waitFromBot", page: "waitFromPage", app: "waitFromApp" };
  const rows = (items) =>
    items
      .map(
        (w) =>
          `<li class="wait-row"><div><strong>${escape(w.client_name)}</strong>${w.phone ? ` <span class="sub">${escape(w.phone)}</span>` : ""}<div class="sub">${escape(w.service_name)} · ${escape(w.resource_name || OrbitI18n.t("waitAnyone"))}${w.wanted ? ` · ${OrbitI18n.t("waitWanted")} ${time(w.wanted)}` : ""} · ${OrbitI18n.t(source[w.source] || "waitFromApp")}${w.telegram ? " · Telegram" : ""}</div>${w.note ? `<div class="sub">${escape(w.note)}</div>` : ""}</div><div class="row-actions"><button type="button" class="primary" data-action="wait-book" data-id="${escape(w.id)}">${OrbitI18n.t("waitBook")}</button><button type="button" class="secondary" data-action="wait-remove" data-id="${escape(w.id)}">${OrbitI18n.t("waitRemove")}</button></div></li>`,
      )
      .join("");
  const today = list.filter((w) => w.date === selectedDate),
    later = list.filter((w) => w.date !== selectedDate);
  const groups = [...new Set(later.map((w) => w.date))]
    .map(
      (d) =>
        `<h3 class="wait-day">${escape(day(d))}</h3><ul class="wait-list">${rows(later.filter((w) => w.date === d))}</ul>`,
    )
    .join("");
  const clients = data.clients
    .map(
      (c) =>
        `<option value="${escape(c.id)}">${escape(c.name)}${c.phone ? ` · ${escape(c.phone)}` : ""}</option>`,
    )
    .join("");
  modal(
    OrbitI18n.t("waitTitle"),
    `<p class="hint">${OrbitI18n.t("waitIntro")}</p><h3 class="wait-day">${escape(day(selectedDate))}</h3>${today.length ? `<ul class="wait-list">${rows(today)}</ul>` : `<p class="hint">${OrbitI18n.t("waitNobody")}</p>`}${groups}` +
      `<fieldset class="wait-add"><legend>${OrbitI18n.t("waitAdd")}</legend>` +
      `<label for="field-client_id">${OrbitI18n.t("waitClient")}</label><select id="field-client_id" name="client_id" required><option value="">—</option>${clients}</select>` +
      `<div class="form-grid"><div>${select(OrbitI18n.t("m275"), "service_id", data.services)}</div><div><label for="field-resource_id">${OrbitI18n.t("waitSpecialist")}</label><select id="field-resource_id" name="resource_id"><option value="any">${OrbitI18n.t("waitAnyone")}</option>${data.resources.map((r) => `<option value="${escape(r.id)}">${escape(r.name)}</option>`).join("")}</select></div></div>` +
      `<div class="form-grid"><div>${field(OrbitI18n.t("bookingDate"), "date", "date", `required value="${escape(selectedDate)}" min="${businessDate(Date.now())}"`)}</div><div>${field(OrbitI18n.t("waitWanted"), "wanted", "time", "")}</div></div>` +
      field(OrbitI18n.t("m282"), "note", "text", 'maxlength="500"') +
      `<p class="hint">${OrbitI18n.t("waitAddHint")}</p></fieldset>`,
    async (v) => {
      if (!v.client_id) throw Error(OrbitI18n.t("bookingClientRequired"));
      await window.orbit.call("waitlist:add", {
        client_id: v.client_id,
        service_id: v.service_id,
        resource_id: v.resource_id,
        date: v.date,
        wanted: v.wanted ? timestamp(`${v.date}T${v.wanted}`) : null,
        note: v.note,
      });
      toast(OrbitI18n.t("waitAdded"));
    },
    OrbitI18n.t("waitAddButton"),
  );
}
function appointmentModal(id) {
  const a = data.appointments.find((x) => x.id === id);
  if (!a) return;
  const status = statuses[a.status] ? a.status : "confirmed";
  const due = Math.max(0, a.price - a.paid),
    staff = !can("money");
  const day = new Date(`${businessDate(a.start)}T12:00:00`).toLocaleDateString(
    OrbitI18n.locale(),
    { day: "numeric", month: "long", weekday: "short" },
  );
  const rows = [
    [OrbitI18n.t("bookingTime"), `${day} · ${time(a.start)} – ${time(a.end)}`],
    [OrbitI18n.t("m275"), a.service_name],
    [OrbitI18n.t("waitSpecialist"), a.resource_name],
    [
      OrbitI18n.t("waitClient"),
      `${a.client_name}${a.phone ? ` · ${a.phone}` : ""}`,
    ],
    [
      OrbitI18n.t("m280"),
      `${money(a.price)} ${data.currency}${a.paid ? ` · ${OrbitI18n.t("apptPaid")} ${money(a.paid)}` : ""}`,
    ],
    ...(a.notes ? [[OrbitI18n.t("m282"), a.notes]] : []),
  ];
  const open = status === "confirmed",
    // Finishing a visit or marking a no-show only makes sense once it has started.
    started = open && a.start <= Date.now();
  const buttons = [
    started &&
      !staff &&
      due > 0 && ["complete-pay", OrbitI18n.t("apptCompletePay"), "primary"],
    started && [
      "complete",
      OrbitI18n.t("m167"),
      !staff && due > 0 ? "secondary" : "primary",
    ],
    open && ["reschedule", OrbitI18n.t("apptMove"), "secondary"],
    !staff &&
      ((!open && due > 0) || due < 0) && [
        "payment",
        OrbitI18n.t("m166"),
        "primary",
      ],
    !staff &&
      status !== "cancelled" && [
        "visit-edit",
        OrbitI18n.t("visitEdit"),
        "secondary",
      ],
    !staff &&
      monoReady() &&
      due > 0 &&
      status !== "cancelled" &&
      (openPayLink(a.id)
        ? ["mono-show", OrbitI18n.t("payShow"), "secondary"]
        : ["mono-invoice", OrbitI18n.t("payInvoice"), "secondary"]),
    started && ["no-show", OrbitI18n.t("m003"), "secondary"],
    open && ["cancel-booking", OrbitI18n.t("apptCancel"), "danger"],
  ].filter(Boolean);
  const client = a.clients?.[0]?.id || a.client_id;
  modal(
    a.client_name,
    `<div class="appointment-card">${visitAlerts(a)
      .map((t) => `<p class="client-alert">⚠ ${escape(t)}</p>`)
      .join(
        "",
      )}<div class="appointment-badges"><span class="badge ${status}">${statuses[status]}</span>${comingBadge(a)}${!staff && due > 0 && status !== "cancelled" ? `<span class="badge due">${OrbitI18n.t("apptDue")} ${money(due)} ${escape(data.currency)}</span>` : ""}${!staff && a.price > 0 && due === 0 ? `<span class="badge paid">${OrbitI18n.t("apptPaidFull")}</span>` : ""}${!staff && due < 0 ? `<span class="badge due">${OrbitI18n.t("payOverpaid")} ${money(-due)} ${escape(data.currency)}</span>` : ""}${!staff && due > 0 && openPayLink(a.id) ? `<span class="badge waiting">${OrbitI18n.t("payWaiting")} · ${money(openPayLink(a.id).amount)} ${escape(data.currency)}</span>` : ""}</div><dl>${rows.map(([k, v]) => `<dt>${escape(k)}</dt><dd>${escape(v)}</dd>`).join("")}</dl><div class="card-buttons">${buttons.map(([act, label, cls]) => `<button type="button" class="${cls}" data-action="appointment-act" data-act="${act}" data-id="${escape(a.id)}">${label}</button>`).join("")}<button type="button" class="link-button" data-action="appointment-act" data-act="client-card" data-id="${escape(client)}">${OrbitI18n.t("clientCard")}</button></div></div>`,
    async () => {},
    OrbitI18n.t("close"),
  );
}
// Payment form shared by "Оплата" and "Завершити й оплатити": the amount starts at what is still due.
function paymentModal(a, complete) {
  const due = Math.max(0, a.price - a.paid),
    vouchers = voucherPayOptions(a);
  modal(
    complete ? OrbitI18n.t("apptCompletePay") : OrbitI18n.t("m300"),
    `<p class="hint">${escape(a.client_name)} · ${escape(a.service_name)} · ${OrbitI18n.t("apptDue")} ${money(due)} ${escape(data.currency)}</p>` +
      field(
        OrbitI18n.t("m301"),
        "amount",
        "number",
        `required step="0.01" min="${complete ? 0.01 : -(a.paid / 100)}" max="${Math.max(due, 0) / 100 || ""}" value="${due / 100}"`,
      ) +
      (complete || a.paid <= 0
        ? ""
        : `<p class="hint">${OrbitI18n.t("payAmountHint")}</p><label class="checkbox-line"><input type="checkbox" name="compensate" checked> ${OrbitI18n.t("payCompensate")}</label>`) +
      `<label>${OrbitI18n.t("m302")}</label><div class="segmented pay-methods">${[
        ["cash", "m116"],
        ["card", "m117"],
        ["transfer", "m118"],
        ...vouchers.methods,
      ]
        .map(
          ([value, key], i) =>
            `<label><input type="radio" name="method" value="${value}" ${i ? "" : "checked"}><span>${OrbitI18n.t(key)}</span></label>`,
        )
        .join("")}</div>` +
      vouchers.fields,
    async (v) => {
      const amount = Number(v.amount);
      if (!amount && !complete) throw Error(OrbitI18n.t("m548"));
      if (amount)
        await window.orbit.call("payment:add", {
          amount,
          method: v.method,
          appointment_id: a.id,
          voucher_id:
            v.method === "certificate"
              ? v.certificate_code.trim()
              : v.method === "pass"
                ? v.pass_id
                : undefined,
        });
      // Money given back to an unhappy client lowers the price of the visit, so it does not turn into a debt.
      if (amount < 0 && v.compensate === "on")
        await window.orbit.call("visit:update", {
          id: a.id,
          total: Math.max(0, a.price / 100 + amount),
        });
      if (complete)
        await window.orbit.call("booking:status", a.id, "completed");
      toast(
        OrbitI18n.t(
          complete ? "apptCompleted" : amount < 0 ? "payRefundSaved" : "paySaved",
        ),
      );
    },
    complete ? OrbitI18n.t("apptCompletePay") : OrbitI18n.t("m271"),
  );
  voucherPayWire(due);
}
// monobank or LiqPay: the client pays on the bank page; the server marks the visit paid when the bank reports it.
function payProviders() {
  return ["monobank", "liqpay"].filter(
    (p) => data.integrations?.[p]?.connected,
  );
}
function monoReady() {
  return payProviders().length > 0 && can("money");
}
function openPayLink(id) {
  return (data.payment_links || []).find((l) => l.appointment_id === id);
}
function payInvoiceModal(a) {
  const due = Math.max(0, a.price - a.paid),
    client = data.clients.find((c) => c.id === a.client_id),
    telegram =
      Boolean(client?.chat_id) &&
      Boolean(data.integrations.telegram?.connected),
    providers = payProviders(),
    names = { monobank: "monobank", liqpay: "LiqPay (ПриватБанк)" };
  modal(
    OrbitI18n.t("payInvoice"),
    `<p class="hint">${escape(a.client_name)} · ${escape(a.service_name)} · ${OrbitI18n.t("apptDue")} ${money(due)} ${escape(data.currency)}</p>` +
      (providers.length > 1
        ? `<label for="field-provider">${OrbitI18n.t("payProvider")}</label><select id="field-provider" name="provider">${providers.map((p) => `<option value="${p}">${names[p]}</option>`).join("")}</select>`
        : "") +
      field(
        OrbitI18n.t("payInvoiceAmount"),
        "amount",
        "number",
        `required min="1" max="${due / 100}" step="0.01" value="${due / 100}"`,
      ) +
      `<label class="checkbox-line"><input name="send" type="checkbox" ${telegram ? "checked" : "disabled"}>${OrbitI18n.t("payInvoiceSend")}</label>` +
      (telegram ? "" : `<p class="hint">${OrbitI18n.t("payNoTelegram")}</p>`),
    async (v) => {
      const provider = providers.includes(v.provider)
        ? v.provider
        : providers[0];
      const r = await window.orbit.call(`${provider}:invoice`, {
        appointment_id: a.id,
        amount: Number(v.amount),
        send: v.send === "on",
      });
      if (r.sendError) toast(r.sendError, true);
      // Opens after this form closes.
      setTimeout(() => payLinkModal(a.id, r.url, r.amount, r.sent), 0);
    },
    OrbitI18n.t("payInvoiceCreate"),
  );
}
let payWatch = null;
// QR code and link; checks every few seconds and shows "Paid" as soon as the bank confirms.
function payLinkModal(id, url, amount, sent) {
  const a = data.appointments.find((x) => x.id === id),
    before = a?.paid || 0;
  let qr = "";
  try {
    qr = OrbitQR.svg(url);
  } catch {}
  modal(
    OrbitI18n.t("payInvoiceReady"),
    `<div class="pay-link"><p class="hint">${a ? `${escape(a.client_name)} · ${escape(a.service_name)} · ` : ""}${money(amount)} ${escape(data.currency)}</p>${sent ? `<p class="pay-sent">${OrbitI18n.t("payInvoiceSent")}</p>` : ""}${qr ? `<img class="pay-qr" src="${qr}" alt="QR">` : ""}<p class="hint">${OrbitI18n.t("payInvoiceScan")}</p><div class="pay-url"><input id="field-pay-url" readonly value="${escape(url)}"><button type="button" class="secondary" data-action="pay-copy">${OrbitI18n.t("payCopy")}</button></div><p class="pay-state" id="pay-state" role="status">${OrbitI18n.t("payWaiting")}…</p><button type="button" class="link-button" data-action="pay-cancel" data-id="${escape(id)}">${OrbitI18n.t("payCancel")}</button></div>`,
    async () => {},
    OrbitI18n.t("close"),
  );
  clearInterval(payWatch);
  payWatch = setInterval(async () => {
    if (!$("#modal").open || !$("#pay-state")) {
      clearInterval(payWatch);
      return;
    }
    await refresh({ preserveView: true }).catch(() => {});
    const v = data.appointments.find((x) => x.id === id),
      state = $("#pay-state");
    if (state && v && v.paid > before && !openPayLink(id)) {
      clearInterval(payWatch);
      state.textContent = OrbitI18n.t("payDone");
      state.classList.add("done");
      $('#modal-fields [data-action="pay-cancel"]')?.remove();
    }
  }, 5000);
}
// "Напишіть нам": goes to the LOMVIKO team even without a licence; the reply comes by email.
function supportContact() {
  try {
    return localStorage.getItem("lomviko.support") || "";
  } catch {
    return "";
  }
}
async function supportModal(error = "", parent = "", preset = {}) {
  let sent = null;
  const info = await window.orbit.call("support:info").catch(() => ({}));
  window.orbit
    .call("support:contact")
    .then((email) => {
      if (!email) return;
      try {
        localStorage.setItem("lomviko.support", email);
      } catch {}
      const line = $("#support-direct");
      if (line) line.textContent = `${OrbitI18n.t("supportDirect")}: ${email}`;
    })
    .catch(() => {});
  const topics = ["problem", "question", "idea", "billing"],
    names = {
      problem: "supportTopicProblem",
      question: "supportTopicQuestion",
      idea: "supportTopicIdea",
      billing: "supportTopicBilling",
    },
    chosen = preset.topic || (error ? "problem" : "question");
  modal(
    OrbitI18n.t("supportTitle"),
    `<p class="support-intro">${OrbitI18n.t("supportIntro")}</p>` +
      `<label>${OrbitI18n.t("supportTopic")}</label><div class="segmented pay-methods support-topics">${topics.map((t) => `<label><input type="radio" name="topic" value="${t}" ${t === chosen ? "checked" : ""}><span>${OrbitI18n.t(names[t])}</span></label>`).join("")}</div>` +
      `<label for="field-message">${OrbitI18n.t("supportMessage")}</label><textarea id="field-message" name="message" rows="5" required minlength="5" maxlength="4000" placeholder="${escape(OrbitI18n.t("supportMessageHint"))}">${escape(preset.message || "")}</textarea>` +
      `<div class="form-grid"><div>${field(OrbitI18n.t("supportEmail"), "email", "email", `required maxlength="254" value="${escape(info.email || "")}"`)}</div><div>${field(OrbitI18n.t("supportName"), "name", "text", `maxlength="120" value="${escape(info.name || "")}"`)}</div></div>` +
      `<label class="checkbox-line"><input name="attach" type="checkbox" checked>${OrbitI18n.t("supportAttach")}</label>` +
      `<p class="hint" id="support-direct">${supportContact() ? `${OrbitI18n.t("supportDirect")}: ${escape(supportContact())}` : ""}</p>`,
    async (v) => {
      try {
        sent = await window.orbit.call("support:send", {
          parent_id: parent || undefined,
          topic: v.topic,
          message: v.message,
          email: v.email,
          name: v.name,
          business: info.business || data?.business || "",
          attach: v.attach === "on",
          error,
        });
      } catch (e) {
        // No server: give the address so the message can still reach us.
        if (/зв’язку|connection|fetch|network/i.test(e.message))
          throw Error(
            supportContact()
              ? `${OrbitI18n.t("supportOffline")} ${supportContact()}`
              : OrbitI18n.t("supportOfflineLater"),
          );
        throw e;
      }
      toast(
        sent?.number
          ? OrbitI18n.t("supportSentNumber")
              .replace("{number}", sent.number)
              .replace("{email}", v.email)
          : `${OrbitI18n.t("supportSent")} ${v.email}`,
      );
      if (sent?.number) loadSupport();
    },
    OrbitI18n.t("supportSend"),
  );
  // Sending must work even when the company server is offline.
  modalNeedsConnection = false;
  setTimeout(() => $("#field-message")?.focus(), 50);
}
// "Мої звернення": numbered requests with the whole conversation. Loaded from the server every few
// minutes; a new team reply puts a dot next to "Допомога".
let supportState = { requests: [], signedOut: true, loaded: false };
async function loadSupport() {
  try {
    const result = await window.orbit.call("support:list");
    supportState = {
      requests: result.requests || [],
      signedOut: Boolean(result.signedOut),
      loaded: true,
    };
    if (result.contact)
      try {
        localStorage.setItem("lomviko.support", result.contact);
      } catch {}
  } catch {}
  const unread = supportState.requests.filter((r) => r.unread).length;
  document
    .querySelector(".help-link")
    ?.classList.toggle("has-unread", unread > 0);
  return supportState;
}
const supportStatus = {
  open: "supportStatusOpen",
  waiting: "supportStatusWaiting",
  solved: "supportStatusSolved",
  closed: "supportStatusClosed",
};
function supportWhen(ms) {
  return new Date(ms).toLocaleString(OrbitI18n.locale(), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function supportThreadModal(id) {
  const r = supportState.requests.find((x) => x.id === id);
  if (!r) return;
  if (r.unread) {
    r.unread = false;
    window.orbit.call("support:read", id).catch(() => {});
    document.querySelector(".help-link")?.classList.toggle(
      "has-unread",
      supportState.requests.some((x) => x.unread),
    );
  }
  const messages = r.messages
    .map(
      (m) =>
        `<div class="support-msg ${m.author}"><div class="support-meta">${escape(m.author === "team" ? `${m.name || "LOMVIKO"} · ${OrbitI18n.t("supportTeam")}` : OrbitI18n.t("supportYou"))} · ${supportWhen(m.created_at)}</div><div class="support-body">${escape(m.text)}</div></div>`,
    )
    .join("");
  const rate =
    ["solved", "closed"].includes(r.status) && !r.rating
      ? `<div class="support-rate"><span>${OrbitI18n.t("supportRateQuestion")}</span><button type="button" class="secondary" data-action="support-rate" data-rating="good" data-id="${escape(r.id)}">👍 ${OrbitI18n.t("supportRateGood")}</button><button type="button" class="secondary" data-action="support-rate" data-rating="bad" data-id="${escape(r.id)}">👎 ${OrbitI18n.t("supportRateBad")}</button></div>`
      : r.rating
        ? `<p class="hint">${OrbitI18n.t("supportRated")}</p>`
        : "";
  const closed = r.status === "closed";
  modal(
    `${OrbitI18n.t("supportRequest")} №${r.number}`,
    `<p><span class="badge support-status ${r.status}">${OrbitI18n.t(supportStatus[r.status] || "supportStatusOpen")}</span>${r.parent ? ` <span class="hint">${OrbitI18n.t("supportContinues")} №${r.parent}</span>` : ""}</p><div class="support-thread">${messages}</div>${rate}` +
      (closed
        ? `<p class="hint">${OrbitI18n.t("supportClosedHint")}</p><button type="button" class="secondary" data-action="support-follow" data-id="${escape(r.id)}">${OrbitI18n.t("supportNewFollow")}</button>`
        : `<label for="field-text">${OrbitI18n.t("supportReply")}</label><textarea id="field-text" name="text" rows="3" required maxlength="4000"></textarea>`),
    closed
      ? async () => {}
      : async (v) => {
          await window.orbit.call("support:reply", { id: r.id, text: v.text });
          toast(OrbitI18n.t("supportReplySent"));
          await loadSupport();
          if (page === "settings") render();
        },
    closed ? OrbitI18n.t("close") : OrbitI18n.t("supportSend"),
  );
  modalNeedsConnection = false;
  setTimeout(() => {
    const t = document.querySelector(".support-thread");
    if (t) t.scrollTop = t.scrollHeight;
  }, 30);
}
function rescheduleModal(a) {
  const chosen = (
    a.resources?.length ? a.resources : [{ id: a.resource_id }]
  ).map((r) => r.id);
  modal(
    OrbitI18n.t("apptMove"),
    `<p class="hint">${escape(a.client_name)} · ${escape(a.service_name)} · ${businessDate(a.start)} ${time(a.start)}</p>` +
      `<input type="hidden" id="field-ignore" value="${escape(a.id)}"><input type="hidden" id="field-service_id" value="${escape(a.service_id)}">` +
      resourceChips(chosen) +
      `<div class="form-grid booking-when"><div>${field(OrbitI18n.t("bookingDate"), "date", "date", `required value="${businessDate(a.start)}"`)}</div>` +
      `<div><label for="field-time">${OrbitI18n.t("bookingTime")}</label><select id="field-time" name="time" required></select></div></div>` +
      `<p class="hint booking-when-hint" id="booking-when-hint" role="status"></p>`,
    async (v) => {
      const resource_ids = checkedResources();
      if (resource_ids.length !== chosen.length)
        throw Error(
          OrbitI18n.t("apptMoveResources").replace("{n}", chosen.length),
        );
      await window.orbit.call("booking:reschedule", {
        id: a.id,
        resource_ids,
        start: timestamp(`${v.date}T${v.time}`),
      });
      selectedDate = v.date;
      toast(OrbitI18n.t("apptMoved"));
    },
    OrbitI18n.t("apptMove"),
  );
  setupBookingTime(time(a.start));
}
function timestamp(value) {
  const target = Date.parse(value + "Z"),
    seen = [];
  let result = target;
  for (let i = 0; i < 4; i++) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: data.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(result)
        .filter((p) => p.type !== "literal")
        .map((p) => [p.type, Number(p.value)]),
    );
    const delta =
      target -
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
      );
    if (!delta) return result;
    if (i) seen.push(result); // the first guess is not a real candidate
    result += delta;
  }
  // This wall-clock time does not exist (spring change to summer time skips an hour):
  // take the later moment, i.e. the same minutes one hour later.
  return Math.max(...seen);
}
function serviceFields(s = {}) {
  return (
    field(
      OrbitI18n.t("m260"),
      "name",
      "text",
      `required maxlength="120" value="${escape(s.name || "")}"`,
    ) +
    '<div class="form-grid">' +
    "<div>" +
    field(
      OrbitI18n.t("m286"),
      "duration",
      "number",
      `required min="5" max="480" value="${s.duration || 60}"`,
    ) +
    "</div>" +
    "<div>" +
    field(
      OrbitI18n.t("m287"),
      "price",
      "number",
      `required min="0" step="0.01" value="${(s.price || 0) / 100}"`,
    ) +
    "</div>" +
    "<div>" +
    field(
      OrbitI18n.t("m288"),
      "capacity",
      "number",
      `required min="1" max="100" value="${s.capacity || 1}"`,
    ) +
    "</div>" +
    "<div>" +
    field(
      OrbitI18n.t("m289"),
      "required_resources",
      "number",
      `required min="1" max="8" value="${s.required_resources || 1}"`,
    ) +
    "</div>" +
    "</div>" +
    (data.resources.length
      ? `<fieldset class="chip-group" id="field-resources"><legend>${OrbitI18n.t("staffWho")}</legend>${data.resources.map((r) => `<label class="chip"><input type="checkbox" name="resource_ids" value="${escape(r.id)}" ${(s.resource_ids || []).includes(r.id) ? "checked" : ""}><span>${escape(r.name)}</span></label>`).join("")}</fieldset><p class="hint">${OrbitI18n.t("staffWhoHint")}</p>`
      : "") +
    serviceExtraFields(s) +
    `<label class="checkbox-line"><input name="bot_visible" type="checkbox" ${s.bot_visible === 0 ? "" : "checked"}>${OrbitI18n.t("m290")}</label><label class="checkbox-line"><input name="web_visible" type="checkbox" ${s.id ? (s.web_visible ? "checked" : "") : "checked"}>${OrbitI18n.t("m291")}</label>`
  );
}
function loginModal() {
  closeModal();
  modal(
    OrbitI18n.t("m293"),
    field(
      OrbitI18n.t("m294"),
      "login",
      "email",
      'required autocomplete="username"',
    ) +
      field(
        OrbitI18n.t("m295"),
        "password",
        "password",
        'required autocomplete="current-password"',
      ) +
      `<p class="hint">${OrbitI18n.t("m296")} <button type="button" class="link-button" data-action="forgot-password">${OrbitI18n.t("forgotPassword")}</button></p><button type="button" class="secondary" data-action="register">${OrbitI18n.t("registerFreeTrial")}</button>`,
    async (v) => {
      await window.orbit.call("account:login", "", v.login, v.password);
      team = [];
      selectedLogo = undefined;
      toast(OrbitI18n.t("m298"));
    },
    OrbitI18n.t("m036"),
  );
  modalNeedsConnection = false;
}

// Forgot password: email → six-digit code from the letter → new password, then straight into the workspace.
function forgotPasswordModal() {
  const known = $("#field-login")?.value || "";
  closeModal();
  modal(
    OrbitI18n.t("forgotPasswordTitle"),
    `<p class="hint">${OrbitI18n.t("forgotPasswordHint")}</p>` +
      field(OrbitI18n.t("m294"), "email", "email", `required maxlength="254" autocomplete="username" value="${escape(known)}"`),
    async (v) => {
      await window.orbit.call("account:reset:start", v.email, OrbitI18n.language);
      setTimeout(
        () =>
          modal(
            OrbitI18n.t("forgotPasswordCodeTitle"),
            `<p class="hint">${OrbitI18n.t("forgotPasswordCodeHint")}</p>` +
              field(OrbitI18n.t("verificationCode"), "code", "text", 'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6"') +
              field(OrbitI18n.t("forgotPasswordNew"), "password", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
              field(OrbitI18n.t("registerPasswordAgain"), "password_again", "password", 'required minlength="12" maxlength="128" autocomplete="new-password"') +
              `<p class="hint">${OrbitI18n.t("registerPasswordHint")}</p>`,
            async (c) => {
              if (c.password !== c.password_again) throw Error(OrbitI18n.t("registerPasswordMismatch"));
              await window.orbit.call("account:reset:confirm", c.code, c.password);
              team = [];
              selectedLogo = undefined;
              toast(OrbitI18n.t("forgotPasswordDone"));
            },
            OrbitI18n.t("forgotPasswordSave"),
          ),
        0,
      );
    },
    OrbitI18n.t("sendCode"),
  );
  modalNeedsConnection = false;
}

function bookingClientFields() {
  return `<div class="booking-client-picker"><label for="field-client_query">${OrbitI18n.t("bookingClientSearch")}</label><input id="field-client_query" name="client_query" type="text" maxlength="120" autocomplete="off" required aria-controls="booking-client-suggestions"><div id="booking-client-suggestions"></div><p class="hint booking-client-found" id="booking-client-found" role="status"></p><div id="booking-client-selected"></div><label for="field-new_client_phone">${OrbitI18n.t("bookingClientPhone")}</label><input id="field-new_client_phone" name="new_client_phone" type="tel" maxlength="40" autocomplete="off"><p class="hint">${OrbitI18n.t("bookingClientHint")}</p><select id="field-client_ids" name="client_ids" multiple hidden>${data.clients.map((c) => `<option value="${escape(c.id)}">${escape(c.name)}</option>`).join("")}</select></div>`;
}
function setupBookingClients() {
  const query = $("#field-client_query"),
    phone = $("#field-new_client_phone"),
    selected = $("#field-client_ids");
  function update() {
    // A full phone number of a client already in the base picks that client with all their details.
    const typed = (phone.value || query.value).replace(/[^0-9]/g, "");
    if (typed.length >= 9) {
      const tail = typed.slice(-9),
        found = data.clients.filter(
          (c) => c.phone.replace(/[^0-9]/g, "").slice(-9) === tail,
        );
      const option =
        found.length === 1 &&
        Array.from(selected.options).find((o) => o.value === found[0].id);
      if (option && !option.selected) {
        option.selected = true;
        query.value = "";
        phone.value = "";
        const c = found[0];
        $("#booking-client-found").textContent =
          `${OrbitI18n.t("bookingClientFound")}: ${c.name}` +
          [c.discount > 0 ? `${OrbitI18n.t("discountShort")} ${c.discount}%` : "", c.vehicle, c.plate, c.alert ? `⚠ ${c.alert}` : ""]
            .filter(Boolean)
            .map((x) => ` · ${x}`)
            .join("");
      }
    }
    const term = query.value.trim().toLocaleLowerCase(),
      digits = (phone.value || term).replace(/[^0-9]/g, "");
    const ids = new Set(Array.from(selected.selectedOptions, (o) => o.value));
    const matches = data.clients
      .filter(
        (c) =>
          !ids.has(c.id) &&
          ((term && c.name.toLocaleLowerCase().includes(term)) ||
            (digits.length >= 3 &&
              c.phone.replace(/[^0-9]/g, "").includes(digits))),
      )
      .slice(0, 6);
    $("#booking-client-suggestions").innerHTML = matches
      .map(
        (c) =>
          `<button type="button" class="booking-client-option" data-client-pick="${escape(c.id)}"><strong>${escape(c.name)}</strong><span>${escape(c.phone)}</span></button>`,
      )
      .join("");
    $("#booking-client-selected").innerHTML = data.clients
      .filter((c) => ids.has(c.id))
      .map(
        (c) =>
          `<span class="booking-client-chip">${escape(c.name)}<button type="button" data-client-remove="${escape(c.id)}" aria-label="${OrbitI18n.t("bookingClientRemove")} · ${escape(c.name)}">×</button></span>`,
      )
      .join("");
    query.required = ids.size === 0;
    const count = ids.size + (term ? 1 : 0);
    const service = data.services.find(
      (s) => s.id === $("#field-service_id").value,
    );
    const people = $("#field-people_count");
    $("#booking-people").hidden = service.capacity <= 1;
    people.value = Math.max(
      1,
      count,
      Math.min(Number(people.value), service.capacity),
    );
    people.max = service.capacity;
    // The first chosen client's personal discount lowers the suggested price.
    const discount =
      data.clients.find((c) => ids.has(c.id))?.discount || 0;
    $("#field-total").value =
      Math.round(
        (service.price * Number(people.value) * (100 - discount)) / 100,
      ) / 100;
  }
  query.addEventListener("input", update);
  phone.addEventListener("input", update);
  $("#field-service_id").addEventListener("change", update);
  $(".booking-client-picker").addEventListener("click", (event) => {
    const button = event.target.closest(
      "[data-client-pick], [data-client-remove]",
    );
    if (!button) return;
    const id = button.dataset.clientPick || button.dataset.clientRemove;
    const option = Array.from(selected.options).find((o) => o.value === id);
    option.selected = Boolean(button.dataset.clientPick);
    if (button.dataset.clientPick) {
      query.value = "";
      phone.value = "";
    }
    update();
    query.focus();
  });
  update();
  query.focus();
}

function registrationModal() {
  // Registration closed by LOMVIKO: explain and point to the request form on the site.
  if (window.OrbitWeb?.registration === false) {
    modal(
      OrbitI18n.t("registrationClosedTitle"),
      `<p>${OrbitI18n.t("registrationClosedText")}</p><p><a class="primary" href="https://lomviko.com/#start" target="_blank" rel="noopener">${OrbitI18n.t("registrationClosedButton")}</a></p>`,
      async () => {},
      OrbitI18n.t("close"),
    );
    return;
  }
  closeModal();
  modal(
    OrbitI18n.t("registerFreeTrial"),
    `<p class="hint">${OrbitI18n.t("registrationHint")}</p>` +
      field(
        OrbitI18n.t("registerCompany"),
        "business",
        "text",
        'required maxlength="120" autocomplete="organization"',
      ) +
      field(
        OrbitI18n.t("registerName"),
        "name",
        "text",
        'required maxlength="120" autocomplete="name"',
      ) +
      field(
        OrbitI18n.t("registerEmail"),
        "email",
        "email",
        'required maxlength="254" autocomplete="email"',
      ) +
      field(
        OrbitI18n.t("m295"),
        "password",
        "password",
        'required minlength="12" maxlength="128" autocomplete="new-password"',
      ) +
      field(
        OrbitI18n.t("registerPasswordAgain"),
        "password_again",
        "password",
        'required minlength="12" maxlength="128" autocomplete="new-password"',
      ) +
      `<p class="hint">${OrbitI18n.t("registerPasswordHint")}</p>` +
      `<label class="checkbox-line legal-accept"><input name="accept" type="checkbox" required><span>${OrbitI18n.t("legalAcceptLabel")} ${window.OrbitWeb?.offer === false ? "" : `<button type="button" class="link-button" data-action="offer">${OrbitI18n.t(window.OrbitWeb?.terms ? "legalTerms" : "legalOffer")}</button> ${OrbitI18n.t("legalAnd")} `}<button type="button" class="link-button" data-action="privacy">${OrbitI18n.t("legalPrivacyAccusative")}</button></span></label>`,
    async (values) => {
      if (values.password !== values.password_again)
        throw Error(OrbitI18n.t("registerPasswordMismatch"));
      if (values.accept !== "on")
        throw Error(OrbitI18n.t(window.OrbitWeb?.offer === false ? "legalAcceptRequiredPrivacy" : window.OrbitWeb?.terms ? "legalAcceptRequiredTerms" : "legalAcceptRequired"));
      const { password_again, accept, ...fields } = values;
      fields.accept = true;
      await window.orbit.call("account:register:start", {
        ...fields,
        language: OrbitI18n.language,
      });
      setTimeout(
        () =>
          modal(
            OrbitI18n.t("verifyEmail"),
            `<p class="hint">${OrbitI18n.t("verifyEmailHint")}</p><p class="hint">${OrbitI18n.t(window.OrbitWeb?.offer === false ? "legalCodeSignsPrivacy" : window.OrbitWeb?.terms ? "legalCodeSignsTerms" : "legalCodeSigns")}</p>` +
              field(
                OrbitI18n.t("verificationCode"),
                "code",
                "text",
                'required pattern="[0-9]{6}" inputmode="numeric" autocomplete="one-time-code" maxlength="6"',
              ),
            async (v) => {
              await window.orbit.call("account:register:confirm", v.code);
              team = [];
              selectedLogo = undefined;
              if (!localStorage.getItem("biz.welcome.seen"))
                setTimeout(() => OrbitWelcome.start(), 100);
            },
          ),
        0,
      );
    },
    OrbitI18n.t("sendCode"),
  );
  modalNeedsConnection = false;
}

// What the owner needs before a visit: how often the client comes, what they paid, what is still due.
// Visits grouped by client once per data snapshot, so the client list stays fast with
// thousands of clients and visits (a per-client scan made it quadratic).
const visitsByClient = new WeakMap();
function clientVisits(id) {
  let index = visitsByClient.get(data.appointments);
  if (!index) {
    index = new Map();
    for (const a of data.appointments)
      for (const c of a.clients?.length ? a.clients : [{ id: a.client_id }]) {
        if (!index.has(c.id)) index.set(c.id, []);
        index.get(c.id).push(a);
      }
    visitsByClient.set(data.appointments, index);
  }
  return index.get(id) || [];
}
// Totals come from the server over all time (c.stats); the loaded visits give the next visit and recent history.
function clientStats(id) {
  const visits = clientVisits(id),
    done = visits.filter((a) => a.status === "completed"),
    now = Date.now(),
    all = data.clients.find((c) => c.id === id)?.stats;
  return {
    visits,
    done: all ? all.done : done.length,
    noShow: all
      ? all.no_show
      : visits.filter((a) => a.status === "no_show").length,
    paid: all ? all.paid : visits.reduce((s, a) => s + a.paid, 0),
    due: all
      ? all.due
      : done.reduce((s, a) => s + Math.max(0, a.price - a.paid), 0),
    last: all ? all.last : done.reduce((m, a) => Math.max(m, a.start), 0),
    next: visits
      .filter((a) => a.status === "confirmed" && a.start > now)
      .sort((x, y) => x.start - y.start)[0],
  };
}
function clientDetails(c) {
  const born = birthdayIn(c.birthday);
  const rows = [
    c.birthday && [
      OrbitI18n.t("clientBirthday"),
      `${formatDay(c.birthday)}${born ? ` · ${born.days === 0 ? OrbitI18n.t("birthdayToday") : OrbitI18n.t("birthdayIn").replace("{days}", born.days)}, ${born.age}` : ""}`,
    ],
    c.email && [OrbitI18n.t("clientEmail"), c.email],
    c.source && [
      OrbitI18n.t("clientSource"),
      OrbitI18n.t("source_" + c.source),
    ],
    (c.vehicle || c.plate) && [
      OrbitI18n.t(
        OrbitIndustries.fields(data.industry).includes("pet")
          ? "clientPet"
          : "clientVehicle",
      ),
      [c.vehicle, c.plate].filter(Boolean).join(" · "),
    ],
    c.discount > 0 && [OrbitI18n.t("discountLabel"), `${c.discount}%`],
  ].filter(Boolean);
  // Without a birthday the card offers to add one, so birthday greetings can find the client.
  const addBirthday =
    !c.birthday && can("clients")
      ? `<p class="hint client-birthday-add">${OrbitI18n.t("clientBirthday")}: — <button type="button" class="link-button" data-action="client-edit" data-id="${escape(c.id)}">${OrbitI18n.t("clientBirthdayAdd")}</button></p>`
      : "";
  return `${c.alert ? `<p class="client-alert">⚠ ${escape(c.alert)}</p>` : ""}${
    c.tags
      ? `<p class="client-tags">${c.tags
          .split(",")
          .map((t) => `<span class="tag">${escape(t.trim())}</span>`)
          .join("")}</p>`
      : ""
  }${rows.length ? `<dl class="client-details">${rows.map(([k, val]) => `<dt>${escape(k)}</dt><dd>${escape(val)}</dd>`).join("")}</dl>` : ""}${addBirthday}`;
}
function clientModal(id) {
  const c = data.clients.find((x) => x.id === id);
  if (!c) return;
  const st = clientStats(id),
    staff = !can("money"),
    cur = escape(data.currency);
  const figures = [
    [OrbitI18n.t("clientVisits"), st.done],
    ...(staff ? [] : [[OrbitI18n.t("clientPaid"), `${money(st.paid)} ${cur}`]]),
    ...(!staff && st.due
      ? [[OrbitI18n.t("apptDue"), `${money(st.due)} ${cur}`, "due"]]
      : []),
    ...(st.noShow ? [[OrbitI18n.t("m003"), st.noShow, "due"]] : []),
  ];
  const rows = (visits) =>
    visits
      .slice()
      .sort((x, y) => y.start - x.start)
      .slice(0, 12)
      .map(
        (a) =>
          `<li><button type="button" class="history-row" data-action="appointment-act" data-act="appointment-open" data-id="${escape(a.id)}"><span>${businessDate(a.start).split("-").reverse().join(".")} · ${time(a.start)}</span><strong>${escape(a.service_name)}</strong><span class="sub">${escape(a.resource_name)}</span><span class="badge ${a.status}">${statuses[a.status]}</span></button></li>`,
      )
      .join("");
  const history = rows(st.visits);
  // Visits older than the loaded months come from the server once the card is open.
  if (
    st.done + st.noShow >
    st.visits.filter((a) => a.status !== "confirmed").length
  )
    window.orbit
      .call("client:history", id)
      .then((visits) => {
        const list = $(
          "#modal[open] .client-history, #modal[open] .client-history-slot",
        );
        if (!list || $("#modal-title").textContent !== c.name) return;
        list.outerHTML = `<ul class="client-history">${rows(visits)}</ul>`;
      })
      .catch(() => {});
  modal(
    c.name,
    `<div class="client-card"><p class="hint">${escape(c.phone || "—")}${c.chat_id ? ` · Telegram ✓` : ""}${c.notes ? ` · ${escape(c.notes)}` : ""}</p>${clientDetails(c)}<div class="client-figures">${figures.map(([k, v, cls]) => `<div class="${cls || ""}"><span>${k}</span><strong>${v}</strong></div>`).join("")}</div><p class="client-next">${st.next ? `${OrbitI18n.t("clientNext")}: <strong>${businessDate(st.next.start).split("-").reverse().join(".")} · ${time(st.next.start)}</strong> · ${escape(st.next.service_name)}` : st.last ? `${OrbitI18n.t("clientLast")}: ${businessDate(st.last).split("-").reverse().join(".")}` : OrbitI18n.t("clientNoVisits")}</p>${history ? `<ul class="client-history">${history}</ul>` : '<div class="client-history-slot"></div>'}<div class="card-buttons"><button type="button" class="primary" data-action="client-book" data-id="${escape(c.id)}">${OrbitI18n.t("m273")}</button>${!c.chat_id ? `<button type="button" class="secondary" data-action="link" data-id="${escape(c.id)}">${OrbitI18n.t("m190")}</button>` : ""}${staff ? "" : `<button type="button" class="secondary" data-action="client-edit" data-id="${escape(c.id)}">${OrbitI18n.t("clientEdit")}</button><button type="button" class="link-button danger-link" data-action="client-delete" data-id="${escape(c.id)}">${OrbitI18n.t("clientDelete")}</button>`}</div></div>`,
    async () => {},
    OrbitI18n.t("close"),
  );
}

// Human-readable shift pattern for lists and the grid.
function scheduleLabel(resource) {
  let s;
  try {
    s = OrbitStaff.normalize(resource.schedule);
  } catch {
    s = null;
  }
  if (!s) return OrbitI18n.t("staffEveryDay");
  if (s.days) {
    const names = [
      OrbitI18n.t("m046"),
      OrbitI18n.t("m047"),
      OrbitI18n.t("m048"),
      OrbitI18n.t("m049"),
      OrbitI18n.t("m050"),
      OrbitI18n.t("m051"),
      OrbitI18n.t("m052"),
    ];
    return s.days.map((d) => names[d - 1]).join(", ");
  }
  return `${s.on}/${s.off} · ${OrbitI18n.t("staffFrom")} ${s.from.split("-").reverse().join(".")}`;
}
function staffModal(id) {
  const r = data.resources.find((x) => x.id === id);
  if (!r) return;
  let s;
  try {
    s = OrbitStaff.normalize(r.schedule);
  } catch {
    s = null;
  }
  const kind = !s ? "all" : s.days ? "days" : "cycle";
  const names = [
    OrbitI18n.t("m046"),
    OrbitI18n.t("m047"),
    OrbitI18n.t("m048"),
    OrbitI18n.t("m049"),
    OrbitI18n.t("m050"),
    OrbitI18n.t("m051"),
    OrbitI18n.t("m052"),
  ];
  const absences = (data.absences || []).filter(
    (a) => a.resource_id === id && a.end_date >= businessDate(Date.now()),
  );
  modal(
    r.name,
    field(
      OrbitI18n.t("m326"),
      "name",
      "text",
      `required maxlength="120" value="${escape(r.name)}"`,
    ) +
      `<label for="field-kind">${OrbitI18n.t("staffSchedule")}</label><select id="field-kind" name="kind"><option value="all" ${kind === "all" ? "selected" : ""}>${OrbitI18n.t("staffEveryDay")}</option><option value="days" ${kind === "days" ? "selected" : ""}>${OrbitI18n.t("staffWeekdays")}</option><option value="cycle" ${kind === "cycle" ? "selected" : ""}>${OrbitI18n.t("staffCycle")}</option></select>` +
      `<div id="staff-days" ${kind === "days" ? "" : "hidden"}><div class="work-days">${names.map((n, i) => `<label class="chip"><input type="checkbox" name="staff_days" value="${i + 1}" ${s?.days?.includes(i + 1) ? "checked" : ""}><span>${n}</span></label>`).join("")}</div></div>` +
      `<div id="staff-cycle" class="form-grid three" ${kind === "cycle" ? "" : "hidden"}><div>${field(OrbitI18n.t("staffOn"), "on", "number", `min="1" max="14" value="${s?.on || 2}"`)}</div><div>${field(OrbitI18n.t("staffOff"), "off", "number", `min="1" max="14" value="${s?.off || 2}"`)}</div><div>${field(OrbitI18n.t("staffCycleStart"), "from", "date", `value="${s?.from || businessDate(Date.now())}"`)}</div></div>` +
      `<p class="hint">${OrbitI18n.t("staffScheduleHint")}</p>` +
      `<h3 class="form-section">${OrbitI18n.t("staffAbsences")}</h3>${absences.length ? `<ul class="absence-list">${absences.map((a) => `<li><span>${a.start_date.split("-").reverse().join(".")} – ${a.end_date.split("-").reverse().join(".")}${a.reason ? ` · ${escape(a.reason)}` : ""}</span><button type="button" class="link-button" data-action="absence-delete" data-id="${escape(a.id)}" data-resource="${escape(id)}">${OrbitI18n.t("catalogDelete")}</button></li>`).join("")}</ul>` : `<p class="hint">${OrbitI18n.t("staffNoAbsences")}</p>`}<button type="button" class="secondary" data-action="absence-add" data-id="${escape(id)}">${OrbitI18n.t("staffAbsenceAdd")}</button>` +
      staffPayFields(r),
    async (v) => {
      const schedule =
        v.kind === "days"
          ? {
              days: Array.from(
                document.querySelectorAll('[name="staff_days"]:checked'),
                (i) => Number(i.value),
              ),
            }
          : v.kind === "cycle"
            ? { on: Number(v.on), off: Number(v.off), from: v.from }
            : null;
      await window.orbit.call("resource:update", {
        id,
        name: v.name,
        schedule,
        ...(v.pay_percent === undefined
          ? {}
          : {
              pay_percent: Number(v.pay_percent || 0),
              pay_daily: Number(v.pay_daily || 0),
            }),
      });
      toast(OrbitI18n.t("m361"));
    },
  );
  $("#field-kind").addEventListener("change", (e) => {
    $("#staff-days").hidden = e.target.value !== "days";
    $("#staff-cycle").hidden = e.target.value !== "cycle";
  });
}
function absenceModal(resourceId) {
  const today = businessDate(Date.now());
  modal(
    OrbitI18n.t("staffAbsenceAdd"),
    `<div class="form-grid">${field(OrbitI18n.t("staffAbsenceFrom"), "start_date", "date", `required value="${today}"`)}${field(OrbitI18n.t("staffAbsenceTo"), "end_date", "date", `required value="${today}"`)}</div>` +
      `<label for="field-reason">${OrbitI18n.t("staffAbsenceReason")}</label><select id="field-reason" name="reason"><option>${OrbitI18n.t("staffVacation")}</option><option>${OrbitI18n.t("staffSick")}</option><option>${OrbitI18n.t("staffDayOff")}</option></select>` +
      `<p class="hint">${OrbitI18n.t("staffAbsenceHint")}</p>`,
    async (v) => {
      await window.orbit.call("absence:add", { ...v, resource_id: resourceId });
      const busy = data.appointments.filter(
        (a) =>
          a.status === "confirmed" &&
          (a.resources || [{ id: a.resource_id }]).some(
            (r) => r.id === resourceId,
          ) &&
          businessDate(a.start) >= v.start_date &&
          businessDate(a.start) <= v.end_date,
      );
      if (!busy.length) return toast(OrbitI18n.t("m361"));
      // Opens after this form closes: the visits that fall on the days off.
      setTimeout(() => absenceVisitsModal(resourceId, busy), 0);
    },
  );
}
function visitLine(a) {
  return `<li><span>${businessDate(a.start).split("-").reverse().join(".")} ${time(a.start)} · ${escape(a.client_name)}${a.phone ? ` · ${escape(a.phone)}` : ""} · ${escape(a.service_name)}</span></li>`;
}
// Gives each visit to someone else who provides the service, works that day and is free then.
// Time and client stay; returns the visits nobody could take.
async function moveVisits(visits, fromId, targetId) {
  const others = data.resources.filter((x) => x.id !== fromId),
    left = [];
  let moved = 0;
  for (const a of visits) {
    const service = data.services.find((s) => s.id === a.service_id),
      day = businessDate(a.start);
    const candidates = (
      targetId ? others.filter((o) => o.id === targetId) : others
    ).filter(
      (o) =>
        OrbitStaff.capable(service, o.id) &&
        OrbitStaff.works(o, day, data.absences),
    );
    const keep = (a.resources || [{ id: a.resource_id }])
      .map((x) => x.id)
      .filter((x) => x !== fromId);
    let done = false;
    for (const o of candidates) {
      if (keep.includes(o.id)) continue;
      try {
        await window.orbit.call("booking:reschedule", {
          id: a.id,
          start: a.start,
          resource_ids: [...keep, o.id],
        });
        moved++;
        done = true;
        break;
      } catch {}
    }
    if (!done) left.push(a);
  }
  return { moved, left };
}
function moveTargetField(fromId) {
  return `<label for="field-target">${OrbitI18n.t("staffMoveTo")}</label><select id="field-target" name="target"><option value="">${OrbitI18n.t("staffMoveAuto")}</option>${data.resources
    .filter((o) => o.id !== fromId)
    .map((o) => `<option value="${escape(o.id)}">${escape(o.name)}</option>`)
    .join("")}</select><p class="hint">${OrbitI18n.t("staffMoveHint")}</p>`;
}
// Visits nobody could take: the owner calls these clients.
function callClientsModal(visits, moved) {
  modal(
    OrbitI18n.t("staffCallTitle"),
    `<p>${OrbitI18n.t("staffCallHint").replace("{moved}", moved).replace("{left}", visits.length)}</p><ul class="absence-list">${visits.map(visitLine).join("")}</ul>`,
    async () => {},
    OrbitI18n.t("close"),
  );
}
function absenceVisitsModal(resourceId, visits) {
  const r = data.resources.find((x) => x.id === resourceId);
  modal(
    OrbitI18n.t("staffAbsenceVisits")
      .replace("{name}", r?.name || "")
      .replace("{n}", visits.length),
    `<p class="danger-note">${OrbitI18n.t("staffAbsenceVisitsHint")}</p><ul class="absence-list">${visits.slice(0, 10).map(visitLine).join("")}</ul>${visits.length > 10 ? `<p class="hint">+${visits.length - 10}</p>` : ""}${moveTargetField(resourceId)}`,
    async (v) => {
      const { moved, left } = await moveVisits(visits, resourceId, v.target);
      if (left.length) setTimeout(() => callClientsModal(left, moved), 0);
      else toast(OrbitI18n.t("staffMovedOnly").replace("{n}", moved));
    },
    OrbitI18n.t("staffAbsenceMove"),
  );
}
// Before archiving a person, move their future visits to someone who can take them.
function staffDeleteModal(id) {
  const r = data.resources.find((x) => x.id === id);
  const future = data.appointments.filter(
    (a) =>
      a.status === "confirmed" &&
      a.start > Date.now() &&
      (a.resources || [{ id: a.resource_id }]).some((x) => x.id === id),
  );
  modal(
    OrbitI18n.t("catalogDeleteResource"),
    `<p><strong>${escape(r.name)}</strong></p>` +
      (future.length
        ? `<p class="danger-note">${OrbitI18n.t("staffDeleteFuture").replace("{n}", future.length)}</p><ul class="absence-list">${future.slice(0, 8).map(visitLine).join("")}</ul>${future.length > 8 ? `<p class="hint">+${future.length - 8}</p>` : ""}${moveTargetField(id)}`
        : `<p>${OrbitI18n.t("catalogDeleteHint")}</p>`),
    async (v) => {
      const { moved, left } = await moveVisits(future, id, v.target);
      if (left.length) {
        await refresh();
        throw Error(
          OrbitI18n.t("staffMovePartial")
            .replace("{moved}", moved)
            .replace("{left}", left.length),
        );
      }
      await window.orbit.call("resource:delete", { id });
      toast(
        moved
          ? OrbitI18n.t("staffMovedAll").replace("{n}", moved)
          : OrbitI18n.t("m361"),
      );
    },
    OrbitI18n.t(future.length ? "staffMoveAndDelete" : "catalogDelete"),
  );
  $("#modal-submit").className = "danger";
}
const CLIENT_SOURCES = [
  "instagram",
  "google",
  "referral",
  "street",
  "ads",
  "page",
  "telegram",
  "other",
];
// Client form shared by "new client" and "edit": only the name is required. Car fields show for car services.
function clientFields(c = {}) {
  const v = (key) => `value="${escape(c[key] || "")}"`,
    pair = (a, b) =>
      `<div class="form-grid"><div>${a}</div><div>${b}</div></div>`;
  return (
    pair(
      field(
        OrbitI18n.t("m304"),
        "name",
        "text",
        `required maxlength="120" ${v("name")}`,
      ),
      field(
        OrbitI18n.t("m322"),
        "phone",
        "tel",
        `maxlength="40" ${v("phone")}`,
      ),
    ) +
    pair(
      field(
        OrbitI18n.t("clientEmail"),
        "email",
        "email",
        `maxlength="120" ${v("email")}`,
      ),
      field(
        OrbitI18n.t("clientBirthday"),
        "birthday",
        "date",
        `max="${businessDate(Date.now())}" ${v("birthday")}`,
      ),
    ) +
    (OrbitIndustries.fields(data.industry).includes("pet")
      ? field(
          OrbitI18n.t("clientPet"),
          "vehicle",
          "text",
          `maxlength="80" placeholder="${OrbitI18n.t("clientPetHint")}" ${v("vehicle")}`,
        )
      : "") +
    (OrbitIndustries.fields(data.industry).includes("vehicle")
      ? pair(
          field(
            OrbitI18n.t("clientVehicle"),
            "vehicle",
            "text",
            `maxlength="80" placeholder="${OrbitI18n.t("clientVehicleHint")}" ${v("vehicle")}`,
          ),
          field(
            OrbitI18n.t("clientPlate"),
            "plate",
            "text",
            `maxlength="20" placeholder="AA 1234 BB" ${v("plate")}`,
          ),
        )
      : "") +
    pair(
      `<label for="field-source">${OrbitI18n.t("clientSource")}</label><select id="field-source" name="source"><option value="">—</option>${CLIENT_SOURCES.map((x) => `<option value="${x}" ${c.source === x ? "selected" : ""}>${OrbitI18n.t("source_" + x)}</option>`).join("")}</select>`,
      field(
        OrbitI18n.t("clientTags"),
        "tags",
        "text",
        `maxlength="200" placeholder="${OrbitI18n.t("clientTagsHint")}" ${v("tags")}`,
      ),
    ) +
    field(
      OrbitI18n.t("clientAlert"),
      "alert",
      "text",
      `maxlength="500" placeholder="${OrbitI18n.t("clientAlertHint")}" ${v("alert")}`,
    ) +
    field(
      OrbitI18n.t("m282"),
      "notes",
      "text",
      `maxlength="2000" ${v("notes")}`,
    ) +
    discountField(c)
  );
}
// "Important" notes of the people in a visit (allergies, contraindications).
function visitAlerts(a) {
  const ids = a.clients?.length ? a.clients.map((x) => x.id) : [a.client_id];
  return data.clients
    .filter((c) => ids.includes(c.id) && c.alert)
    .map((c) => (ids.length > 1 ? `${c.name}: ${c.alert}` : c.alert));
}
const formatDay = (d) => d.split("-").reverse().join(".");
// Days until the next birthday (0 = today) and the age then; 29 February counts on the 28th.
function birthdayIn(birthday) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday || "")) return null;
  const today = businessDate(Date.now()),
    year = Number(today.slice(0, 4));
  const on = (y) => {
    const leap = new Date(Date.UTC(y, 1, 29)).getUTCMonth() === 1;
    return `${y}-${birthday.slice(5) === "02-29" && !leap ? "02-28" : birthday.slice(5)}`;
  };
  let next = on(year);
  if (next < today) next = on(year + 1);
  return {
    days: Math.round((Date.parse(next) - Date.parse(today)) / 86400000),
    age: Number(next.slice(0, 4)) - Number(birthday.slice(0, 4)),
  };
}
function clientEditModal(id) {
  const c = data.clients.find((x) => x.id === id);
  if (!c) return;
  modal(OrbitI18n.t("clientEdit"), clientFields(c), async (v) => {
    await window.orbit.call("client:update", { ...v, id });
    toast(OrbitI18n.t("m361"));
  });
}
function clientDeleteModal(id) {
  const c = data.clients.find((x) => x.id === id);
  if (!c) return;
  const visits =
    clientVisits(id).length || (c.stats ? c.stats.done + c.stats.no_show : 0);
  modal(
    OrbitI18n.t("clientDelete"),
    `<p><strong>${escape(c.name)}</strong> · ${escape(c.phone || "")}</p><p class="danger-note">${OrbitI18n.t(visits ? "clientDeleteAnon" : "clientDeleteFull")}</p>`,
    async () => {
      await window.orbit.call("client:delete", { id });
      toast(OrbitI18n.t("clientDeleted"));
    },
    OrbitI18n.t("clientDelete"),
  );
  $("#modal-submit").className = "danger";
}
function visitEditModal(id) {
  const a = data.appointments.find((x) => x.id === id);
  if (!a) return;
  modal(
    OrbitI18n.t("visitEdit"),
    `<p class="hint">${escape(a.client_name)} · ${escape(a.service_name)} · ${businessDate(a.start)} ${time(a.start)}</p><div class="form-grid">` +
      field(
        OrbitI18n.t("m280"),
        "total",
        "number",
        `required min="0" step="0.01" value="${a.price / 100}"`,
      ) +
      field(
        OrbitI18n.t("m281"),
        "cost",
        "number",
        `min="0" step="0.01" value="${(a.cost || 0) / 100}"`,
      ) +
      `</div>` +
      field(
        OrbitI18n.t("m282"),
        "notes",
        "text",
        `maxlength="2000" value="${escape(a.notes || "")}"`,
      ) +
      `<p class="hint">${OrbitI18n.t("visitEditHint")}</p>`,
    async (v) => {
      await window.orbit.call("visit:update", { ...v, id });
      toast(OrbitI18n.t("m361"));
    },
  );
}
