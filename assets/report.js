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
    let current = 0;

    const openAt = (i) => {
      current = (i + thumbs.length) % thumbs.length;
      const img = thumbs[current];
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt || '';
      lightbox.classList.add('open');
      document.body.classList.add('lb-locked');
    };

    const closeLightbox = () => {
      lightbox.classList.remove('open');
      document.body.classList.remove('lb-locked');
    };

    thumbs.forEach((img, i) => {
      img.parentElement.addEventListener('click', () => openAt(i));
    });

    document.getElementById('lbClose').addEventListener('click', closeLightbox);
    document.getElementById('lbPrev').addEventListener('click', () => openAt(current - 1));
    document.getElementById('lbNext').addEventListener('click', () => openAt(current + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') openAt(current - 1);
      if (e.key === 'ArrowRight') openAt(current + 1);
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
    { key: 'UAE-2024', title: 'Поездка в Рас-Эль-Хайма, ОАЭ' },
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
})();