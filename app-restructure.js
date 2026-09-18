'use strict';

/* ---------- Лента: tip, проезд, после — цветной ---------- */
function layoutTapeTip(el) {
  const rw = el.clientWidth * 2;
  el.style.setProperty('--tip', `${(161.12 / 653) * rw}px`);
}

function playTape(el) {
  layoutTapeTip(el);
  el.classList.remove('sweeping', 'shot--revealed');
  el.style.setProperty('--p', '0');
  void el.offsetWidth;
  el.classList.add('sweeping');
  el.addEventListener('animationend', () => {
    el.classList.remove('sweeping');
    el.classList.add('shot--revealed');
  }, { once: true });
}

const sweeper = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    playTape(e.target);
    sweeper.unobserve(e.target);
  });
}, { threshold: 0.35 });
document.querySelectorAll('.shot--sweep').forEach((el) => sweeper.observe(el));
window.addEventListener('resize', () => {
  document.querySelectorAll('.shot--sweep, .shot--revealed').forEach(layoutTapeTip);
});

/* Документы / любые shot с data-img — грузим только рядом с экраном */
(function () {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const fig = en.target;
      const src = fig.dataset.img;
      if (!src) return;
      fig.style.setProperty('--img', `url('${src}')`);
      fig.classList.add('shot--sweep');
      sweeper.observe(fig);
      io.unobserve(fig);
    });
  }, { rootMargin: '180px', threshold: 0.01 });
  document.querySelectorAll('.shot[data-img]').forEach((fig) => io.observe(fig));
})();

/* ---------- Hero: без рывка — ленту прячем на сбросе p, curr без клипа ---------- */
(function () {
  const el = document.getElementById('heroSafety');
  if (!el) return;

  const items = [
    'img/safety/extinguisher.webp',
    'img/safety/cabinet.webp',
    'img/safety/estop.webp',
    'img/safety/kit.webp',
    'img/safety/plan.webp'
  ];
  const curr = el.querySelector('.hero__safety-curr');
  const next = el.querySelector('.hero__safety-next');
  const DUR = 1500;
  let i = 0;
  let raf = 0;
  let t0 = 0;
  let running = false;
  let ready = false;
  let busy = false;

  const abs = (src) => new URL(src, document.baseURI).href;

  function load(src) {
    return new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve(src);
      im.onerror = () => resolve(src);
      im.src = abs(src);
    });
  }

  function setPair(from) {
    const a = items[from];
    const b = items[(from + 1) % items.length];
    curr.src = a;
    next.src = b;
    el.style.setProperty('--mask-curr', 'url("' + a + '")');
    el.style.setProperty('--mask-next', 'url("' + b + '")');
  }

  function tick(now) {
    if (!running || busy) return;
    const p = Math.min(1, (now - t0) / DUR);
    el.style.setProperty('--p', String(p));
    if (p < 1) {
      raf = requestAnimationFrame(tick);
      return;
    }

    /* Конец: next полностью накрыл curr.
       1) curr ← next ( fores одинаковые при p=1)
       2) спрятать ленту (иначе телепорт p:1→0)
       3) p=0, подставить следующий next
       4) показать ленту и ехать снова */
    busy = true;
    i = (i + 1) % items.length;
    const shown = items[i];
    const upcoming = items[(i + 1) % items.length];
    const shownMask = el.style.getPropertyValue('--mask-next') || ('url("' + shown + '")');

    curr.src = shown;
    el.style.setProperty('--mask-curr', shownMask);

    el.classList.add('tape-off');
    raf = requestAnimationFrame(() => {
      el.style.setProperty('--p', '0');
      next.src = upcoming;
      el.style.setProperty('--mask-next', 'url("' + upcoming + '")');

      raf = requestAnimationFrame((t) => {
        el.classList.remove('tape-off');
        busy = false;
        t0 = t;
        raf = requestAnimationFrame(tick);
      });
    });
  }

  function start() {
    if (running || !ready || document.hidden) return;
    running = true;
    busy = false;
    el.classList.remove('sweeping', 'shot--revealed', 'tape-off', 'is-hold');
    layoutTapeTip(el);
    setPair(i);
    el.style.setProperty('--p', '0');
    t0 = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    busy = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    el.classList.add('tape-off');
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stop();
      el.style.setProperty('--p', '0');
    } else if (ready) {
      el.classList.remove('tape-off');
      start();
    }
  });

  let tipTimer = 0;
  window.addEventListener('resize', () => {
    if (!ready) return;
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => layoutTapeTip(el), 150);
  });

  Promise.all([load(items[0]), load(items[1])]).then(() => {
    ready = true;
    setPair(0);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.setProperty('--p', '1');
      el.classList.add('tape-off');
      return;
    }
    el.style.setProperty('--p', '0');
    items.slice(2).forEach(load);
    const tryStart = () => {
      const r = el.getBoundingClientRect();
      if (r.bottom > 40 && r.top < window.innerHeight) start();
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        start();
        io.disconnect();
      }, { threshold: 0.1 });
      io.observe(el);
      requestAnimationFrame(tryStart);
    } else start();
  });
})();

