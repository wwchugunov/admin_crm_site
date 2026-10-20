"use strict";
// Day grid: positions bookings by time (the page CSP forbids inline style
// attributes, so geometry is applied here) and turns clicks on free time into
// a new booking for that specialist and time.
window.OrbitScheduleGrid = (() => {
  const HOUR = 72;
  const STEP = 15;
  const pad = (n) => String(n).padStart(2, "0");
  const label = (minutes) =>
    `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
  function geometry(grid) {
    return { from: Number(grid.dataset.from), to: Number(grid.dataset.to) };
  }
  function layout() {
    const grid = document.querySelector(".day-grid");
    if (!grid) return;
    const { from, to } = geometry(grid);
    grid.style.setProperty("--columns", grid.dataset.columns);
    grid.style.setProperty("--hour", HOUR + "px");
    const body = grid.querySelector(".day-grid-body");
    body.style.height = ((to - from) / 60) * HOUR + "px";
    for (const mark of grid.querySelectorAll(".grid-times span"))
      mark.style.top = ((Number(mark.dataset.min) - from) / 60) * HOUR + "px";
    for (const event of grid.querySelectorAll(".grid-event")) {
      const start = Number(event.dataset.startMin),
        end = Math.max(start + STEP, Number(event.dataset.endMin));
      event.style.top = ((start - from) / 60) * HOUR + 2 + "px";
      event.style.height = Math.max(26, ((end - start) / 60) * HOUR - 4) + "px";
      event.classList.toggle("compact", end - start < 45);
      // 45–59 minutes: three tight lines still fit (time, client, service).
      event.classList.toggle("short", end - start >= 45 && end - start < 60);
    }
    now();
    const scroll = grid.querySelector(".day-grid-scroll");
    if (!grid.dataset.scrolled) {
      grid.dataset.scrolled = "1";
      const marker =
        grid.querySelector(".grid-now:not([hidden])") ||
        grid.querySelector(".grid-event");
      if (marker) scroll.scrollTop = Math.max(0, marker.offsetTop - HOUR);
    }
  }
  function now() {
    const grid = document.querySelector(".day-grid"),
      line = grid?.querySelector(".grid-now");
    if (!line) return;
    const { from, to } = geometry(grid),
      minutes = dayMinutes(Date.now());
    const today = selectedDate === businessDate(Date.now());
    line.hidden = !today || minutes < from || minutes > to;
    line.style.top = ((minutes - from) / 60) * HOUR + "px";
  }
  function minutesAt(column, clientY) {
    const grid = column.closest(".day-grid"),
      { from, to } = geometry(grid),
      rect = column.getBoundingClientRect();
    const raw = from + ((clientY - rect.top) / HOUR) * 60;
    return Math.max(from, Math.min(to - STEP, Math.floor(raw / STEP) * STEP));
  }
  document.addEventListener("mousemove", (event) => {
    const column = event.target.closest?.(".grid-column");
    const hover = document.querySelector(".grid-hover");
    if (!hover) return;
    if (!column || event.target.closest(".grid-event")) {
      hover.hidden = true;
      return;
    }
    const grid = column.closest(".day-grid"),
      { from } = geometry(grid),
      minutes = minutesAt(column, event.clientY);
    hover.hidden = false;
    hover.textContent = "+ " + label(minutes);
    hover.style.top = ((minutes - from) / 60) * HOUR + "px";
    hover.style.left = column.offsetLeft + 4 + "px";
    hover.style.width = column.offsetWidth - 8 + "px";
  });
  document.addEventListener(
    "mouseleave",
    () => {
      const hover = document.querySelector(".grid-hover");
      if (hover) hover.hidden = true;
    },
    true,
  );
  document.addEventListener("click", (event) => {
    const column = event.target.closest(".grid-column");
    if (!column || event.target.closest(".grid-event")) return;
    if (data.integrations?.license?.mode === "locked") return;
    const minutes = minutesAt(column, event.clientY);
    run(() =>
      bookingModal({
        resourceId: column.dataset.resource,
        time: label(minutes),
      }),
    );
  });
  setInterval(now, 60000);
  return { layout };
})();
