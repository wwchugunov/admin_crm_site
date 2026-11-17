"use strict";
// No CRM data is sent. A conversion is emitted only after email confirmation succeeds.
window.OrbitAds = (() => {
  let target = null;
  let completed = false;
  return {
    configure(config) {
      if (!/^AW-\d+\/[A-Za-z0-9_-]+$/.test(config?.registrationSendTo || "")) return;
      target = config.registrationSendTo;
      const tag = target.split("/")[0];
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("set", "linker", { domains: ["lomviko.com", "app.lomviko.com"] });
      window.gtag("js", new Date());
      window.gtag("config", tag);
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + tag;
      document.head.append(script);
    },
    registrationComplete() {
      if (!target || completed) return;
      completed = true;
      window.gtag("event", "conversion", { send_to: target });
    },
  };
})();
