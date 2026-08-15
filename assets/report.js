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
  const inFlight = new Map(); // url -> { controller, promise } текущей фоновой закачки (section 4 наполняет)
  let lightboxIsOpen = false;
  let resumePreload = () => { }; // section 4 переопределит после инициализации
  let pausePreload = () => { }; // section 4 переопределит: обрывает фоновые закачки

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
        const finish = () => {
          if (thumbs[current] !== target) return; // уже перелистнули дальше
          lbImg.src = fullSrc;
          lbImg.classList.remove('is-loading');
        };

        if (inFlight.has(fullSrc)) {
          // Эта же картинка уже качается фоном (мы не стали её обрывать
          // в pausePreload) — просто ждём тот же fetch, а не запускаем
          // второй запрос за тем же файлом с нуля.
          inFlight.get(fullSrc).promise.then(finish, finish);
        } else {
          const loader = new Image();
          if ('fetchPriority' in loader) loader.fetchPriority = 'high';
          requestedFull.add(fullSrc);
          loader.onload = finish;
          loader.onerror = finish;
          loader.src = fullSrc;
        }
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
      const target = thumbs[current];
      const openingUrl = target.dataset.full || target.currentSrc || target.src;
      pausePreload(openingUrl); // обрываем фоновые закачки, кроме той, что открываем сейчас —
      // иначе клик по фото, чья фоновая закачка уже идёт, обрывает
      // её на середине и запускает скачивание того же файла заново
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
  /* Раньше прелоад шёл строго по порядку документа (0, 1, 2, ...),
     поэтому если открыть фото далеко от начала галереи, оно ещё
     даже не попадало в очередь. А запросы уже начатых фоновых
     закачек нельзя было отменить — они продолжали идти и после
     открытия лайтбокса, отбирая канал у той фотографии, которую
     человек реально смотрит.

     Теперь: 1) очередь строится через IntersectionObserver — грузим
     то, что приближается к области видимости, то есть синхронно со
     скроллом человека, а не с начала списка; 2) закачки идут через
     fetch()+AbortController, поэтому их можно реально ОБОРВАТЬ в
     момент открытия лайтбокса, а не просто перестать добавлять
     новые. */
  if (thumbs.length > 0) {
    const MAX_CONCURRENT = 2; // сколько фото грузим одновременно — по-настоящему,
    // не по таймеру, а по факту свободного слота

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isSlow = conn && (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');

    if (!isSlow) {
      const queue = []; // URL-ы, ожидающие закачки, в порядке приближения к viewport
      let active = 0;
      let started = false; // не запускаем закачки раньше window 'load'

      const startLoad = (url) => {
        requestedFull.add(url);
        active++;
        const controller = new AbortController();
        const promise = fetch(url, { signal: controller.signal, priority: 'low', credentials: 'same-origin' })
          .catch(() => { }) // отменено или сеть подвела — не страшно, лайтбокс перезапросит сам
          .finally(() => {
            inFlight.delete(url);
            active--;
            pump();
          });
        inFlight.set(url, { controller, promise });
      };

      const pump = () => {
        if (!started || lightboxIsOpen) return; // возобновится сама через resumePreload()

        while (active < MAX_CONCURRENT && queue.length > 0) {
          const url = queue.shift();
          if (requestedFull.has(url)) continue; // уже грузится/загружено по клику
          startLoad(url);
        }
      };

      const enqueue = (url) => {
        if (!url || requestedFull.has(url) || queue.includes(url)) return;
        queue.push(url);
        pump();
      };

      /* Обрываем фоновые закачки — освобождаем канал под открытое в
         лайтбоксе фото. exceptUrl — это как раз то фото, которое мы
         открываем: если оно уже качается фоном, не обрываем его на
         середине (иначе render() пришлось бы качать его заново с
         нуля), а даём ему домотаться и переиспользуем в render(). */
      const abortAllPreloads = (exceptUrl) => {
        inFlight.forEach(({ controller }, url) => {
          if (url === exceptUrl) return;
          controller.abort();
          requestedFull.delete(url);
          queue.unshift(url); // возвращаем в начало очереди
          inFlight.delete(url);
          active--;
        });
      };

      resumePreload = pump;
      pausePreload = abortAllPreloads;

      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              enqueue(entry.target.dataset.full);
              io.unobserve(entry.target);
            }
          });
        }, { rootMargin: '1000px 0px' }); // с запасом вперёд по скроллу

        thumbs.forEach((img) => {
          if (img.dataset.full) io.observe(img);
        });
      } else {
        // старые браузеры без IntersectionObserver — старое поведение,
        // прелоадим всё по порядку документа
        thumbs.forEach((img) => enqueue(img.dataset.full));
      }

      window.addEventListener('load', () => {
        setTimeout(() => {
          started = true;
          pump();
        }, 500);
      });
    }
  }
})();