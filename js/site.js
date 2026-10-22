/* Shared controls (rev 8). The inline head script sets motion before paint and exposes window.AO;
   this file wires the desktop windows on the home page and the step sequences.
   Motion follows prefers-reduced-motion (or ?motion=off); there is no on-page motion button. */
(() => {
  const root = document.documentElement;
  const motionOn = () => root.dataset.motion === 'on';

  /* Home desktop: from 1200px the windows sit at fixed spots; drag one by its title bar (the top
     --bar-h pixels, drawn by CSS), click one to bring it to the front, or use the status-bar buttons. */
  const desk = document.querySelector('.desk');
  if (desk) {
    const wide = matchMedia('(min-width:1200px)');
    const wins = [...desk.querySelectorAll('.win')];
    const tasks = [...document.querySelectorAll('.tasks button')];
    let z = 20;
    const front = w => {
      wins.forEach(x => x.classList.toggle('top', x === w));
      w.style.zIndex = ++z;
      tasks.forEach(b => b.classList.toggle('on', b.dataset.for === w.id));
    };
    wins.forEach(w => {
      w.addEventListener('pointerdown', e => {
        front(w);
        if (!wide.matches || e.button !== 0 || e.clientY - w.getBoundingClientRect().top > 30 || e.target.closest('a')) return;
        e.preventDefault();
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
