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

/* ---------- Hero: было/стало — стабильный цикл без вспышек ---------- */
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
  let i = 0;
  let sweeping = false;
  let tipLocked = false;

  const absUrl = (src) => new URL(src, document.baseURI).href;

  function loadOne(src) {
    return new Promise((resolve) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => {
        if (im.decode) im.decode().then(() => resolve(src)).catch(() => resolve(src));
        else resolve(src);
      };
      im.onerror = () => resolve(src);
      im.src = absUrl(src);
    });
  }

  function setPair(from) {
    const to = (from + 1) % items.length;
    const a = items[from];
    const b = items[to];
    curr.src = a;
    next.src = b;
    el.style.setProperty('--mask-curr', `url("${absUrl(a)}")`);
    el.style.setProperty('--mask-next', `url("${absUrl(b)}")`);
  }

  function layoutTipSafe() {
    if (tipLocked) return;
    layoutTapeTip(el);
  }

  function startSweep() {
    if (sweeping) return;
    if (document.hidden) return;
    sweeping = true;
    tipLocked = false;
    layoutTipSafe();
    tipLocked = true;
    el.classList.remove('sweeping', 'shot--revealed');
    el.style.setProperty('--p', '0');
    if (el.getAnimations) el.getAnimations().forEach((a) => a.cancel());
    void el.offsetWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!sweeping) return;
        el.classList.add('sweeping');
      });
    });
  }

  el.addEventListener('animationend', (e) => {
    if (e.target !== el) return;
    if (e.animationName && e.animationName !== 'tape-rtl') return;
    if (!sweeping) return;

    /* Сначала --p:0 (видно только curr), потом меняем пару — иначе вспышка next */
    el.classList.remove('sweeping');
    tipLocked = false;
    el.style.setProperty('--p', '0');
    i = (i + 1) % items.length;
    setPair(i);
    void el.offsetWidth;
    sweeping = false;

    requestAnimationFrame(() => startSweep());
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      el.classList.remove('sweeping');
      sweeping = false;
      tipLocked = false;
      el.style.setProperty('--p', '0');
    } else if (el.getBoundingClientRect().top < window.innerHeight) {
      startSweep();
    }
  });

  window.addEventListener('resize', () => {
    if (!el.classList.contains('sweeping')) layoutTapeTip(el);
  });

  Promise.all(items.map(loadOne)).then(() => {
    setPair(0);
    el.style.setProperty('--p', '0');
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        startSweep();
        io.disconnect();
      }, { threshold: 0.2 });
      io.observe(el);
    } else startSweep();
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
  { i: 'img/history/39.png', y: 2023, t: 'Золото HR-бренд hh.ru', d: 'Первое место.' },
  { i: 'img/history/39.png', y: 2024, t: 'Снова золото hh.ru', d: 'Проект «ГлавТренер».' },
  { i: 'img/history/36.jpg', y: 2024, t: '83 067 клиентов', d: 'Идём к 100 000.' },
  { i: 'img/history/40.png', y: 2025, t: 'Жюри премии hh.ru', d: 'Василий Папин возглавил жюри.' },
  { i: 'img/history/40.png', y: 2026, t: 'Совет рейтинга работодателей', d: 'Рядом с X5, VK, Альфа-Банком.' },
  { i: 'img/history/38.jpg', y: 2026, t: 'К 2027 — изменить индустрию', d: 'Меньше штрафов и нервов на проверках.' }
];

const track = document.getElementById('tlTrack');
const ruler = document.getElementById('tlRuler');
const thumb = document.getElementById('tlThumb');

track.innerHTML = events.map((e) => `
  <article class="tl__card" data-year="${e.y}">
    ${e.i ? `<figure class="shot shot--sweep tl__shot" style="--img:url('${e.i}')">
      <span class="shot__base"></span><span class="shot__color"></span><span class="shot__tape"></span>
    </figure>` : ''}
    <div class="tl__body">
      <b>${e.y}</b>
      <h3>${e.t}</h3>
      ${e.d ? `<p>${e.d}</p>` : ''}
    </div>
  </article>`).join('');

track.querySelectorAll('.shot--sweep').forEach((el) => sweeper.observe(el));

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
