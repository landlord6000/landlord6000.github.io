/* ============================================================
   Общий скрипт для страниц отчётов о походах.
   Подключается на каждой странице так:
   <script src="../../assets/report.js"></script>

   Делает три вещи:
   1. Лайтбокс — ожидает разметку:
      .thumb > img[data-full][alt]
      #lightbox, #lbImg, #lbCap, #lbClose, #lbPrev, #lbNext
   2. Кнопка "наверх" — создаётся и вставляется скриптом сама,
      в HTML отчёта ничего добавлять не нужно.
   3. Переходы prev/next между отчётами — список REPORTS ниже
      единый на все страницы; при добавлении нового отчёта
      достаточно дописать одну строку сюда, а не редактировать
      каждую HTML-страницу.
   ============================================================ */

(function () {
  /* ---------- 1. Лайтбокс ---------- */
  const thumbs = Array.from(document.querySelectorAll('.thumb img'));
  const lightbox = document.getElementById('lightbox');

  /* Общий для лайтбокса и фонового прелоада: какие fullres-урлы уже
     запрошены (или сейчас грузятся), чтобы не дублировать запрос и
     чтобы прелоад мог пропускать то, что уже стартовало по клику. */
  const requestedFull = new Set();
  let lightboxIsOpen = false;
  let resumePreload = () => { }; // section 4 переопределит после инициализации

  if (lightbox && thumbs.length > 0) {
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    const lbPrevBtn = document.getElementById('lbPrev');
    const lbNextBtn = document.getElementById('lbNext');
    let current = 0;

    /* Оборачиваем #lbImg в фиксированный по размеру контейнер, не
       трогая разметку HTML-страниц отчётов — иначе при подмене
       thumb → fullres плывёт размер бокса (см. .lb-stage в CSS). */
    const lbStage = document.createElement('div');
    lbStage.className = 'lb-stage';
    lbImg.parentNode.insertBefore(lbStage, lbImg);
    lbStage.appendChild(lbImg);

    /* Границы "своей" галереи для индекса — чтобы при пролистывании
       не уезжать в фотографии соседней .gallery на той же странице. */
    const galleryBounds = (index) => {
      const galleryEl = thumbs[index].closest('.gallery');
      let start = index;
      let end = index;
      while (start - 1 >= 0 && thumbs[start - 1].closest('.gallery') === galleryEl) start--;
      while (end + 1 < thumbs.length && thumbs[end + 1].closest('.gallery') === galleryEl) end++;
      return { start, end };
    };

    const render = () => {
      const target = thumbs[current];
      const thumbSrc = target.currentSrc || target.src; // уже в кэше — появляется мгновенно
      const fullSrc = target.dataset.full || thumbSrc;
      const alt = target.alt;

      lbCap.textContent = alt || '';
      lightbox.classList.add('open');
      document.body.classList.add('lb-locked');

      /* Сразу показываем растянутый thumb (он уже загружен), затем,
         по мере готовности, бесшовно подменяем на полный размер. */
      lbImg.src = thumbSrc;
      lbImg.alt = alt;
      lbImg.style.opacity = 1;
      lbImg.classList.toggle('is-loading', fullSrc !== thumbSrc);

      if (fullSrc !== thumbSrc) {
        const loader = new Image();
        if ('fetchPriority' in loader) loader.fetchPriority = 'high';
        requestedFull.add(fullSrc);
        const finish = () => {
          if (thumbs[current] !== target) return; // уже перелистнули дальше
          lbImg.src = fullSrc;
          lbImg.classList.remove('is-loading');
        };
        loader.onload = finish;
        loader.onerror = finish;
        loader.src = fullSrc;
      }

      const { start, end } = galleryBounds(current);
      const atStart = current <= start;
      const atEnd = current >= end;
      lbPrevBtn.disabled = atStart;
      lbNextBtn.disabled = atEnd;
      lbPrevBtn.classList.toggle('lb-btn-disabled', atStart);
      lbNextBtn.classList.toggle('lb-btn-disabled', atEnd);
    };

    const openAt = (i) => {
      current = i;
      lightboxIsOpen = true;
      render();
    };

    /* Листание кнопками/стрелками — только в пределах своей галереи,
       без перехода на соседнюю и без зацикливания. */
    const step = (delta) => {
      const { start, end } = galleryBounds(current);
      const next = current + delta;
      if (next < start || next > end) return;
      current = next;
      render();
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('lb-locked');
      lightboxIsOpen = false;
      resumePreload(); // освободили полосу — фоновый прелоад можно продолжать
    };

    thumbs.forEach((img, i) => {
      img.parentElement.addEventListener('click', () => openAt(i));
    });

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    lbPrevBtn.addEventListener('click', () => step(-1));
    lbNextBtn.addEventListener('click', () => step(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- 2. Кнопка "наверх" ---------- */
  const backToTop = document.createElement('button');
  backToTop.className = 'back-to-top';
  backToTop.type = 'button';
  backToTop.setAttribute('aria-label', 'Наверх');
  backToTop.textContent = '↑';
  document.body.appendChild(backToTop);

  const toggleBackToTop = () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  };
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  toggleBackToTop();

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- 3. Переходы между отчётами ---------- */
  /* Порядок — как на главной странице (сверху вниз, от нового к старому). */
  const REPORTS = [
    { key: 'moskvoretsky-2026', title: 'Москворецкий пойменный заказник' },
    { key: 'UAE-2024', title: 'Небольшой очерк об ОАЭ (Рас-Эль-Хайма)' },
    { key: 'karelia-2023', title: 'Путешествие по югу Карелии' },
    { key: 'valday-2023', title: 'Большая Валдайская тропа на лыжах' },
  ];

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const currentKey = pathParts[pathParts.length - 2];
  const currentIndex = REPORTS.findIndex((r) => r.key === currentKey);

  const wrap = document.querySelector('.wrap');
  if (currentIndex !== -1 && wrap) {
    const prev = REPORTS[currentIndex - 1];
    const next = REPORTS[currentIndex + 1];

    if (prev || next) {
      const nav = document.createElement('div');
      nav.className = 'report-nav';

      if (prev) {
        const a = document.createElement('a');
        a.href = `../${prev.key}/${prev.key}.html`;
        a.className = 'prev';
        a.textContent = `← ${prev.title}`;
        nav.appendChild(a);
      }

      if (next) {
        const a = document.createElement('a');
        a.href = `../${next.key}/${next.key}.html`;
        a.className = 'next';
        a.textContent = `${next.title} →`;
        nav.appendChild(a);
      }

      wrap.appendChild(nav);
    }
  }

  /* ---------- 4. Тихий прелоад полноразмерных фото ---------- */
  if (thumbs.length > 0) {
    const MAX_CONCURRENT = 2; // сколько фото грузим одновременно — по-настоящему,
    // не по таймеру, а по факту свободного слота

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlow = conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');

    if (!isSlow) {
      const urls = thumbs
        .map((img) => img.dataset.full)
        .filter(Boolean);

      let index = 0;
      let active = 0;

      const pump = () => {
        if (lightboxIsOpen) return; // возобновится сама через resumePreload() при закрытии

        while (active < MAX_CONCURRENT && index < urls.length) {
          const url = urls[index++];
          if (requestedFull.has(url)) continue; // уже грузится/загружено по клику
          requestedFull.add(url);

          active++;
          const img = new Image();
          if ('fetchPriority' in img) img.fetchPriority = 'low';
          const done = () => {
            active--;
            pump(); // слот освободился — сразу берём следующее фото
          };
          img.onload = done;
          img.onerror = done;
          img.src = url;
        }
      };

      resumePreload = pump;
      window.addEventListener('load', () => {
        setTimeout(pump, 1000);
      });
    }
  }
})();