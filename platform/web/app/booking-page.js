"use strict";
// "Онлайн-запис": the company's booking page (lomviko.com/b/<address>) with its own logo, cover,
// colour and style. The owner shares it as a link, a QR code or a "Записатися" button for any website.
const BOOKING_STYLES = ["minimal", "warm", "lux", "bright"];
const BOOKING_COLORS = [
  "#0a8f74",
  "#d6336c",
  "#c9a45c",
  "#2f9e77",
  "#e8590c",
  "#1c7ed6",
  "#212529",
];
let bookingImages = {};
function bookingInfo() {
  return data.integrations?.booking || null;
}
// "Студія Олени" → "studiia-oleny": a readable address suggestion from the company name.
function bookingSlug(name) {
  const map = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ie",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "i",
    й: "i",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "iu",
    я: "ia",
    ы: "y",
    э: "e",
    ё: "io",
    ъ: "",
  };
  const slug = String(name || "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug.length >= 3 ? slug : "";
}
// Pictures are made smaller here so pages open fast on a phone: logo 400 px, cover 1600 px wide.
async function bookingPicture(kind) {
  const source = await window.orbit.call("branding:select");
  if (!source) return null;
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(Error(OrbitI18n.t("m512")));
    img.src = source;
  });
  const max = kind === "logo" ? 400 : 1600,
    scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
  return kind === "logo"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.85);
}
function bookingEmbed(b) {
  const origin = b.base.replace(/\/b\/$/, "");
  return `<script src="${origin}/b/embed.js" data-salon="${b.slug}" data-color="${b.color}" async></script>`;
}
function bookingImageRow(kind, has) {
  const label = OrbitI18n.t(kind === "logo" ? "bookLogo" : "bookCover"),
    pending = bookingImages[kind],
    shown = pending === null ? false : pending || has;
  const preview = pending
    ? `<img class="booking-${kind}-preview" alt="" src="${escape(pending)}">`
    : shown && kind === "logo" && data.logo
      ? `<img class="booking-logo-preview" alt="" src="${escape(data.logo)}">`
      : shown
        ? `<span class="hint">${OrbitI18n.t("bookImageSet")}</span>`
        : `<span class="hint">${OrbitI18n.t("bookImageNone")}</span>`;
  return `<div class="booking-image" data-kind="${kind}"><label>${label}</label><div class="booking-image-row">${preview}<button type="button" class="secondary" data-action="booking-image" data-kind="${kind}">${OrbitI18n.t("bookImageUpload")}</button>${shown ? `<button type="button" class="link-button" data-action="booking-image-clear" data-kind="${kind}">${OrbitI18n.t("bookImageRemove")}</button>` : ""}</div><p class="hint">${OrbitI18n.t(kind === "logo" ? "bookLogoHint" : "bookCoverHint")}</p></div>`;
}
function bookingSettingsModal() {
  const b = bookingInfo();
  if (!b) return toast(OrbitI18n.t("payNeedsAccount"), true);
  bookingImages = {};
  const slug = b.slug || bookingSlug(data.business),
    visible = data.services.filter((s) => s.web_visible).length;
  const styles = BOOKING_STYLES.map(
    (s) =>
      `<label class="booking-style booking-style-${s}"><input type="radio" name="style" value="${s}" ${b.style === s ? "checked" : ""}><span class="booking-style-sample"><i></i><b></b><em></em></span><span>${OrbitI18n.t("bookStyle_" + s)}</span></label>`,
  ).join("");
  const colors = BOOKING_COLORS.map(
    (c, i) =>
      `<label class="booking-swatch swatch-${i}" title="${c}"><input type="radio" name="color" value="${c}" ${b.color === c ? "checked" : ""}><span></span></label>`,
  ).join("");
  const custom = !BOOKING_COLORS.includes(b.color);
  modal(
    OrbitI18n.t("bookTitle"),
    `<label class="checkbox-line"><input type="checkbox" name="enabled" ${b.enabled || !b.slug ? "checked" : ""}> ${OrbitI18n.t("bookEnabled")}</label>` +
      (visible
        ? ""
        : `<p class="hint warning">${OrbitI18n.t("bookNoServices")}</p>`) +
      `<label for="field-slug">${OrbitI18n.t("bookAddress")}</label><div class="booking-address"><span>${escape(b.base || "lomviko.com/b/")}</span><input id="field-slug" name="slug" required minlength="3" maxlength="40" pattern="[a-z0-9-]{3,40}" spellcheck="false" autocomplete="off" value="${escape(slug)}"></div><p class="hint">${OrbitI18n.t("bookAddressHint")}</p>` +
      `<label>${OrbitI18n.t("bookStyle")}</label><div class="booking-styles">${styles}</div>` +
      `<label>${OrbitI18n.t("bookColor")}</label><div class="booking-colors">${colors}<label class="booking-swatch custom" title="${OrbitI18n.t("bookColorOwn")}"><input type="radio" name="color" value="custom" ${custom ? "checked" : ""}><input type="color" name="color_custom" value="${escape(custom ? b.color : "#7048e8")}" aria-label="${OrbitI18n.t("bookColorOwn")}"></label></div>` +
      bookingImageRow("logo", b.logo) +
      bookingImageRow("cover", b.cover) +
      `<label for="field-about">${OrbitI18n.t("bookAbout")}</label><textarea id="field-about" name="about" rows="2" maxlength="400" placeholder="${escape(OrbitI18n.t("bookAboutHint"))}">${escape(b.about)}</textarea>` +
      field(
        OrbitI18n.t("bookInstagram"),
        "instagram",
        "text",
        `maxlength="60" placeholder="studio.olena" value="${escape(b.instagram)}"`,
      ) +
      `<p class="hint">${OrbitI18n.t("bookProfileHint")}</p>`,
    async (v) => {
      const payload = {
        enabled: v.enabled === "on",
        slug: String(v.slug || "")
          .trim()
          .toLowerCase(),
        style: v.style,
        color: v.color === "custom" ? v.color_custom : v.color,
        about: v.about || "",
        instagram: v.instagram || "",
      };
      if ("logo" in bookingImages) payload.logo = bookingImages.logo;
      if ("cover" in bookingImages) payload.cover = bookingImages.cover;
      const saved = await window.orbit.call("booking:save", payload);
      bookingImages = {};
      toast(OrbitI18n.t(saved.enabled ? "bookSaved" : "bookSavedOff"));
      if (saved.enabled) setTimeout(() => bookingShareModal(saved), 0);
    },
    OrbitI18n.t("m271"),
  );
}
function bookingShareModal(b = bookingInfo()) {
  if (!b?.url) return;
  let qr = "";
  try {
    qr = OrbitQR.svg(b.url);
  } catch {}
  modal(
    OrbitI18n.t("bookShare"),
    `<p class="hint">${OrbitI18n.t("bookShareHint")}</p>` +
      `<label>${OrbitI18n.t("bookLink")}</label><div class="pay-url"><input id="field-booking-url" readonly value="${escape(b.url)}"><button type="button" class="secondary" data-action="booking-copy" data-target="field-booking-url">${OrbitI18n.t("payCopy")}</button></div>` +
      `<div class="booking-share-row">${qr ? `<img class="pay-qr" id="booking-qr" src="${qr}" alt="QR">` : ""}<div><p><strong>${OrbitI18n.t("bookQr")}</strong></p><p class="hint">${OrbitI18n.t("bookQrHint")}</p><button type="button" class="secondary" data-action="booking-qr-save">${OrbitI18n.t("bookQrSave")}</button></div></div>` +
      `<label for="field-booking-embed">${OrbitI18n.t("bookEmbed")}</label><textarea id="field-booking-embed" readonly rows="3" class="booking-embed">${escape(bookingEmbed(b))}</textarea><div class="card-buttons"><button type="button" class="secondary" data-action="booking-copy" data-target="field-booking-embed">${OrbitI18n.t("bookEmbedCopy")}</button><button type="button" class="secondary" data-action="booking-open">${OrbitI18n.t("bookOpen")}</button></div><p class="hint">${OrbitI18n.t("bookEmbedHint")}</p>`,
    async () => {},
    OrbitI18n.t("close"),
  );
}
Object.assign(actions, {
  "booking-settings": () => bookingSettingsModal(),
  "booking-share": () => bookingShareModal(),
  "booking-open": () => window.orbit.call("booking:open", bookingInfo()?.url),
  "booking-copy": async (b) => {
    const input = $("#" + b.dataset.target);
    try {
      await navigator.clipboard.writeText(input.value);
      toast(OrbitI18n.t("payCopied"));
    } catch {
      input.select();
    }
  },
  "booking-qr-save": async () => {
    const img = $("#booking-qr");
    if (!img) return;
    // The QR is drawn large on white so it prints sharp on a counter card or a mirror sticker.
    const picture = new Image();
    await new Promise((r) => {
      picture.onload = r;
      picture.src = img.src;
    });
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 1200, 1200);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(picture, 60, 60, 1080, 1080);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `qr-${bookingInfo()?.slug || "booking"}.png`;
    a.click();
  },
  "booking-image": async (b) => {
    const kind = b.dataset.kind,
      picture = await bookingPicture(kind);
    if (!picture) return;
    bookingImages[kind] = picture;
    $(`.booking-image[data-kind="${kind}"]`).outerHTML = bookingImageRow(
      kind,
      true,
    );
  },
  "booking-image-clear": (b) => {
    const kind = b.dataset.kind;
    bookingImages[kind] = null;
    $(`.booking-image[data-kind="${kind}"]`).outerHTML = bookingImageRow(
      kind,
      false,
    );
  },
});
// Picking your own colour selects the "own colour" option.
document.addEventListener("input", (event) => {
  if (event.target.name === "color_custom")
    $('#modal-fields [name="color"][value="custom"]').checked = true;
});
