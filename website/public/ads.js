// Google Ads tag: counts which ad clicks end in a request. Loaded from our own origin so the page CSP stays strict.
(() => {
  const TAG = 'AW-10954716152';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', TAG);
  // Queue attribution and conversions immediately, then load the third-party runtime after
  // the page's own resources. Early form submissions remain in dataLayer until it is ready.
  const load = () => {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG;
    document.head.append(script);
  };
  const schedule = () => 'requestIdleCallback' in window ? window.requestIdleCallback(load, { timeout: 1500 }) : setTimeout(load, 0);
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
  // Called by app.js after the server accepted a request from the form.
  window.lomvikoConversion = () => window.gtag('event', 'conversion', { send_to: TAG + '/vBQQCKD6o64dEPjnzuco' });
})();
