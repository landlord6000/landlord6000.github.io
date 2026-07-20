# Инструкция: создание страниц отчётов о походах

Файл самодостаточен: шаблон HTML/CSS/JS ниже — единственный источник правды, ничего дополнительно прикладывать не нужно.

## 0. Рабочий процесс

Исходник — сырой txt-черновик от пользователя (текст похода, не структурированный, без привязки к фото). На его основе делаются два файла в `travell/<slug>/`:

1. **`<slug>.md`** — причёсанный черновик-конспект: тот же текст, разбитый заголовками по блокам (точки/дни), с пометками, где по тексту должны стоять фото — `[фото NN, MM: подпись]`. Промежуточный шаг для проверки текста и структуры человеком, без CSS/HTML.
2. **`<slug>.html`** — финальная страница по шаблону ниже, собранная из того же текста.

`<slug>` — латиницей, формат `название-год` (например `karelia-2023`, `moskvoretsky-2026`).

## 1. Структура файлов проекта

```
travell/<slug>/<slug>.html
travell/<slug>/photos/   — полноразмерные фото
travell/<slug>/thumbs/   — уменьшенные превью (те же имена файлов)
```

## 2. Именование фото

Двузначные номера без суффиксов, `.jpg`:

- Первая цифра (десяток) — порядковый номер смыслового блока по ходу текста (день/точка/эпизод): 0, 1, 2, 3...
- Вторая цифра — номер фото внутри блока: 0, 1, 2...
- Если в блоке одно фото — всё равно `N0` (`00.jpg`, `20.jpg`, `60.jpg`), не голое `N`.
- Блоков может быть больше 10 — тогда продолжаем счёт десятками (100, 101, 110, 130...). Пропуски десятков допустимы, если в блоке нет фото.

Каждое фото должно существовать в двух копиях с одинаковым именем: `photos/NN.jpg` (оригинал) и `thumbs/NN.jpg` (уменьшенное превью для сетки).

## 3. HTML-шаблон (копировать целиком, менять только помеченные места)

