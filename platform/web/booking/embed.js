/* LOMVIKO "Записатися" button for any website:
   <script src="https://lomviko.com/b/embed.js" data-salon="studio-olena" data-color="#5b5bd6" async></script>
   The button appears where the script is (data-float="1" pins it to the corner) and opens the booking
   page over the site. Styles are inline so the site's own CSS cannot break it. */
(function () {
  var script = document.currentScript;
  if (!script || !script.dataset.salon) return;
  var origin = new URL(script.src).origin;
  var slug = String(script.dataset.salon).replace(/[^a-z0-9-]/g, '');
  var color = /^#[0-9a-fA-F]{6}$/.test(script.dataset.color || '') ? script.dataset.color : '#5b5bd6';
  var hex = color.slice(1), light = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000 > 160;
  var button = document.createElement('button');
  button.type = 'button';
  button.textContent = script.dataset.text || 'Записатися';
  var floating = script.dataset.float === '1';
  button.style.cssText = 'all:initial;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;padding:13px 26px;border-radius:999px;cursor:pointer;font:600 16px/1.2 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.18);background:' + color + ';color:' + (light ? '#141418' : '#fff') + ';' + (floating ? 'position:fixed;right:20px;bottom:20px;z-index:2147483000;' : '');
  var overlay = null, previous = '';
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.documentElement.style.overflow = previous;
    button.focus();
  }
  function open() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', button.textContent);
    overlay.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483001;background:rgba(10,10,14,.55);display:flex;align-items:center;justify-content:center;';
    var frame = document.createElement('iframe');
    frame.src = origin + '/b/' + slug + '?embed=1';
    frame.title = button.textContent;
    frame.setAttribute('allow', 'clipboard-write');
    var narrow = window.innerWidth < 640;
    frame.style.cssText = 'all:initial;display:block;border:0;background:#fff;width:' + (narrow ? '100%' : '480px') + ';height:' + (narrow ? '100%' : 'min(820px,92vh)') + ';border-radius:' + (narrow ? '0' : '18px') + ';box-shadow:0 20px 60px rgba(0,0,0,.35);';
    overlay.appendChild(frame);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(overlay);
    frame.focus();
  }
  window.addEventListener('message', function (e) {
    if (e.origin === origin && e.data && e.data.lomviko === 'close') close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  button.addEventListener('click', open);
  if (floating) document.body ? document.body.appendChild(button) : document.addEventListener('DOMContentLoaded', function () { document.body.appendChild(button); });
  else script.parentNode.insertBefore(button, script.nextSibling);
})();
