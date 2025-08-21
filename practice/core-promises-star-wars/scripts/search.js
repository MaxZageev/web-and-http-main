// Методы, которые могут пригодиться:
// starWars.searchCharacters(query), 
// starWars.searchPlanets(query), 
// starWars.searchSpecies(query).
// starWars.getCharactersById(id), 
// starWars.getPlanetsById(id), 
// starWars.getSpeciesById(id)

// Release 1

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM
  const resultWrap = document.getElementById('result-container'); // message-обёртка
  const content    = document.getElementById('content');           // внутренняя панель вывода
  const byQuery    = document.getElementById('byQueryBlock');      // блок поиска 
  const input      = byQuery.querySelector('input');               // блок ввода
  const searchBtn  = document.getElementById('byQueryBtn');        // кнопка поиска
  const spinner = document.getElementById('spinner');              // индикатор поиска

  const safe = (v) => { const d = document.createElement('div'); d.textContent = String(v ?? ''); return d.innerHTML; }; // защита от спецсимволов 
  const isLikelyUrl = (v) => typeof v === 'string' && /^https?:\/\//i.test(v); // проверяем строку не является ли она ссылкой

  const linkify = (v) => {
    if (isLikelyUrl(v)) {
      const href = safe(v);
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${href}</a>`;
    }
    return safe(v);
  }; // делаем ссылки кликабельными  и защищаем их noopener noreferrer

  const formatValue = (val) => {
    if (Array.isArray(val)) {
      if (val.length === 0) return '[]';
      return `<ul style="margin:0 0 0 1rem">
        ${val.map(item => `<li>${typeof item === 'object' ? `<pre style="white-space:pre-wrap">${safe(JSON.stringify(item, null, 2))}</pre>` : linkify(item)}</li>`).join('')}
      </ul>`;
    }
    if (val && typeof val === 'object') {
      return `<pre style="white-space:pre-wrap">${safe(JSON.stringify(val, null, 2))}</pre>`;
    }
    return linkify(val);
  };   // форматируем полученные с апи значения

  const renderPersonCard = (person) => {
    // верхний заголовок — name, ниже — все остальные поля ключ: значение
    const entries = Object.entries(person).filter(([k]) => k !== 'name');

    const rows = entries.map(([key, value]) => `
      <div class="mb-2">
        <span style="font-weight:600">${safe(key)}:</span>
        <div>${formatValue(value)}</div>
      </div>
    `).join('');

    const raw = safe(JSON.stringify(person, null, 2));

    return `
      <section class="box" style="margin-bottom:12px">
        <h3 class="title is-5" style="margin-bottom:8px">${safe(person.name)}</h3>
        ${rows}
        <details style="margin-top:8px">
          <summary>Raw JSON</summary>
          <pre class="is-size-6" style="white-space:pre-wrap; margin-top:6px">${raw}</pre>
        </details>
      </section>
    `;
  };

  const showResultWrap = () => { if (resultWrap) resultWrap.style.visibility = 'visible'; };
  const hideResultWrap = () => { if (resultWrap) resultWrap.style.visibility = 'hidden'; };

  const showSpinner = () => {
    if (!spinner) return;
    spinner.style.visibility = 'visible';
    spinner.style.display    = 'block';
    spinner.style.opacity    = '1';
    spinner.style.animationPlayState = 'running';
  };
  const hideSpinner = () => {
    if (!spinner) return;
    spinner.style.visibility = 'hidden';
    spinner.style.display    = '';
    spinner.style.opacity    = '';
  };

  const render = (html) => { content.innerHTML = html; showResultWrap(); };

  // крестик (delete) — закрыть панель
  const deleteBtn = resultWrap ? resultWrap.querySelector('.delete') : null;
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      hideSpinner();
      hideResultWrap();
      content.innerHTML = '';
    });
  }

  // основное действие — поиск и рендер карточек
  async function searchByQuery() {
    const q = input.value.trim();

    if (!q) {
      render('<p class="is-size-5">Write Name.</p>');
      hideSpinner();
      return;
    }

    showResultWrap();
    render('<p class="is-size-5">Serch wait…</p>');
    showSpinner();

    try {
      const data    = await starWars.searchCharacters(q);      
      const results = Array.isArray(data?.results) ? data.results : [];

      if (results.length === 0) {
        render('<p class="is-size-5">Ничего не найдено.</p>');
        return;
      }

      // карточки с полной инфой
      const cards = results.map(renderPersonCard).join('');
      render(`
        <h2 class="title is-4">Results (characters)</h2>
        ${cards}
      `);
    } catch (err) {
      console.error('[Release1] search error:', err);
      render('<p class="is-size-5">Not found try again(((</p>');
    } finally {
      hideSpinner();
    }
  }

  // события
  searchBtn.addEventListener('click', searchByQuery);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchByQuery(); });

  // стартовое состояние
  hideSpinner();
  hideResultWrap();
});

