'use strict';
(() => {
  document.documentElement.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const hero = document.querySelector('.hero');

  // Header turns white once the gradient hero has scrolled away; a thin progress line shows how far the reader is.
  const progress = document.createElement('span');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  header.append(progress);

  // Parallax: things in the same scene move at different speeds. Positive depth lags behind the scroll (far away),
  // negative depth runs ahead (close to the viewer). Only `translate` is touched, so reveal transforms keep working.
  const DEPTHS = [
    ['.hero-copy', 0.1], ['.board-stage', -0.06], ['.float-booking', -0.12], ['.float-reminder', 0.1],
    ['.launch-phone', 0], ['.peek-frame img', -0.05], ['.deck-slide-3', 0.08], ['.deck-slide-2', 0.04],
    ['.plan', -0.04], ['.calc-save', -0.05], ['.final h2', 0.06],
  ];
  let layers = [];
  const collect = () => {
    const shifts = new Map(layers.map(({ el, shift }) => [el, shift]));
    layers = DEPTHS.flatMap(([selector, depth]) => [...document.querySelectorAll(selector)].map((el) => ({ el, depth, shift: shifts.get(el) || 0 }))).filter((l) => l.depth);
  };

  let ticking = false;
  const frame = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    // On phones the layout is a single column: shifting blocks only makes them overlap their neighbours.
    const parallax = !reduce && innerWidth >= 760;
    const middle = innerHeight / 2;
    // Measure all layers before changing styles to avoid forcing layout once per layer.
    const positions = parallax ? layers.map((layer) => ({ layer, rect: layer.el.getBoundingClientRect() })) : [];
    header.classList.toggle('is-scrolled', !hero || scrollY > 40);
    progress.style.setProperty('--progress', max > 0 ? Math.min(1, scrollY / max) : 0);
    if (!parallax) {
      for (const layer of layers) if (layer.shift) { layer.el.style.translate = ''; layer.shift = 0; }
      return;
    }
    for (const { layer, rect: r } of positions) {
      if (r.bottom < -200 || r.top > innerHeight + 200) continue;
      const offset = (middle - (r.top + r.height / 2 - (layer.shift || 0))) * layer.depth;
      layer.shift = offset;
      layer.el.style.translate = `0 ${offset.toFixed(1)}px`;
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });

  // Reveal blocks once as they enter the viewport.
  const revealer = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealer.unobserve(entry.target); }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;
  const observe = () => {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => (revealer ? revealer.observe(el) : el.classList.add('is-visible')));
    collect(); onScroll();
  };
  document.addEventListener('lomviko:render', observe);
  observe();

  // Hero phone: a new Telegram booking slides into the day, then a reminder goes out.
  const stage = document.getElementById('board-stage'), board = stage?.querySelector('.board');
  if (board) {
    if (reduce) board.classList.add('is-live', 'is-remind');
    else {
      let timers = [], running = false, visible = false;
      const cycle = () => {
        board.classList.remove('is-live', 'is-remind');
        timers = [setTimeout(() => board.classList.add('is-live'), 1400), setTimeout(() => board.classList.add('is-remind'), 3400), setTimeout(cycle, 9000)];
      };
      const update = () => {
        if (visible && !document.hidden) { if (!running) { running = true; cycle(); } }
        else if (running) { running = false; timers.forEach(clearTimeout); }
      };
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }, { threshold: 0.25 }).observe(stage);
        document.addEventListener('visibilitychange', update);
      } else board.classList.add('is-live', 'is-remind');
      // The phone turns towards the pointer.
      if (matchMedia('(hover: hover)').matches) {
        let pointerFrame = 0, pointerX = 0, pointerY = 0;
        hero.addEventListener('pointermove', (e) => {
          pointerX = e.clientX / innerWidth - 0.5; pointerY = e.clientY / innerHeight - 0.5;
          if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
            pointerFrame = 0;
            board.style.setProperty('--ry', `${(-18 + pointerX * 16).toFixed(1)}deg`);
            board.style.setProperty('--rx', `${(8 - pointerY * 10).toFixed(1)}deg`);
          });
        }, { passive: true });
        hero.addEventListener('pointerleave', () => { cancelAnimationFrame(pointerFrame); pointerFrame = 0; board.style.removeProperty('--ry'); board.style.removeProperty('--rx'); });
      }
    }
  }

  // Launch story: the pinned phone shows the screen of whichever step is in the middle of the viewport.
  const phone = document.getElementById('launch-phone'), steps = [...document.querySelectorAll('.launch-step')];
  if (phone && steps.length) {
    const activate = (step) => { phone.dataset.active = step.dataset.step; steps.forEach((s) => s.classList.toggle('is-active', s === step)); };
    activate(steps[0]);
    if ('IntersectionObserver' in window) {
      const picker = new IntersectionObserver((entries) => { for (const entry of entries) if (entry.isIntersecting) activate(entry.target); }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => picker.observe(s));
    }
  }
})();
