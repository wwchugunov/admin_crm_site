"use strict";
document.documentElement.classList.add(
  /Mac/.test(navigator.userAgent) ? "platform-mac" : "platform-win",
);
// Focus rings are for keyboard users: Tab turns them on, any mouse press turns them off.
document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Tab")
      document.documentElement.classList.add("keyboard-nav");
  },
  true,
);
document.addEventListener(
  "pointerdown",
  () => document.documentElement.classList.remove("keyboard-nav"),
  true,
);
// Run once per window, after the saved layout has been applied.
window.OrbitStartup = (() => {
  let played = false;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function play() {
    if (played) return;
    played = true;
    if (reduced.matches || typeof Element.prototype.animate !== "function")
      return;
    const animations = [];
    const visible = (element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        rect.top < innerHeight &&
        rect.bottom > 0
      );
    };
    const animate = (element, x, y, delay) => {
      if (!visible(element)) return;
      const rect = element.getBoundingClientRect();
      x = innerWidth / 2 - (rect.left + rect.width / 2);
      y = innerHeight / 2 - (rect.top + rect.height / 2);
      animations.push(
        element.animate(
          [
            { opacity: 0, transform: `translate(${x}px, ${y}px) scale(.72)` },
            { opacity: 1, transform: "translate(0, 0) scale(1)" },
          ],
          {
            duration: 920,
            delay,
            easing: "cubic-bezier(.22, 1, .36, 1)",
            fill: "backwards",
          },
        ),
      );
    };
    document
      .querySelectorAll(
        "aside .brand, aside .workspace, aside .nav, aside .desktop-controls, aside .sidebar-bottom",
      )
      .forEach((element, index) =>
        animate(element, -22, 4, Math.min(index * 35, 280)),
      );
    document
      .querySelectorAll(
        "main .app-toolbar, #view .stat, #view .panel, #view .card, #view .callout",
      )
      .forEach((element, index) =>
        animate(element, 0, 26, 90 + Math.min(index * 55, 330)),
      );
    document
      .querySelectorAll("#view .appointment, #view .catalog-row")
      .forEach((element, index) =>
        animate(element, 12, 12, 180 + Math.min(index * 35, 280)),
      );
    // Interaction always takes priority over the entrance effect.
    const finish = (event) =>
      animations.forEach((animation) => {
        // Do not move a pressed control before its click has been delivered.
        if (
          event?.type === "pointerdown" &&
          animation.effect?.target?.contains(event.target)
        )
          return;
        if (
          animation.playState !== "finished" &&
          animation.playState !== "idle"
        )
          animation.finish();
      });
    const onPreference = (event) => {
      if (event.matches) finish();
    };

    document.addEventListener("pointerdown", finish, { capture: true });
    document.addEventListener("click", finish, { capture: true });
    document.addEventListener("keydown", finish, { capture: true });
    reduced.addEventListener("change", onPreference);
    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      () => {
        document.removeEventListener("pointerdown", finish, { capture: true });
        document.removeEventListener("click", finish, { capture: true });
        document.removeEventListener("keydown", finish, { capture: true });
        reduced.removeEventListener("change", onPreference);
      },
    );
  }
  return { play };
})();
