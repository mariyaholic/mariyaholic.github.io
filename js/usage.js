/* usage.js: the hourly usage page (ADR-0038 Addendum 3 in Uika). No storage, no cookies, no third party
   but the same GitHub org's raw host. Renders with textContent only. Polls every 5 min while the tab is
   visible (the file is replaced hourly; raw.githubusercontent.com caches 5 min). */
(function () {
  'use strict';
  var REAL = 'https://raw.githubusercontent.com/mariyaholic/mariyaholic.github.io/usage-data/usage.json';
  var SAMPLE = 'data/usage.sample.json';
  var POLL_MS = 5 * 60 * 1000;
  var $ = function (id) { return document.getElementById(id); };
  var st = { data: null, demo: false, loadedAt: 0, timer: 0, fails: 0 };
  var q = new URLSearchParams(location.search);

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function fmt(n) {
    if (!isFinite(n) || n <= 0) return '0';
    var u = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
    for (var i = 0; i < u.length; i++) if (n >= u[i][0]) return String(Number((n / u[i][0]).toPrecision(2))) + u[i][1];
    return String(Math.round(n));
  }
  function usd(n) { return n > 0 ? '$' + (n >= 10 ? Math.round(n) : Number(n.toPrecision(2))) : '$0'; }
  function pct(w) { return w.below_one ? '<1%' : w.pct + '%'; }
  function ago(ms) {
    var m = Math.max(0, Math.round(ms / 60000));
    if (m < 60) return m + ' min ago';
    var h = Math.floor(m / 60);
    return h + ' h ' + (m % 60) + ' min ago';
  }
  function bar(size) {
    var t = el('span', 'bar-track'), f = el('span', 'bar-fill');
    f.style.setProperty('--bar-size', String(Math.max(0, Math.min(1, size))));
    t.appendChild(f);
    return t;
  }

  var MIX = [['fresh_input', 'Fresh input', 'm0', 'var(--c11)'], ['cache_read', 'Cache read', 'm1', 'var(--c14)'],
             ['cache_write', 'Cache write', 'm2', 'var(--c12)'], ['output', 'Output', 'm3', 'var(--c5)']];

  function render(d) {
    $('t7').textContent = fmt(d.totals.tokens_7d);
    $('t30').textContent = fmt(d.totals.tokens_30d);
    $('spend').textContent = usd(d.totals.spend_usd_30d);
    $('u-caption').textContent = d.caption || '';

    var mix = d.totals.mix_pct, m = $('mix'), lg = $('mix-legend'), desc = [];
    clear(m); clear(lg);
    MIX.forEach(function (p) {
      var v = mix[p[0]] || 0, s = el('span', p[2]);
      s.style.width = v + '%';
      m.appendChild(s);
      var li = el('li'), sw = el('i');
      sw.style.background = p[3];
      li.appendChild(sw);
      li.appendChild(document.createTextNode(p[1] + ' ' + v + '%'));
      lg.appendChild(li);
      desc.push(p[1] + ' ' + v + '%');
    });
    m.setAttribute('aria-label', 'Token mix: ' + desc.join(', '));

    var tb = $('tools');
    clear(tb);
    d.harnesses.forEach(function (h) {
      var tr = el('tr'), th = el('th', null, h.id);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(el('td', 'n c7', fmt(h.tokens_7d)));
      tr.appendChild(el('td', 'n', fmt(h.tokens_30d)));
      var sh = el('td', 'share');
      sh.appendChild(bar(h.share_pct / 100));
      sh.appendChild(el('span', 'u-note', h.share_pct + '%'));
      tr.appendChild(sh);
      tr.appendChild(el('td', 'n', usd(h.spend_usd_30d)));
      tb.appendChild(tr);
    });

    var wk = $('weeks');
    clear(wk);
    d.weekly_index.forEach(function (v, i) {
      var li = el('li');
      li.style.height = Math.max(v, 1) + '%';
      li.setAttribute('aria-label', 'Week ' + (i + 1) + ' of 12: ' + v);
      li.title = String(v);
      wk.appendChild(li);
    });

    var mb = $('models');
    clear(mb);
    (d.models || []).forEach(function (mo) {
      var tr = el('tr'), th = el('th', null, mo.id);
      th.setAttribute('scope', 'row');
      tr.appendChild(th);
      tr.appendChild(el('td', null, mo.harness));
      tr.appendChild(el('td', 'n c7', fmt(mo.tokens_7d)));
      tr.appendChild(el('td', 'n', fmt(mo.tokens_30d)));
      var sh = el('td', 'share');
      sh.appendChild(bar(mo.share_pct / 100));
      sh.appendChild(el('span', 'u-note', mo.share_pct + '%'));
      tr.appendChild(sh);
      mb.appendChild(tr);
    });
  }

  function status() {
    var d = st.data;
    if (!d) return;
    var s = $('u-status'), banner = $('u-banner'), now = Date.now();
    var limit = (d.stale_after_min || 240) * 60000;
    var age = now - Date.parse(d.generated_at);
    var stale = !st.demo && age > limit;
    s.setAttribute('data-state', st.demo ? 'demo' : stale ? 'stale' : 'live');
    $('u-next').textContent = st.demo ? '' : ago(age) + ' · next check in ' + Math.max(0, Math.ceil((st.loadedAt + POLL_MS - now) / 1000)) + ' s';
    if (st.demo) {
      banner.hidden = false;
      banner.textContent = 'Synthetic demonstration - not a measured result. The live file could not be read, so this is example data.';
    } else if (stale) {
      banner.hidden = false;
      banner.textContent = 'This data is more than ' + Math.round(limit / 3600000) + ' hours old. My PC is probably asleep or off; the numbers below are from the last update.';
    } else if (st.fails) {
      banner.hidden = false;
      banner.textContent = 'The last refresh failed; showing the previous update.';
    } else {
      banner.hidden = true;
    }
  }

  function load(url) {
    return fetch(url, { cache: 'no-cache', credentials: 'omit' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function valid(d) { return d && d.schema === 1 && d.totals && d.harnesses && d.weekly_index; }

  function apply(d, demo) {
    st.data = d; st.demo = demo; st.loadedAt = Date.now(); st.fails = 0;
    render(d);
    $('u-when').textContent = demo ? 'Example data' : 'Updated ' + d.generated_at.slice(0, 16).replace('T', ' ') + ' UTC';
    status();
  }

  function refresh() {
    clearTimeout(st.timer);
    var src = q.get('src');   /* local testing only: a same-origin file under data/ */
    var url = src && /^data\/[\w.-]+\.json$/.test(src) ? src : REAL;
    var go = q.has('demo') ? Promise.reject(new Error('demo')) : load(url);
    go.then(function (d) {
      if (!valid(d)) throw new Error('bad shape');
      apply(d, false);
    }).catch(function () {
      if (st.data && !st.demo) { st.fails++; status(); return; }
      return load(SAMPLE).then(function (d) { apply(d, true); })
        .catch(function () { $('u-when').textContent = 'Could not load data'; });
    }).then(function () {
      st.timer = setTimeout(function () { if (!document.hidden) refresh(); else st.timer = 0; }, POLL_MS);
    });
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && (!st.timer || Date.now() - st.loadedAt > 60000)) refresh();
  });
  setInterval(function () { if (!document.hidden) status(); }, 30000);
  refresh();
})();
