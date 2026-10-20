'use strict';
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');

  // Header state and reading progress.
  const progress = document.createElement('span');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  header.append(progress);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', scrollY > 8);
      progress.style.setProperty('--progress', max > 0 ? Math.min(1, scrollY / max) : 0);
      ticking = false;
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal sections once as they enter the viewport.
  const revealer = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver((entries) => {
        for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealer.unobserve(entry.target); }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    : null;
  const observe = () => document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => (revealer ? revealer.observe(el) : el.classList.add('is-visible')));
  document.addEventListener('lomviko:render', observe);
  observe();

  // Hero schedule: a new Telegram booking arrives, then a reminder goes out.
  const stage = document.getElementById('board-stage'), board = stage?.querySelector('.board');
  if (board) {
    if (reduce) board.classList.add('is-live', 'is-remind'), stage.classList.add('is-flat');
    else {
      let timers = [], running = false;
      const cycle = () => {
        board.classList.remove('is-live', 'is-remind');
        timers = [setTimeout(() => board.classList.add('is-live'), 1200), setTimeout(() => board.classList.add('is-remind'), 3200), setTimeout(cycle, 9000)];
      };
      const visible = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { stage.classList.add('is-flat'); if (!running) { running = true; cycle(); } }
        else if (running) { running = false; timers.forEach(clearTimeout); }
      }, { threshold: 0.25 });
      visible.observe(stage);
    }
  }

  // Soft spotlight that follows the pointer on feature cards.
  if (!reduce && matchMedia('(hover: hover)').matches)
    document.addEventListener('pointermove', (e) => {
      const card = e.target.closest?.('.card');
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });
})();
