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

  /* Sound: off until the SOUND button in the status bar turns it on, and the choice is remembered. Every
     sound is synthesized here with two-operator FM (a sine bending the pitch of a sine or square, like the
     PC-98's FM chip), so there are no audio files. Browsers only start audio after a click or key on the
     page, so with sound on a fresh page can stay silent until then; sfx() does nothing while it can't play.
     Internal links wait 140ms so their chime is heard before the page changes. */
  const sfx = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return () => {};
    let on = false, musicOn = false, ac = null, out = null, noise = null;
    try { on = localStorage.getItem('mh98-sound') === 'on'; musicOn = localStorage.getItem('mh98-music') === 'on'; } catch (e) { /* stays off */ }
    const start = () => {
      if (!ac) {
        ac = new AC(); out = ac.createGain(); out.gain.value = .16; out.connect(ac.destination);
        noise = ac.createBuffer(1, ac.sampleRate * .2, ac.sampleRate);
        const d = noise.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return ac.state === 'suspended' ? ac.resume() : Promise.resolve();
    };
    // One FM note: carrier at f, modulator at f*ratio and depth index*f; the brightness and volume both decay.
    const fm = (f, at, dur, { ratio = 2, index = 1.5, wave = 'sine', vol = 1 } = {}) => {
      const t = ac.currentTime + at, car = ac.createOscillator(), mod = ac.createOscillator(), depth = ac.createGain(), env = ac.createGain();
      car.type = wave; car.frequency.value = f; mod.frequency.value = f * ratio;
      depth.gain.setValueAtTime(index * f, t); depth.gain.exponentialRampToValueAtTime(index * f * .2 + 1, t + dur);
      env.gain.setValueAtTime(vol, t); env.gain.exponentialRampToValueAtTime(.001, t + dur);
      mod.connect(depth).connect(car.frequency); car.connect(env).connect(out);
      car.start(t); mod.start(t); car.stop(t + dur + .02); mod.stop(t + dur + .02);
    };
    // A burst of band-passed noise: clicks, ticks and the drive seek.
    const hiss = (at, dur, vol, hz) => {
      const t = ac.currentTime + at, src = ac.createBufferSource(), bp = ac.createBiquadFilter(), env = ac.createGain();
      src.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = hz; bp.Q.value = 2;
      env.gain.setValueAtTime(vol, t); env.gain.exponentialRampToValueAtTime(.001, t + dur);
      src.connect(bp).connect(env).connect(out); src.start(t); src.stop(t + dur + .02);
    };
    const note = n => 440 * 2 ** ((n - 69) / 12);
    const SOUNDS = {
      chime: () => [72, 76, 79, 84].forEach((n, i) => fm(note(n), i * .07, .3, { index: 2 })),  // sound turned on: C E G C
      open: () => { fm(note(84), 0, .06); fm(note(91), .05, .09); },                         // a window comes to the front
      tick: () => hiss(0, .018, .3, 3200),                                                   // dragging, every 24px
      link: () => { fm(note(88), 0, .08, { ratio: 3 }); fm(note(93), .07, .14, { ratio: 3 }); },
      post: () => fm(2000, 0, .12, { wave: 'square', index: 0, vol: .3 }),                   // the boot beep
      seek: () => [0, .05, .1, .19].forEach((at, i) => hiss(at, .03, .5, 700 + i * 250)),     // drive seek during the memory test
      key: () => { hiss(0, .012, .4, 2600); hiss(.04, .012, .35, 3000); },                   // two typed characters per boot frame
      miss: () => { fm(note(64), 0, .12, { wave: 'square', index: .5, vol: .4 }); fm(note(57), .14, .26, { wave: 'square', index: .5, vol: .4 }); },
      // hovers: quieter and shorter than clicks
      menu: n => fm(note(n), 0, .045, { index: .8, vol: .35 }),                                // one note of a scale per menu item
      icon: () => fm(note(67), 0, .05, { ratio: 3.5, index: 2.5, vol: .4 }),                  // a desktop icon: a woody knock
      cta: () => { fm(note(91), 0, .04, { index: 1, vol: .3 }); fm(note(96), .035, .06, { index: 1, vol: .3 }); },
      btn: () => hiss(0, .01, .25, 4200),                                                     // a status-bar button
    };
    const play = (name, arg) => {
      if (!on || !ac || ac.state !== 'running') return;
      SOUNDS[name](arg);
      if (duck) { const t = ac.currentTime; duck.gain.setTargetAtTime(.45, t, .01); duck.gain.setTargetAtTime(1, t + .12, .08); }
    };

    /* Music: a four-voice chip player in the style of the PC-98's square-wave channels. Two pulse waves (25%
       lead, 12.5% arpeggio), a triangle bass and noise drums play a song written below as text, one 16th note
       per step. A lookahead scheduler books notes 150ms ahead on the audio clock, so timing holds even when
       timers lag. The music sits under the effects and dips while one plays. It stops in hidden tabs, and the
       position is kept for the session, so the next page carries on from the same beat. */
    const DESKTOP = {
      name: 'DESKTOP.MID', bpm: 90,
      chords: 'Cmaj7 Am7 Fmaj7 G Cmaj7 Am7 Fmaj7 G Dm7 Em7 Fmaj7 G Dm7 Em7 Fmaj7 G',
      lead: [ // eighth notes: a note, - holds it, . rests
        'E5 - G5 - B5 - A5 G5', 'E5 - - - C5 - D5 E5', 'F5 - A5 - C6 - B5 A5', 'G5 - - - . . D5 E5',
        'E5 - G5 - B5 - D6 C6', 'B5 - A5 - G5 - E5 -', 'F5 - E5 F5 A5 - G5 F5', 'G5 - - - - - . .',
        'A5 - - F5 E5 - D5 -', 'G5 - - E5 D5 - B4 -', 'C5 - D5 - E5 - F5 -', 'G5 - A5 - B5 - D6 -',
        'C6 - - A5 G5 - F5 -', 'E5 - - D5 E5 - G5 -', 'A5 - - - G5 - F5 E5', 'D5 - - - - - . .'],
      kick: 'x......x..x.....', snare: '....x.......x...', fill: '....x.......xxxx', hat: 'x.x.x.x.x.x.x.x.',
    };
    const CHORDS = { Cmaj7: [60, 64, 67, 71], Am7: [57, 60, 64, 67], Fmaj7: [53, 57, 60, 64], G: [55, 59, 62, 67], Dm7: [50, 53, 57, 60], Em7: [52, 55, 59, 62] };
    const BASS = { 0: [0, 3], 6: [12, 2], 8: [7, 2], 10: [0, 2], 14: [12, 2] }; // step in the bar: [semitones above the root, length in steps]
    const midi = tok => { const m = /^([A-G])(#?)(\d)$/.exec(tok); return 12 * (+m[3] + 1) + 'C D EF G A B'.indexOf(m[1]) + (m[2] ? 1 : 0); };
    let level = null, duck = null, waves = null, timer = null, step = 0, next = 0, hush = false; // hush: a video is playing
    try { step = +sessionStorage.getItem('mh98-music-at') || 0; } catch (e) { /* from the top */ }
    const song = DESKTOP, chords = song.chords.split(' ').map(c => CHORDS[c]), lead = song.lead.map(b => b.split(' '));
    const STEP = 60 / song.bpm / 4, TOTAL = chords.length * 16;
    // A pulse wave of duty d as a Fourier series: the chip sound comes from the narrow pulse.
    const pulse = d => {
      const re = new Float32Array(64), im = new Float32Array(64);
      for (let k = 1; k < 64; k++) { re[k] = Math.sin(2 * Math.PI * k * d) / (k * Math.PI); im[k] = (1 - Math.cos(2 * Math.PI * k * d)) / (k * Math.PI); }
      return ac.createPeriodicWave(re, im);
    };
    // One chip note: an instant attack, a quick fall to 60%, and a short release at the end.
    const voice = (wave, n, t, dur, vol) => {
      const o = ac.createOscillator(), g = ac.createGain();
      if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
      o.frequency.value = note(n);
      g.gain.setValueAtTime(vol, t); g.gain.linearRampToValueAtTime(vol * .6, t + Math.min(.08, dur / 2));
      g.gain.setValueAtTime(vol * .6, t + dur - .01); g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(duck); o.start(t); o.stop(t + dur + .02);
    };
    const drum = (t, kind) => {
      if (kind === 'kick') {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12);
        g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .14);
        o.connect(g).connect(duck); o.start(t); o.stop(t + .16);
        return;
      }
      const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain(), len = kind === 'hat' ? .03 : .1;
      src.buffer = noise; hp.type = 'highpass'; hp.frequency.value = kind === 'hat' ? 7000 : 1500;
      g.gain.setValueAtTime(kind === 'hat' ? .18 : .45, t); g.gain.exponentialRampToValueAtTime(.001, t + len);
      src.connect(hp).connect(g).connect(duck); src.start(t); src.stop(t + len + .02);
    };
    const book = (s, t) => {
      const bar = s >> 4, i = s & 15, chord = chords[bar];
      for (let k = 0; k < 3; k++) voice(waves.arp, chord[(s * 3 + k) % chord.length], t + k * STEP / 3, STEP / 3, .16); // the arpeggio: three notes per step
      if (BASS[i]) voice('triangle', chord[0] - 12 + BASS[i][0], t, BASS[i][1] * STEP - .01, .8);
      const tok = i % 2 ? null : lead[bar][i / 2];
      if (tok && tok !== '-' && tok !== '.') {
        let len = 1;
        while (lead[bar][i / 2 + len] === '-') len++;
        voice(waves.lead, midi(tok), t, len * 2 * STEP - .02, .38);
      }
      if (song.kick[i] === 'x') drum(t, 'kick');
      if ((bar % 8 === 7 ? song.fill : song.snare)[i] === 'x') drum(t, 'snare');
      if (song.hat[i] === 'x') drum(t, 'hat');
    };
    const pump = () => { while (next < ac.currentTime + .15) { book(step, next); next += STEP; step = (step + 1) % TOTAL; } };
    const playMusic = () => {
      if (timer || hush || !musicOn || !ac || ac.state !== 'running' || document.hidden || root.classList.contains('boot')) return; // after the boot
      if (!level) { level = ac.createGain(); level.gain.value = .8; level.connect(out); waves = { lead: pulse(.25), arp: pulse(.125) }; }
      duck = ac.createGain(); duck.connect(level);
      step &= ~3; next = ac.currentTime + .05; pump(); timer = setInterval(pump, 25); // resume on a beat
    };
    const stopMusic = () => {
      if (!timer) return;
      clearInterval(timer); timer = null;
      const old = duck, t = ac.currentTime; old.gain.cancelScheduledValues(t); old.gain.setTargetAtTime(0, t, .02);
      setTimeout(() => old.disconnect(), 300); duck = null;
    };
    document.addEventListener('visibilitychange', () => (document.hidden ? stopMusic() : playMusic()));
    addEventListener('mh98-booted', playMusic);
    addEventListener('mh98-quiet', () => { hush = true; stopMusic(); });
    addEventListener('mh98-loud', () => { hush = false; playMusic(); });
    addEventListener('pagehide', () => { try { sessionStorage.setItem('mh98-music-at', String(step)); } catch (e) { /* starts from the top */ } });

    // Audio wakes on the first click or key when the browser held it back; then the music starts.
    const wake = () => start().then(playMusic);
    if (on || musicOn) {
      wake();
      const once = () => { wake(); removeEventListener('pointerdown', once, true); removeEventListener('keydown', once, true); };
      addEventListener('pointerdown', once, true); addEventListener('keydown', once, true);
    }
    const foot = document.querySelector('.footer');
    const toggle = (label, key, get, set, onText, turnedOn, turnedOff) => {
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'sound'; btn.dataset.toggle = key;
      btn.innerHTML = `${label}<span aria-hidden="true"></span>`;
      const show = () => { btn.setAttribute('aria-pressed', String(get())); btn.lastChild.textContent = get() ? onText : ': OFF'; };
      show();
      btn.addEventListener('click', () => {
        set(!get()); show();
        try { localStorage.setItem(key, get() ? 'on' : 'off'); } catch (e) { /* only this page remembers */ }
        if (get()) start().then(turnedOn); else turnedOff();
      });
      foot.insertBefore(btn, foot.querySelector('nav'));
    };
    if (foot) {
      toggle('SOUND', 'mh98-sound', () => on, v => { on = v; }, ': ON', () => play('chime'), () => {});
      toggle('MUSIC', 'mh98-music', () => musicOn, v => { musicOn = v; }, `: ${song.name}`, () => { hush = false; playMusic(); }, stopMusic);
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || !on || !ac || ac.state !== 'running' || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target || a.hasAttribute('download') || a.origin !== location.origin) return;
      play('link');
      if (a.pathname === location.pathname && a.search === location.search) return; // an anchor on this page
      e.preventDefault();
      setTimeout(() => { location.href = a.href; }, 140);
    });
    if (document.body.dataset.page === '404') addEventListener('load', () => setTimeout(() => play('miss'), 300));

    /* Hovers on the main controls, mouse only. A control sounds once per entry and hovers sound at most once
       every 140ms, so sweeping across the menu plays a quick pentatonic run instead of a buzz. */
    const HOVER = [['.wordmark, .site-nav a', 'menu'], ['.icons a', 'icon'], ['.primary-link, .text-link, .yt', 'cta'], ['.tasks button, .footer .sound', 'btn']];
    const SCALE = [79, 84, 86, 88, 91, 93, 96]; // G5, then C D E G A C
    let over = null, last = 0;
    document.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      const hit = HOVER.map(([sel, name]) => [e.target.closest(sel), name]).find(([el]) => el) || [null];
      if (hit[0] === over) return;
      over = hit[0];
      if (!over || performance.now() - last < 140) return;
      last = performance.now();
      const menu = [...document.querySelectorAll('.wordmark, .site-nav a')];
      play(hit[1], SCALE[Math.min(menu.indexOf(over), SCALE.length - 1)]);
    });
    return play;
  })();

  /* FLUORITE.EYE, the home page's YouTube window. The markup is a plain link to the video (what shows without
     JS); with JS it becomes YouTube's player, on the privacy-enhanced host, through YouTube's IFrame API. It
     plays when the page opens (after the boot). If the browser holds sound back until a click or key, it starts
     on the first one. The spot is saved every second and on leaving, so coming back picks up there; paused
     by hand, it comes back paused. While it plays, the site's MUSIC steps aside. If the API can't load, the
     link comes back. */
  const ytLink = document.querySelector('a[data-yt]');
  if (ytLink) {
    const KEY = `mh98-yt-${ytLink.dataset.yt}`;
    let saved = { t: 0, paused: false }, player = null, leaving = false;
    try { saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { /* from the start */ }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* this visit only */ } };
    const box = document.createElement('div'), spot = document.createElement('div');
    box.className = 'yt-box'; box.append(spot);
    ytLink.replaceWith(box);
    if (!saved.paused) dispatchEvent(new Event('mh98-quiet')); // the song is about to play: no chip music first
    const playing = () => player?.getPlayerState?.() === 1;
    const go = () => { if (player && !saved.paused && !root.classList.contains('boot')) player.playVideo(); };
    const firstTouch = () => {
      const once = () => { removeEventListener('pointerdown', once, true); removeEventListener('keydown', once, true); go(); };
      addEventListener('pointerdown', once, true); addEventListener('keydown', once, true);
    };
    const begin = () => { go(); setTimeout(() => { if (!playing() && !saved.paused) firstTouch(); }, 1500); };
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player(spot, {
        host: 'https://www.youtube-nocookie.com', videoId: ytLink.dataset.yt, width: '100%', height: '100%',
        playerVars: { start: Math.floor(saved.t), rel: 0, playsinline: 1, origin: location.origin },
        events: {
          onReady: () => { player.getIframe().title = ytLink.dataset.title || 'YouTube video'; begin(); },
          onStateChange: e => {
            if (e.data === 1) { saved.paused = false; dispatchEvent(new Event('mh98-quiet')); }
            else if (e.data === 2 && !leaving) { saved.paused = true; dispatchEvent(new Event('mh98-loud')); }
            else if (e.data === 0) { saved = { t: 0, paused: false }; dispatchEvent(new Event('mh98-loud')); }
            save();
          },
        },
      });
    };
    setInterval(() => { if (playing()) { saved.t = player.getCurrentTime(); save(); } }, 1000);
    addEventListener('pagehide', () => { leaving = true; if (player?.getPlayerState && player.getPlayerState() !== 0) { saved.t = player.getCurrentTime(); save(); } }); // not at the end
    addEventListener('pageshow', e => { if (e.persisted) { leaving = false; begin(); } });
    addEventListener('mh98-booted', begin);
    const api = document.createElement('script');
    api.src = 'https://www.youtube.com/iframe_api';
    api.onerror = () => { box.replaceWith(ytLink); dispatchEvent(new Event('mh98-loud')); };
    document.head.append(api);
  }

  /* Boot: on a first visit with motion on, the head script adds html.boot (CSS covers the page in black)
     and this types a short text-mode boot, about 1.2-1.5s, then cuts to the page. The last line changes to
     the page's directory. A key, click, tap or wheel skips it; ?boot replays it. The hero animations ran under
     the cover, so they restart afterwards. A page opened in a background tab keeps the cover and starts
     the boot when it is first shown. */
  const boot = () => {
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
    const typed = frames.length;
    for (let n = 0; n < 3; n++) frames.push([...done, 'A:\\>' + cmd]);
    let f = 0;
    const show = () => {
      scr.textContent = frames[f].join('\n') + (f >= typing && f % 2 === 0 ? '_' : '');
      if (f === 0) sfx('post'); else if (f === 1) sfx('seek'); else if (f > typing && f <= typed) sfx('key');
    };
    const keys = ['keydown', 'wheel'];
    const end = () => {
      if (!scr.isConnected) return;
      clearInterval(timer); scr.remove(); root.classList.remove('boot'); dispatchEvent(new Event('mh98-booted'));
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
  };
  if (root.classList.contains('boot')) {
    if (!document.hidden) boot();
    else {
      const shown = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', shown); boot(); } };
      document.addEventListener('visibilitychange', shown);
    }
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
    const front = (w, quiet) => {
      if (!quiet && !w.classList.contains('top')) sfx('open');
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
        let tx = e.clientX, ty = e.clientY;
        const move = ev => {
          w.style.left = Math.max(0, Math.min(desk.clientWidth - 80, ev.clientX - sx)) + 'px';
          w.style.top = Math.max(0, ev.clientY - sy) + 'px';
          if (Math.hypot(ev.clientX - tx, ev.clientY - ty) >= 24) { tx = ev.clientX; ty = ev.clientY; sfx('tick'); }
        };
        const up = () => { removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
        addEventListener('pointermove', move); addEventListener('pointerup', up);
      });
      w.addEventListener('focusin', () => front(w));
    });
    tasks.forEach(b => b.addEventListener('click', () => { const w = document.getElementById(b.dataset.for); front(w); }));
    if (wins.length) front(wins[0], true);
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