/* ---------- Одна скорость у бегущих строк (бренды = направления) ---------- */
(function () {
  const SPEED = 42; /* px/s — как у dirs при ~48s */
  function sync(track) {
    const row = track && track.children[0];
    if (!row) return;
    const w = row.getBoundingClientRect().width;
    if (w < 1) return;
    track.style.animationDuration = `${Math.max(12, w / SPEED)}s`;
  }
  function syncAll() {
    document.querySelectorAll('.dirs-marquee__track, .trust__brands-track').forEach(sync);
  }
  syncAll();
  window.addEventListener('resize', syncAll);
})();

/* ---------- Счётчик: цифра растёт от 0 до значения при появлении ---------- */
function countUp(el) {
  const target = +el.dataset.count;
  const dur = +el.dataset.dur || 1800;
  const fmt = (n) => Math.round(n).toLocaleString('ru-RU').replace(/\u00a0|\s/g, '\u00a0');
  const t0 = performance.now();
  const tick = (now) => {
    const p = Math.min(1, (now - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(target * eased);
    if (p < 1) requestAnimationFrame(tick); else el.textContent = fmt(target);
  };
  el.textContent = '0';
  requestAnimationFrame(tick);
}
const counter = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countUp(e.target);
    counter.unobserve(e.target);
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

/* ---------- История: короткие вехи, без эпохи, с hh.ru ---------- */
const events = [
  { i: 'img/history/2.jpg', y: 2012, t: 'Компания родилась', d: 'Шесть человек. Хотели делать чуть лучше рынка.' },
  { i: 'img/history/3.jpg', y: 2012, t: 'Лицензия на образование', d: 'Первый паспорт компании.' },
  { i: 'img/history/6.jpg', y: 2013, t: 'Аккредитация Минтруда', d: 'Минобразования и Минтруд — оба.' },
  { i: 'img/history/10.jpg', y: 2014, t: 'Первые 1000 клиентов', d: 'Казалось, что захватили весь рынок.' },
  { i: 'img/history/12.jpg', y: 2015, t: 'Федеральный институт', d: 'Заказчики пошли из других регионов.' },
  { i: 'img/history/13.jpg', y: 2016, t: 'Проверка Минобразования', d: 'Плановая. Без нарушений.' },
  { i: 'img/history/16.jpg', y: 2017, t: 'Придумали СПО', d: 'Одинаковый уровень знаний у всех, кого прислала компания.' },
  { i: 'img/history/19.jpg', y: 2018, t: '10 000 клиентов', d: 'Цель стала дальше.' },
  { i: 'img/history/20.jpg', y: 2019, t: 'Проверка инспекции труда', d: 'Без нареканий.' },
  { i: 'img/history/23.jpg', y: 2020, t: 'Сто человек в команде', d: 'На удалёнке — ещё до пандемии.' },
  { i: 'img/history/25.jpg', y: 2021, t: '100 000 слушателей', d: 'ИТ-системы выдержали.' },
  { i: 'img/history/27.jpg', y: 2021, t: 'Полная проверка Минобразования', d: 'Снова без нарушений.' },
  { i: 'img/history/28.jpg', y: 2022, t: '50 000-й клиент', d: 'Столько компаний нам доверяют.' },
  { i: 'img/history/33.jpg', y: 2023, t: 'Своё ПО', d: 'Свидетельство о регистрации программы.' },
  { i: 'img/history/39.jpg', y: 2023, t: 'Золото HR-бренд hh.ru', d: 'Первое место.' },
  { i: 'img/history/39.jpg', y: 2024, t: 'Снова золото hh.ru', d: 'Проект «ГлавТренер».' },
  { i: 'img/history/36.jpg', y: 2024, t: '83 067 клиентов', d: 'Идём к 100 000.' },
  { i: 'img/history/40.jpg', y: 2025, t: 'Жюри премии hh.ru', d: 'Василий Папин возглавил жюри.' },
  { i: 'img/history/40.jpg', y: 2026, t: 'Совет рейтинга работодателей', d: 'Рядом с X5, VK, Альфа-Банком.' },
  { i: 'img/history/38.jpg', y: 2026, t: 'К 2027 — изменить индустрию', d: 'Меньше штрафов и нервов на проверках.' }
];

const track = document.getElementById('tlTrack');
const ruler = document.getElementById('tlRuler');
const thumb = document.getElementById('tlThumb');

track.innerHTML = events.map((e) => `
  <article class="tl__card" data-year="${e.y}">
    ${e.i ? `<figure class="shot tl__shot" data-img="${e.i}">
      <span class="shot__base"></span><span class="shot__color"></span><span class="shot__tape"></span>
    </figure>` : ''}
    <div class="tl__body">
      <b>${e.y}</b>
      <h3>${e.t}</h3>
      ${e.d ? `<p>${e.d}</p>` : ''}
    </div>
  </article>`).join('');

/* Картинки истории — только когда карточка рядом с экраном */
const lazyHistory = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const fig = en.target;
    const src = fig.dataset.img;
    if (!src) return;
    fig.style.setProperty('--img', `url('${src}')`);
    fig.classList.add('shot--sweep');
    sweeper.observe(fig);
    lazyHistory.unobserve(fig);
  });
}, { root: track, rootMargin: '120px', threshold: 0.01 });
track.querySelectorAll('.tl__shot[data-img]').forEach((fig) => lazyHistory.observe(fig));

