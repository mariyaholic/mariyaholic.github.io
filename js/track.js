/* track.js: counts clicks on paper links that have a data-track attribute.
   The address of the counter comes from <meta name="click-endpoint">. If it is empty, the script does nothing.
   It sends one small request per click, with the link name only. It sets no cookie and uses no storage.
   It sends nothing when the browser asks for no tracking (Global Privacy Control or Do Not Track).
   The counter source is in tools/click-counter/. */
(function () {
  'use strict';
  var meta = document.querySelector('meta[name="click-endpoint"]');
  var endpoint = meta && meta.content ? meta.content.replace(/\/+$/, '') : '';
  if (!endpoint) return;
  if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1') return;

  var sent = {};
  function send(name) {
    if (sent[name]) return;            /* one count per link for each page view */
    sent[name] = true;
    var body = JSON.stringify({ link: name });
    var url = endpoint + '/hit';
    try {
      /* text/plain keeps the request "simple", so the browser sends no CORS preflight */
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }))) return;
    } catch (e) { /* fall through */ }
    try {
      fetch(url, { method: 'POST', body: body, keepalive: true, mode: 'no-cors', credentials: 'omit',
        headers: { 'Content-Type': 'text/plain' } });
    } catch (e) { /* counting must never block the link */ }
  }

  function onActivate(ev) {
    if (ev.type === 'auxclick' && ev.button !== 1) return;   /* middle click opens a new tab */
    var a = ev.target && ev.target.closest ? ev.target.closest('a[data-track]') : null;
    if (a) send(a.getAttribute('data-track'));
  }
  document.addEventListener('click', onActivate, true);
  document.addEventListener('auxclick', onActivate, true);
})();
