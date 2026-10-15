'use strict';
(() => {
  const copy = {
    uk: {
      stageLabel: 'Один звичайний день. Значно менше метушні.', dayTitle: 'Сьогодні все сходиться.', daySubtitle: 'Команда · спільний розклад', memberOne: 'Олена', memberTwo: 'Максим', serviceOne: 'Стрижка + укладка', serviceTwo: 'Догляд за волоссям', serviceThree: 'Консультація', customerOne: 'Ірина · підтверджено', customerTwo: 'Анна · через Telegram', customerThree: 'Дмитро · підтверджено', teamSync: 'Команда бачить той самий розклад', newBooking: 'Анна обрала свій час', bookingDetail: '12:00 · запис уже в розкладі', paperNote: 'А ви займаєтесь\nсвоєю справою.', illustration: 'Демонстрація сценарію · вигадані дані', pause: 'Пауза анімації', play: 'Увімкнути анімацію', tabSchedule: 'Хто, коли й до кого', tabBot: 'Запис без переписки', tabMoney: 'Куди пішов робочий день', peekEyebrow: 'А ВСЕРЕДИНІ — РОБОЧИЙ ІНСТРУМЕНТ', peekTitle: 'Відкрили. Побачили день. За роботу.', peekBody: 'Розклад, клієнти й оплати поруч. Не потрібно згадувати, в якому чаті домовлялися.',
      stories: [
        { tag: 'РОЗКЛАД', title: '«А на дванадцяту хтось є?»', body: 'Не питайте в чаті. Подивіться в розклад: хто працює, коли вільний і скільки часу займе послуга.', foot: 'Один запис — спільний план для команди.', labels: ['Обираємо вільний час', 'Запис у розкладі', 'Олена', 'Максим', 'Догляд · Анна', 'Вільне вікно'] },
        { tag: 'TELEGRAM-БОТ', title: 'Клієнт записується. Ви працюєте.', body: 'Послуга, майстер, час — клієнт обирає сам. Підключений бот працює на сервері, навіть коли застосунок закритий.', foot: 'Бота потрібно підключити до вашого бізнесу.', labels: ['На яку послугу записати?', 'Догляд за волоссям', 'Оберіть зручний час', '12:00', 'Готово! Чекаємо на вас о 12:00.', 'BIZ · запис онлайн'] },
        { tag: 'РЕЗУЛЬТАТИ', title: 'День закінчився. Цифри залишились.', body: 'Внесли оплату — вона в обліку. Подивіться дохід, завантаженість і послуги за потрібний період.', foot: 'Фінанси доступні за правами вашої ролі.', labels: ['Оплата за візит', 'Внесено в облік', 'Дохід за день', 'Послуги', 'Візити', 'Демонстраційний звіт'] }
      ]
    },
    en: {
      stageLabel: 'An ordinary day. A little less back-and-forth.', dayTitle: 'Today, it all fits.', daySubtitle: 'Team · shared schedule', memberOne: 'Olena', memberTwo: 'Max', serviceOne: 'Cut + styling', serviceTwo: 'Hair treatment', serviceThree: 'Consultation', customerOne: 'Iryna · confirmed', customerTwo: 'Anna · via Telegram', customerThree: 'Dmytro · confirmed', teamSync: 'The same schedule for everyone', newBooking: 'Anna picked her time', bookingDetail: '12:00 · already on the schedule', paperNote: 'You get on\nwith your work.', illustration: 'Illustrative scenario · fictional data', pause: 'Pause animation', play: 'Play animation', tabSchedule: 'Who, when and with whom', tabBot: 'Book without the back-and-forth', tabMoney: 'See what your day added up to', peekEyebrow: 'INSIDE: A TOOL FOR THE WORKDAY', peekTitle: 'Open it. See your day. Get to work.', peekBody: 'Appointments, customers and payments together. No searching through chats to find what you agreed.',
      stories: [
        { tag: 'SCHEDULE', title: '“Is anyone booked at twelve?”', body: 'Check the schedule. See who is working, who has a slot and how long the service takes.', foot: 'One appointment. A shared plan for your team.', labels: ['Choosing a free slot', 'On the schedule', 'Olena', 'Max', 'Treatment · Anna', 'Available slot'] },
        { tag: 'TELEGRAM BOT', title: 'They book. You get on with work.', body: 'Service, specialist, time — customers choose for themselves. Your connected bot runs on the server even when the app is closed.', foot: 'Connect a bot to your business to get started.', labels: ['What would you like to book?', 'Hair treatment', 'Pick a time that suits you', '12:00', 'Booked! See you at 12:00.', 'BIZ · online booking'] },
        { tag: 'RESULTS', title: 'The day is done. The numbers are here.', body: 'Record a payment and it is in your books. Check revenue, workload and services over the period you need.', foot: 'Financial access depends on your role.', labels: ['Appointment payment', 'Recorded', 'Daily revenue', 'Services', 'Visits', 'Illustrative report'] }
      ]
    }
  };
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let selected = 0;
  let paused = reduced.matches;
  const text = () => copy[document.documentElement.lang === 'en' ? 'en' : 'uk'];
  function scene(story) {
    const l = story.labels.map(escape);
    if (selected === 0) return `<div class="scene-schedule" aria-hidden="true"><div class="mini-head"><span>BIZ / 14.10</span><span class="scene-status">✓ ${l[1]}</span></div><div class="mini-columns"><span>${l[2]}</span><span>${l[3]}</span></div><div class="mini-calendar"><div class="mini-slot slot-fixed">10:00<br>11:00</div><div class="mini-slot slot-free">12:00<br><span>${l[5]}</span></div><div class="mini-slot slot-added"><small>12:00 — 13:00</small><strong>${l[4]}</strong><b>✓</b></div><div class="mini-slot slot-second">11:00<br>12:00</div><div class="demo-pointer">↖<span>${l[0]}</span></div></div></div>`;
    if (selected === 1) return `<div class="scene-chat" aria-hidden="true"><div class="chat-head"><span class="telegram-icon">↗</span><strong>${l[5]}</strong><span>•••</span></div><div class="chat-message chat-one">${l[0]}</div><div class="chat-message chat-two">${l[1]} ✓</div><div class="chat-message chat-three">${l[2]}<div class="chat-times"><span>10:00</span><span class="chosen">${l[3]}</span><span>14:30</span></div></div><div class="chat-message chat-four">${l[4]} <span>✓✓</span></div></div>`;
    return `<div class="scene-report" aria-hidden="true"><div class="mini-head"><span>${l[5]}</span><span>14.10</span></div><div class="report-total"><span>${l[2]}</span><strong>4 800 <small>₴</small></strong></div><div class="report-bars"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="report-details"><span>${l[3]} <b>3</b></span><span>${l[4]} <b>6</b></span></div><div class="payment-slip"><span>${l[0]}</span><strong>+ 800 ₴</strong><small>✓ ${l[1]}</small></div></div>`;
  }
  function render() {
    const c = text();
    document.querySelectorAll('[data-motion]').forEach(el => { el.textContent = c[el.dataset.motion]; });
    document.querySelectorAll('[data-story]').forEach(button => {
      const active = Number(button.dataset.story) === selected;
      button.classList.toggle('selected', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const story = c.stories[selected];
    const panel = document.querySelector('#story-panel');
    panel.setAttribute('aria-labelledby', `story-tab-${selected}`);
    panel.innerHTML = `<div class="story-copy"><p class="eyebrow">${escape(story.tag)}</p><h3>${escape(story.title)}</h3><p>${escape(story.body)}</p><span class="story-foot">${escape(story.foot)}</span></div><div class="story-scene">${scene(story)}</div><p class="scene-caption">${escape(c.illustration)}</p>`;
    syncPause();
  }
  function syncPause() {
    document.body.classList.toggle('motion-paused', paused);
    const button = document.querySelector('.motion-toggle');
    button.textContent = `${paused ? '▷' : 'Ⅱ'} ${paused ? text().play : text().pause}`;
    button.setAttribute('aria-pressed', String(paused));
  }
  document.querySelector('.motion-toggle').onclick = () => { paused = !paused; syncPause(); };
  document.querySelectorAll('[data-story]').forEach(button => {
    button.onclick = () => { selected = Number(button.dataset.story); render(); };
    button.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      selected = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (selected + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
      render();
      document.querySelector(`[data-story="${selected}"]`).focus();
    };
  });
  reduced.addEventListener('change', event => { paused = event.matches; syncPause(); });
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  render();
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => entry.target.classList.toggle('in-view', entry.isIntersecting)), { threshold: .12 });
    document.querySelectorAll('.hero-visual, .benefit-studio').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.hero-visual, .benefit-studio').forEach(el => el.classList.add('in-view'));
})();