const years = [...new Set(events.map((e) => e.y))];
years.forEach((y) => {
  const tick = document.createElement('button');
  tick.className = 'tl__tick';
  tick.dataset.year = y;
  tick.innerHTML = `<span>${String(y).slice(2)}</span>`;
  tick.addEventListener('click', () => {
    track.querySelector(`.tl__card[data-year="${y}"]`)
      .scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  });
  ruler.appendChild(tick);
});

const cards = [...track.querySelectorAll('.tl__card')];
const ticks = [...ruler.querySelectorAll('.tl__tick')];

function syncRuler() {
  const max = track.scrollWidth - track.clientWidth;
  const progress = max > 0 ? track.scrollLeft / max : 0;
  const rulerW = ruler.clientWidth;
  const width = Math.max(28, (track.clientWidth / track.scrollWidth) * rulerW);
  thumb.style.width = width + 'px';
  thumb.style.transform = `translateX(${progress * (rulerW - width)}px)`;

  const center = track.scrollLeft + track.clientWidth / 2;
  let nearest = cards[0];
  let best = Infinity;
  cards.forEach((c) => {
    const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
    if (dist < best) { best = dist; nearest = c; }
  });
  ticks.forEach((t) => {
    if (t.dataset.year === nearest.dataset.year) t.setAttribute('data-active', '');
    else t.removeAttribute('data-active');
  });
}

track.addEventListener('scroll', () => requestAnimationFrame(syncRuler), { passive: true });
window.addEventListener('resize', syncRuler);
syncRuler();

const step = () => (cards[0]?.offsetWidth || 340) + 20;
document.getElementById('tlPrev').addEventListener('click',
  () => track.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
document.getElementById('tlNext').addEventListener('click',
  () => track.scrollBy({ left: step() * 2, behavior: 'smooth' }));

let dragging = false;
const seekFromRuler = (clientX) => {
  const r = ruler.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  track.scrollLeft = ratio * (track.scrollWidth - track.clientWidth);
};
ruler.addEventListener('pointerdown', (e) => { dragging = true; seekFromRuler(e.clientX); });
window.addEventListener('pointermove', (e) => { if (dragging) seekFromRuler(e.clientX); });
window.addEventListener('pointerup', () => { dragging = false; });
