// Google Ads tag: counts which ad clicks end in a request. Loaded from our own origin so the page CSP stays strict.
(() => {
  const TAG = 'AW-10954716152';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', TAG);
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + TAG;
  document.head.append(script);
  // Called by app.js after the server accepted a request from the form.
  window.lomvikoConversion = () => window.gtag('event', 'conversion', { send_to: TAG + '/vBQQCKD6o64dEPjnzuco' });
})();
