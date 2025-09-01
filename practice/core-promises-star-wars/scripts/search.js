// Методы, которые могут пригодиться:
// starWars.searchCharacters(query), 
// starWars.searchPlanets(query), 
// starWars.searchSpecies(query).
// starWars.getCharactersById(id), 
// starWars.getPlanetsById(id), 
// starWars.getSpeciesById(id)

document.addEventListener('DOMContentLoaded', () => {
  // ждем загрузку DOM
  const resultWrap = document.getElementById('result-container'); // message-обёртка (мы её показываем/прячем)
  const content    = document.getElementById('content');           // внутренняя панель вывода
  const spinner    = document.getElementById('spinner');           // индикатор поиска

  // единая строка управления
  const modeSel = document.getElementById('searchMode');           // режим: 'query' | 'id'
  const resSel  = document.getElementById('resourceSelect');       // ресурс: 'characters' | 'planets' | 'species'
  const input   = document.getElementById('searchInput');          // поле ввода (тип меняем в зависимости от режима)
  const goBtn   = document.getElementById('searchBtn');            // кнопка GO

  // вспомогательные функции (безопасная вставка, ссылки, форматирование)
  const safe = (v) => { const d = document.createElement('div'); d.textContent = String(v ?? ''); return d.innerHTML; }; //защита от спецсимволов/инъекций
  const isLikelyUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v); // быстрая проверка: это похоже на URL?
  const linkify = (v) => isLikelyUrl(v)
    ? `<a href="${safe(v)}" target="_blank" rel="noopener noreferrer">${safe(v)}</a>` // делаем ссылку кликабельной + защита от reverse-tabnabbing
    : safe(v);

  // ограничиваем длину списков — показываем первые N, остальное под <details>
  const MAX_LIST = 3;
  const formatArrayLimited = (arr) => {
    if (arr.length === 0) return '[]';
    const head = arr.slice(0, MAX_LIST);
    const tail = arr.slice(MAX_LIST);
    const li = (item) => `<li>${
      typeof item === 'object'
        ? `<pre style="white-space:pre-wrap">${safe(JSON.stringify(item, null, 2))}</pre>`
        : linkify(item)
    }</li>`;
    if (tail.length === 0) return `<ul style="margin:0 0 0 1rem">${head.map(li).join('')}</ul>`;
    return `
      <ul style="margin:0 0 0 1rem">${head.map(li).join('')}</ul>
      <details style="margin-left:1rem;margin-top:6px">
        <summary>Show more (${tail.length})</summary>
        <ul style="margin:6px 0 0 1rem">${tail.map(li).join('')}</ul>
      </details>
    `;
  };

  // форматируем любое значение поля (массив/объект/строка)
  const formatValue = (val) => {
    if (Array.isArray(val)) return formatArrayLimited(val);
    if (val && typeof val === 'object') return `<pre style="white-space:pre-wrap">${safe(JSON.stringify(val, null, 2))}</pre>`;
    return linkify(val);
  };

  // универсальный конструктор карточки ответа
  const renderCard = (obj) => {
    const rows = Object.entries(obj)
      .filter(([k]) => k !== 'name') // name пойдёт в заголовок
      .map(([key, value]) => `
        <div class="mb-2">
          <span style="font-weight:600">${safe(key)}:</span>
          <div>${formatValue(value)}</div>
        </div>
      `).join('');
    const raw = safe(JSON.stringify(obj, null, 2));
    return `
      <section class="box" style="margin-bottom:12px">
        <h3 class="title is-5" style="margin-bottom:8px">${safe(obj.name ?? '(no name)')}</h3>
        ${rows}
        <details style="margin-top:8px">
          <summary>Raw JSON</summary>
          <pre class="is-size-6" style="white-space:pre-wrap; margin-top:6px">${raw}</pre>
        </details>
      </section>
    `;
  };

  // управление панелью/спиннером
  const showResultWrap = () => { resultWrap.classList.add('is-visible'); };   // показываем контейнер результата (через CSS-класс)
  const hideResultWrap = () => { resultWrap.classList.remove('is-visible'); };// прячем контейнер
  const showSpinner    = () => { spinner.classList.add('is-visible'); };      // показываем спиннер
  const hideSpinner    = () => { spinner.classList.remove('is-visible'); };   // прячем спиннер
  const render = (html) => { content.innerHTML = html; showResultWrap(); };   // вставляем HTML и показываем панель

  // крестик (delete) — закрыть панель
  const deleteBtn = resultWrap.querySelector('.delete');
  deleteBtn.addEventListener('click', () => { hideSpinner(); hideResultWrap(); content.innerHTML = ''; });

  // Release 2: обогащение — вытаскиваем id из URL и подменяем ссылки на названия
  const extractIdFromUrl = (url) => (String(url || '').match(/\/(\d+)\/?$/) || [])[1] || null; // .../planets/1/ -> "1"

  // Подменяем ОДИН url в obj[key] на наименование (name/title)
  async function replaceUrlFieldWithName(obj, key, fetchById) {
    const id = extractIdFromUrl(obj?.[key]);
    if (!id) return obj;
    try {
      const data = await fetchById(id);
      obj[key] = data?.name ?? data?.title ?? 'unknown';
    } catch {
      obj[key] = 'unknown';
    }
    return obj;
  }

  // Подменяем МАССИВ url-ов в obj[key] на массив имён
  async function replaceUrlArrayWithNames(obj, key, fetchById) {
    const urls = Array.isArray(obj?.[key]) ? obj[key] : [];
    if (!urls.length) return obj;
    try {
      const ids  = urls.map(extractIdFromUrl).filter(Boolean);
      const rows = await Promise.all(ids.map((id) => fetchById(id)));
      obj[key]   = rows.map((x) => x?.name ?? x?.title ?? 'unknown');
    } catch {
      obj[key] = [];
    }
    return obj;
  }

  // Обогащатели под каждый ресурс
  async function enrichCharacter(p) {
    await replaceUrlFieldWithName(p, 'homeworld', (id) => starWars.getPlanetsById(id));
    await replaceUrlArrayWithNames(p, 'species',   (id) => starWars.getSpeciesById(id));
    await replaceUrlArrayWithNames(p, 'films',   (id) => starWars.getFilmsById(id));
    await replaceUrlArrayWithNames(p, 'vehicles',   (id) => starWars.getVehiclesById(id));
     await replaceUrlArrayWithNames(p, 'starships',   (id) => starWars.getStarshipsById(id));
    return p;
  }
  async function enrichPlanet(pl) {
    await replaceUrlArrayWithNames(pl, 'residents', (id) => starWars.getCharactersById(id));
    return pl;
  }
  async function enrichSpecies(sp) {
    await replaceUrlFieldWithName(sp, 'homeworld', (id) => starWars.getPlanetsById(id));
    await replaceUrlArrayWithNames(sp, 'people',   (id) => starWars.getCharactersById(id));
    return sp;
  }

  // ядро: поиск по строке
  async function searchByQuery(q, resource) {
    let data;
    if (resource === 'characters')      data = await starWars.searchCharacters(q);
    else if (resource === 'planets')    data = await starWars.searchPlanets(q);
    else /* species */                  data = await starWars.searchSpecies(q);

    const results = Array.isArray(data?.results) ? data.results : [];
    if (results.length === 0) { render('<p class="is-size-5">Nothing found.</p>'); return; }

    if (resource === 'characters')      await Promise.all(results.map(enrichCharacter));
    else if (resource === 'planets')    await Promise.all(results.map(enrichPlanet));
    else /* species */                  await Promise.all(results.map(enrichSpecies));

    const titleMap = { characters: 'Results (people)', planets: 'Results (planets)', species: 'Results (species)' };
    const cards = results.map(renderCard).join('');
    render(`<h2 class="title is-4">${titleMap[resource] || 'Results'}</h2>${cards}`);
  }

  // ядро: поиск по ID
  async function getById(id, resource) {
    let item;
    if (resource === 'characters')      item = await starWars.getCharactersById(id);
    else if (resource === 'planets')    item = await starWars.getPlanetsById(id);
    else /* species */                  item = await starWars.getSpeciesById(id);

    if (!item || Object.keys(item).length === 0) { render('<p class="is-size-5">Not found.</p>'); return; }

    if (resource === 'characters')      await enrichCharacter(item);
    else if (resource === 'planets')    await enrichPlanet(item);
    else /* species */                  await enrichSpecies(item);

    const titleMap = { characters: 'Item (person)', planets: 'Item (planet)', species: 'Item (species)' };
    render(`<h2 class="title is-4">${titleMap[resource] || 'Item'}</h2>${renderCard(item)}`);
  }

  // переключение режима — меняем тип инпута и плейсхолдер
  const applyInputType = () => {
    if (modeSel.value === 'id') {
      input.type = 'number'; input.placeholder = 'ID…'; input.min = '1';
    } else {
      input.type = 'text';   input.placeholder = 'Search…'; input.removeAttribute('min');
    }
    input.value = ''; // очистим поле при смене режима
  };
  modeSel.addEventListener('change', applyInputType);
  applyInputType(); // стартовое применение

  // обработчик кнопки GO (и Enter в инпуте)
  async function onGo() {
    const mode = modeSel.value;
    const resource = resSel.value;

    showResultWrap();
    render(`<p class="is-size-5">${mode === 'id' ? 'Loading by ID…' : 'Search…'}</p>`);
    showSpinner();

    try {
      if (mode === 'id') {
        const id = Number(input.value);
        if (!Number.isInteger(id) || id <= 0) { render('<p class="is-size-5">Введите корректный ID (целое число &gt;= 1).</p>'); return; }
        await getById(id, resource);
      } else {
        const q = input.value.trim();
        if (!q) { render('<p class="is-size-5">Write Name.</p>'); return; }
        await searchByQuery(q, resource);
      }
    } catch (err) {
      console.error('[Search] error:', err);
      render('<p class="is-size-5">Error. Try again.</p>');
    } finally {
      hideSpinner();
    }
  }
  goBtn.addEventListener('click', onGo);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') onGo(); });

  // стартовое состояние — всё скрыто/чисто
  hideSpinner();
  hideResultWrap();
});
