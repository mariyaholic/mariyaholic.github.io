/* Shared controls (rev 7). The inline head script sets view and motion before paint and exposes
   window.AO; this file wires the Night toggle, the project switcher and the step sequences.
   Motion follows prefers-reduced-motion (or ?motion=off); there is no on-page motion button. */
(() => {
  const root = document.documentElement;
  const A = window.AO;
  const themeButton = document.getElementById('theme');
  const motionOn = () => root.dataset.motion === 'on';

  /* Night toggle: fixed label, state in aria-pressed; only clicks save. */
  if (A) {
    A.view(root.dataset.view);
    A.motion(root.dataset.motion);
    themeButton?.addEventListener('click', () => {
      const next = root.dataset.view === 'night' ? 'light' : 'night';
      A.view(next);
      A.put(A.T, next === 'night' ? 'dark' : 'light');
    });
  }

  /* Project switcher (index, confluence). image:null shows the page's TODO frame (cap-tickatlas.png missing). */
  const switcher = document.querySelector('[data-project-switcher]');
  if (switcher) {
    const q = sel => switcher.querySelector(sel);
    const panel = q('[data-project-panel]');
    const image = q('[data-project-image]');
    const todo = q('[data-project-todo]');
    const category = q('[data-project-category]');
    const title = q('[data-project-title]');
    const description = q('[data-project-description]');
    const link = q('[data-project-link]');
    const projects = {
      cygnus: { image:'img/cygnus.png', alt:'Cygnus Sky, an interactive astronomical map', category:'Astronomy', title:'A map of the sky.', description:'Ad Astra pulls from public astronomy archives. Cygnus is the part you can browse.', href:'https://cygnus-sky.pages.dev', label:'Visit Cygnus' },
      starfire: { image:'img/starfire.png', alt:'Starfire Hearth concept art, labelled as concept art rather than gameplay', category:'Games', title:'Starfire Hearth.', description:'A cozy space settlement game about exploring and building a home out there. Still in development.', href:'hearth.html', label:'Read about Starfire Hearth' },
      uika: { image:'img/uika.png', alt:'The Uika estate manual in its Doloris theme', category:'Tools', title:'Uika.', description:'An early setup for keeping my coding tools, decisions and experiments together across repos.', href:'tools.html', label:'Read about Uika' },
      atlas: { image:null, alt:'TickAtlas, the public statistics site from Argonaut Oak', category:'Research', title:'TickAtlas.', description:'Market studies written up as pages you can check. It\'s research, not a promise about future performance.', href:'atlas.html', label:'Read about TickAtlas' }
    };
    function show(key, fromClick) {
      const id = projects[key] ? key : 'cygnus';
      const item = projects[id];
      switcher.querySelectorAll('[data-project]').forEach(button => {
        button.setAttribute('aria-current', button.dataset.project === id ? 'true' : 'false');
      });
      if (item.image) {
        image.src = item.image; image.alt = item.alt; image.hidden = false;
        if (todo) todo.hidden = true;
      } else if (todo) {
        image.hidden = true; todo.hidden = false; todo.setAttribute('aria-label', item.alt);
      }
      category.textContent = item.category; title.textContent = item.title; description.textContent = item.description;
      link.href = item.href; link.textContent = `${item.label} ↗`;
      if (!fromClick) return;
      panel.classList.remove('is-switching');
      if (motionOn()) requestAnimationFrame(() => panel.classList.add('is-switching'));
      history.replaceState(null, '', `#project-${id}`);
    }
    switcher.querySelectorAll('[data-project]').forEach(button => button.addEventListener('click', () => show(button.dataset.project, true)));
    show(location.hash.replace('#project-', ''), false);
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
