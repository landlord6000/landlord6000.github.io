/* ============================================================
   Общий скрипт лайтбокса для страниц отчётов о походах.
   Подключается на каждой странице так:
   <script src="../../assets/report.js"></script>

   Ожидает на странице разметку:
   .thumb > img[data-full][alt]  — превью в галереях
   #lightbox, #lbImg, #lbCap, #lbClose, #lbPrev, #lbNext
   ============================================================ */

(function () {
  const thumbs = Array.from(document.querySelectorAll('.thumb img'));
  const lightbox = document.getElementById('lightbox');
  if (!lightbox || thumbs.length === 0) return;

  const lbImg = document.getElementById('lbImg');
  const lbCap = document.getElementById('lbCap');
  let current = 0;

  function openAt(i) {
    current = (i + thumbs.length) % thumbs.length;
    const img = thumbs[current];
    lbImg.src = img.dataset.full || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt || '';
    lightbox.classList.add('open');
  }

  thumbs.forEach((img, i) => {
    img.parentElement.addEventListener('click', () => openAt(i));
  });

  document.getElementById('lbClose').addEventListener('click', () => lightbox.classList.remove('open'));
  document.getElementById('lbPrev').addEventListener('click', () => openAt(current - 1));
  document.getElementById('lbNext').addEventListener('click', () => openAt(current + 1));

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) lightbox.classList.remove('open');
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') lightbox.classList.remove('open');
    if (e.key === 'ArrowLeft') openAt(current - 1);
    if (e.key === 'ArrowRight') openAt(current + 1);
  });
})();