```html
<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- НАЗВАНИЕ ОТЧЁТА --></title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
    rel="stylesheet">
  <style>
    :root {
      --bg: #E9EDE3;
      --bg-card: #F5F4EC;
      --text: #20241C;
      --muted: #6E7566;
      --accent: #35606B;
      --accent2: #6B7D4F;
      --line: rgba(53, 96, 107, 0.18);
      --max-w: 760px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: 'IBM Plex Sans', sans-serif;
      font-size: 17px;
      line-height: 1.65;
      -webkit-font-smoothing: antialiased;
    }

    .wrap {
      max-width: var(--max-w);
      margin: 0 auto;
      padding: 64px 24px 120px;
    }

    h1 {
      font-family: 'Fraunces', serif;
      font-weight: 700;
      font-optical-sizing: auto;
      font-size: clamp(2rem, 5vw, 2.9rem);
      line-height: 1.1;
      letter-spacing: -0.01em;
      margin: 0 0 8px;
    }

    .subtitle {
      color: var(--muted);
      font-size: 15px;
      margin-bottom: 48px;
      font-family: 'IBM Plex Mono', monospace;
    }

    p {
      margin: 0 0 20px;
    }

    .section-title {
      font-family: 'Fraunces', serif;
      font-weight: 600;
      font-size: 1.5rem;
      margin: 56px 0 18px;
      display: flex;
      align-items: baseline;
      gap: 14px;
    }

    .day-heading {
      margin: 48px 0 16px;
    }

    .day-heading.tight {
      margin: 36px 0 14px;
    }

    .day-title {
      font-family: 'Fraunces', serif;
      font-weight: 600;
      font-size: 1.6rem;
    }

    blockquote {
      margin: 20px 0;
      padding: 16px 20px;
      background: var(--bg-card);
      border-left: 3px solid var(--accent);
      border-radius: 2px;
      font-style: italic;
      color: var(--text);
    }

    blockquote p:last-child {
      margin-bottom: 0;
    }

    ul {
      padding-left: 20px;
      margin: 0 0 20px;
    }

    hr {
      border: none;
      border-top: 1px solid var(--line);
      margin: 48px 0;
    }

    .caption {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.78rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 10px 0 32px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .caption::before {
      content: "◆";
      font-size: 0.6rem;
      color: var(--accent);
    }

    .home-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.72rem;
      color: var(--muted);
      text-decoration: none;
      letter-spacing: 0.03em;
      margin-bottom: 28px;
      opacity: 0.7;
      transition: opacity .2s;
    }

    .home-link:hover {
      opacity: 1;
      color: var(--accent);
    }

    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 8px;
      margin-bottom: 12px;
    }

    .gallery.single {
      grid-template-columns: 1fr;
    }

    .gallery.single .thumb {
      aspect-ratio: 16/10;
    }

    .thumb {
      aspect-ratio: 1/1;
      overflow: hidden;
      border-radius: 3px;
      cursor: zoom-in;
      background: var(--bg-card);
    }

    .thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform .35s ease;
    }

    .thumb:hover img {
      transform: scale(1.06);
    }

    strong {
      color: var(--text);
    }

    a {
      color: var(--accent);
    }

    /* Lightbox */
    .lightbox {
      position: fixed;
      inset: 0;
      background: rgba(15, 17, 12, 0.94);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 40px;
    }

    .lightbox.open {
      display: flex;
    }

    .lightbox img {
      max-width: 90vw;
      max-height: 82vh;
      object-fit: contain;
      border-radius: 2px;
    }

    .lightbox-cap {
      position: absolute;
      bottom: 28px;
      left: 0;
      right: 0;
      text-align: center;
      color: #E9EDE3;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.85rem;
      opacity: 0.85;
    }

    .lb-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #E9EDE3;
      font-size: 2.4rem;
      cursor: pointer;
      padding: 12px 18px;
      opacity: 0.7;
      transition: opacity .2s;
      font-family: serif;
      line-height: 1;
    }

    .lb-btn:hover {
      opacity: 1;
    }

    .lb-prev {
      left: 6px;
    }

    .lb-next {
      right: 6px;
    }

    .lb-close {
      position: absolute;
      top: 18px;
      right: 24px;
      background: none;
      border: none;
      color: #E9EDE3;
      font-size: 1.8rem;
      cursor: pointer;
      opacity: 0.7;
    }

    .lb-close:hover {
      opacity: 1;
    }

    @media (max-width:600px) {
      .wrap {
        padding: 40px 16px 90px;
      }

      .lb-btn {
        font-size: 1.8rem;
        padding: 8px 10px;
      }
    }
  </style>
</head>

<body>

  <div class="wrap">

    <a href="../../index.html" class="home-link">← на главную</a>

    <h1><!-- НАЗВАНИЕ ОТЧЁТА --></h1>
    <div class="subtitle"><!-- Тип похода · MM.ГГГГ · километраж, напр. "ПВД · 07.2026 · 9 км" --></div>

    <div class="section-title">О месте</div>

    <p><!-- вводный текст про место/маршрут --></p>

    <p><strong>Трек:</strong> <a href="<!-- ссылка на nakarte.me -->" target="_blank" rel="noopener">nakarte.me</a></p>

    <blockquote>
      <p><strong>Кратко:</strong> <!-- краткая сводка/предупреждения по маршруту --></p>
    </blockquote>

    <hr>

    <!-- Точка/день 1: первый блок использует class="day-heading" БЕЗ tight -->
    <div class="day-heading">
      <div class="day-title"><!-- X1 / День первый --></div>
    </div>

    <p><!-- текст --></p>

    <!-- Точка/день 2 и далее: class="day-heading tight" -->
    <div class="day-heading tight">
      <div class="day-title"><!-- X2 / День второй --></div>
    </div>

    <p><!-- текст --></p>

    <!-- Галерея из нескольких фото -->
    <div class="gallery">
      <div class="thumb"><img src="./thumbs/10.jpg" data-full="./photos/10.jpg" alt="Описание" loading="lazy"></div>
      <div class="thumb"><img src="./thumbs/11.jpg" data-full="./photos/11.jpg" alt="Описание" loading="lazy"></div>
    </div>

    <!-- Одно фото (широкий кадр 16:10) — с подписью снизу -->
    <div class="gallery single">
      <div class="thumb"><img src="./thumbs/20.jpg" data-full="./photos/20.jpg" alt="Описание" loading="lazy"></div>
    </div>
    <div class="caption">Подпись под фото</div>

    <!-- ... повторять day-heading.tight / p / gallery для каждого блока ... -->

    <hr>

    <div class="section-title">Итоги</div>

    <p><!-- итоговый текст --></p>

  </div>

  <!-- Lightbox -->
  <div class="lightbox" id="lightbox">
    <button class="lb-close" id="lbClose">✕</button>
    <button class="lb-btn lb-prev" id="lbPrev">‹</button>
    <img id="lbImg" src="" alt="">
    <button class="lb-btn lb-next" id="lbNext">›</button>
    <div class="lightbox-cap" id="lbCap"></div>
  </div>

  <script>
    const thumbs = Array.from(document.querySelectorAll('.thumb img'));
    const lightbox = document.getElementById('lightbox');
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
  </script>

</body>

</html>
```

### Важные правила по галереям

- **Всегда** оба атрибута на `<img>`: `src="./thumbs/NN.jpg"` (превью) и `data-full="./photos/NN.jpg"` (открывается в лайтбоксе). Никогда не ссылаться в `src` напрямую на `./photos/`.
- `<div class="gallery">` — для 2+ фото подряд (квадратные превью в сетке).
- `<div class="gallery single">` — для одного фото (широкий кадр 16:10), сразу под ним `<div class="caption">`.

### Заголовки блоков

- `day-heading` без `tight` — только у самого первого блока после вступления.
- `day-heading tight` — у всех последующих блоков (меньше отступ сверху).
- Название блока (`day-title`) — либо номер точки (X1, X2, X7'...) для ПВД, либо "День первый / День второй..." для многодневных походов.

## 4. Обновление index.html

После создания страницы добавить новый `<li>` в начало списка `.travell` в `/index.html`:

```html
<li>
  <a href="travell/<slug>/<slug>.html">
    <span class="report-title">Название отчёта</span>
    <span class="report-meta">Тип похода · MM.ГГГГ</span>
  </a>
</li>
```
