/* Shared controls (rev 8). The inline head script sets motion before paint and exposes window.AO;
   this file draws the desktop and the boot, wires the desktop windows on the home page, and runs the
   app sketches and the step sequences.
   Motion follows prefers-reduced-motion (or ?motion=off); there is no on-page motion button. */
(() => {
  const root = document.documentElement;
  const motionOn = () => root.dataset.motion === 'on';
  const live = () => motionOn() && !matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Desktop: a canvas behind every page at half resolution, so one canvas pixel is one 2px cell of the CSS
     checker it replaces. Each pixel holds a fixed phase (a wavy diagonal, Bayer-dithered at the edges) and
     each step rotates the palette over the phases, so a band of brighter dither drifts across: the PC-98
     palette-cycling trick. Stars sit on top in three layers that drift left and twinkle. Two steps a second,
     none in hidden tabs; with motion off or reduced it draws one still frame, plain checker plus stars.
     It is decoration, so a failure here falls back to the CSS checker and never stops the code below. */
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.className = 'desktop'; canvas.setAttribute('aria-hidden', 'true');
      document.body.append(canvas); root.classList.add('desk-live');
      const css = getComputedStyle(root);
      const col = n => { const h = css.getPropertyValue(`--c${n}`).trim().slice(1); return 0xff000000 | parseInt(h.slice(4, 6), 16) << 16 | parseInt(h.slice(2, 4), 16) << 8 | parseInt(h.slice(0, 2), 16); };
      const LEVELS = [[col(1), col(2)], [col(2), col(2)], [col(2), col(3)]]; // [even, odd] cell of the checker
      const N = 64, BAND = [1, 1, 2, 2, 2, 1, 1];                                // phases lit by the band; the rest plain
      const STAR = [col(3), col(4), col(5), col(6), col(7)], SPEED = [1 / 16, 1 / 8, 1 / 4];
      const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      let seed = 98;
      const rand = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
      const ALL = Array.from({ length: 700 }, () => {
        const layer = rand() < .5 ? 0 : rand() < .6 ? 1 : 2;
        return { fx: rand(), fy: rand(), layer, lv: layer === 2 && rand() < .15 ? 4 : layer + 1 };
      });
      let W, H, img, px, cell, stars, t = 0, moving = false, rt;
      function layout() {
        W = Math.max(1, Math.ceil(innerWidth / 2)); H = Math.max(1, Math.ceil(innerHeight / 2)); // 0 in a hidden or unsized frame
        canvas.width = W; canvas.height = H;
        canvas.style.width = W * 2 + 'px'; canvas.style.height = H * 2 + 'px';
        img = ctx.createImageData(W, H); px = new Uint32Array(img.data.buffer);
        cell = new Uint8Array(W * H);
        for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i++) {
          const f = (x + y * 1.5) / 6 + 2.5 * Math.sin(y / 23) + 2 * Math.sin(x / 41) + BAYER[(y & 3) * 4 + (x & 3)] / 16;
          cell[i] = (Math.floor(f) % N + N) % N * 2 + ((x + y) & 1);
        }
        stars = ALL.slice(0, Math.round(W * H / 2200)).map(s => ({ ...s, x: s.fx * W, y: Math.floor(s.fy * H), tw: false }));
      }
      const dot = (x, y, c) => { if (x >= 0 && x < W && y >= 0 && y < H) px[y * W + x] = c; };
      function draw() {
        const lut = new Uint32Array(N * 2);
        for (let p = 0; p < N; p++) {
          const k = (p - t % N + N) % N, lv = moving && k < BAND.length ? BAND[k] : 0;
          lut[p * 2] = LEVELS[lv][0]; lut[p * 2 + 1] = LEVELS[lv][1];
        }
        for (let i = 0; i < px.length; i++) px[i] = lut[cell[i]];
        for (const s of stars) {
          const x = Math.floor(s.x), lv = s.tw ? s.lv - 1 : s.lv;
          if (lv === 4) [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => dot(x + dx, s.y + dy, STAR[1]));
          dot(x, s.y, STAR[lv]);
        }
        ctx.putImageData(img, 0, 0);
      }
      layout(); draw();
      setInterval(() => {
        if (document.hidden) return;
        if (live()) {
          moving = true; t++;
          for (const s of stars) { s.x -= SPEED[s.layer]; if (s.x < 0) s.x += W; s.tw = Math.random() < .04; }
          draw();
        } else if (moving) { moving = false; stars.forEach(s => { s.tw = false; }); draw(); }
      }, 500);
      addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { layout(); draw(); }, 200); });
    }
  } catch (e) {
    document.querySelector('canvas.desktop')?.remove(); root.classList.remove('desk-live');
  }

  /* Boot: on a first visit with motion on, the head script adds html.boot (CSS covers the page in black)
     and this types a short text-mode boot, about 1.2-1.5s, then cuts to the page. The last line changes to
     the page's directory. A key, click, tap or wheel skips it; ?boot replays it. The hero animations ran under
     the cover, so they restart afterwards. A page opened in a background tab skips it and leaves the flag
     unset, so the boot waits for a page that is seen. */
  if (root.classList.contains('boot') && document.hidden) root.classList.remove('boot');
  if (root.classList.contains('boot')) {
    const scr = document.createElement('div');
    scr.className = 'boot-screen'; scr.setAttribute('aria-hidden', 'true');
    document.body.append(scr);
    const dir = (document.querySelector('.site-header .path')?.textContent || '').replace(/^A:\\|>$/g, '');
    const cmd = dir ? `CD \\${dir}` : 'DESKTOP';
    const head = ['mariyaholic-98 system  rev 8', ''], mem = 'Memory test   640 KB  OK', pal = 'Palette       16 colours  OK';
    const done = [...head, mem, pal, 'Font          Departure Mono  OK', ''];
    const frames = [0, 160, 320, 480, 640].map(kb => [...head, `Memory test   ${String(kb).padStart(3)} KB`]);
    frames.push([...head, mem], [...head, mem, pal], done);
    const typing = frames.length;
    for (let n = 0; n < cmd.length; n += 2) frames.push([...done, 'A:\\>' + cmd.slice(0, n)]);
    for (let n = 0; n < 3; n++) frames.push([...done, 'A:\\>' + cmd]);
    let f = 0;
    const show = () => { scr.textContent = frames[f].join('\n') + (f >= typing && f % 2 === 0 ? '_' : ''); };
    const keys = ['keydown', 'wheel'];
    const end = () => {
      if (!scr.isConnected) return;
      clearInterval(timer); scr.remove(); root.classList.remove('boot');
      keys.forEach(e => removeEventListener(e, end, true));
      try { localStorage.setItem('mh98-booted', '1'); } catch (e) { /* the boot just plays again next time */ }
      const played = [...document.querySelectorAll('.in-view')];
      played.forEach(el => el.classList.remove('in-view')); void document.body.offsetWidth;
      played.forEach(el => el.classList.add('in-view'));
    };
    show();
    const timer = setInterval(() => { if (++f >= frames.length) end(); else show(); }, 80);
    keys.forEach(e => addEventListener(e, end, { capture: true, passive: true }));
    scr.addEventListener('click', end);
  }

  /* Home desktop: from 1200px CSS lays the windows out in two columns, then pin() fixes each one where
     it landed (absolute, .pinned) so it can be dragged by its title bar (the top --bar-h pixels, drawn by
     CSS). Click a window to bring it to the front, or use the status-bar buttons. Resizing re-pins until
     something has been dragged; going below 1200px unpins. */
  const desk = document.querySelector('.desk');
  if (desk) {
    const wide = matchMedia('(min-width:1200px)');
    const wins = [...desk.querySelectorAll('.win')];
    const tasks = [...document.querySelectorAll('.tasks button')];
    let z = 20, dragged = false;
    const unpin = () => {
      desk.classList.remove('pinned'); desk.style.height = '';
      wins.forEach(w => { w.style.left = w.style.top = w.style.width = ''; });
    };
    const pin = () => {
      unpin();
      if (!wide.matches) return;
      const d = desk.getBoundingClientRect();
      const spots = wins.map(w => { const r = w.getBoundingClientRect(); return [r.left - d.left, r.top - d.top, r.width]; });
      desk.style.height = d.height + 'px';
      wins.forEach((w, i) => { w.style.left = spots[i][0] + 'px'; w.style.top = spots[i][1] + 'px'; w.style.width = spots[i][2] + 'px'; });
      desk.classList.add('pinned');
    };
    let timer;
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(pin);
    wide.addEventListener('change', () => { dragged = false; pin(); });
    addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(() => { if (!dragged) pin(); }, 150); });
    const front = w => {
      wins.forEach(x => x.classList.toggle('top', x === w));
      w.style.zIndex = ++z;
      tasks.forEach(b => b.classList.toggle('on', b.dataset.for === w.id));
    };
    wins.forEach(w => {
      w.addEventListener('pointerdown', e => {
        front(w);
        if (!desk.classList.contains('pinned') || e.button !== 0 || e.clientY - w.getBoundingClientRect().top > 30 || e.target.closest('a')) return;
        e.preventDefault(); dragged = true;
        const sx = e.clientX - w.offsetLeft, sy = e.clientY - w.offsetTop;
        const move = ev => {
          w.style.left = Math.max(0, Math.min(desk.clientWidth - 80, ev.clientX - sx)) + 'px';
          w.style.top = Math.max(0, ev.clientY - sy) + 'px';
        };
        const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
        addEventListener('pointermove', move); addEventListener('pointerup', up);
      });
      w.addEventListener('focusin', () => front(w));
    });
    tasks.forEach(b => b.addEventListener('click', () => { const w = document.getElementById(b.dataset.for); front(w); }));
    if (wins.length) front(wins[0]);
  }

  /* App sketches (programs, home): stepped text-mode animation, one step a second. The prices are a random
     walk around the README's example values and the songs are made up; the captions say so. Fields keep
     their width so the drawing never shifts. Nothing runs with motion off or reduced, while every sketch
     is off-screen, or in a hidden tab; the static text in the markup is the resting frame. */
  const sketches = [...document.querySelectorAll('[data-sketch]')];
  if (sketches.length && motionOn() && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const $$ = sel => [...document.querySelectorAll(sel)];
    const set = (key, text, cls) => $$(`[data-k="${key}"]`).forEach(el => { el.textContent = text; if (cls) el.className = cls; });
    const money = (v, d) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    const quotes = {
      XAU: { base: 4153.73, d: 2, w: 8, step: 1.6 }, XAG: { base: 56.59, d: 3, w: 9, step: .06 },
      BTC: { base: 81219, d: 0, w: 6, step: 60 }, DOW: { base: 52048, d: 0, w: 6, step: 18 },
      SPX: { base: 7743.75, d: 2, w: 8, step: 1.5 }, NAS: { base: 29801.5, d: 2, w: 9, step: 7 },
    };
    Object.values(quotes).forEach(x => { x.v = x.base; });
    const prev = 4141.33, BARS = '▁▂▃▄▅▆▇█';
    const spark = [4141, 4141, 4143, 4143, 4141, 4143, 4146, 4146, 4149, 4146, 4149, 4151, 4149, 4151, 4151, 4153, 4151, 4153, 4153, 4155, 4153, 4153, 4155];
    let age = 0, flashed = [];
    function tickQuotes() {
      flashed.forEach(el => el.className = 'st1'); flashed = [];
      const names = Object.keys(quotes).filter(() => Math.random() < .35);
      if (Math.random() < .7) names.push('XAU');
      new Set(names).forEach(name => {
        const x = quotes[name], was = x.v;
        x.v += x.step * (Math.random() * 2 - 1) - (x.v - x.base) * .08;
        const up = x.v >= was;
        $$(`[data-q="${name}"]`).forEach(el => { el.textContent = money(x.v, x.d).padStart(x.w); el.className = up ? 'up' : 'dn'; flashed.push(el); });
        if (name === 'XAU') {
          age = 0; spark.push(x.v); spark.shift();
          const lo = Math.min(...spark), hi = Math.max(...spark);
          set('spark', spark.map(v => BARS[Math.round((v - lo) / (hi - lo || 1) * 7)]).join(''));
          const ch = x.v - prev, sg = ch < 0 ? '-' : '+';
          set('chg', `${(sg + Math.abs(ch).toFixed(2)).padStart(6)} ${(sg + Math.abs(ch / prev * 100).toFixed(2) + '%').padStart(7)}`, ch < 0 ? 'dn' : 'up');
        }
      });
      set('age', `${String(age).padStart(2)}s old`);
      age++;
      const now = new Date();
      set('clock', `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    }

    /* Yozora: one tick = ten seconds of song. On a new song the text changes at once and the artwork two ticks later.
       YouTube Music shows no Listen button, as in Yozora. */
    const songs = [
      { src: 'SPOTIFY', title: 'Song title', artist: 'by the artist', album: 'on the album', dur: 220, btn: '[ Listen on Spotify ]', art: ['░▒▓▓▒░', '▒▓██▓▒'], c: 'ln' },
      { src: 'APPLE MUSIC', title: 'Another song', artist: 'by someone else', album: 'on a different album', dur: 178, btn: '[ Listen on Apple Music ]', art: ['▓▒░░▒▓', '░▒▓▓▒░'], c: 'kp' },
      { src: 'YOUTUBE MUSIC', title: 'A third song', artist: 'by a third artist', album: 'on a single', dur: 195, btn: '', art: ['▒░▓▓░▒', '▓█▒▒█▓'], c: 'lbl' },
    ];
    let song = 0, at = 72, artIn = 0;
    const clock = t => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`.padStart(5);
    function tickSong() {
      at += 10;
      if (at > songs[song].dur) {
        song = (song + 1) % songs.length; at = 0; artIn = 2;
        const s = songs[song];
        set('src', s.src.padEnd(13)); set('title', s.title.padEnd(22)); set('artist', s.artist.padEnd(22)); set('album', s.album.padEnd(22));
        set('t1', clock(s.dur).trim()); set('btn', s.btn.padEnd(25));
        set('art1', '      ', 'ax'); set('art2', '  ··  ', 'ax');
      } else if (artIn && !--artIn) {
        const s = songs[song]; set('art1', s.art[0], s.c); set('art2', s.art[1], s.c);
      }
      const filled = Math.round(at / songs[song].dur * 13);
      set('t0', clock(at)); set('barA', '━'.repeat(filled)); set('barB', '─'.repeat(13 - filled));
    }

    const seen = new Set();
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)));
    sketches.forEach(el => io.observe(el));
    const hasTicker = sketches.some(el => el.dataset.sketch === 'ticker');
    const hasSong = sketches.some(el => el.dataset.sketch === 'discord');
    window.setInterval(() => {
      if (document.hidden || !seen.size || !motionOn()) return;
      if (hasTicker) tickQuotes();
      if (hasSong) tickSong();
    }, 1000);
  }

  /* Step sequences (method, evidence, privacy, efficiency). User-started only; with motion not 'on'
     a play jumps to the last step. */
  document.querySelectorAll('[data-sequence]').forEach(sequence => {
    const targets = [...sequence.querySelectorAll('[data-sequence-target]')];
    const steps = [...sequence.querySelectorAll('[data-sequence-step]')];
    const status = sequence.querySelector('[data-sequence-status]');
    const play = sequence.querySelector('[data-sequence-play]');
    const bars = sequence.dataset.sequence === 'bars';
    const labels = (steps.length ? steps : targets).map((item, position) => item.dataset.sequenceLabel || item.textContent.trim() || `Step ${position + 1}`);
    let timer = null;
    let index = 0;
    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
      if (play) play.disabled = false;
    }
    function select(next) {
      index = Math.max(0, Math.min(next, targets.length - 1));
      targets.forEach((target, position) => target.classList.toggle('is-active', position === index));
      steps.forEach((step, position) => step.setAttribute('aria-current', String(position === index)));
      if (status && !bars) status.textContent = `${labels[index]} · step ${index + 1} of ${targets.length}`;
      const pulse = sequence.querySelector('.trace-pulse, .receipt-pulse');
      const circle = targets[index]?.querySelector('circle');
      if (pulse && circle) {
        pulse.setAttribute('cx', circle.getAttribute('cx'));
        pulse.setAttribute('cy', circle.getAttribute('cy'));
      }
    }
    /* is-playing stays on after a replay (removing it would restart the bars); only touched with motion on. */
    function replayBars() {
      if (motionOn()) {
        sequence.classList.remove('is-playing');
        void sequence.offsetWidth;
        sequence.classList.add('is-playing');
      }
      if (status) status.textContent = motionOn() ? 'Measured local inventory · bars replaying' : 'Measured local inventory · motion paused';
    }
    function playSequence() {
      stop();
      if (bars) { replayBars(); return; }
      if (!targets.length) return;
      if (!motionOn()) { select(targets.length - 1); return; }
      if (play) play.disabled = true;
      select(0);
      timer = window.setInterval(() => {
        if (index >= targets.length - 1) { stop(); return; }
        select(index + 1);
      }, 760);
    }
    steps.forEach((step, position) => step.addEventListener('click', () => { stop(); select(position); }));
    play?.addEventListener('click', playSequence);
    if (targets.length && !bars) select(0);
  });
})();
