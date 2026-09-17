'use strict';

/* ---------- Лента: tip по ширине, проезд, после — цветной ---------- */
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

/* ---------- Направления: фильтр по роли ---------- */
document.querySelectorAll('[data-tabs="dirs"] .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-tabs="dirs"] .tab')
      .forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    const f = tab.dataset.filter;
    document.querySelectorAll('.dir').forEach((d) => {
      d.hidden = f !== 'all' && !d.dataset.role.split(' ').includes(f);
    });
  });
});

/* ---------- Отрасли ---------- */
const industries = [
  { name: 'Производство', img: 'img/history/14.jpg' },
  { name: 'Строительство', img: 'img/history/35.jpg' },
  { name: 'Медицина', img: 'img/history/24.jpg' },
  { name: 'Торговля', img: 'img/history/34.jpg' },
  { name: 'Образование', img: 'img/history/22.jpg' }
];
const indShot = document.getElementById('indShot');
const indBadge = document.getElementById('indBadge');
document.querySelectorAll('[data-tabs="ind"] .tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('[data-tabs="ind"] .tab')
      .forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    const it = industries[+tab.dataset.ind];
    indBadge.textContent = it.name;
    indShot.style.setProperty('--img', `url('${it.img}')`);
    playTape(indShot);
  });
});

