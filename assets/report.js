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

  if (lightbox && thumbs.length > 0) {
    const lbImg = document.getElementById('lbImg');
    const lbCap = document.getElementById('lbCap');
    const lbPrevBtn = document.getElementById('lbPrev');
    const lbNextBtn = document.getElementById('lbNext');
    let current = 0;

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
      const thumbSrc = target.src;               // уже загружено (это же превью в галерее)
      const fullSrc = target.dataset.full || thumbSrc;
      const alt = target.alt;

      /* Показываем то, что уже есть (превью), сразу — вместе с новой
         подписью. Полноразмерное фото подменяем, когда оно догрузится,
         чтобы не висела старая фотка под новым заголовком. */
      lbImg.src = thumbSrc;
      lbImg.alt = alt;
      lbCap.textContent = alt || '';
      lightbox.classList.add('open');
      document.body.classList.add('lb-locked');

      if (fullSrc !== thumbSrc) {
        lbImg.classList.add('lb-loading');
        const loader = new Image();
        loader.onload = () => {
          if (thumbs[current] !== target) return; // пока грузилось — уже перелистнули дальше
          lbImg.src = fullSrc;
          lbImg.classList.remove('lb-loading');
        };
        loader.onerror = () => {
          if (thumbs[current] !== target) return;
          lbImg.classList.remove('lb-loading');
        };
        loader.src = fullSrc;
      } else {
        lbImg.classList.remove('lb-loading');
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
    const BATCH_SIZE = 2;    // сколько фото грузим параллельно
    const BATCH_DELAY = 300; // пауза между пачками, мс

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlow = conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');

    if (!isSlow) {
      const urls = thumbs
        .map((img) => img.dataset.full)
        .filter(Boolean);

      let index = 0;

      const loadNextBatch = () => {
        if (index >= urls.length) return;

        urls.slice(index, index + BATCH_SIZE).forEach((url) => {
          const img = new Image();
          img.src = url;
        });

        index += BATCH_SIZE;
        setTimeout(loadNextBatch, BATCH_DELAY);
      };

      window.addEventListener('load', () => {
        setTimeout(loadNextBatch, 1000);
      });
    }
  }
})();