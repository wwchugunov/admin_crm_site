"use strict";
// Layout preferences contain only stable element IDs, never CRM records or form values.
window.OrbitLayout = (() => {
  let groups = new Map(),
    active = false,
    drag = null,
    scope = "",
    screen = "";
  const prefix = "ch.layout.v1.";
  const t = (key) => OrbitI18n.t(key);
  function read(key) {
    try {
      const value = JSON.parse(localStorage.getItem(prefix + key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    } catch {
      return {};
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(prefix + key, JSON.stringify(value));
      return true;
    } catch {
      announce(t("layoutSaveFailed"));
      return false;
    }
  }
  function announce(message) {
    document.querySelector("#layout-status").textContent = message;
  }
  function children(group) {
    return Array.from(group.parent.children).filter(
      (item) => item.dataset.layoutGroup === group.id,
    );
  }
  function addGroup(id, parent, items, storage = scope + "." + screen) {
    items = items
      .filter((item) => !item.classList.contains("layout-handle"))
      .map((item) => {
        if (!item.matches("button,input,select,textarea,a,summary"))
          return item;
        const wrapper = document.createElement("div");
        wrapper.className = "layout-control-item";
        item.replaceWith(wrapper);
        wrapper.append(item);
        return wrapper;
      });
    if (!parent || !items.length) return;
    const group = {
      id,
      parent,
      storage,
      defaults: [],
    };
    items.forEach((item, index) => {
      if (!item.hasAttribute("data-layout-default"))
        item.dataset.layoutDefault = String(index);
      const key = item.dataset.layoutKey || `${id}:${index}`;
      item.dataset.layoutKey = key;
      item.dataset.layoutGroup = id;
      item.classList.add("layout-item");
      const handle = document.createElement("button");
      handle.type = "button";
      handle.className = "layout-handle";
      handle.textContent = "⠿";
      const label =
        item
          .querySelector("h2,h3,.stat-top,.appointment-person strong,strong")
          ?.textContent.trim() || item.textContent.trim().slice(0, 70);
      handle.setAttribute("aria-label", `${t("layoutMove")}: ${label}`);
      handle.title = t("layoutMoveHint");
      // A table row keeps its valid cell structure; menu buttons have a sibling grip.
      if (item.tagName === "TR") item.firstElementChild.prepend(handle);
      else item.prepend(handle);
    });
    group.defaults = [...items]
      .sort(
        (a, b) =>
          Number(a.dataset.layoutDefault) - Number(b.dataset.layoutDefault),
      )
      .map((item) => item.dataset.layoutKey);
    groups.set(id, group);
    parent.classList.add("layout-group");
  }
  function restore(group) {
    const saved = read(group.storage)[group.id];
    if (!Array.isArray(saved)) return;
    const items = children(group),
      byKey = new Map(items.map((item) => [item.dataset.layoutKey, item]));
    const ordered = [];
    for (const key of saved) {
      if (typeof key === "string" && byKey.has(key)) {
        ordered.push(byKey.get(key));
        byKey.delete(key);
      }
    }
    ordered.push(...byKey.values());
    // Replace only sortable slots so headings, labels and table headers stay in place.
    const slots = items.map((item) => {
      const slot = document.createComment("layout-slot");
      item.replaceWith(slot);
      return slot;
    });
    slots.forEach((slot, index) => slot.replaceWith(ordered[index]));
  }
  function save(group) {
    const value = read(group.storage);
    // Keep filtered/hidden entries in the preference so search does not erase their order.
    const current = children(group).map((item) => item.dataset.layoutKey);
    const previous = Array.isArray(value[group.id])
      ? value[group.id].filter((key) => typeof key === "string")
      : [];
    const visible = new Set(current);
    let index = 0;
    const merged = previous.map((key) =>
      visible.has(key) ? current[index++] : key,
    );
    merged.push(...current.slice(index));
    value[group.id] = [...new Set(merged)].slice(-10000);
    return write(group.storage, value);
  }
  function prepare(page, data) {
    cancel();
    groups = new Map();
    scope = `${data.mode}.${data.business_id || data.installation}.${data.account?.id || "local"}.${data.role}`;
    screen = page;
    const sidebar = document.querySelector("aside"),
      nav = sidebar.querySelector("nav");
    // Refreshes rebuild the view, while the sidebar lives for the lifetime of the window.
    document.querySelectorAll(".layout-handle").forEach((el) => el.remove());
    for (const button of nav.querySelectorAll(":scope > .nav")) {
      const item = document.createElement("div");
      item.className = "layout-nav-item";
      item.dataset.layoutKey = button.dataset.page;
      button.replaceWith(item);
      item.append(button);
    }
    for (const item of nav.children)
      item.hidden = Boolean(item.querySelector(".nav")?.hidden);
    addGroup("navigation", nav, Array.from(nav.children), "navigation");
    addGroup("sidebar", sidebar, Array.from(sidebar.children), "sidebar");
    const view = document.querySelector("#view");
    addGroup(
      "heading-actions",
      document.querySelector(".heading-actions"),
      Array.from(document.querySelector(".heading-actions").children),
      scope + ".workspace",
    );
    // Register all levels before applying saved positions: keys remain based on source order.
    addGroup("screen", view, Array.from(view.children));
    const definitions = [
      ["stats", ".stats", ".stat"],
      ["columns", ".layout", null],
      ["context", ".schedule-context", null],
      ["cards", ".grid-2", null],
      ["charts", ".dashboard-panels", null],
      ["appointments", ".agenda-list", ".appointment"],
    ];
    for (const [id, selector, filter] of definitions)
      view.querySelectorAll(selector).forEach((parent, index) => {
        const items = Array.from(parent.children).filter(
          (item) => !filter || item.matches(filter),
        );
        addGroup(`${id}-${index}`, parent, items);
      });
    view
      .querySelectorAll("tbody")
      .forEach((parent, index) =>
        addGroup(`rows-${index}`, parent, Array.from(parent.children)),
      );
    view.querySelectorAll(".card").forEach((parent, index) =>
      addGroup(
        `catalog-${index}`,
        parent,
        Array.from(parent.children).filter((item) =>
          item.matches(".catalog-row"),
        ),
      ),
    );
    for (const group of groups.values()) restore(group);
    updateMode();
  }
  function updateMode() {
    document.documentElement.classList.toggle("layout-editing", active);
    const toggle = document.querySelector("#layout-toggle"),
      reset = document.querySelector("#layout-reset");
    // Idle: a quiet icon in the toolbar; while editing: a clear "Done" button.
    toggle.textContent = active ? t("layoutDone") : "⋯";
    toggle.className = active ? "primary" : "icon-button toolbar-icon";
    toggle.title = t("layoutCustomize");
    toggle.setAttribute("aria-label", t("layoutCustomize"));
    toggle.setAttribute("aria-pressed", String(active));
    reset.hidden = !active;
    if (reset.parentElement.classList.contains("layout-control-item"))
      reset.parentElement.hidden = !active;
    document.querySelector("#layout-help").hidden = !active;
    document.querySelector("#layout-help").textContent = t("layoutHelp");
  }
  function finish() {
    if (!drag) return;
    drag.item.classList.remove("layout-dragging");
    drag.preview?.remove();
    document.documentElement.classList.remove("layout-drag-active");
    drag = null;
  }
  function cancel() {
    if (!drag) return;
    if (drag.moved && drag.item.isConnected) {
      const group = drag.group;
      for (const item of drag.original) group.parent.append(item);
    }
    finish();
  }
  function move(item, target, after) {
    target[after ? "after" : "before"](item);
  }
  document.addEventListener(
    "click",
    (event) => {
      if (event.target.closest(".layout-handle")) {
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      if (event.target.closest("#layout-toggle")) {
        cancel();
        active = !active;
        updateMode();
      }
      if (event.target.closest("#layout-reset")) {
        cancel();
        for (const storage of new Set(
          Array.from(groups.values(), (group) => group.storage),
        )) {
          const value = read(storage);
          for (const group of groups.values())
            if (group.storage === storage) delete value[group.id];
          write(storage, value);
        }
        // Rebuild from source order while preserving unsaved inputs in settings.
        for (const group of groups.values()) {
          const byKey = new Map(
            children(group).map((item) => [item.dataset.layoutKey, item]),
          );
          for (const key of group.defaults)
            if (byKey.has(key)) group.parent.append(byKey.get(key));
        }
        announce(t("layoutResetDone"));
      }
    },
    true,
  );
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest(".layout-handle");
    if (!active || !handle || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const item = handle.closest(".layout-item"),
      group = groups.get(item.dataset.layoutGroup);
    drag = {
      item,
      handle,
      group,
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      original: children(group),
      moved: false,
    };
  });
  document.addEventListener(
    "pointermove",
    (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (!drag.item.isConnected) {
        finish();
        return;
      }
      if (
        !drag.moved &&
        Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5
      )
        return;
      event.preventDefault();
      if (!drag.moved) {
        drag.moved = true;
        const rect = drag.item.getBoundingClientRect();
        drag.preview = drag.item.cloneNode(true);
        drag.preview.removeAttribute("id");
        drag.preview
          .querySelectorAll("[id]")
          .forEach((el) => el.removeAttribute("id"));
        drag.preview.classList.add("layout-drag-preview");
        drag.preview.setAttribute("aria-hidden", "true");
        drag.preview.inert = true;
        drag.preview.style.width = `${Math.min(rect.width, 400)}px`;
        document.body.append(drag.preview);
        drag.item.classList.add("layout-dragging");
        document.documentElement.classList.add("layout-drag-active");
      }
      drag.preview.style.left = `${Math.min(event.clientX + 14, innerWidth - Math.min(drag.item.offsetWidth, 400) - 8)}px`;
      drag.preview.style.top = `${Math.min(event.clientY + 12, innerHeight - 90)}px`;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      let target = under?.closest(".layout-item");
      while (target && target.dataset.layoutGroup !== drag.group.id)
        target = target.parentElement.closest(".layout-item");
      if (target && target !== drag.item) {
        const rect = target.getBoundingClientRect();
        const sourceRect = drag.item.getBoundingClientRect();
        const sameRow =
          Math.abs(sourceRect.top - rect.top) <
          Math.min(rect.height, sourceRect.height) / 2;
        const after = sameRow
          ? event.clientX > rect.left + rect.width / 2
          : event.clientY > rect.top + rect.height / 2;
        move(drag.item, target, after);
      }
      const scrollArea = under?.closest("aside") || document.scrollingElement;
      const rect =
        scrollArea === document.scrollingElement
          ? { top: 0, bottom: innerHeight }
          : scrollArea.getBoundingClientRect();
      if (event.clientY < rect.top + 45) scrollArea.scrollBy(0, -14);
      if (event.clientY > rect.bottom - 45) scrollArea.scrollBy(0, 14);
    },
    { passive: false },
  );
  document.addEventListener("pointerup", (event) => {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const { group, handle, moved } = drag;
    const saved = moved && save(group);
    finish();
    handle.focus({ preventScroll: true });
    if (saved) announce(t("layoutSaved"));
  });
  document.addEventListener("pointercancel", cancel);
  window.addEventListener("blur", cancel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && drag) {
      event.preventDefault();
      cancel();
      return;
    }
    const handle = event.target.closest(".layout-handle");
    if (
      !active ||
      !handle ||
      ![
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
      ].includes(event.key)
    )
      return;
    event.preventDefault();
    event.stopPropagation();
    const item = handle.closest(".layout-item"),
      group = groups.get(item.dataset.layoutGroup),
      items = children(group).filter(
        (el) => !el.hidden && getComputedStyle(el).display !== "none",
      ),
      index = items.indexOf(item);
    const destination =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : index + (["ArrowUp", "ArrowLeft"].includes(event.key) ? -1 : 1);
    if (destination < 0 || destination >= items.length || destination === index)
      return;
    move(item, items[destination], destination > index);
    const saved = save(group);
    handle.focus({ preventScroll: true });
    if (saved) announce(t("layoutSaved"));
  });
  return {
    prepare,
    get editing() {
      return active;
    },
  };
})();