/* ---------- Таймлайн ---------- */
const events = [
  { i: 'img/history/2.jpg', y: 2012, t: 'Компания родилась', d: 'Назывались по-другому и просто хотели делать чуть лучше, чем было на рынке.' },
  { i: 'img/history/3.jpg', y: 2012, t: 'Получили лицензию на образование', d: 'Первая лицензия — как первый паспорт для подростка. Всё только начиналось.' },
  { i: 'img/history/4.jpg', y: 2012, t: 'Нас шесть человек', d: 'Анна, Лиля, Женя, Сережа, Ольга и ВМ. Юны, но амбициозны.' },
  { i: 'img/history/1.jpg', y: 2012, t: 'Несостоявшийся конец света', era: 1 },
  { i: 'img/history/5.jpg', y: 2013, t: 'Первые 100 клиентов', d: 'Ещё вчера был один клиент, и мы ему радовались. А теперь сто.' },
  { i: 'img/history/6.jpg', y: 2013, t: 'Аккредитация Минтруда', d: 'Охрана труда требует двойного контроля: Минобразования и Минтруда. Прошли оба.' },
  { i: 'img/history/7.jpg', y: 2013, t: 'Универсиада в Казани', era: 1 },
  { i: 'img/history/8.jpg', y: 2014, t: 'Олимпиада в Сочи', era: 1 },
  { i: 'img/history/10.jpg', y: 2014, t: 'Первые 1000 клиентов', d: 'Тогда казалось, что мы захватили весь рынок.' },
  { i: 'img/history/11.jpg', y: 2015, t: 'Нас десять человек', d: 'Начали расти сразу удалённо, когда это ещё считалось подработкой.' },
  { i: 'img/history/12.jpg', y: 2015, t: 'Стали Федеральным институтом', d: 'Компании Алтайского края закончились. Для других регионов нужно было имя.' },
  { i: 'img/history/13.jpg', y: 2016, t: 'Проверка Минобразования', d: 'Плановая. Мы всё делаем правильно, и проверка это подтвердила.' },
  { i: 'img/history/14.jpg', y: 2016, t: 'Нас двадцать человек', d: 'Двадцать человек на удалёнке. Учились управлять без офиса.' },
  { i: 'img/history/15.jpg', y: 2017, t: 'Проверка Министерства юстиции', d: 'Проверяли соблюдение законодательства о некоммерческих организациях. Всё в порядке.' },
  { i: 'img/history/16.jpg', y: 2017, t: 'Придумали СПО', d: 'Система принудительного обучения: одинаковый уровень знаний у всех, кого прислала компания.' },
  { i: 'img/history/18.jpg', y: 2018, t: 'Чемпионат мира по футболу', era: 1 },
  { i: 'img/history/19.jpg', y: 2018, t: 'Первые 10 000 клиентов', d: 'Восприняли спокойно — было понятно, что цель намного дальше.' },
  { i: 'img/history/20.jpg', y: 2019, t: 'Проверка инспекции труда', d: 'Прошли без нареканий, даже с СОУТ, которая стала обязательной за месяц до этого.' },
  { i: 'img/history/21.jpg', y: 2019, t: '50 млн выплаченных зарплат', d: 'Компания сделала разных людей суммарно на 50 миллионов богаче.' },
  { i: 'img/history/22.jpg', y: 2020, t: 'Песочница для руководителей', d: 'Инструмент для тех, у кого есть амбиция стать руководителем.' },
  { i: 'img/history/23.jpg', y: 2020, t: 'Нас сто человек', d: 'Сто человек на удалёнке — ещё до пандемии, когда это не было мейнстримом.' },
  { i: 'img/history/24.jpg', y: 2020, t: 'Ковид-19', era: 1 },
  { i: 'img/history/26.jpg', y: 2021, t: '100 млн выплаченных зарплат', d: 'Идём к миллиарду, потому что это формула вин-вин.' },
  { i: 'img/history/25.jpg', y: 2021, t: 'Обучили 100 000 слушателей', d: 'Испытание для наших ИТ-систем. Справились.' },
  { i: 'img/history/27.jpg', y: 2021, t: 'Полная проверка Минобразования', d: 'Лицензионный контроль и контроль образовательной деятельности. Без нарушений.' },
  { i: 'img/history/28.jpg', y: 2022, t: '50 000-й клиент', d: 'Столько компаний нам доверяют. На то есть причины.' },
  { i: 'img/history/31.jpg', y: 2022, t: 'Нам десять лет', d: 'Пригласили в Барнаул всех сотрудников. Два дня общения. Повторим.' },
  { i: 'img/history/32.jpg', y: 2023, t: '200 млн выплаченных зарплат', d: 'Цель прежняя — миллиард.' },
  { i: 'img/history/33.jpg', y: 2023, t: 'Запатентовали программу', d: 'Получили свидетельство о регистрации собственного ПО.' },
  { i: 'img/history/34.jpg', y: 2023, t: 'Зарплата каждый день', d: 'Внутренний сервис начисляет зарплату не два раза в месяц, а ежедневно.' },
  { i: 'img/history/35.jpg', y: 2024, t: 'Средняя зарплата 57 000', d: 'По рынку в отрасли — около 40 000 по данным hh.ru.' },
  { i: 'img/history/36.jpg', y: 2024, t: '83 067 клиентов', d: 'Идём к 100 000 постепенно. И однажды будет миллион.' },
  { i: 'img/history/39.png', y: 2024, t: 'Премия HR-бренд — золото', d: 'Победа в категории «Малый бизнес»: проект «ГлавТренер».' },
  { i: 'img/history/40.png', y: 2025, t: 'Председатель жюри hh.ru', d: 'Василий Папин возглавляет жюри Премии HR-бренд.' },
  { i: 'img/history/38.jpg', y: 2026, t: 'Изменить индустрию к 2027', d: 'Избавляем компании от штрафов и эмоциональных затрат при проверках.' }
];

const track = document.getElementById('tlTrack');
const ruler = document.getElementById('tlRuler');
const thumb = document.getElementById('tlThumb');

track.innerHTML = events.map((e) => `
  <article class="tl__card${e.era ? ' tl__card--era' : ''}" data-year="${e.y}">
    ${e.i ? `<figure class="shot shot--sweep tl__shot" style="--img:url('${e.i}')">
      <span class="shot__base"></span><span class="shot__color"></span><span class="shot__tape"></span>
    </figure>` : ''}
    <div class="tl__body">
      <b>${e.y}</b>
      <h3>${e.t}</h3>
      ${e.d ? `<p>${e.d}</p>` : '<p>Контекст эпохи</p>'}
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

/* Протаскивание линейки мышью — курсор по годам */
let dragging = false;
const seekFromRuler = (clientX) => {
  const r = ruler.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  track.scrollLeft = ratio * (track.scrollWidth - track.clientWidth);
};
ruler.addEventListener('pointerdown', (e) => { dragging = true; seekFromRuler(e.clientX); });
window.addEventListener('pointermove', (e) => { if (dragging) seekFromRuler(e.clientX); });
window.addEventListener('pointerup', () => { dragging = false; });
