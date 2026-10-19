"use strict";
// The browser side of LOMVIKO: the screens call window.orbit.call(channel, ...args) as they did in
// the desktop app; here every call goes to /web/call on the same site. A few things happen in the
// browser itself: picking a logo, opening links, downloading an export.
(function () {
  let info = { version: "", api: "" };
  const post = (path, body) =>
    fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body || {}),
    });
  const ready = post("/web/info")
    .then((r) => r.json())
    .then((value) => (info = value))
    .catch(() => {});
  function signedOutError() {
    const error = Error("");
    error.signedOut = true;
    return error;
  }
  async function remote(channel, args) {
    let response;
    try {
      response = await post("/web/call", { channel, args });
    } catch {
      throw Error("Failed to fetch");
    }
    const result = await response.json().catch(() => ({
      error: "Unexpected server reply",
    }));
    if (response.status === 401 && result.signedOut) {
      window.OrbitWeb.signedOut();
      throw signedOutError();
    }
    if (!response.ok) throw Error(result.error || "Server error");
    return result.value;
  }
  function pickLogo() {
    return new Promise((resolve, reject) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/png,image/jpeg";
      input.addEventListener("change", () => {
        const file = input.files[0];
        if (!file) return resolve(null);
        if (file.size > 2 * 1024 * 1024)
          return reject(Error(OrbitI18n.t("m511")));
        if (!["image/png", "image/jpeg"].includes(file.type))
          return reject(Error(OrbitI18n.t("m512")));
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(Error(OrbitI18n.t("m512")));
        reader.readAsDataURL(file);
      });
      input.addEventListener("cancel", () => resolve(null));
      input.click();
    });
  }
  async function download(format, password) {
    const response = await post("/web/export", { format, password });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      if (response.status === 401 && result.signedOut) {
        window.OrbitWeb.signedOut();
        throw signedOutError();
      }
      throw Error(result.error || "Export failed");
    }
    const name =
      /filename="([^"]+)"/.exec(
        response.headers.get("content-disposition") || "",
      )?.[1] || `LOMVIKO.${format}`;
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return true;
  }
  const open = (url) => {
    window.open(url, "_blank", "noopener");
    return true;
  };
  const local = {
    "appearance:set": (p) => {
      if (p?.reload) location.reload();
      return true;
    },
    "app:version": async () => {
      await ready;
      return info.version ? `web ${info.version}` : "web";
    },
    "updates:completed": () => null,
    "branding:select": pickLogo,
    "booking:open": (url) => {
      if (
        typeof url !== "string" ||
        !/^https?:\/\/[^/\s]+\/b\/[a-z0-9-]{3,40}$/.test(url)
      )
        throw Error("Invalid link");
      return open(url);
    },
    "legal:privacy": (language) =>
      open(
        `${info.api}/public/documents/app-privacy/${language === "en" ? "en" : "uk"}`,
      ),
    "legal:offer": () => open(`${info.api}/public/documents/site-offer/uk`),
    "notify:link": async () => {
      // Opened before the request so the browser does not treat it as a pop-up.
      const tab = window.open("about:blank", "_blank");
      try {
        const url = await remote("notify:link", []);
        if (tab) tab.location = url;
        else open(url);
        return true;
      } catch (e) {
        tab?.close();
        throw e;
      }
    },
    export: (format, password) => download(format, password),
  };
  window.orbit = {
    web: true,
    async call(channel, ...args) {
      if (local[channel]) return local[channel](...args);
      return remote(channel, args);
    },
  };
  // Signed out (or the session ended): the sign-in screen replaces the workspace.
  window.OrbitWeb = {
    signedOut() {
      if (document.body.classList.contains("signed-out")) return;
      document.body.classList.add("signed-out");
      if (typeof data !== "undefined") data = null;
      if (document.querySelector("#modal")?.open) closeModal();
      // The website's "Try it free" lands on registration, "Sign in" on the sign-in form.
      const start = new URLSearchParams(location.search).get("start");
      if (start) history.replaceState(null, "", location.pathname);
      setTimeout(
        () => (start === "register" ? registrationModal() : loginModal()),
        0,
      );
    },
    signedIn() {
      document.body.classList.remove("signed-out");
    },
  };
})();
