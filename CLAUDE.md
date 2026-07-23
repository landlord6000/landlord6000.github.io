# Инструкция: создание страниц отчётов о походах

Файл самодостаточен. Общие CSS и JS уже вынесены в отдельные файлы —
`/assets/report.css` и `/assets/report.js` — их не нужно копировать
инлайново на страницу, только подключить ссылкой. Ничего дополнительно
прикладывать не нужно.

**НИКОГДА НЕ МЕНЯЙ АВТОРСКИЙ ТЕКСТ, НИ ПРИ КАКИХ ОБСТОЯТЕЛЬСТВАХ.**
Меняй его только если тебя явно попросили внести изменения.

## 0. Рабочий процесс

Исходник — сырой черновик от пользователя. Текст идёт сплошным потоком,
а места для фото помечены прямо внутри текста в формате:

```
текст текст текст
фото00 Фото моста
фото01 Фото дома
текст текст
фото10 Вид с перевала
текст текст
...
```

То есть `фотоNN` — это отдельная строка-плейсхолдер внутри потока текста.
`NN` — двузначный номер, который превращается в имя файла `NN.jpg`. Сразу
после номера, через пробел (без двоеточия) — подпись к этому фото. Подпись
пишется всегда, для каждого фото. Она идёт в `alt` у `<img>`, а для
одиночного фото (`gallery single`) — ещё и в `<div class="caption">` под
галереей.

На основе черновика делаются два файла в `travel/<slug>/`:

1. **`<slug>.md`** — причёсанный конспект: тот же текст, разбитый
   заголовками по блокам (точки/дни), с уже расставленными по местам
   плейсхолдерами `[фото NN]`. Промежуточный шаг, чтобы можно было
   проверить текст и структуру без HTML.
2. **`<slug>.html`** — финальная страница по шаблону ниже.

`<slug>` — латиницей, формат `название-год` (например `karelia-2023`,
`moskvoretsky-2026`).

`assets/report.css` и `assets/report.js` уже существуют в репозитории —
их не нужно создавать или копировать заново для нового отчёта, только
подключить ссылкой (см. шаблон в п.4). Единственная точечная правка в
`report.js` при добавлении нового отчёта — запись в массив `REPORTS`
(см. п.5).

## 1. Структура файлов проекта

```
assets/report.css
assets/report.js
index.html
travel/<slug>/<slug>.html
travel/<slug>/photos/   — полноразмерные фото
travel/<slug>/thumbs/   — уменьшенные превью (те же имена файлов)
```

`report.css` и `report.js` — общие на все страницы, лежат в одном месте
(`/assets/`), подключаются с уровня страницы отчёта через `../../assets/...`.
Их **не нужно** редактировать при добавлении нового отчёта, за одним
исключением — см. п.5 про `REPORTS` в `report.js`.

## 2. Именование фото

Двузначные (при необходимости — трёхзначные) номера без суффиксов, `.jpg`:

- Первая цифра (десяток) — порядковый номер смыслового блока по ходу
  текста (день/точка/эпизод): 0, 1, 2, 3...
- Вторая цифра — номер фото внутри блока: 0, 1, 2...
- Если в блоке одно фото — всё равно `N0` (`00.jpg`, `20.jpg`, `60.jpg`),
  не голое `N`.
- Блоков может быть больше 10 — тогда счёт продолжается десятками (100,
  101, 110, 130...). Пропуски десятков допустимы, если в блоке нет фото.

Каждое фото должно существовать в двух копиях с одинаковым именем:
`photos/NN.jpg` (оригинал) и `thumbs/NN.jpg` (уменьшенное превью для сетки).

Это соответствие: плейсхолдер `фото00` в черновике → блок 0, фото 0 →
файлы `photos/00.jpg` и `thumbs/00.jpg`.

## 3. Как плейсхолдеры фото превращаются в разметку

Идущие подряд плейсхолдеры `фотоNN` (без текста между ними) собираются
в одну галерею:

- **1 фото подряд** → `<div class="gallery single">` с одним `.thumb`,
  подпись идёт и в `alt`, и в `<div class="caption">` под галереей.
- **2+ фото подряд** → `<div class="gallery">` (сетка квадратных превью)
  со всеми `.thumb` внутри. У фото в сетке подпись идёт только в `alt`
  каждого `<img>` (по существующей практике на сайте под сеткой отдельный
  `.caption` не ставится).

Разметка одного превью:

```html
<div class="thumb"><img src="./thumbs/NN.jpg" data-full="./photos/NN.jpg" alt="Подпись к фото" loading="lazy"></div>
```

`src` — всегда `./thumbs/`, никогда напрямую `./photos/`. Полный размер
открывается в лайтбоксе через `data-full`.

