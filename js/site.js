/* Shared controls (rev 8). The inline head script sets motion before paint and exposes window.AO;
   this file wires the desktop windows on the home page and the step sequences.
   Motion follows prefers-reduced-motion (or ?motion=off); there is no on-page motion button. */
(() => {
  const root = document.documentElement;
  const motionOn = () => root.dataset.motion === 'on';

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
