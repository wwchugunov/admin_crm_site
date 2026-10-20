"use strict";
const actions = {
  "dashboard-mode": (b) => {
    dashboardMode = b.dataset.mode;
    render();
  },
  login: loginModal,
  privacy: () => window.orbit.call("legal:privacy", OrbitI18n.language),
  offer: () => window.orbit.call("legal:offer"),
  "legal-accept": async () => {
    legalState = await window.orbit.call("legal:accept", {
      offer_version: legalState?.offer?.version,
      privacy_version: legalState?.privacy?.version,
    });
    toast(OrbitI18n.t("legalAccepted"));
    render();
  },
  register: registrationModal,
  "forgot-password": forgotPasswordModal,
  // Renewal goes to the LOMVIKO team as a billing request; the reply brings the payment details.
  "subscription-extend": () =>
    supportModal("", "", {
      topic: "billing",
      message: OrbitI18n.t("subscriptionRequest").replace("{business}", data?.business || ""),
    }),
  welcome: () => OrbitWelcome.start(),
  logo: async () => {
    const logo = await window.orbit.call("branding:select");
    if (!logo) return;
    selectedLogo = logo;
    const row = $(".logo-row");
    if (row) {
      let image = row.querySelector("img");
      if (!image) {
        image = document.createElement("img");
        image.className = "logo-preview";
        image.alt = OrbitI18n.t("m037");
        row.prepend(image);
      }
      image.src = logo;
    }
  },
  "service-delete": (b) => {
    const service = data.services.find((s) => s.id === b.dataset.id);
    modal(
      OrbitI18n.t("catalogDeleteService"),
      `<p><strong>${escape(service.name)}</strong></p><p>${OrbitI18n.t("catalogDeleteHint")}</p>`,
      () => window.orbit.call("service:delete", { id: service.id }),
      OrbitI18n.t("catalogDelete"),
    );
  },
  "resource-delete": (b) => staffDeleteModal(b.dataset.id),
  "service-edit": (b) => {
    const s = data.services.find((s) => s.id === b.dataset.id);
    modal(OrbitI18n.t("m299"), serviceFields(s), (v) =>
      window.orbit.call("service:update", {
        ...v,
        id: s.id,
        resource_ids: v.resource_ids || [],
      }),
    );
  },
  "staff-edit": (b) => staffModal(b.dataset.id),
  "absence-add": (b) => {
    closeModal();
    absenceModal(b.dataset.id);
  },
  "absence-delete": async (b) => {
    await window.orbit.call("absence:delete", { id: b.dataset.id });
    await refresh();
    staffModal(b.dataset.resource);
  },
  "client-edit": (b) => {
    closeModal();
    clientEditModal(b.dataset.id);
  },
  "client-delete": (b) => {
    closeModal();
    clientDeleteModal(b.dataset.id);
  },
  "visit-edit": (b) => visitEditModal(b.dataset.id),
  payment: (b) => {
    const a = data.appointments.find((x) => x.id === b.dataset.id);
    if (a) paymentModal(a, false);
  },
  "complete-pay": (b) => {
    const a = data.appointments.find((x) => x.id === b.dataset.id);
    if (a) paymentModal(a, true);
  },
  "support-thread": (b) => supportThreadModal(b.dataset.id),
  "support-follow": (b) => {
    closeModal();
    return supportModal("", b.dataset.id);
  },
  "support-rate": async (b) => {
    await window.orbit.call("support:rate", {
      id: b.dataset.id,
      rating: b.dataset.rating,
    });
    toast(OrbitI18n.t("supportRateThanks"));
    await loadSupport();
    supportThreadModal(b.dataset.id);
  },
  support: (b) => {
    const error = b.dataset.fromError ? lastError : "";
    $("#toast").hidePopover?.();
    $("#toast").style.display = "none";
    return supportModal(error);
  },
  "zone-fix": async (b) => {
    await window.orbit.call("settings:save", {
      business: data.business,
      industry: data.industry,
      timezone: b.dataset.zone,
    });
    toast(OrbitI18n.t("zoneMismatchDone"));
    await refresh();
  },
  "zone-keep": (b) => {
    try {
      localStorage.setItem("lomviko.zone.keep", b.dataset.key);
    } catch {}
    render();
  },
  "mono-invoice": (b) => {
    const a = data.appointments.find((x) => x.id === b.dataset.id);
    if (a) payInvoiceModal(a);
  },
  "mono-show": (b) => {
    const link = openPayLink(b.dataset.id);
    if (link) payLinkModal(link.appointment_id, link.url, link.amount, false);
  },
  "pay-copy": async () => {
    const input = $("#field-pay-url");
    try {
      await navigator.clipboard.writeText(input.value);
      toast(OrbitI18n.t("payCopied"));
    } catch {
      input.select();
    }
  },
  "pay-cancel": async (b) => {
    const provider =
      openPayLink(b.dataset.id)?.provider === "liqpay" ? "liqpay" : "monobank";
    await window.orbit.call(`${provider}:cancel`, {
      appointment_id: b.dataset.id,
    });
    closeModal();
    toast(OrbitI18n.t("payCancelled"));
    await refresh();
  },
  "mono-connect": () =>
    modal(
      OrbitI18n.t("payMonoConnect"),
      `<p class="hint">${OrbitI18n.t("payMonoTokenHint")}</p>` +
        field(
          OrbitI18n.t("payMonoToken"),
          "token",
          "password",
          'required autocomplete="off" spellcheck="false" maxlength="200"',
        ) +
        `<p class="hint">${OrbitI18n.t("payMonoLegal")}</p>`,
      async (v) => {
        const r = await window.orbit.call("monobank:connect", v.token);
        toast(`${OrbitI18n.t("payMonoDone")}: ${r.merchant}`);
      },
      OrbitI18n.t("payMonoConnect"),
    ),
  "liqpay-connect": () =>
    modal(
      OrbitI18n.t("payLiqConnect"),
      `<p class="hint">${OrbitI18n.t("payLiqHint")}</p>` +
        field(
          OrbitI18n.t("payLiqPublic"),
          "public_key",
          "text",
          'required autocomplete="off" spellcheck="false" maxlength="64"',
        ) +
        field(
          OrbitI18n.t("payLiqPrivate"),
          "private_key",
          "password",
          'required autocomplete="off" spellcheck="false" maxlength="128"',
        ) +
        `<p class="hint">${OrbitI18n.t("payLiqLegal")}</p>`,
      async (v) => {
        const r = await window.orbit.call("liqpay:connect", {
          public_key: v.public_key,
          private_key: v.private_key,
        });
        toast(`${OrbitI18n.t("payLiqDone")}: ${r.merchant}`);
      },
      OrbitI18n.t("payLiqConnect"),
    ),
  "liqpay-off": async () => {
    await window.orbit.call("liqpay:disconnect");
    toast(OrbitI18n.t("payLiqOff"));
    await refresh();
  },
  "mono-off": async () => {
    await window.orbit.call("monobank:disconnect");
    toast(OrbitI18n.t("payMonoOff"));
    await refresh();
  },
  reschedule: (b) => {
    const a = data.appointments.find((x) => x.id === b.dataset.id);
    if (a) rescheduleModal(a);
  },
  "account-delete": () => {
    modal(
      OrbitI18n.t("accountDelete"),
      `<p class="danger-note">${OrbitI18n.t(data.role === "owner" ? "accountDeleteOwner" : "accountDeleteMember")}</p>` +
        field(
          OrbitI18n.t("accountDeletePassword"),
          "password",
          "password",
          'required maxlength="128" autocomplete="current-password"',
        ) +
        `<label class="checkbox-line"><input type="checkbox" name="confirm" required>${OrbitI18n.t("accountDeleteConfirm")}</label>`,
      async (v) => {
        await window.orbit.call("account:delete", v.password);
        team = [];
        data = null;
        await refresh();
        toast(OrbitI18n.t("accountDeleted"));
      },
      OrbitI18n.t("accountDelete"),
    );
    $("#modal-submit").className = "danger";
  },
  "layout-start": () => $("#layout-toggle").click(),
  "settings-section": (b) => {
    settingsSection = b.dataset.section;
    render();
    if (settingsSection === "support")
      loadSupport().then(
        () =>
          page === "settings" &&
          settingsSection === "support" &&
          !$("#modal").open &&
          render(),
      );
  },
  "client-card": (b) => clientModal(b.dataset.id),
  waitlist: () => waitlistModal(),
  "wait-book": (b) => {
    const w = (data.waitlist || []).find((x) => x.id === b.dataset.id);
    if (!w) return;
    closeModal();
    bookingModal({
      clientId: w.client_id,
      serviceId: w.service_id,
      resourceId: w.resource_id || undefined,
      date: w.date,
      time: w.wanted ? time(w.wanted) : undefined,
      waitId: w.id,
    });
  },
  "wait-remove": async (b) => {
    await window.orbit.call("waitlist:remove", { id: b.dataset.id });
    closeModal();
    await refresh();
    waitlistModal();
  },
  "client-filter": (b) => {
    clientFilter = ["lapsed", "birthdays"].includes(b.dataset.filter)
      ? b.dataset.filter
      : "all";
    render();
  },
  "lapsed-invite": async (b) => {
    await window.orbit.call("lapsed:invite", b.dataset.id);
    toast(OrbitI18n.t("lapsedSent"));
    await refresh();
  },
  "client-open": (b) => clientModal(b.dataset.id),
  "client-book": (b) => {
    closeModal();
    bookingModal({ clientId: b.dataset.id });
  },
  "team-refresh": async () => {
    team = await window.orbit.call("account:users");
    render();
  },
  "team-add": () =>
    modal(
      OrbitI18n.t("m303"),
      field(OrbitI18n.t("m304"), "name", "text", 'required maxlength="120"') +
        field(OrbitI18n.t("m294"), "email", "email", "required") +
        field(
          OrbitI18n.t("m305"),
          "password",
          "password",
          'required minlength="12" maxlength="128" autocomplete="new-password"',
        ) +
        `<label>${OrbitI18n.t("m306")}</label><select name="role"><option value="staff">${OrbitI18n.t("m132")}</option><option value="admin">${OrbitI18n.t("m131")}</option></select>`,
      async (v) => {
        await window.orbit.call("account:user:add", v);
        team = await window.orbit.call("account:users");
      },
    ),
  "team-edit": (b) => {
    const u = team.find((u) => u.id === b.dataset.id);
    modal(
      OrbitI18n.t("m307"),
      `<p class="hint">${escape(u.name)} · ${escape(u.email)}</p><label>${OrbitI18n.t("m306")}</label><select name="role"><option value="staff" ${u.role === "staff" ? "selected" : ""}>${OrbitI18n.t("m132")}</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>${OrbitI18n.t("m131")}</option></select><label>${OrbitI18n.t("m308")}</label><select name="stage"><option value="active">${OrbitI18n.t("m309")}</option><option value="blocked" ${u.stage === "blocked" ? "selected" : ""}>${OrbitI18n.t("m135")}</option></select>` +
        field(
          OrbitI18n.t("m310"),
          "password",
          "password",
          'minlength="12" maxlength="128" autocomplete="new-password"',
        ),
      async (v) => {
        await window.orbit.call("account:user:update", { ...v, id: u.id });
        team = await window.orbit.call("account:users");
      },
    );
  },
  "business-add": () =>
    modal(
      OrbitI18n.t("m311"),
      field(OrbitI18n.t("m260"), "name", "text", 'required maxlength="120"'),
      async (v) => {
        const result = await window.orbit.call("account:business:add", v.name);
        await window.orbit.call("account:business", result.value);
        team = [];
        toast(OrbitI18n.t("m312"));
      },
    ),
  "telegram-check": async () => {
    const result = await window.orbit.call("telegram:check");
    const value = result.value || result;
    toast(`${OrbitI18n.t("m313")}${value.username} ${OrbitI18n.t("m314")}`);
  },
  book: bookingModal,
  client: () =>
    modal(OrbitI18n.t("m321"), clientFields(), (values) =>
      window.orbit.call("client:add", values),
    ),
  service: () =>
    modal(OrbitI18n.t("m324"), serviceFields(), (values) =>
      window.orbit.call("service:add", {
        ...values,
        resource_ids: values.resource_ids || [],
      }),
    ),
  resource: () =>
    modal(
      OrbitI18n.t("m325"),
      field(OrbitI18n.t("m326"), "name", "text", 'required maxlength="120"'),
      (values) => window.orbit.call("resource:add", values),
    ),
  telegram: () =>
    modal(
      OrbitI18n.t("m327"),
      `<p class="hint">${OrbitI18n.t("m328")}</p>` +
        field(
          OrbitI18n.t("m329"),
          "token",
          "password",
          'required autocomplete="off" spellcheck="false"',
        ),
      async (v) => {
        await window.orbit.call("telegram:connect", v.token);
        toast(OrbitI18n.t("m330"));
      },
      OrbitI18n.t("m320"),
    ),
  "telegram-off": async () => {
    await window.orbit.call("telegram:disconnect");
    toast(OrbitI18n.t("m331"));
    await refresh();
  },
  "export-json": async () => {
    if (await window.orbit.call("export", "json")) toast(OrbitI18n.t("m341"));
  },
  "export-csv": async () => {
    if (await window.orbit.call("export", "csv")) toast(OrbitI18n.t("m342"));
  },
  backup: () =>
    modal(
      OrbitI18n.t("m250"),
      field(
        OrbitI18n.t("m343"),
        "password",
        "password",
        'required minlength="12" maxlength="1024" autocomplete="new-password"',
      ) + `<p class="hint">${OrbitI18n.t("m344")}</p>`,
      async (v) => {
        if (await window.orbit.call("export", "orbit", v.password))
          toast(OrbitI18n.t("m339"));
      },
      OrbitI18n.t("m345"),
    ),
  link: async (button) => {
    const link = await window.orbit.call("telegram:link", button.dataset.id);
    modal(
      OrbitI18n.t("m355"),
      field(
        OrbitI18n.t("m356"),
        "link",
        "text",
        `readonly value="${escape(link)}"`,
      ) + `<p class="hint">${OrbitI18n.t("m357")}</p>`,
      () => {},
      OrbitI18n.t("m336"),
    );
  },
  complete: async (b) => {
    await window.orbit.call("booking:status", b.dataset.id, "completed");
    await refresh();
  },
  "cancel-booking": (b) =>
    modal(
      OrbitI18n.t("m358"),
      `<p>${OrbitI18n.t("m359")}</p>`,
      async () =>
        window.orbit.call("booking:status", b.dataset.id, "cancelled"),
      OrbitI18n.t("m360"),
    ),
  "no-show": async (b) => {
    await window.orbit.call("booking:status", b.dataset.id, "no_show");
    await refresh();
  },
  "schedule-mode": (b) => {
    scheduleMode = b.dataset.mode === "list" ? "list" : "grid";
    try {
      localStorage.setItem("lomviko.schedule.mode", scheduleMode);
    } catch {}
    render();
  },
  "schedule-today": () => {
    selectedDate = businessDate(Date.now());
    render();
  },
  "welcome-skip": () => closeModal(),
  "go-catalog": () => {
    page = "catalog";
    render();
  },
  "appointment-open": (b) => appointmentModal(b.dataset.id),
  // Actions started from the booking card close the card first.
  "appointment-act": async (b) => {
    closeModal();
    await actions[b.dataset.act]?.(b);
  },
  "go-integrations": () => {
    page = "integrations";
    render();
  },
  "schedule-day": (b) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.dataset.date)) return;
    selectedDate = b.dataset.date;
    render();
    document
      .querySelector(".week-day.selected")
      ?.focus({ preventScroll: true });
  },
  "day-prev": () => moveDay(-1),
  "day-next": () => moveDay(1),
};
function moveDay(amount) {
  const d = new Date(`${selectedDate}T12:00:00`);
  d.setDate(d.getDate() + amount);
  selectedDate = dateKey(d);
  render();
}
document.addEventListener("click", (event) => {
  const nav = event.target.closest("[data-page]");
  if (nav) {
    page = nav.dataset.page;
    render();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (button && !button.disabled)
    run(() => actions[button.dataset.action]?.(button));
});
document.addEventListener("change", (event) => {
  if (event.target.id === "lapsed-days") {
    run(async () => {
      await window.orbit.call("lapsed:days", Number(event.target.value));
      await refresh();
    });
    return;
  }
  if (event.target.id === "dashboard-period") {
    const v = event.target.value;
    try {
      OrbitAnalytics.period(dashboardMode, v, data.timezone);
      dashboardDate =
        dashboardMode === "day"
          ? v
          : dashboardMode === "month"
            ? v + "-01"
            : v + "-01-01";
      render();
    } catch (e) {
      toast(e.message, true);
    }
    return;
  }
  if (
    event.target.id === "schedule-date" &&
    /^\d{4}-\d{2}-\d{2}$/.test(event.target.value)
  ) {
    selectedDate = event.target.value;
    render();
  }
  if (event.target.id === "finance-month") {
    financeMonth = event.target.value;
    render();
  }
  if (event.target.id === "business-selector")
    run(async () => {
      await window.orbit.call("account:business", event.target.value);
      team = [];
      selectedLogo = undefined;
      await refresh();
    });
  if (
    ["field-service_id", "field-client_ids", "field-people_count"].includes(
      event.target.id,
    ) &&
    $("#field-people_count")
  ) {
    const s = data.services.find((s) => s.id === $("#field-service_id").value),
      count = $("#field-client_ids").selectedOptions.length;
    $("#field-people_count").max = s.capacity;
    $("#field-people_count").value = Math.max(
      count,
      Math.min(Number($("#field-people_count").value), s.capacity),
    );
    $("#field-total").value =
      (s.price / 100) * Number($("#field-people_count").value);
    if (event.target.id === "field-service_id") syncBookingStaff(true);
  }
});
document.addEventListener("input", (event) => {
  if (event.target.id === "client-search") {
    const position = event.target.selectionStart;
    search = event.target.value;
    render();
    $("#client-search").focus();
    $("#client-search").setSelectionRange(position, position);
  }
});
document.addEventListener("submit", (event) => {
  if (event.target.id === "settings-form") {
    event.preventDefault();
    run(async () => {
      await window.orbit.call(
        "settings:save",
        profileValues(new FormData(event.target)),
      );
      selectedLogo = undefined;
      toast(OrbitI18n.t("m361"));
      await refresh();
    });
  }
});
$("#account-entry").onclick = () => {
  if (data?.mode === "server")
    run(async () => {
      await window.orbit.call("account:logout");
      team = [];
      data = null;
      await refresh();
    });
  else loginModal();
};
$("#new-booking").addEventListener("click", bookingModal);
$("#close-modal").addEventListener("click", closeModal);
$("#cancel-modal").addEventListener("click", closeModal);
$("#modal").addEventListener("cancel", (event) => {
  event.preventDefault();
  if (!$("#modal-submit").disabled) closeModal();
});
$("#modal-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.target);
  let values = $('#modal-fields [name="work_days"]')
    ? profileValues(form)
    : Object.fromEntries(form);
  for (const name of ["client_ids", "resource_ids"])
    if (form.has(name)) values[name] = form.getAll(name);
  for (const name of ["bot_visible", "web_visible"])
    if ($(`#modal-fields [name="${name}"]`)) values[name] = form.has(name);
  values = serviceExtraValues(values);
  $("#modal-submit").disabled = true;
  $("#cancel-modal").disabled = true;
  $("#close-modal").disabled = true;
  try {
    if (data?.offline && modalNeedsConnection) throw Error(OrbitI18n.t("m362"));
    await onSubmit(values);
    closeModal();
    await refresh();
  } catch (e) {
    if (!e.signedOut) toast(e.message, true);
  } finally {
    $("#modal-submit").disabled = false;
    $("#cancel-modal").disabled = false;
    $("#close-modal").disabled = false;
  }
});
run(async () => {
  await refresh();
  loadSupport();
  loadLegal();
});
setInterval(() => {
  run(() =>
    refresh({
      preserveView:
        OrbitLayout.editing ||
        $("#modal").open ||
        page === "settings" ||
        ["INPUT", "TEXTAREA", "SELECT"].includes(
          document.activeElement?.tagName,
        ),
    }),
  );
}, 15000);
// New replies from the LOMVIKO team.
setInterval(() => {
  loadSupport();
  loadLegal();
}, 120000);