## 4. HTML-шаблон страницы отчёта

Голова страницы подключает общий `report.css`, никакого инлайнового
`<style>` на странице по умолчанию не нужно (если для конкретного отчёта
требуется другой ритм отступов `.day-heading` — можно добавить локальный
`<style>` только с этим переопределением, ничего больше туда не дублировать).

```html
<!DOCTYPE html>
<html lang="ru">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- НАЗВАНИЕ ОТЧЁТА --></title>
  <link rel="canonical" href="https://landlord6000.github.io/travel/<slug>/<slug>.html">
  <meta name="description" content="<!-- краткое описание, 1-2 предложения -->">
  <meta property="og:type" content="article">
  <meta property="og:title" content="<!-- НАЗВАНИЕ ОТЧЁТА -->">
  <meta property="og:description" content="<!-- краткое описание -->">
  <meta property="og:url" content="https://landlord6000.github.io/travel/<slug>/<slug>.html">
  <meta property="og:image" content="https://landlord6000.github.io/travel/<slug>/photos/<!-- любое эффектное фото -->.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link
    href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="../../assets/report.css">
</head>

<body>

  <div class="wrap">

    <a href="../../index.html" class="home-link">← на главную</a>

    <h1><!-- НАЗВАНИЕ ОТЧЁТА --></h1>
    <div class="subtitle"><!-- Тип похода · MM.ГГГГ · километраж, напр. "ПВД · 07.2026 · 9 км" --></div>

    <div class="section-title">О месте</div>

    <p><!-- вводный текст про место/маршрут --></p>

    <p><strong>Трек:</strong> <a href="<!-- ссылка на nakarte.me -->" target="_blank" rel="noopener">nakarte.me</a></p>

    <hr>

    <!-- Первый блок текста после вступления: day-heading БЕЗ tight -->
    <div class="day-heading">
      <div class="day-title"><!-- X1 / День первый --></div>
    </div>

    <p><!-- текст --></p>

    <div class="gallery">
      <div class="thumb"><img src="./thumbs/00.jpg" data-full="./photos/00.jpg" alt="Фото моста" loading="lazy"></div>
      <div class="thumb"><img src="./thumbs/01.jpg" data-full="./photos/01.jpg" alt="Фото дома" loading="lazy"></div>
    </div>

    <p><!-- текст после фото, если есть --></p>

    <!-- Второй и все следующие блоки: day-heading tight -->
    <div class="day-heading tight">
      <div class="day-title"><!-- X2 / День второй --></div>
    </div>

    <p><!-- текст --></p>

    <div class="gallery single">
      <div class="thumb"><img src="./thumbs/10.jpg" data-full="./photos/10.jpg" alt="Вид с перевала" loading="lazy"></div>
    </div>
    <div class="caption">Вид с перевала</div>

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

  <script src="../../assets/report.js"></script>

</body>

</html>
```

### Заголовки блоков

- `day-heading` без `tight` — только у самого первого блока после вступления.
- `day-heading tight` — у всех последующих блоков (меньше отступ сверху).
- Название блока (`day-title`) — либо номер точки (X1, X2, X7'...) для ПВД,
  либо «День первый / День второй…» для многодневных походов. Определяется
  по тому, как размечен исходный черновик пользователя; если непонятно —
  переспросить.

### Блок "Кратко" (опционально)

Если пользователь даёт краткую сводку/предупреждение по маршруту, она
оформляется как `<blockquote>` сразу после ссылки на трек:

```html
<blockquote>
  <p><strong>Кратко:</strong> <!-- краткая сводка --></p>
</blockquote>
```

Если такой сводки в черновике нет — блок не добавляется.

## 5. Обновление index.html и report.js

Новый отчёт всегда добавляется **в начало** списка (сверху — самый новый).
Это нужно сделать в двух местах:

1. **`/index.html`** — новый `<li>` в начало `<ul class="travel">`:

```html
<li>
  <a href="travel/<slug>/<slug>.html">
    <span class="report-title">Название отчёта</span>
    <span class="report-meta">Тип похода · MM.ГГГГ</span>
  </a>
</li>
```

2. **`/assets/report.js`** — новая запись в начало массива `REPORTS`
   (используется для стрелок «пред./след. отчёт» внизу страницы,
   порядок должен совпадать с порядком в `index.html`):

```js
const REPORTS = [
  { key: '<slug>', title: 'Название отчёта' },
  // ...остальные записи как были, ничего не удалять и не переставлять
];
```

Больше никаких правок в `report.css` / `report.js` для добавления
обычного отчёта не требуется — лайтбокс, кнопка «наверх» и переходы
между отчётами работают автоматически по разметке `.thumb`/`.gallery`
и записи в `REPORTS`.